'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface City {
  id: string
  city: string
  state_code: string
  population: number
  slug: string
  wordpress_url: string | null
  published_at: string | null
  created_at: string
}

interface ResearchJob {
  id: string
  city_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  results_json: any
  created_at: string
  completed_at: string | null
}

export default function Dashboard() {
  const [cities, setCities] = useState<City[]>([])
  const [researchJobs, setResearchJobs] = useState<Map<string, ResearchJob>>(new Map())
  const [loading, setLoading] = useState(true)
  const [researchingCities, setResearchingCities] = useState<Set<string>>(new Set())
  const [publishingCities, setPublishingCities] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'researched' | 'published' | 'not-researched'>('all')

  useEffect(() => {
    fetchCities()
    fetchResearchJobs()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchResearchJobs()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('population', { ascending: false })

    if (!error && data) {
      setCities(data)
    }
    setLoading(false)
  }

  const fetchResearchJobs = async () => {
    const { data, error } = await supabase
      .from('research_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const jobMap = new Map<string, ResearchJob>()
      data.forEach(job => {
        // Keep the most recent job for each city
        if (!jobMap.has(job.city_id)) {
          jobMap.set(job.city_id, job)
        }
      })
      setResearchJobs(jobMap)
    }
  }

  const handleResearch = async (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    if (!city) return

    const confirmMessage = `Research ${city.city}, ${city.state_code}?\n\nThis will generate ${getNeighborhoodCount(city.city)} pages with ~15,000-20,000 words of content.\n\nEstimated time: 8-10 minutes\nCost: ~$0.50 in API calls`
    
    if (!confirm(confirmMessage)) return

    setResearchingCities(prev => new Set(prev).add(cityId))

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start research')
      }

      alert(`Research started for ${city.city}!\n\nGenerating content in the background. This will take 8-10 minutes.`)
      
      // Refresh jobs
      await fetchResearchJobs()
    } catch (error: any) {
      console.error('Research error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setResearchingCities(prev => {
        const newSet = new Set(prev)
        newSet.delete(cityId)
        return newSet
      })
    }
  }

  const handlePublish = async (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    const job = researchJobs.get(cityId)
    
    if (!city) return
    
    if (!job || job.status !== 'completed') {
      alert('Please run Research first before publishing.')
      return
    }

    const pageCount = job.results_json?.generatedContent?.neighborhoodPages?.length || 0
    const totalPages = pageCount + 1 // +1 for main page

    const confirmMessage = `Publish ${city.city}, ${city.state_code} to WordPress?\n\nThis will create ${totalPages} pages on your site.`
    
    if (!confirm(confirmMessage)) return

    setPublishingCities(prev => new Set(prev).add(cityId))

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresResearch) {
          alert('No content available. Please run Research first.')
        } else {
          throw new Error(data.error || 'Failed to publish')
        }
        return
      }

      alert(`✅ Successfully published ${data.pages.length} pages!\n\nMain URL:\n${data.mainUrl}\n\nAll pages are live on your site.`)
      
      // Refresh cities to show updated wordpress_url
      await fetchCities()
    } catch (error: any) {
      console.error('Publishing error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setPublishingCities(prev => {
        const newSet = new Set(prev)
        newSet.delete(cityId)
        return newSet
      })
    }
  }

  const getNeighborhoodCount = (cityName: string): number => {
    const neighborhoods: { [key: string]: number } = {
      'Phoenix': 8,
      'Dallas': 8,
      'Houston': 8,
      'Los Angeles': 8,
      'Chicago': 8,
      'San Antonio': 8
    }
    return (neighborhoods[cityName] || 8) + 1 // +1 for main page
  }

  const getStatusBadge = (cityId: string) => {
    const job = researchJobs.get(cityId)
    const city = cities.find(c => c.id === cityId)

    if (city?.published_at) {
      return <span className="status-badge published">✓ Published</span>
    }

    if (!job) {
      return <span className="status-badge not-researched">Not Researched</span>
    }

    switch (job.status) {
      case 'completed':
        return <span className="status-badge researched">✓ Researched</span>
      case 'processing':
        return <span className="status-badge processing">⏳ Processing...</span>
      case 'failed':
        return <span className="status-badge failed">✗ Failed</span>
      default:
        return <span className="status-badge pending">Pending</span>
    }
  }

  const getWordCount = (cityId: string): string => {
    const job = researchJobs.get(cityId)
    if (!job || job.status !== 'completed') return '-'
    
    const content = job.results_json?.generatedContent
    if (!content) return '-'

    let totalWords = 0
    
    // Count main page words
    if (content.mainCityPage?.htmlContent) {
      const text = content.mainCityPage.htmlContent.replace(/<[^>]*>/g, '')
      totalWords += text.split(/\s+/).length
    }

    // Count neighborhood pages
    if (content.neighborhoodPages) {
      content.neighborhoodPages.forEach((page: any) => {
        const text = page.htmlContent.replace(/<[^>]*>/g, '')
        totalWords += text.split(/\s+/).length
      })
    }

    return totalWords.toLocaleString()
  }

  const filteredCities = cities.filter(city => {
    // Search filter
    const matchesSearch = city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.state_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    // Status filter
    const job = researchJobs.get(city.id)
    
    switch (statusFilter) {
      case 'published':
        return city.published_at !== null
      case 'researched':
        return job?.status === 'completed' && !city.published_at
      case 'not-researched':
        return !job || job.status === 'failed'
      default:
        return true
    }
  })

  const stats = {
    total: cities.length,
    researched: Array.from(researchJobs.values()).filter(j => j.status === 'completed').length,
    published: cities.filter(c => c.published_at).length,
    notResearched: cities.length - Array.from(researchJobs.values()).filter(j => j.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading cities...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .dashboard-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          margin-bottom: 48px;
        }

        .dashboard-header h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1d1d1f;
        }

        .dashboard-header p {
          font-size: 18px;
          color: #86868b;
          margin: 0;
        }

        .nav-links {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .nav-link {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .nav-link:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 700;
          color: #667eea;
          margin: 0;
        }

        .stat-label {
          font-size: 16px;
          color: #86868b;
          margin: 8px 0 0 0;
        }

        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 300px;
          padding: 14px 20px;
          font-size: 16px;
          border: 2px solid #e8e8ed;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s;
        }

        .search-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid #e8e8ed;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .filter-btn:hover {
          border-color: #667eea;
        }

        .filter-btn.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .cities-table {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 16px;
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f5f5f7;
        }

        th {
          padding: 20px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
          border-bottom: 2px solid #e8e8ed;
        }

        td {
          padding: 20px;
          border-bottom: 1px solid #f5f5f7;
          font-size: 15px;
          color: #515154;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #fafafa;
        }

        .city-name {
          font-weight: 600;
          color: #1d1d1f;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.published {
          background: #d1f4e0;
          color: #0d7d3e;
        }

        .status-badge.researched {
          background: #d1e7ff;
          color: #0066cc;
        }

        .status-badge.not-researched {
          background: #f5f5f7;
          color: #86868b;
        }

        .status-badge.processing {
          background: #fff4d1;
          color: #b38600;
        }

        .status-badge.failed {
          background: #ffd1d1;
          color: #b30000;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-research {
          background: #667eea;
          color: white;
        }

        .btn-research:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .btn-publish {
          background: #0d7d3e;
          color: white;
        }

        .btn-publish:hover:not(:disabled) {
          background: #0a5f2e;
          transform: translateY(-2px);
        }

        .btn-view {
          background: #f5f5f7;
          color: #1d1d1f;
        }

        .btn-view:hover {
          background: #e8e8ed;
        }

        .btn-preview {
          background: #f5f5f7;
          color: #1d1d1f;
        }

        .btn-preview:hover {
          background: #e8e8ed;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 100px 20px;
          font-size: 18px;
          color: #86868b;
        }

        @media (max-width: 768px) {
          .dashboard-header h1 {
            font-size: 32px;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .controls {
            flex-direction: column;
          }

          .search-input {
            min-width: 100%;
          }

          .cities-table {
            overflow-x: auto;
          }

          table {
            min-width: 800px;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🗺️ City Content Manager</h1>
          <p>Generate and publish SEO-optimized dumpster rental pages</p>
        </div>

        <div className="nav-links">
          <a href="/bulk" className="nav-link">⚡ Bulk Operations</a>
          <a href="/import" className="nav-link">📥 Import Cities</a>
          <a href="/analytics" className="nav-link">📊 Analytics</a>
          <a href="/settings" className="nav-link">⚙️ Settings</a>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Cities</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.researched}</div>
            <div className="stat-label">Researched</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.published}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.notResearched}</div>
            <div className="stat-label">Not Researched</div>
          </div>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${statusFilter === 'not-researched' ? 'active' : ''}`}
              onClick={() => setStatusFilter('not-researched')}
            >
              Not Researched
            </button>
            <button
              className={`filter-btn ${statusFilter === 'researched' ? 'active' : ''}`}
              onClick={() => setStatusFilter('researched')}
            >
              Researched
            </button>
            <button
              className={`filter-btn ${statusFilter === 'published' ? 'active' : ''}`}
              onClick={() => setStatusFilter('published')}
            >
              Published
            </button>
          </div>
        </div>

        <div className="cities-table">
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>State</th>
                <th>Population</th>
                <th>Status</th>
                <th>Words</th>
                <th>Pages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.map(city => {
                const job = researchJobs.get(city.id)
                const pageCount = job?.results_json?.generatedContent?.neighborhoodPages?.length || 0
                const totalPages = job?.status === 'completed' ? pageCount + 1 : '-'
                const isResearching = researchingCities.has(city.id) || job?.status === 'processing'
                const isPublishing = publishingCities.has(city.id)
                const canPublish = job?.status === 'completed' && !isPublishing
                const canPreview = job?.status === 'completed'

                return (
                  <tr key={city.id}>
                    <td className="city-name">{city.city}</td>
                    <td>{city.state_code}</td>
                    <td>{city.population.toLocaleString()}</td>
                    <td>{getStatusBadge(city.id)}</td>
                    <td>{getWordCount(city.id)}</td>
                    <td>{totalPages}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-research"
                          onClick={() => handleResearch(city.id)}
                          disabled={isResearching}
                        >
                          {isResearching ? '⏳' : '🔬'}
                        </button>
                        <button
                          className="btn btn-publish"
                          onClick={() => handlePublish(city.id)}
                          disabled={!canPublish}
                        >
                          {isPublishing ? '⏳' : '📤'}
                        </button>
                        {canPreview && (
                          
                            href={`/preview/${city.id}`}
                            className="btn btn-preview"
                          >
                            👁️
                          </a>
                        )}
                        {city.wordpress_url && (
                          
                            href={city.wordpress_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-view"
                          >
                            🌐
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}