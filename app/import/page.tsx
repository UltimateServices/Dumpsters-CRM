'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BulkImport() {
  const [csvData, setCsvData] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleImport = async () => {
    if (!csvData.trim()) {
      alert('Please paste CSV data')
      return
    }

    setImporting(true)
    setResults(null)

    try {
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const cities = []
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        const cityObj: any = {}
        headers.forEach((header, index) => {
          cityObj[header] = values[index]
        })

        // Create slug
        const slug = `dumpster-rental-${cityObj.city.toLowerCase().replace(/\s+/g, '-')}-${cityObj.state_code.toLowerCase()}`

        const cityData = {
          city: cityObj.city,
          state_code: cityObj.state_code,
          population: parseInt(cityObj.population) || 0,
          slug: slug,
          latitude: parseFloat(cityObj.latitude) || null,
          longitude: parseFloat(cityObj.longitude) || null
        }

        const { error } = await supabase
          .from('cities')
          .insert(cityData)

        if (error) {
          console.error(`Error importing ${cityData.city}:`, error)
          errorCount++
        } else {
          successCount++
        }

        cities.push(cityData)
      }

      setResults({
        total: lines.length - 1,
        success: successCount,
        errors: errorCount,
        cities
      })

    } catch (error: any) {
      alert(`Import error: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const exampleCSV = `city,state_code,population,latitude,longitude
Austin,TX,978908,30.2672,-97.7431
Seattle,WA,753675,47.6062,-122.3321
Denver,CO,715522,39.7392,-104.9903`

  return (
    <>
      <style jsx>{`
        .import-container {
          max-width: 1200px;
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
          margin: 0 0 16px 0;
          color: #1d1d1f;
        }

        .section p {
          font-size: 16px;
          color: #515154;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .csv-textarea {
          width: 100%;
          min-height: 300px;
          padding: 16px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          border: 2px solid #e8e8ed;
          border-radius: 8px;
          outline: none;
          resize: vertical;
        }

        .csv-textarea:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .example-box {
          background: #f5f5f7;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .example-box h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .example-box pre {
          margin: 0;
          font-size: 13px;
          white-space: pre-wrap;
        }

        .import-button {
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

        .import-button:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .import-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results {
          background: #d1f4e0;
          border: 2px solid #0d7d3e;
          padding: 24px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .results h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #0d7d3e;
        }

        .results-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .result-stat {
          text-align: center;
        }

        .result-number {
          font-size: 36px;
          font-weight: 700;
          color: #0d7d3e;
        }

        .result-label {
          font-size: 14px;
          color: #0a5f2e;
        }

        .cities-imported {
          max-height: 300px;
          overflow-y: auto;
          background: white;
          padding: 16px;
          border-radius: 8px;
        }

        .cities-imported ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cities-imported li {
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f7;
        }

        .cities-imported li:last-child {
          border-bottom: none;
        }
      `}</style>

      <div className="import-container">
        <a href="/dashboard" className="back-link">← Back to Dashboard</a>
        
        <div className="header">
          <h1>📥 Bulk City Import</h1>
          <p>Import multiple cities at once using CSV</p>
        </div>

        <div className="section">
          <h2>CSV Format</h2>
          <p>Your CSV must include these columns: city, state_code, population, latitude, longitude</p>
          
          <div className="example-box">
            <h3>Example CSV:</h3>
            <pre>{exampleCSV}</pre>
          </div>

          <h3>Paste your CSV data:</h3>
          <textarea
            className="csv-textarea"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={exampleCSV}
          />

          <div style={{ marginTop: '24px' }}>
            <button
              className="import-button"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? '⏳ Importing...' : '📥 Import Cities'}
            </button>
          </div>

          {results && (
            <div className="results">
              <h3>✅ Import Complete</h3>
              <div className="results-stats">
                <div className="result-stat">
                  <div className="result-number">{results.total}</div>
                  <div className="result-label">Total</div>
                </div>
                <div className="result-stat">
                  <div className="result-number">{results.success}</div>
                  <div className="result-label">Success</div>
                </div>
                <div className="result-stat">
                  <div className="result-number">{results.errors}</div>
                  <div className="result-label">Errors</div>
                </div>
              </div>

              <h4>Cities Imported:</h4>
              <div className="cities-imported">
                <ul>
                  {results.cities.map((city: any, index: number) => (
                    <li key={index}>
                      {city.city}, {city.state_code} - Pop: {city.population.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}