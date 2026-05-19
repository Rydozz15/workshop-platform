'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_authed');
    if (stored === 'true') setAuthed(true);
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_authed', 'true');
        setAuthed(true);
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;

  if (!authed) {
    return (
      <div className="login-container">
        <form className="glass-card login-card" onSubmit={handleLogin}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔐</div>
          <h1>Admin Access</h1>
          <p>Enter the admin password to access the workshop dashboard.</p>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/versions', label: 'Versions', icon: '📋' },
    { href: '/admin/campaigns', label: 'Campaigns', icon: '🚀' },
    { href: '/admin/sessions', label: 'Sessions', icon: '💬' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <h2>ISSDE Workshop</h2>
        </div>
        <nav>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 'auto' }} onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}>
          🚪 Logout
        </button>
      </aside>
      <main className="admin-content">{children}</main>
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
