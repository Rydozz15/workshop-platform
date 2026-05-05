'use client';
import { useState, useEffect, useRef, use } from 'react';

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

export default function SessionPage({ params }) {
  const { code } = use(params);
  const [phase, setPhase] = useState('welcome'); // welcome | chat | completed
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [version, setVersion] = useState(null);
  const [workshopName, setWorkshopName] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages]);

  const joinWorkshop = async (e) => {
    if (e) e.preventDefault();
    setJoining(true);
    setError('');
    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, participant_name: name || 'Anonymous' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to join'); setJoining(false); return; }
      
      localStorage.setItem(`workshop_${code}_session`, data.session_id);
      
      setSessionId(data.session_id);
      setVersion(data.version);
      setWorkshopName(data.workshop_name);
      setPhase('chat');
    } catch { setError('Connection error'); setJoining(false); }
  };

  useEffect(() => {
    const savedSessionId = localStorage.getItem(`workshop_${code}_session`);
    if (savedSessionId) {
      // Try to resume the session
      fetch(`/api/session/${savedSessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error && data.status === 'active') {
            setSessionId(data.id);
            setVersion(data.version);
            setWorkshopName(data.workshop_name || '');
            setMessages(data.messages || []);
            setPhase('chat');
          } else {
            localStorage.removeItem(`workshop_${code}_session`);
          }
        })
        .catch(() => {
          // If network error, maybe ignore or clear
        });
    }
  }, [code]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) { setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Could not get response.' }]); setStreaming(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let buffer = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        let newContent = '';
        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                newContent += json.choices?.[0]?.delta?.content || '';
              } catch { /* ignore partial JSON */ }
            }
          }
        }
        
        if (newContent) {
          assistantMsg += newContent;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Connection failed.' }]);
    }
    setStreaming(false);
    
    // Auto-focus the input only on Desktop, to prevent annoying keyboard popups on mobile
    if (window.innerWidth > 768) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const completeSession = async () => {
    if (!confirm('Mark this session as complete?')) return;
    await fetch(`/api/session/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    localStorage.removeItem(`workshop_${code}_session`);
    setPhase('completed');
  };

  // WELCOME PHASE
  if (phase === 'welcome') {
    return (
      <div className="session-welcome">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
        <h1>Welcome to the Workshop</h1>
        <p>You&apos;ll be assigned a scenario and interact with an AI chatbot. Enter your name to begin.</p>
        {error && <div className="login-error">{error}</div>}
        <form className="welcome-form" onSubmit={joinWorkshop}>
          <div className="form-group">
            <label className="form-label">Your Name (optional)</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary" disabled={joining} style={{ width: '100%' }}>
            {joining ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Joining...</> : '🚀 Start Session'}
          </button>
        </form>
      </div>
    );
  }

  // COMPLETED PHASE
  if (phase === 'completed') {
    return (
      <div className="session-welcome">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
        <h1>Session Complete!</h1>
        <p>Thank you for participating. Your responses have been recorded.</p>
        <div className="glass-card" style={{ padding: 24, marginTop: 16, textAlign: 'left', width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Messages sent</span>
            <span style={{ fontWeight: 600 }}>{messages.filter((m) => m.role === 'user').length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Version</span>
            <span style={{ fontWeight: 600 }}>{version?.title || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }

  // CHAT PHASE
  return (
    <div className="session-layout">
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="status-dot" />
            <h2>{workshopName || 'Workshop Chat'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCaseOpen(!caseOpen)} style={{ display: 'none' }} id="desktop-case-toggle">
              📋 Case
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
              <p style={{ marginBottom: 4, fontWeight: 500, color: 'var(--text-secondary)' }}>Start the conversation</p>
              <p style={{ fontSize: '0.85rem' }}>Type your first message below. Check the case panel for your scenario.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
              <div className="message-bubble">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} style={{ display: 'inline' }} />
                {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="typing-indicator" style={{ display: 'inline-flex', marginLeft: 4, verticalAlign: 'middle' }}>
                    <span /><span /><span />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="complete-section">
          <button className="complete-btn" onClick={completeSession}>✅ Mark Session as Complete</button>
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea ref={inputRef} className="chat-input" rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." disabled={streaming} autoFocus />
            <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || streaming} title="Send message">
              {streaming ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> : '➤'}
            </button>
          </div>
        </div>
      </div>

      <div className={`case-panel ${caseOpen ? 'open' : ''}`}>
        <div className="case-panel-header">
          <h3>📋 Your Case Scenario</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setCaseOpen(false)} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div className="case-panel-content">
          <div className="case-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(version?.case_content || '') }} />
        </div>
      </div>

      <button className="case-toggle-btn" onClick={() => setCaseOpen(!caseOpen)} title="Toggle case panel">
        {caseOpen ? '✕' : '📋'}
      </button>
    </div>
  );
}
