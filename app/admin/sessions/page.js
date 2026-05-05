'use client';
import { useState, useEffect } from 'react';

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Sessions</h1>
        <p>Browse participant sessions and view conversation transcripts</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <select className="select" style={{ maxWidth: 300 }} value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
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
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); viewTranscript(s.id); }}
                      >
                        💬 View
                      </button>
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
                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
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
