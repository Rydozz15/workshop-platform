'use client';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsPage() {
  const [data, setData] = useState({ workshops: [], sessions: [], versions: [] });
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSummarize = async (workshopId, questionId, texts, ai_provider, model) => {
    setSummarizing(prev => ({ ...prev, [`${workshopId}-${questionId}`]: true }));
    try {
      const res = await fetch('/api/admin/analytics/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, ai_provider, model })
      });
      const json = await res.json();
      setSummaries(prev => ({ ...prev, [`${workshopId}-${questionId}`]: json.summary }));
    } catch (e) {
      alert("Error summarizing: " + e.message);
    }
    setSummarizing(prev => ({ ...prev, [`${workshopId}-${questionId}`]: false }));
  };

  const handleEvolutionSummarize = async (chainId, questionId, stepsData) => {
    const sumKey = `evol-${chainId}-${questionId}`;
    setSummarizing(prev => ({ ...prev, [sumKey]: true }));
    try {
      const res = await fetch('/api/admin/analytics/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepsData })
      });
      const json = await res.json();
      setSummaries(prev => ({ ...prev, [sumKey]: json.summary }));
    } catch (e) {
      alert("Error generating evolution summary: " + e.message);
    }
    setSummarizing(prev => ({ ...prev, [sumKey]: false }));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  const { workshops, sessions } = data;

  // Group workshops by chain_id or standalone
  const groupedWorkshops = {};
  workshops.forEach(w => {
    const key = w.chain_id || w.id;
    if (!groupedWorkshops[key]) groupedWorkshops[key] = [];
    groupedWorkshops[key].push(w);
  });

  const getSharedQuestions = (group) => {
    if (group.length < 2) return [];
    
    const questionMap = {};
    group.forEach(step => {
      (step.survey_config || []).forEach(q => {
        if (!questionMap[q.id]) {
          questionMap[q.id] = { ...q, stepNames: [] };
        }
        questionMap[q.id].stepNames.push(`Step ${step.chain_order}`);
      });
    });

    return Object.values(questionMap).filter(q => q.stepNames.length > 1);
  };

  return (
    <>
      <div className="admin-header">
        <h1>Analytics Dashboard</h1>
        <p>Visualize metrics and survey responses across all campaigns.</p>
      </div>

      {Object.values(groupedWorkshops).map((group, index) => {
        // Sort by chain_order
        group.sort((a, b) => (a.chain_order || 1) - (b.chain_order || 1));
        const isChained = group.length > 1;
        const groupName = isChained ? `Chained Campaign: ${group[0].name.split(' (Part')[0]}` : group[0].name;
        const chainId = group[0].chain_id || group[0].id;
        
        const currentTab = activeTab[chainId] || 'steps'; // 'steps' or 'longitudinal'
        const sharedQuestions = isChained ? getSharedQuestions(group) : [];

        return (
          <div key={index} style={{ marginBottom: 40 }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <h2 style={{ margin: 0 }}>{groupName}</h2>
              {isChained && sharedQuestions.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className={`btn ${currentTab === 'steps' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setActiveTab(prev => ({ ...prev, [chainId]: 'steps' }))}
                  >
                    Step-by-Step View
                  </button>
                  <button 
                    className={`btn ${currentTab === 'longitudinal' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setActiveTab(prev => ({ ...prev, [chainId]: 'longitudinal' }))}
                  >
                    📈 Longitudinal Evolution
                  </button>
                </div>
              )}
            </div>
            
            {currentTab === 'steps' && (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 10 }}>
                {group.map((w) => {
                  const workshopSessions = sessions.filter(s => s.workshop_id === w.id);
                  const completedSessions = workshopSessions.filter(s => s.status === 'completed');
                  const avgInteractions = workshopSessions.length ? Math.round(workshopSessions.reduce((acc, s) => acc + s.interaction_count, 0) / workshopSessions.length * 10) / 10 : 0;
                  
                  return (
                    <div key={w.id} className="glass-card" style={{ minWidth: '400px', flex: 1 }}>
                      <h3>{isChained ? `Step ${w.chain_order}: ${w.name}` : w.name}</h3>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workshopSessions.length}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Sessions</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{completedSessions.length}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{avgInteractions}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Msgs</div>
                        </div>
                      </div>

                      {w.survey_config && w.survey_config.length > 0 ? (
                        <div>
                          <h4 style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>Survey Results</h4>
                          {w.survey_config.map(q => {
                            // Extract answers for this question
                            const answers = completedSessions
                              .map(s => s.survey_answers ? s.survey_answers[q.id] : null)
                              .filter(a => a !== null && a !== undefined && a !== '');

                            if (answers.length === 0) return <div key={q.id} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.text}: No answers yet</div>;

                            if (q.type === 'likert') {
                              const avg = answers.reduce((acc, val) => acc + Number(val), 0) / answers.length;
                              return (
                                <div key={q.id} style={{ marginBottom: 15 }}>
                                  <div style={{ fontSize: '0.9rem' }}>{q.text}</div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {avg.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>average (1-5)</span>
                                  </div>
                                </div>
                              );
                            }

                            if (q.type === 'multiple' || q.type === 'checkbox') {
                              const counts = {};
                              answers.forEach(a => {
                                const vals = Array.isArray(a) ? a : [a];
                                vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
                              });
                              
                              const chartData = {
                                labels: Object.keys(counts),
                                datasets: [{
                                  data: Object.values(counts),
                                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                                  borderWidth: 0,
                                }]
                              };

                              return (
                                <div key={q.id} style={{ marginBottom: 15 }}>
                                  <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>{q.text}</div>
                                  <div style={{ height: '150px', display: 'flex', justifyContent: 'center' }}>
                                    {q.type === 'multiple' 
                                      ? <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                                      : <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                    }
                                  </div>
                                </div>
                              );
                            }

                            if (q.type === 'open') {
                              const sumKey = `${w.id}-${q.id}`;
                              return (
                                <div key={q.id} style={{ marginBottom: 15 }}>
                                  <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>{q.text} <span className="badge badge-inactive">{answers.length} responses</span></div>
                                  {!summaries[sumKey] ? (
                                    <button 
                                      className="btn btn-secondary btn-sm" 
                                      onClick={() => handleSummarize(w.id, q.id, answers, w.ai_provider, w.openrouter_model)}
                                      disabled={summarizing[sumKey]}
                                    >
                                      {summarizing[sumKey] ? '🤖 Summarizing...' : '🤖 Generate AI Summary'}
                                    </button>
                                  ) : (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, fontSize: '0.85rem' }}>
                                      <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: 5 }}>AI Summary:</div>
                                      <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaries[sumKey]}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No survey configured.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentTab === 'longitudinal' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 20 }}>Longitudinal Evolution</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Tracking the exact same questions across multiple steps in the chain.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 30 }}>
                  {sharedQuestions.map(q => {
                    // Collect data across steps
                    const stepLabels = [];
                    const stepAverages = []; // For Likert
                    const stepTexts = [];    // For Open

                    group.forEach(w => {
                      // Check if this workshop actually has the question
                      const hasQ = (w.survey_config || []).some(sq => sq.id === q.id);
                      if (!hasQ) return;

                      stepLabels.push(`Step ${w.chain_order}`);
                      
                      const completedSessions = sessions.filter(s => s.workshop_id === w.id && s.status === 'completed');
                      const answers = completedSessions
                              .map(s => s.survey_answers ? s.survey_answers[q.id] : null)
                              .filter(a => a !== null && a !== undefined && a !== '');

                      if (q.type === 'likert') {
                        const avg = answers.length > 0 ? answers.reduce((acc, val) => acc + Number(val), 0) / answers.length : null;
                        stepAverages.push(avg);
                      } else if (q.type === 'open') {
                        stepTexts.push({ step: `Step ${w.chain_order}`, responses: answers });
                      }
                    });

                    if (q.type === 'likert') {
                      const chartData = {
                        labels: stepLabels,
                        datasets: [
                          {
                            label: 'Average Score (1-5)',
                            data: stepAverages,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            tension: 0.3,
                            borderWidth: 3,
                            pointRadius: 6,
                            pointHoverRadius: 8
                          }
                        ]
                      };
                      
                      return (
                        <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12 }}>
                          <h4 style={{ marginBottom: 15, fontSize: '1.1rem' }}>{q.text}</h4>
                          <div style={{ height: '300px' }}>
                            <Line 
                              data={chartData} 
                              options={{ 
                                maintainAspectRatio: false,
                                scales: {
                                  y: { min: 1, max: 5, ticks: { stepSize: 1 } }
                                }
                              }} 
                            />
                          </div>
                        </div>
                      );
                    }

                    if (q.type === 'open') {
                      const sumKey = `evol-${chainId}-${q.id}`;
                      const hasEnoughData = stepTexts.some(st => st.responses.length > 0);
                      
                      return (
                        <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12 }}>
                          <h4 style={{ marginBottom: 15, fontSize: '1.1rem' }}>{q.text} <span className="badge badge-inactive">Qualitative</span></h4>
                          
                          {!hasEnoughData ? (
                            <p style={{ color: 'var(--text-muted)' }}>Not enough data to analyze evolution.</p>
                          ) : !summaries[sumKey] ? (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleEvolutionSummarize(chainId, q.id, stepTexts)}
                              disabled={summarizing[sumKey]}
                            >
                              {summarizing[sumKey] ? '🤖 Analyzing Evolution...' : '🤖 Generate Evolution Analysis'}
                            </button>
                          ) : (
                            <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 8 }}>
                              <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '1.2rem' }}>📈</span> AI Evolution Analysis:
                              </div>
                              <div className="markdown-content" style={{ lineHeight: '1.6' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaries[sumKey]}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
