'use client';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    const [wRes, dRes] = await Promise.all([
      fetch('/api/admin/workshops'),
      fetch('/api/admin/dashboard'),
    ]);
    const campaignList = await wRes.json();
    const dashData = await dRes.json();
    setCampaigns(campaignList);
    setSessions(dashData.recentSessions || []);
    setLoading(false);
  };

  const fetchFilteredSessions = async (workshopId) => {
    const url = workshopId
      ? `/api/admin/dashboard?workshopId=${workshopId}`
      : '/api/admin/dashboard';
    const res = await fetch(url);
    const data = await res.json();
    setSessions(data.recentSessions || []);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    fetchFilteredSessions(selectedCampaign);
  }, [selectedCampaign]);

  const viewTranscript = async (sessionId) => {
    setLoadingTranscript(true);
    setSelectedSession(sessionId);
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();
      setTranscript(data);
    } catch {
      setTranscript({ error: 'Failed to load transcript' });
    }
    setLoadingTranscript(false);
  };

  const closeTranscript = () => {
    setSelectedSession(null);
    setTranscript(null);
  };

  const handleDeleteSession = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session and all its messages?')) return;
    try {
      const res = await fetch(`/api/session/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFilteredSessions(selectedCampaign);
      } else {
        alert('Failed to delete session');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const fetchExportData = async () => {
    const url = selectedCampaign
      ? `/api/admin/export?workshopId=${selectedCampaign}`
      : '/api/admin/export';
    const res = await fetch(url);
    return res.json();
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      
      // Map survey answers to question texts
      const mappedData = data.map(s => {
        if (!s.survey_answers || !s.survey_config) return s;
        const mappedAnswers = {};
        for (const [key, val] of Object.entries(s.survey_answers)) {
          const question = s.survey_config.find(q => q.id === key);
          if (question) {
            mappedAnswers[question.text] = val;
          } else {
            mappedAnswers[key] = val;
          }
        }
        return { ...s, survey_answers: mappedAnswers };
      });
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const campaignLabel = selectedCampaign
        ? campaigns.find(c => c.id === selectedCampaign)?.name?.replace(/\s+/g, '_') || 'campaign'
        : 'all_campaigns';
      downloadFile(
        JSON.stringify(mappedData, null, 2),
        `workshop_export_${campaignLabel}_${timestamp}.json`,
        'application/json'
      );
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    setExporting(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      // Flatten: one row per message, with session metadata repeated
      const headers = [
        'session_id', 'participant_name', 'campaign_name', 'campaign_id',
        'chain_id', 'chain_order', 'chain_user_id',
        'version_title', 'version_id', 'ai_provider', 'ai_model', 'campaign_system_prompt',
        'session_status', 'interaction_count', 'session_started_at', 'session_completed_at',
        'survey_answers',
        'message_order', 'message_role', 'message_content', 'message_created_at'
      ];

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = [headers.join(',')];
      for (const s of data) {
        let mappedAnswers = s.survey_answers;
        if (s.survey_answers && s.survey_config) {
          mappedAnswers = {};
          for (const [key, val] of Object.entries(s.survey_answers)) {
            const question = s.survey_config.find(q => q.id === key);
            mappedAnswers[question ? question.text : key] = val;
          }
        }

        if (!s.messages || s.messages.length === 0) {
          // Still include sessions with no messages
          rows.push([
            s.session_id, s.participant_name, s.campaign_name, s.campaign_id,
            s.chain_id || '', s.chain_order || '', s.chain_user_id || '',
            s.version_title, s.version_id, s.ai_provider, s.ai_model, s.system_prompt || '',
            s.status, s.interaction_count, s.started_at, s.completed_at || '',
            mappedAnswers || '',
            '', '', '', ''
          ].map(escapeCSV).join(','));
        } else {
          for (const m of s.messages) {
            rows.push([
              s.session_id, s.participant_name, s.campaign_name, s.campaign_id,
              s.chain_id || '', s.chain_order || '', s.chain_user_id || '',
              s.version_title, s.version_id, s.ai_provider, s.ai_model, s.system_prompt || '',
              s.status, s.interaction_count, s.started_at, s.completed_at || '',
              mappedAnswers || '',
              m.message_order, m.role, m.content, m.created_at
            ].map(escapeCSV).join(','));
          }
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const campaignLabel = selectedCampaign
        ? campaigns.find(c => c.id === selectedCampaign)?.name?.replace(/\s+/g, '_') || 'campaign'
        : 'all_campaigns';
      downloadFile(
        rows.join('\n'),
        `workshop_export_${campaignLabel}_${timestamp}.csv`,
        'text/csv'
      );
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    setExporting(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Sessions</h1>
        <p>Browse participant sessions and view conversation transcripts</p>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select" style={{ maxWidth: 300 }} value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={exporting || sessions.length === 0}>
            {exporting ? '⏳' : '📊'} Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportJSON} disabled={exporting || sessions.length === 0}>
            {exporting ? '⏳' : '📦'} Export JSON
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">📭</div>
          <p>No sessions found. Share a campaign link to get started!</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="section-header">
            <h2>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Messages</th>
                  <th>Started</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => viewTranscript(s.id)}>
                    <td>{s.participant_name}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.version_title}</td>
                    <td><span className={`badge ${s.status === 'completed' ? 'badge-completed' : 'badge-active'}`}>{s.status}</span></td>
                    <td>{s.interaction_count}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(s.started_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => { e.stopPropagation(); viewTranscript(s.id); }}
                        >
                          💬 View
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Delete Session"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedSession && (
        <div className="modal-overlay" onClick={closeTranscript}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            {loadingTranscript ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : transcript?.error ? (
              <div style={{ padding: 24 }}>
                <h2>Error</h2>
                <p>{transcript.error}</p>
                <button className="btn btn-secondary" onClick={closeTranscript}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                  <h2 style={{ margin: 0 }}>💬 Conversation Transcript</h2>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>👤 <strong style={{ color: 'var(--text-secondary)' }}>{transcript.participant_name}</strong></span>
                    <span>📋 {transcript.version?.title || 'Unknown'}</span>
                    <span>📅 {new Date(transcript.started_at).toLocaleString()}</span>
                    <span className={`badge ${transcript.status === 'completed' ? 'badge-completed' : 'badge-active'}`}>{transcript.status}</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.85rem', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <strong>System Prompt:</strong> {transcript.system_prompt ? <span style={{ color: 'var(--text-primary)' }}>{transcript.system_prompt}</span> : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None (Naive Mode)</span>}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                  {(!transcript.messages || transcript.messages.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      <p>No messages in this session.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {transcript.messages.map((msg, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                          gap: 8,
                          alignItems: 'flex-start',
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0,
                            background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                          }}>
                            {msg.role === 'user' ? '👤' : '🤖'}
                          </div>
                          <div style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--bg-glass)',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                          }}>
                            <div className="markdown-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                            <div style={{ fontSize: '0.7rem', marginTop: 6, opacity: 0.6, textAlign: 'right' }}>
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={closeTranscript}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
