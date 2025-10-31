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
  const [searchTerm, setSearchTerm] = useState('')

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

    if (!confirm(`Research ${city.city}, ${city.state_code}?\n\nThis will generate:\n- 1 main page (5,400 words)\n- 4 neighborhood pages (2,200 words each)\n\nTotal: ~14,200 words\nTime: 8-10 minutes`)) return

    setResearchingCities(prev => new Set(prev).add(cityId))

    try {
      console.log('🚀 Initializing research...')
      
      // Step 1: Initialize job
      const initResponse = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId })
      })

      const initData = await initResponse.json()
      if (!initResponse.ok) throw new Error(initData.error)

      const { jobId, neighborhoods } = initData
      console.log(`✅ Job ID: ${jobId}`)

      const updateProgress = async (progress: number, step: string) => {
        await supabase.from('research_jobs').update({
          progress: Math.round(progress),
          current_step: step
        }).eq('id', jobId)
        await fetchResearchJobs()
      }

      // Main page sections (6 sections)
      const mainSections = [
        { key: 'hero_services', label: 'Hero & Services', progress: 5 },
        { key: 'areas_whychoose', label: 'Areas & Why Choose Us', progress: 15 },
        { key: 'pricing_process', label: 'Pricing & Process', progress: 25 },
        { key: 'faqs_part1', label: 'FAQs Part 1', progress: 35 },
        { key: 'faqs_part2', label: 'FAQs Part 2', progress: 45 },
        { key: 'testimonials_cta', label: 'Testimonials & CTA', progress: 50 }
      ]

      console.log('📄 Generating main city page (6 sections)...')
      
      for (const section of mainSections) {
        await updateProgress(section.progress, `Main page: ${section.label}...`)
        
        const response = await fetch('/api/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId,
            pageType: 'main',
            section: section.key,
            jobId
          })
        })

        if (!response.ok) {
          console.error(`Failed to generate ${section.key}`)
          throw new Error(`Failed to generate main page section: ${section.label}`)
        }

        const data = await response.json()
        console.log(`✅ ${section.label} complete (${data.wordCount} words)`)
      }

      console.log('✅ Main city page complete!')

      // Neighborhood pages (4 neighborhoods, 3 sections each)
      const neighborhoodSections = [
        { key: 'intro_projects', label: 'Intro & Projects' },
        { key: 'service_details', label: 'Service Details' },
        { key: 'faqs_cta', label: 'FAQs & CTA' }
      ]

      const baseProgress = 50
      const progressPerNeighborhood = 12.5 // 50% total / 4 neighborhoods

      for (let i = 0; i < neighborhoods.length; i++) {
        const neighborhood = neighborhoods[i]
        const neighborhoodProgress = baseProgress + (i * progressPerNeighborhood)
        
        console.log(`📄 Generating ${neighborhood} page...`)

        for (let j = 0; j < neighborhoodSections.length; j++) {
          const section = neighborhoodSections[j]
          const sectionProgress = neighborhoodProgress + (j * (progressPerNeighborhood / 3))
          
          await updateProgress(sectionProgress, `${neighborhood}: ${section.label}...`)
          
          const response = await fetch('/api/generate-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cityId,
              pageType: 'neighborhood',
              section: section.key,
              neighborhoodName: neighborhood,
              jobId
            })
          })

          if (!response.ok) {
            console.error(`Failed to generate ${neighborhood} ${section.key}`)
            continue // Skip failed sections but continue
          }

          const data = await response.json()
          console.log(`✅ ${neighborhood} - ${section.label} (${data.wordCount} words)`)
        }

        console.log(`✅ ${neighborhood} page complete!`)
      }

      // Assemble final pages from sections
      await updateProgress(95, 'Assembling pages...')
      await assemblePagesFromSections(jobId, cityId, city, neighborhoods)

      // Mark complete
      await supabase.from('research_jobs').update({
        status: 'completed',
        progress: 100,
        current_step: 'Complete!',
        completed_at: new Date().toISOString()
      }).eq('id', jobId)

      alert(`✅ Research completed for ${city.city}!\n\nGenerated:\n- 1 main page (5,400 words)\n- 4 neighborhood pages (2,200 words each)\n\nTotal: ~14,200 words\n\nReady to Preview or Publish!`)
      
      await fetchResearchJobs()

    } catch (error: any) {
      console.error('💥 Research error:', error)
      alert('Error: ' + error.message)
      
      try {
        await supabase
          .from('research_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('city_id', cityId)
          .eq('status', 'processing')
      } catch (e) {
        console.error('Failed to update job status:', e)
      }
    } finally {
      setResearchingCities(prev => {
        const newSet = new Set(prev)
        newSet.delete(cityId)
        return newSet
      })
    }
  }

  async function assemblePagesFromSections(jobId: string, cityId: string, city: any, neighborhoods: string[]) {
    console.log('🔨 Assembling pages from sections...')
    
    const { data: job } = await supabase
      .from('research_jobs')
      .select('results_json')
      .eq('id', jobId)
      .single()

    const sections = job?.results_json?.sections || {}
    
    // Assemble main page
    const mainSections = sections.main || {}
    const mainPage = {
      type: 'main',
      title: `Dumpster Rental in ${city.city}, ${city.state_code} - Affordable Roll-Off Rentals`,
      metaDescription: `Professional dumpster rental in ${city.city}, ${city.state_code}. Residential, commercial & construction services. Fast delivery, transparent pricing. Call for your free quote today.`,
      h1: `Dumpster Rental in ${city.city}, ${city.state_code}`,
      content: {
        heroServices: mainSections.hero_services?.content || '',
        areasWhyChoose: mainSections.areas_whychoose?.content || '',
        neighborhoods: mainSections.areas_whychoose?.neighborhoods || [],
        pricingProcess: mainSections.pricing_process?.content || '',
        faqsPart1: mainSections.faqs_part1?.faqs || [],
        faqsPart2: mainSections.faqs_part2?.faqs || [],
        testimonialsCta: mainSections.testimonials_cta?.content || ''
      },
      wordCount: 
        (mainSections.hero_services?.wordCount || 0) +
        (mainSections.areas_whychoose?.wordCount || 0) +
        (mainSections.pricing_process?.wordCount || 0) +
        (mainSections.faqs_part1?.wordCount || 0) +
        (mainSections.faqs_part2?.wordCount || 0) +
        (mainSections.testimonials_cta?.wordCount || 0),
      generatedAt: new Date().toISOString()
    }

    // Assemble neighborhood pages
    const neighborhoodPages = neighborhoods.map(neighborhood => {
      const key = `neighborhood_${neighborhood}`
      const nSections = sections[key] || {}
      
      return {
        type: 'neighborhood',
        neighborhoodName: neighborhood,
        title: `Dumpster Rental in ${neighborhood}, ${city.city} - Fast Local Service`,
        metaDescription: `Dumpster rental service in ${neighborhood}, ${city.city}. Same-day delivery available. Residential & commercial. Transparent pricing. Book online or call today.`,
        h1: `Dumpster Rental in ${neighborhood}, ${city.city}`,
        content: {
          introProjects: nSections.intro_projects?.content || '',
          serviceDetails: nSections.service_details?.content || '',
          faqs: nSections.faqs_cta?.faqs || [],
          cta: nSections.faqs_cta?.cta || ''
        },
        wordCount:
          (nSections.intro_projects?.wordCount || 0) +
          (nSections.service_details?.wordCount || 0) +
          (nSections.faqs_cta?.wordCount || 0),
        generatedAt: new Date().toISOString()
      }
    })

    // Save assembled pages
    await supabase
      .from('research_jobs')
      .update({
        results_json: {
          pages: [mainPage, ...neighborhoodPages],
          sections // Keep sections for debugging
        }
      })
      .eq('id', jobId)

    console.log('✅ Pages assembled!')
  }

  const handlePublish = async (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    const job = researchJobs.get(cityId)
    
    if (!city) return
    
    if (!job || job.status !== 'completed') {
      alert('Research must be completed before publishing')
      return
    }

    if (!confirm(`Publish ${city.city}, ${city.state_code} to WordPress?\n\nThis will create multiple pages on your production site.`)) return

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

      alert(`Successfully published ${data.pages.length} pages for ${city.city}`)
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

    if (city?.published_at) return 'published'
    if (!job) return 'not-researched'
    if (job.status === 'completed') return 'researched'
    if (job.status === 'processing') return 'processing'
    if (job.status === 'failed') return 'failed'
    return 'pending'
  }

  const filteredCities = cities.filter(city => 
    city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: cities.length,
    researched: Array.from(researchJobs.values()).filter((j: any) => j.status === 'completed').length,
    published: cities.filter(c => c.published_at).length,
    processing: Array.from(researchJobs.values()).filter((j: any) => j.status === 'processing').length
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e9ecef',
            borderTop: '4px solid #4c6ef5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#868e96', fontSize: '14px' }}>Loading dashboard...</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        
        .container {
          min-height: 100vh;
          background: #f8f9fa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .header {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 24px 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #212529;
          letter-spacing: -0.5px;
        }
        
        .nav {
          display: flex;
          gap: 8px;
        }
        
        .nav-btn {
          padding: 10px 20px;
          background: #4c6ef5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .nav-btn:hover {
          background: #4263eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 110, 245, 0.3);
        }
        
        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 32px;
        }
        
        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #212529;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        
        .page-subtitle {
          font-size: 15px;
          color: #868e96;
          margin: 0 0 32px 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 28px;
          border: 1px solid #dee2e6;
          transition: all 0.2s;
        }
        
        .stat-card:hover {
          border-color: #4c6ef5;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        
        .stat-label {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #868e96;
          margin-bottom: 12px;
        }
        
        .stat-value {
          font-size: 40px;
          font-weight: 700;
          color: #212529;
          line-height: 1;
        }
        
        .stat-card.processing .stat-value {
          color: #f59f00;
        }
        
        .stat-card.researched .stat-value {
          color: #4c6ef5;
        }
        
        .stat-card.published .stat-value {
          color: #20c997;
        }
        
        .search-box {
          margin-bottom: 24px;
        }
        
        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 12px 16px;
          font-size: 14px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
          background: white;
        }
        
        .search-input:focus {
          border-color: #4c6ef5;
          box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
        }
        
        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #dee2e6;
          overflow: hidden;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: #f8f9fa;
        }
        
        th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
        }
        
        td {
          padding: 20px;
          border-bottom: 1px solid #f1f3f5;
          font-size: 14px;
          color: #495057;
        }
        
        tbody tr {
          transition: background 0.2s;
        }
        
        tbody tr:hover {
          background: #f8f9fa;
        }
        
        tbody tr:last-child td {
          border-bottom: none;
        }
        
        .city-name {
          font-weight: 600;
          color: #212529;
          font-size: 15px;
        }
        
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        
        .badge.published {
          background: #d3f9d8;
          color: #2b8a3e;
        }
        
        .badge.researched {
          background: #d0ebff;
          color: #1971c2;
        }
        
        .badge.processing {
          background: #fff3bf;
          color: #e67700;
        }
        
        .badge.not-researched {
          background: #f1f3f5;
          color: #868e96;
        }
        
        .badge.failed {
          background: #ffe3e3;
          color: #c92a2a;
        }
        
        .progress-container {
          margin-top: 12px;
          width: 240px;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4c6ef5 0%, #5f3dc4 100%);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 3px;
        }
        
        .progress-text {
          font-size: 11px;
          color: #4c6ef5;
          font-weight: 600;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .pulse-dot {
          width: 6px;
          height: 6px;
          background: #4c6ef5;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          white-space: nowrap;
        }
        
        .btn-primary {
          background: #4c6ef5;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #4263eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 110, 245, 0.3);
        }
        
        .btn-success {
          background: #20c997;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background: #12b886;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(32, 201, 151, 0.3);
        }
        
        .btn-secondary {
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
        }
        
        .btn-secondary:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .nav {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .nav-btn {
            flex: 1;
            min-width: 140px;
            text-align: center;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .table-container {
            overflow-x: auto;
          }
          
          table {
            min-width: 900px;
          }
        }
      `}</style>

      <div className="container">
        <header className="header">
          <div className="header-content">
            <div className="logo">Content Manager Pro</div>
            <nav className="nav">
              <Link href="/bulk" className="nav-btn">Bulk Operations</Link>
              <Link href="/import" className="nav-btn">Import</Link>
              <Link href="/analytics" className="nav-btn">Analytics</Link>
              <Link href="/settings" className="nav-btn">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="main">
          <h1 className="page-title">City Content Dashboard</h1>
          <p className="page-subtitle">
            Manage SEO-optimized content generation and WordPress publishing
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Cities</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card processing">
              <div className="stat-label">Processing</div>
              <div className="stat-value">{stats.processing}</div>
            </div>
            <div className="stat-card researched">
              <div className="stat-label">Researched</div>
              <div className="stat-value">{stats.researched}</div>
            </div>
            <div className="stat-card published">
              <div className="stat-label">Published</div>
              <div className="stat-value">{stats.published}</div>
            </div>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search cities or states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>State</th>
                  <th>Population</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city) => {
                  const job = researchJobs.get(city.id)
                  const isResearching = researchingCities.has(city.id) || job?.status === 'processing'
                  const isPublishing = publishingCities.has(city.id)
                  const canPublish = job?.status === 'completed' && !isPublishing
                  const canPreview = job?.status === 'completed'
                  const status = getStatus(city.id)

                  return (
                    <tr key={city.id}>
                      <td className="city-name">{city.city}</td>
                      <td>{city.state_code}</td>
                      <td>{city.population.toLocaleString()}</td>
                      <td>
                        <div>
                          <span className={'badge ' + status}>
                            {status === 'published' && 'Published'}
                            {status === 'researched' && 'Researched'}
                            {status === 'processing' && 'Processing'}
                            {status === 'not-researched' && 'Not Researched'}
                            {status === 'failed' && 'Failed'}
                          </span>
                          
                          {isResearching && job?.progress !== undefined && (
                            <div className="progress-container">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: job.progress + '%' }} />
                              </div>
                              <div className="progress-text">
                                <span className="pulse-dot" />
                                {job.progress}% • {job.current_step || 'Processing...'}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            onClick={() => handleResearch(city.id)}
                            disabled={isResearching}
                            className="btn btn-primary"
                          >
                            {isResearching ? 'Processing...' : 'Research'}
                          </button>
                          <button
                            onClick={() => handlePublish(city.id)}
                            disabled={!canPublish}
                            className="btn btn-success"
                          >
                            {isPublishing ? 'Publishing...' : 'Publish'}
                          </button>
                          {canPreview && (
                            <Link href={'/preview/' + city.id} className="btn btn-secondary">
                              Preview
                            </Link>
                          )}
                          {city.wordpress_url && (
                            <a 
                              href={city.wordpress_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                            >
                              View Live
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
        </main>
      </div>
    </>
  )
}