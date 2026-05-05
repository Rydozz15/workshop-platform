'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [versions, setVersions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', selected_version_ids: [], openrouter_model: '', ai_provider: 'openrouter', system_prompt: '' });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchAll = async () => {
    const [wRes, vRes] = await Promise.all([fetch('/api/admin/workshops'), fetch('/api/admin/versions')]);
    const campaignList = await wRes.json();
    setCampaigns(campaignList);
    setVersions(await vRes.json());

    // Fetch metrics for each campaign
    const metricsMap = {};
    await Promise.all(
      campaignList.map(async (c) => {
        const res = await fetch(`/api/admin/dashboard?workshopId=${c.id}`);
        metricsMap[c.id] = await res.json();
      })
    );
    setMetrics(metricsMap);
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
    setForm({ name: '', selected_version_ids: [], openrouter_model: '', ai_provider: 'openrouter', system_prompt: '' });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign? All sessions and data will be lost.')) return;
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
        <h1>Campaigns</h1>
        <p>Create campaigns, assign versions, and share links with participants</p>
      </div>

      <div className="section-header">
        <h2>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">🚀</div>
          <p>No campaigns yet. Create one to start collecting data!</p>
        </div>
      ) : (
        <div className="workshop-grid">
          {campaigns.map((w) => {
            const url = `${baseUrl}/session/${w.share_code}`;
            const m = metrics[w.id] || {};
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
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(w)} title={w.is_active ? 'Pause' : 'Activate'}>
                      {w.is_active ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>🗑️</button>
                  </div>
                </div>

                {/* Campaign inline metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{m.totalSessions || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sessions</div>
                  </div>
                  <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{m.completedSessions || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
                  </div>
                  <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{m.totalInteractions || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Messages</div>
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
            <h2>Create New Campaign</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Campaign Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Pilot Test A, Workshop Session 1" required />
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
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Custom System Prompt</label>
              <textarea 
                className="input" 
                rows={3} 
                value={form.system_prompt} 
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} 
                placeholder="Optional: Provide custom instructions for the AI behavior. Leave blank for naive mode." 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Defines the AI persona/behavior for this specific campaign.</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={form.selected_version_ids.length === 0}>Create Campaign</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
