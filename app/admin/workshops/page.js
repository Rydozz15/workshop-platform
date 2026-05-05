'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', selected_version_ids: [], openrouter_model: '', ai_provider: 'openrouter' });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchAll = async () => {
    const [wRes, vRes] = await Promise.all([fetch('/api/admin/workshops'), fetch('/api/admin/versions')]);
    setWorkshops(await wRes.json());
    setVersions(await vRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleVersion = (id) => {
    setForm((f) => ({
      ...f,
      selected_version_ids: f.selected_version_ids.includes(id)
        ? f.selected_version_ids.filter((v) => v !== id)
        : [...f.selected_version_ids, id],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/workshops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ name: '', selected_version_ids: [], openrouter_model: '', ai_provider: 'openrouter' });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workshop?')) return;
    await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const toggleActive = async (w) => {
    await fetch(`/api/admin/workshops/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !w.is_active }) });
    fetchAll();
  };

  const copyUrl = (code) => {
    navigator.clipboard.writeText(`${baseUrl}/session/${code}`);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeVersions = versions.filter((v) => v.is_active);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Workshops</h1>
        <p>Create workshops, select versions, and generate shareable links</p>
      </div>

      <div className="section-header">
        <h2>{workshops.length} workshop{workshops.length !== 1 ? 's' : ''}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Workshop</button>
      </div>

      {workshops.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">🔗</div>
          <p>No workshops yet. Create one to generate a shareable link!</p>
        </div>
      ) : (
        <div className="workshop-grid">
          {workshops.map((w) => {
            const url = `${baseUrl}/session/${w.share_code}`;
            const versionNames = w.selected_version_ids.map((vid) => {
              const v = versions.find((ver) => ver.id === vid);
              return v ? v.title : 'Unknown';
            });
            return (
              <div className="glass-card workshop-card" key={w.id}>
                <div className="workshop-card-header">
                  <div>
                    <h3>{w.name}</h3>
                    <span className={`badge ${w.is_active ? 'badge-active' : 'badge-inactive'}`} style={{ marginTop: 4 }}>
                      {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="workshop-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(w)}>
                      {w.is_active ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>🗑️</button>
                  </div>
                </div>
                <div className="workshop-meta">
                  <span>📋 {w.selected_version_ids.length} versions</span>
                  <span>🤖 {w.ai_provider === 'groq' ? 'Groq' : 'OpenRouter'} ({w.openrouter_model?.split('/').pop() || 'default'})</span>
                  <span>📅 {new Date(w.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Versions:</strong>{' '}
                  {versionNames.join(', ')}
                </div>
                <div className="qr-section glass-card">
                  <div className="qr-code">
                    <QRCodeSVG value={url} size={120} bgColor="#ffffff" fgColor="#0a0e1a" level="M" />
                  </div>
                  <div className="qr-details">
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Share this link with participants:</div>
                    <div className="qr-url">
                      <span style={{ flex: 1 }}>{url}</span>
                      <button className="copy-btn" onClick={() => copyUrl(w.share_code)} title="Copy URL">
                        {copiedId === w.share_code ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>Create New Workshop</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Workshop Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., ISSDE Session 1" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Select Versions to Include</label>
              {activeVersions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active versions. Create versions first.</p>
              ) : (
                <div className="multi-select">
                  {activeVersions.map((v) => (
                    <label key={v.id} className={`multi-select-option ${form.selected_version_ids.includes(v.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={form.selected_version_ids.includes(v.id)} onChange={() => toggleVersion(v.id)} />
                      <span>{v.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">AI Provider</label>
              <select className="input" value={form.ai_provider} onChange={(e) => setForm({ ...form, ai_provider: e.target.value })}>
                <option value="openrouter">OpenRouter</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">AI Model</label>
              <input className="input" value={form.openrouter_model} onChange={(e) => setForm({ ...form, openrouter_model: e.target.value })} placeholder={form.ai_provider === 'groq' ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.1-8b-instruct"} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave blank for default model</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={form.selected_version_ids.length === 0}>Create Workshop</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
