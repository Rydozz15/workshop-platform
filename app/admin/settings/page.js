'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    default_ai_provider: 'openrouter',
    default_ai_model: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Error saving settings: ' + e.message);
    }
    setSaving(false);
  };

  const modelPlaceholder = settings.default_ai_provider === 'groq'
    ? 'llama-3.3-70b-versatile'
    : 'meta-llama/llama-3.1-8b-instruct';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Settings</h1>
        <p>Configure global defaults for AI provider, model, and platform behavior.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="glass-card" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 4 }}>🤖 AI Configuration</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            These defaults are used for analytics summaries and pre-filled when creating new campaigns. Individual campaigns can override these values.
          </p>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Default AI Provider</label>
            <select
              className="input"
              value={settings.default_ai_provider}
              onChange={(e) => setSettings(prev => ({ ...prev, default_ai_provider: e.target.value }))}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="groq">Groq</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              {settings.default_ai_provider === 'openrouter'
                ? 'Uses the OPENROUTER_API_KEY environment variable. Supports hundreds of models.'
                : 'Uses the GROQ_API_KEY environment variable. Ultra-fast inference.'}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Default AI Model</label>
            <input
              className="input"
              value={settings.default_ai_model}
              onChange={(e) => setSettings(prev => ({ ...prev, default_ai_model: e.target.value }))}
              placeholder={modelPlaceholder}
              required
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              {settings.default_ai_provider === 'openrouter'
                ? 'Use the full model ID from OpenRouter (e.g., meta-llama/llama-3.1-8b-instruct, qwen/qwen3-32b).'
                : 'Use the Groq model ID (e.g., llama-3.3-70b-versatile, llama3-8b-8192).'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
            {saved && (
              <span style={{ 
                color: 'var(--accent-emerald)', 
                fontSize: '0.9rem', 
                animation: 'fadeIn 0.3s ease'
              }}>
                ✅ Settings saved successfully
              </span>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ maxWidth: 640, marginTop: 20 }}>
          <h3 style={{ marginBottom: 4 }}>📋 How Settings Are Used</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span>🚀</span>
              <span><strong>New campaigns</strong> — Provider and model are pre-filled from these defaults. You can override them per campaign.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span>📈</span>
              <span><strong>Analytics summaries</strong> — The AI Summary and Evolution Analysis buttons use this model as fallback when no campaign-specific model is available.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span>⚙️</span>
              <span><strong>Environment variables</strong> — API keys (<code>OPENROUTER_API_KEY</code>, <code>GROQ_API_KEY</code>) are still read from environment variables and cannot be changed here.</span>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
