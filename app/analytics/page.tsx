'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Analytics() {
  const [cities, setCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })

    if (data) setCities(data)
    setLoading(false)
  }

  const stats = {
    totalPages: cities.length,
    totalWords: cities.length * 15000, // Estimate
    avgWordsPerPage: 15000,
    publishedThisMonth: cities.filter(c => {
      const publishedDate = new Date(c.published_at)
      const now = new Date()
      return publishedDate.getMonth() === now.getMonth() && 
             publishedDate.getFullYear() === now.getFullYear()
    }).length
  }

  return (
    <>
      <style jsx>{`
        .analytics-container {
          max-width: 1600px;
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 16px;
          padding: 32px;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 700;
          color: #667eea;
          margin: 0 0 8px 0;
        }

        .stat-label {
          font-size: 16px;
          color: #86868b;
          margin: 0;
        }

        .section {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
        }

        .section h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #1d1d1f;
        }

        .coming-soon {
          text-align: center;
          padding: 60px 20px;
          background: #f5f5f7;
          border-radius: 12px;
        }

        .coming-soon h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #1d1d1f;
        }

        .coming-soon p {
          font-size: 16px;
          color: #86868b;
          margin: 0;
        }

        .integration-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .integration-item {
          background: #f5f5f7;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .integration-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .integration-name {
          font-weight: 600;
          color: #1d1d1f;
        }
      `}</style>

      <div className="analytics-container">
        <a href="/dashboard" className="back-link">← Back to Dashboard</a>
        
        <div className="header">
          <h1>📊 Analytics</h1>
          <p>Track performance across all your published pages</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalPages}</div>
            <div className="stat-label">Total Published Pages</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalWords.toLocaleString()}</div>
            <div className="stat-label">Total Words Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.avgWordsPerPage.toLocaleString()}</div>
            <div className="stat-label">Avg Words Per Page</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.publishedThisMonth}</div>
            <div className="stat-label">Published This Month</div>
          </div>
        </div>

        <div className="section">
          <h2>Traffic & Rankings</h2>
          <div className="coming-soon">
            <h3>🚧 Coming Soon</h3>
            <p>Google Analytics and Search Console integration</p>
            <div className="integration-list">
              <div className="integration-item">
                <div className="integration-icon">📈</div>
                <div className="integration-name">Google Analytics</div>
              </div>
              <div className="integration-item">
                <div className="integration-icon">🔍</div>
                <div className="integration-name">Search Console</div>
              </div>
              <div className="integration-item">
                <div className="integration-icon">🎯</div>
                <div className="integration-name">Rank Tracking</div>
              </div>
              <div className="integration-item">
                <div className="integration-icon">💰</div>
                <div className="integration-name">Conversion Tracking</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Top Performing Pages</h2>
          <div className="coming-soon">
            <h3>🚧 Coming Soon</h3>
            <p>See which cities are driving the most traffic and conversions</p>
          </div>
        </div>
      </div>
    </>
  )
}