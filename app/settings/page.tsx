'use client'

import { useState, useEffect } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    wordpress_url: '',
    wordpress_username: '',
    wordpress_password: '',
    anthropic_key: '',
    supabase_url: '',
    supabase_key: ''
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load current settings from env
    setSettings({
      wordpress_url: process.env.NEXT_PUBLIC_WORDPRESS_URL || '',
      wordpress_username: process.env.NEXT_PUBLIC_WORDPRESS_USERNAME || '',
      wordpress_password: '••••••••',
      anthropic_key: '••••••••',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabase_key: '••••••••'
    })
  }, [])

  const handleSave = async () => {
    // In production, you'd save these to a secure backend
    // For now, just show confirmation
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <style jsx>{`
        .settings-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          margin-bottom: 48px;
        }

        .header h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1d1d1f;
        }

        .header p {
          font-size: 18px;
          color: #86868b;
          margin: 0;
        }

        .back-link {
          display: inline-block;
          color: #06c;
          text-decoration: none;
          margin-bottom: 24px;
          font-size: 16px;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .section {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
        }

        .section h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #1d1d1f;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid #e8e8ed;
          border-radius: 8px;
          outline: none;
          transition: all 0.3s;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-help {
          font-size: 13px;
          color: #86868b;
          margin-top: 8px;
        }

        .save-button {
          padding: 16px 48px;
          font-size: 16px;
          font-weight: 600;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-button:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .save-button.saved {
          background: #0d7d3e;
        }

        .warning {
          background: #fff4d1;
          border: 2px solid #f4e5a1;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #b38600;
        }

        .current-values {
          background: #f5f5f7;
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
        }

        .current-values h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .current-values pre {
          font-size: 13px;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>

      <div className="settings-container">
        <a href="/dashboard" className="back-link">← Back to Dashboard</a>
        
        <div className="header">
          <h1>⚙️ Settings</h1>
          <p>Configure your CRM and API integrations</p>
        </div>

        <div className="warning">
          ⚠️ Note: These settings are currently read from your .env file. To change them, update your .env.local file and restart the dev server.
        </div>

        <div className="section">
          <h2>WordPress Configuration</h2>
          
          <div className="form-group">
            <label className="form-label">WordPress Site URL</label>
            <input 
              type="text" 
              className="form-input"
              value={settings.wordpress_url}
              readOnly
              placeholder="https://yourdomain.com"
            />
            <div className="form-help">Your WordPress site URL (without trailing slash)</div>
          </div>

          <div className="form-group">
            <label className="form-label">WordPress Username</label>
            <input 
              type="text" 
              className="form-input"
              value={settings.wordpress_username}
              readOnly
              placeholder="admin"
            />
            <div className="form-help">WordPress admin username</div>
          </div>

          <div className="form-group">
            <label className="form-label">Application Password</label>
            <input 
              type="password" 
              className="form-input"
              value={settings.wordpress_password}
              readOnly
              placeholder="xxxx xxxx xxxx xxxx"
            />
            <div className="form-help">WordPress Application Password (not your regular password)</div>
          </div>
        </div>

        <div className="section">
          <h2>API Keys</h2>
          
          <div className="form-group">
            <label className="form-label">Anthropic API Key</label>
            <input 
              type="password" 
              className="form-input"
              value={settings.anthropic_key}
              readOnly
              placeholder="sk-ant-..."
            />
            <div className="form-help">Your Anthropic API key for content generation</div>
          </div>

          <div className="form-group">
            <label className="form-label">Supabase URL</label>
            <input 
              type="text" 
              className="form-input"
              value={settings.supabase_url}
              readOnly
              placeholder="https://xxxxx.supabase.co"
            />
            <div className="form-help">Your Supabase project URL</div>
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Anon Key</label>
            <input 
              type="password" 
              className="form-input"
              value={settings.supabase_key}
              readOnly
              placeholder="eyJhbGc..."
            />
            <div className="form-help">Your Supabase anonymous key</div>
          </div>
        </div>

        <div className="current-values">
          <h3>Current Environment Variables</h3>
          <pre>{`WORDPRESS_SITE_URL=${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'Not set'}
WORDPRESS_USERNAME=${process.env.NEXT_PUBLIC_WORDPRESS_USERNAME || 'Not set'}
WORDPRESS_APP_PASSWORD=${process.env.WORDPRESS_APP_PASSWORD ? '••••••••' : 'Not set'}
ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? '••••••••' : 'Not set'}
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••' : 'Not set'}`}</pre>
        </div>
      </div>
    </>
  )
}