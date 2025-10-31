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
}

interface ResearchJob {
  id: string
  city_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export default function BulkOperations() {
  const [cities, setCities] = useState<City[]>([])
  const [researchJobs, setResearchJobs] = useState<Map<string, ResearchJob>>(new Map())
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, operation: '' })

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchResearchJobs, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchCities(), fetchResearchJobs()])
    setLoading(false)
  }

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('population', { ascending: false })

    if (!error && data) setCities(data)
  }

  const fetchResearchJobs = async () => {
    const { data, error } = await supabase
      .from('research_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const jobMap = new Map<string, ResearchJob>()
      data.forEach(job => {
        if (!jobMap.has(job.city_id)) {
          jobMap.set(job.city_id, job)
        }
      })
      setResearchJobs(jobMap)
    }
  }

  const toggleCity = (cityId: string) => {
    setSelectedCities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cityId)) {
        newSet.delete(cityId)
      } else {
        newSet.add(cityId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedCities(new Set(cities.map(c => c.id)))
  }

  const selectNone = () => {
    setSelectedCities(new Set())
  }

  const selectNotResearched = () => {
    const notResearched = cities.filter(c => {
      const job = researchJobs.get(c.id)
      return !job || job.status === 'failed'
    })
    setSelectedCities(new Set(notResearched.map(c => c.id)))
  }

  const selectResearched = () => {
    const researched = cities.filter(c => {
      const job = researchJobs.get(c.id)
      return job?.status === 'completed' && !c.published_at
    })
    setSelectedCities(new Set(researched.map(c => c.id)))
  }

  const bulkResearch = async () => {
    if (selectedCities.size === 0) {
      alert('Please select at least one city')
      return
    }

    const estimatedTime = Math.ceil(selectedCities.size * 8) // 8 min per city
    const estimatedCost = (selectedCities.size * 0.50).toFixed(2)

    if (!confirm(`Research ${selectedCities.size} cities?\n\nEstimated time: ${estimatedTime} minutes\nEstimated cost: $${estimatedCost}\n\nCities will be processed one at a time.`)) {
      return
    }

    setProcessing(true)
    const cityIds = Array.from(selectedCities)
    setProgress({ current: 0, total: cityIds.length, operation: 'research' })

    for (let i = 0; i < cityIds.length; i++) {
      const cityId = cityIds[i]
      const city = cities.find(c => c.id === cityId)
      
      setProgress({ current: i + 1, total: cityIds.length, operation: 'research' })

      try {
        console.log(`🔬 Researching ${city?.city}, ${city?.state_code} (${i + 1}/${cityIds.length})`)
        
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId })
        })

        if (!response.ok) {
          console.error(`Failed to research ${city?.city}`)
        }

        // Wait for completion (poll until done)
        await waitForCompletion(cityId)
        
      } catch (error) {
        console.error(`Error researching ${city?.city}:`, error)
      }
    }

    setProcessing(false)
    setProgress({ current: 0, total: 0, operation: '' })
    alert(`✅ Bulk research complete!\n\n${cityIds.length} cities researched.`)
    
    await fetchData()
  }

  const bulkPublish = async () => {
    if (selectedCities.size === 0) {
      alert('Please select at least one city')
      return
    }

    // Filter to only researched cities
    const validCities = Array.from(selectedCities).filter(cityId => {
      const job = researchJobs.get(cityId)
      return job?.status === 'completed'
    })

    if (validCities.length === 0) {
      alert('No researched cities selected. Please run Research first.')
      return
    }

    if (!confirm(`Publish ${validCities.length} cities to WordPress?\n\nThis will create ~${validCities.length * 9} pages on your site.`)) {
      return
    }

    setProcessing(true)
    setProgress({ current: 0, total: validCities.length, operation: 'publish' })

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validCities.length; i++) {
      const cityId = validCities[i]
      const city = cities.find(c => c.id === cityId)
      
      setProgress({ current: i + 1, total: validCities.length, operation: 'publish' })

      try {
        console.log(`📤 Publishing ${city?.city}, ${city?.state_code} (${i + 1}/${validCities.length})`)
        
        const response = await fetch('/api/wordpress/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId })
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
          console.error(`Failed to publish ${city?.city}`)
        }
        
      } catch (error) {
        failCount++
        console.error(`Error publishing ${city?.city}:`, error)
      }
    }

    setProcessing(false)
    setProgress({ current: 0, total: 0, operation: '' })
    alert(`✅ Bulk publish complete!\n\nSuccess: ${successCount}\nFailed: ${failCount}`)
    
    await fetchData()
  }

  const waitForCompletion = async (cityId: string): Promise<void> => {
    return new Promise((resolve) => {
      const checkStatus = async () => {
        const { data } = await supabase
          .from('research_jobs')
          .select('status')
          .eq('city_id', cityId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data?.status === 'completed' || data?.status === 'failed') {
          resolve()
        } else {
          setTimeout(checkStatus, 5000) // Check every 5 seconds
        }
      }
      checkStatus()
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .container {
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

        .nav-back {
          display: inline-block;
          color: #06c;
          text-decoration: none;
          margin-bottom: 24px;
          font-size: 16px;
        }

        .nav-back:hover {
          text-decoration: underline;
        }

        .selection-stats {
          background: #f5f5f7;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .selection-info {
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .selection-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-secondary {
          background: #f5f5f7;
          color: #1d1d1f;
        }

        .btn-secondary:hover {
          background: #e8e8ed;
        }

        .btn-success {
          background: #0d7d3e;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #0a5f2e;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bulk-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .btn-bulk {
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-bulk-research {
          background: #667eea;
          color: white;
        }

        .btn-bulk-research:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .btn-bulk-publish {
          background: #0d7d3e;
          color: white;
        }

        .btn-bulk-publish:hover:not(:disabled) {
          background: #0a5f2e;
          transform: translateY(-2px);
        }

        .progress-bar {
          background: #f5f5f7;
          padding: 32px;
          border-radius: 16px;
          margin-bottom: 32px;
        }

        .progress-info {
          text-align: center;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .progress-track {
          height: 12px;
          background: #e8e8ed;
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }

        .cities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .city-card {
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .city-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .city-card.selected {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .city-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .city-name {
          font-size: 20px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .checkbox {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }

        .city-state {
          font-size: 16px;
          color: #86868b;
          margin-bottom: 12px;
        }

        .city-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-published {
          background: #d1f4e0;
          color: #0d7d3e;
        }

        .status-researched {
          background: #d1e7ff;
          color: #0066cc;
        }

        .status-not-researched {
          background: #f5f5f7;
          color: #86868b;
        }

        .loading {
          text-align: center;
          padding: 100px 20px;
          font-size: 18px;
          color: #86868b;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 32px;
          }

          .selection-stats {
            flex-direction: column;
            align-items: start;
          }

          .cities-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="container">
        <a href="/dashboard" className="nav-back">← Back to Dashboard</a>
        
        <div className="header">
          <h1>⚡ Bulk Operations</h1>
          <p>Research and publish multiple cities at once</p>
        </div>

        <div className="selection-stats">
          <div className="selection-info">
            {selectedCities.size} cities selected
          </div>
          <div className="selection-actions">
            <button className="btn btn-secondary" onClick={selectAll}>
              Select All ({cities.length})
            </button>
            <button className="btn btn-secondary" onClick={selectNotResearched}>
              Select Not Researched
            </button>
            <button className="btn btn-secondary" onClick={selectResearched}>
              Select Researched
            </button>
            <button className="btn btn-secondary" onClick={selectNone}>
              Clear Selection
            </button>
          </div>
        </div>

        <div className="bulk-actions">
          <button
            className="btn-bulk btn-bulk-research"
            onClick={bulkResearch}
            disabled={processing || selectedCities.size === 0}
          >
            🔬 Bulk Research ({selectedCities.size} cities)
          </button>
          <button
            className="btn-bulk btn-bulk-publish"
            onClick={bulkPublish}
            disabled={processing || selectedCities.size === 0}
          >
            📤 Bulk Publish ({selectedCities.size} cities)
          </button>
        </div>

        {processing && (
          <div className="progress-bar">
            <div className="progress-info">
              {progress.operation === 'research' ? '🔬 Researching' : '📤 Publishing'}: {progress.current} of {progress.total}
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="cities-grid">
          {cities.map(city => {
            const job = researchJobs.get(city.id)
            const isSelected = selectedCities.has(city.id)
            
            let status = 'not-researched'
            let statusLabel = 'Not Researched'
            
            if (city.published_at) {
              status = 'published'
              statusLabel = '✓ Published'
            } else if (job?.status === 'completed') {
              status = 'researched'
              statusLabel = '✓ Researched'
            }

            return (
              <div
                key={city.id}
                className={`city-card ${isSelected ? 'selected' : ''}`}
                onClick={() => !processing && toggleCity(city.id)}
              >
                <div className="city-header">
                  <div className="city-name">{city.city}</div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="checkbox"
                  />
                </div>
                <div className="city-state">{city.state_code} • {city.population.toLocaleString()}</div>
                <div className={`city-status status-${status}`}>
                  {statusLabel}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}