'use client';
import { useState, useEffect } from 'react';

export default function VersionsPage() {
  const [versions, setVersions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', case_content: '' });
  const [loading, setLoading] = useState(true);

  const fetchVersions = async () => {
    const res = await fetch('/api/admin/versions');
    setVersions(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchVersions(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', case_content: '' }); setShowModal(true); };
  const openEdit = (v) => { setEditing(v); setForm({ title: v.title, case_content: v.case_content }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/admin/versions/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/admin/versions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    fetchVersions();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this version?')) return;
    await fetch(`/api/admin/versions/${id}`, { method: 'DELETE' });
    fetchVersions();
  };

  const toggleActive = async (v) => {
    await fetch(`/api/admin/versions/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !v.is_active }) });
    fetchVersions();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Case Versions</h1>
        <p>Create and manage the case scenarios for your workshops</p>
      </div>

      <div className="section-header">
        <h2>{versions.length} version{versions.length !== 1 ? 's' : ''}</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Version</button>
      </div>

      {versions.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">📋</div>
          <p>No versions yet. Create your first case scenario!</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Title</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.title}</td>
                    <td>
                      <button className={`badge ${v.is_active ? 'badge-active' : 'badge-inactive'}`} onClick={() => toggleActive(v)} style={{ cursor: 'pointer', border: 'none' }}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{editing ? 'Edit Version' : 'Create New Version'}</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Version A — Phishing Scenario" required />
            </div>
            <div className="form-group">
              <label className="form-label">Case Content (Markdown supported)</label>
              <textarea className="textarea" style={{ minHeight: 250 }} value={form.case_content} onChange={(e) => setForm({ ...form, case_content: e.target.value })} placeholder="Write the case scenario that participants will see..." required />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Version'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
