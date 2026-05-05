'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [versions, setVersions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [showModal, setShowModal] = useState(false);
  
  const defaultStep = { 
    name: '', 
    selected_version_ids: [], 
    openrouter_model: '', 
    ai_provider: 'openrouter',
    system_prompt: '',
    survey_config: [] 
  };
  
  const [steps, setSteps] = useState([{ ...defaultStep }]);
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

  const toggleVersion = (stepIndex, id) => {
    const newSteps = [...steps];
    const step = newSteps[stepIndex];
    step.selected_version_ids = step.selected_version_ids.includes(id)
      ? step.selected_version_ids.filter((v) => v !== id)
      : [...step.selected_version_ids, id];
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, { ...defaultStep, name: steps[0].name + ` (Part ${steps.length + 1})` }]);
  };
  
  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const addSurveyQuestion = (stepIndex) => {
    const newSteps = [...steps];
    newSteps[stepIndex].survey_config.push({
      id: crypto.randomUUID(),
      type: 'likert', // likert, multiple, checkbox, open
      text: '',
      options: ['Option 1']
    });
    setSteps(newSteps);
  };

  const updateSurveyQuestion = (stepIndex, qIndex, field, value) => {
    const newSteps = [...steps];
    newSteps[stepIndex].survey_config[qIndex][field] = value;
    setSteps(newSteps);
  };

  const removeSurveyQuestion = (stepIndex, qIndex) => {
    const newSteps = [...steps];
    newSteps[stepIndex].survey_config.splice(qIndex, 1);
    setSteps(newSteps);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/workshops', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(steps) 
    });
    setShowModal(false);
    setSteps([{ ...defaultStep }]);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign? (If chained, only this step is deleted)')) return;
    await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const toggleActive = async (w) => {
    await fetch(`/api/admin/workshops/${w.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ is_active: !w.is_active }) 
    });
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
        <p>Create campaigns, chained workflows, and configure post-session surveys.</p>
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
              <div className="glass-card workshop-card" key={w.id} style={{ borderTop: w.chain_id ? '3px solid var(--accent)' : 'none' }}>
                <div className="workshop-card-header">
                  <div>
                    <h3>{w.name} {w.chain_id && <span style={{fontSize:'0.7em', color:'var(--accent)'}}>[Step {w.chain_order}]</span>}</h3>
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
                  <span>🤖 {w.ai_provider === 'groq' ? 'Groq' : 'OpenRouter'}</span>
                  <span>📊 {w.survey_config?.length || 0} survey qs</span>
                </div>
                <div style={{ marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Versions:</strong>{' '}
                  {versionNames.join(', ')}
                </div>
                {(!w.chain_id || w.chain_order === 1) && (
                  <div className="qr-section glass-card">
                    <div className="qr-code">
                      <QRCodeSVG value={url} size={120} bgColor="#ffffff" fgColor="#0a0e1a" level="M" />
                    </div>
                    <div className="qr-details">
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Share this link:</div>
                      <div className="qr-url">
                        <span style={{ flex: 1 }}>{url}</span>
                        <button className="copy-btn" onClick={() => copyUrl(w.share_code)} title="Copy URL">
                          {copiedId === w.share_code ? '✅' : '📋'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {w.chain_id && w.chain_order > 1 && (
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    🔗 Step {w.chain_order} of a chained campaign. Reached automatically after Step {w.chain_order - 1}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
          <form className="modal" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>Create New Campaign</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You can add multiple steps to create a chained campaign.</p>
            
            {steps.map((step, index) => (
              <div key={index} style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, marginBottom: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Step {index + 1}</h3>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)} className="btn btn-danger btn-sm">Remove Step</button>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Step Name</label>
                  <input className="input" value={step.name} onChange={(e) => updateStep(index, 'name', e.target.value)} placeholder="e.g., ISSDE Session 1" required />
                </div>
                
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Select Versions to Include</label>
                  <div className="multi-select">
                    {activeVersions.map((v) => (
                      <label key={v.id} className={`multi-select-option ${step.selected_version_ids.includes(v.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={step.selected_version_ids.includes(v.id)} onChange={() => toggleVersion(index, v.id)} />
                        <span>{v.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">AI Provider</label>
                    <select className="input" value={step.ai_provider} onChange={(e) => updateStep(index, 'ai_provider', e.target.value)}>
                      <option value="openrouter">OpenRouter</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">AI Model</label>
                    <input className="input" value={step.openrouter_model} onChange={(e) => updateStep(index, 'openrouter_model', e.target.value)} placeholder={step.ai_provider === 'groq' ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.1-8b-instruct"} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Custom System Prompt (Optional)</label>
                  <textarea className="input" value={step.system_prompt || ''} onChange={(e) => updateStep(index, 'system_prompt', e.target.value)} placeholder="Leave blank to use default system prompt..." rows={3} />
                </div>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ margin: 0 }}>Post-Session Survey</label>
                    <button type="button" onClick={() => addSurveyQuestion(index)} className="btn btn-secondary btn-sm">+ Add Question</button>
                  </div>
                  
                  {step.survey_config.map((q, qIndex) => (
                    <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <select className="input" style={{ width: '150px' }} value={q.type} onChange={(e) => updateSurveyQuestion(index, qIndex, 'type', e.target.value)}>
                          <option value="likert">Likert Scale</option>
                          <option value="multiple">Multiple Choice</option>
                          <option value="checkbox">Checkboxes</option>
                          <option value="open">Open Text</option>
                        </select>
                        <input className="input" style={{ flex: 1 }} value={q.text} onChange={(e) => updateSurveyQuestion(index, qIndex, 'text', e.target.value)} placeholder="Question text..." required />
                        <button type="button" onClick={() => removeSurveyQuestion(index, qIndex)} className="btn btn-danger btn-sm">X</button>
                      </div>
                      
                      {(q.type === 'multiple' || q.type === 'checkbox') && (
                        <div style={{ marginLeft: 160 }}>
                          <input 
                            className="input" 
                            style={{ fontSize: '0.85rem', padding: '6px 10px' }} 
                            value={q.options.join(',')} 
                            onChange={(e) => updateSurveyQuestion(index, qIndex, 'options', e.target.value.split(',').map(o => o.trim()))} 
                            placeholder="Comma separated options..." 
                          />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Separate options with commas</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {step.survey_config.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No survey configured for this step.</p>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <button type="button" onClick={addStep} className="btn btn-secondary" style={{ borderStyle: 'dashed' }}>
                + Add Another Step to Chain
              </button>
            </div>

            <div className="modal-actions" style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={steps.some(s => s.selected_version_ids.length === 0)}>Create Campaign</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
