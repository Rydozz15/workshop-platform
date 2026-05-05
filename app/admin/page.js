'use client';
import { useState, useEffect, useCallback } from 'react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const fetchMetrics = useCallback(async () => {
    const url = selectedCampaign ? `/api/admin/dashboard?workshopId=${selectedCampaign}` : '/api/admin/dashboard';
    const res = await fetch(url);
    const data = await res.json();
    setMetrics(data);
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    const res = await fetch('/api/admin/workshops');
    setCampaigns(await res.json());
  };

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { fetchMetrics(); const i = setInterval(fetchMetrics, 10000); return () => clearInterval(i); }, [fetchMetrics]);

  if (!metrics) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  const maxDist = Math.max(1, ...Object.values(metrics.versionDistribution));
  const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'];

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Real-time campaign activity overview</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <select className="select" style={{ maxWidth: 300 }} value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>

      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon cyan">👥</div>
          <div className="metric-value">{metrics.totalSessions}</div>
          <div className="metric-label">Total Sessions</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon emerald">✅</div>
          <div className="metric-value">{metrics.completedSessions}</div>
          <div className="metric-label">Completed</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon amber">⚡</div>
          <div className="metric-value">{metrics.activeSessions}</div>
          <div className="metric-label">Active Now</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon rose">💬</div>
          <div className="metric-value">{metrics.totalInteractions}</div>
          <div className="metric-label">Total Messages</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon purple">📈</div>
          <div className="metric-value">{metrics.avgInteractions}</div>
          <div className="metric-label">Avg Messages/Session</div>
        </div>
      </div>

      {Object.keys(metrics.versionDistribution).length > 0 && (
        <div className="glass-card chart-container" style={{ padding: 24 }}>
          <div className="section-header"><h2>Version Distribution</h2></div>
          <div className="bar-chart">
            {Object.entries(metrics.versionDistribution).map(([label, count], i) => (
              <div className="bar-row" key={label}>
                <div className="bar-label" title={label}>{label}</div>
                <div className="bar-track">
                  <div className={`bar-fill ${gradients[i % gradients.length]}`} style={{ width: `${(count / maxDist) * 100}%` }}>
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 24 }}>
        <div className="section-header"><h2>Recent Sessions</h2></div>
        {metrics.recentSessions.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><p>No sessions yet. Share a campaign link to get started!</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Participant</th><th>Version</th><th>Status</th><th>Messages</th><th>Started</th></tr></thead>
              <tbody>
                {metrics.recentSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.participant_name}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.version_title}</td>
                    <td><span className={`badge ${s.status === 'completed' ? 'badge-completed' : 'badge-active'}`}>{s.status}</span></td>
                    <td>{s.interaction_count}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(s.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
