'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ContentPreview() {
  const params = useParams()
  const cityId = params.cityId as string
  
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState<any>(null)
  const [content, setContent] = useState<any>(null)
  const [selectedPage, setSelectedPage] = useState<'main' | number>('main')

  useEffect(() => {
    fetchData()
  }, [cityId])

  const fetchData = async () => {
    // Fetch city
    const { data: cityData } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    // Fetch research job
    const { data: jobData } = await supabase
      .from('research_jobs')
      .select('*')
      .eq('city_id', cityId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cityData) setCity(cityData)
    if (jobData?.results_json?.generatedContent) {
      setContent(jobData.results_json.generatedContent)
    }
    
    setLoading(false)
  }

  const getWordCount = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, '')
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        Loading preview...
      </div>
    )
  }

  if (!content) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>No content available</h2>
        <p>Please run Research first.</p>
        <a href="/dashboard" style={{ color: '#06c' }}>← Back to Dashboard</a>
      </div>
    )
  }

  const mainPage = content.mainCityPage
  const neighborhoodPages = content.neighborhoodPages || []

  const currentContent = selectedPage === 'main' 
    ? mainPage 
    : neighborhoodPages[selectedPage as number]

  return (
    <>
      <style jsx>{`
        .preview-container {
          display: flex;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sidebar {
          width: 320px;
          background: #f5f5f7;
          border-right: 1px solid #e8e8ed;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #e8e8ed;
        }

        .sidebar-header h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1d1d1f;
        }

        .sidebar-header p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
        }

        .back-link {
          display: inline-block;
          color: #06c;
          text-decoration: none;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-list {
          padding: 16px;
        }

        .page-item {
          padding: 16px;
          margin-bottom: 8px;
          background: white;
          border: 2px solid #e8e8ed;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .page-item:hover {
          border-color: #667eea;
        }

        .page-item.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .page-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .page-meta {
          font-size: 13px;
          opacity: 0.7;
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          background: white;
        }

        .content-header {
          padding: 24px;
          border-bottom: 1px solid #e8e8ed;
          background: #f5f5f7;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .content-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #1d1d1f;
        }

        .content-stats {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #86868b;
        }

        .content-body {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .preview-mode {
          padding: 16px 24px;
          background: #fff4d1;
          border-bottom: 2px solid #f4e5a1;
          text-align: center;
          font-weight: 600;
          color: #b38600;
        }

        .raw-html {
          background: #f5f5f7;
          padding: 24px;
          border-radius: 12px;
          margin-top: 40px;
        }

        .raw-html h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .raw-html pre {
          background: white;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .preview-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            max-height: 300px;
          }
        }
      `}</style>

      <div className="preview-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <a href="/dashboard" className="back-link">← Back to Dashboard</a>
            <h2>{city.city}, {city.state_code}</h2>
            <p>Content Preview</p>
          </div>
          
          <div className="page-list">
            <div 
              className={`page-item ${selectedPage === 'main' ? 'active' : ''}`}
              onClick={() => setSelectedPage('main')}
            >
              <div className="page-title">Main City Page</div>
              <div className="page-meta">
                {getWordCount(mainPage.htmlContent).toLocaleString()} words
              </div>
            </div>

            {neighborhoodPages.map((page: any, index: number) => (
              <div 
                key={index}
                className={`page-item ${selectedPage === index ? 'active' : ''}`}
                onClick={() => setSelectedPage(index)}
              >
                <div className="page-title">{page.title}</div>
                <div className="page-meta">
                  {getWordCount(page.htmlContent).toLocaleString()} words
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-area">
          <div className="preview-mode">
            📋 PREVIEW MODE - Content not yet published
          </div>
          
          <div className="content-header">
            <h1 className="content-title">{currentContent.title}</h1>
            <div className="content-stats">
              <span>📝 {getWordCount(currentContent.htmlContent).toLocaleString()} words</span>
              <span>🔗 /{currentContent.slug}</span>
            </div>
          </div>

          <div className="content-body">
            <div dangerouslySetInnerHTML={{ __html: currentContent.htmlContent }} />
            
            <div className="raw-html">
              <h3>Raw HTML</h3>
              <pre>{currentContent.htmlContent}</pre>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}