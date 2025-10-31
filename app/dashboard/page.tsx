'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [cities, setCities] = useState<any[]>([])
  const [researchJobs, setResearchJobs] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [researchingCities, setResearchingCities] = useState<Set<string>>(new Set())
  const [publishingCities, setPublishingCities] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCities()
    fetchResearchJobs()
    
    const interval = setInterval(() => {
      fetchResearchJobs()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .order('population', { ascending: false })

    if (data) setCities(data)
    setLoading(false)
  }

  const fetchResearchJobs = async () => {
    const { data } = await supabase
      .from('research_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      const jobMap = new Map()
      data.forEach((job: any) => {
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

    if (!confirm('Research ' + city.city + ', ' + city.state_code + '?')) return

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

      alert('Research started for ' + city.city)
      await fetchResearchJobs()
    } catch (error: any) {
      alert('Error: ' + error.message)
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
      alert('Please run Research first')
      return
    }

    if (!confirm('Publish ' + city.city + ' to WordPress?')) return

    setPublishingCities(prev => new Set(prev).add(cityId))

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      alert('Successfully published ' + data.pages.length + ' pages!')
      await fetchCities()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setPublishingCities(prev => {
        const newSet = new Set(prev)
        newSet.delete(cityId)
        return newSet
      })
    }
  }

  const getStatus = (cityId: string) => {
    const job = researchJobs.get(cityId)
    const city = cities.find(c => c.id === cityId)

    if (city?.published_at) return 'Published'
    if (!job) return 'Not Researched'
    if (job.status === 'completed') return 'Researched'
    if (job.status === 'processing') return 'Processing'
    if (job.status === 'failed') return 'Failed'
    return 'Pending'
  }

  const stats = {
    total: cities.length,
    researched: Array.from(researchJobs.values()).filter((j: any) => j.status === 'completed').length,
    published: cities.filter(c => c.published_at).length
  }

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>City Content Manager</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Generate and publish SEO-optimized dumpster rental pages</p>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link href="/bulk" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
          Bulk Operations
        </Link>
        <Link href="/import" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
          Import Cities
        </Link>
        <Link href="/analytics" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
          Analytics
        </Link>
        <Link href="/settings" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
          Settings
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div style={{ background: 'white', border: '2px solid #e8e8ed', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#667eea' }}>{stats.total}</div>
          <div style={{ fontSize: '16px', color: '#86868b' }}>Total Cities</div>
        </div>
        <div style={{ background: 'white', border: '2px solid #e8e8ed', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#667eea' }}>{stats.researched}</div>
          <div style={{ fontSize: '16px', color: '#86868b' }}>Researched</div>
        </div>
        <div style={{ background: 'white', border: '2px solid #e8e8ed', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#667eea' }}>{stats.published}</div>
          <div style={{ fontSize: '16px', color: '#86868b' }}>Published</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '2px solid #e8e8ed', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f7' }}>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e8e8ed' }}>City</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e8e8ed' }}>State</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e8e8ed' }}>Population</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e8e8ed' }}>Status</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e8e8ed' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => {
              const job = researchJobs.get(city.id)
              const isResearching = researchingCities.has(city.id) || job?.status === 'processing'
              const isPublishing = publishingCities.has(city.id)
              const canPublish = job?.status === 'completed' && !isPublishing
              const canPreview = job?.status === 'completed'

              return (
                <tr key={city.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                  <td style={{ padding: '20px', fontWeight: '600' }}>{city.city}</td>
                  <td style={{ padding: '20px' }}>{city.state_code}</td>
                  <td style={{ padding: '20px' }}>{city.population.toLocaleString()}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: '600',
                      background: getStatus(city.id) === 'Published' ? '#d1f4e0' : getStatus(city.id) === 'Researched' ? '#d1e7ff' : '#f5f5f7',
                      color: getStatus(city.id) === 'Published' ? '#0d7d3e' : getStatus(city.id) === 'Researched' ? '#0066cc' : '#86868b'
                    }}>
                      {getStatus(city.id)}
                    </span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleResearch(city.id)}
                        disabled={isResearching}
                        style={{ 
                          padding: '10px 20px', 
                          background: '#667eea', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: isResearching ? 'not-allowed' : 'pointer',
                          opacity: isResearching ? 0.5 : 1,
                          fontWeight: '600'
                        }}
                      >
                        {isResearching ? 'Processing' : 'Research'}
                      </button>
                      <button
                        onClick={() => handlePublish(city.id)}
                        disabled={!canPublish}
                        style={{ 
                          padding: '10px 20px', 
                          background: '#0d7d3e', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: canPublish ? 'pointer' : 'not-allowed',
                          opacity: canPublish ? 1 : 0.5,
                          fontWeight: '600'
                        }}
                      >
                        {isPublishing ? 'Publishing' : 'Publish'}
                      </button>
                      {canPreview && (
                        <Link 
                          href={'/preview/' + city.id}
                          style={{ 
                            padding: '10px 20px', 
                            background: '#f5f5f7', 
                            color: '#1d1d1f', 
                            border: 'none', 
                            borderRadius: '8px', 
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          Preview
                        </Link>
                      )}
                      {city.wordpress_url && (
                        <a 
                          href={city.wordpress_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            padding: '10px 20px', 
                            background: '#f5f5f7', 
                            color: '#1d1d1f', 
                            border: 'none', 
                            borderRadius: '8px', 
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          View
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
  )
}