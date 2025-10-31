'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      
      let successCount = 0
      let errorCount = 0
      const importedCities = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        const cityObj: any = {}
        headers.forEach((header, index) => {
          cityObj[header] = values[index]
        })

        const slug = 'dumpster-rental-' + cityObj.city.toLowerCase().replace(/\s+/g, '-') + '-' + cityObj.state_code.toLowerCase()

        const cityData = {
          city: cityObj.city,
          state_code: cityObj.state_code,
          population: parseInt(cityObj.population) || 0,
          slug: slug,
          latitude: parseFloat(cityObj.latitude) || null,
          longitude: parseFloat(cityObj.longitude) || null
        }

        const { data: existing } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', slug)
          .single()

        if (existing) {
          console.log('City already exists:', cityData.city)
          errorCount++
          continue
        }

        const { error } = await supabase
          .from('cities')
          .insert(cityData)

        if (error) {
          console.error('Error importing', cityData.city, ':', error.message)
          errorCount++
        } else {
          successCount++
          importedCities.push(cityData)
        }
      }

      setResults({
        total: lines.length - 1,
        success: successCount,
        errors: errorCount,
        cities: importedCities
      })

    } catch (error: any) {
      alert('Import error: ' + error.message)
      console.error('Full error:', error)
    } finally {
      setImporting(false)
    }
  }

  const exampleCSV = `city,state_code,population,latitude,longitude
Austin,TX,978908,30.2672,-97.7431
Seattle,WA,753675,47.6062,-122.3321
Denver,CO,715522,39.7392,-104.9903`

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Link href="/dashboard" style={{ color: '#06c', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
        ← Back to Dashboard
      </Link>
      
      <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '8px' }}>Bulk City Import</h1>
      <p style={{ fontSize: '18px', color: '#86868b', marginBottom: '48px' }}>Import multiple cities at once using CSV</p>

      <div style={{ background: 'white', border: '2px solid #e8e8ed', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>CSV Format</h2>
        <p style={{ marginBottom: '24px' }}>Your CSV must include these columns: city, state_code, population, latitude, longitude</p>
        
        <div style={{ background: '#f5f5f7', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Example CSV:</h3>
          <pre style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{exampleCSV}</pre>
        </div>

        <h3 style={{ marginBottom: '12px' }}>Paste your CSV data:</h3>
        <textarea
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '16px',
            fontFamily: 'Monaco, Courier New, monospace',
            fontSize: '14px',
            border: '2px solid #e8e8ed',
            borderRadius: '8px',
            resize: 'vertical'
          }}
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder={exampleCSV}
        />

        <button
          onClick={handleImport}
          disabled={importing}
          style={{
            marginTop: '24px',
            padding: '16px 48px',
            fontSize: '16px',
            fontWeight: '600',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: importing ? 'not-allowed' : 'pointer',
            opacity: importing ? 0.5 : 1
          }}
        >
          {importing ? '⏳ Importing...' : '📥 Import Cities'}
        </button>

        {results && (
          <div style={{ 
            background: '#d1f4e0', 
            border: '2px solid #0d7d3e', 
            padding: '24px', 
            borderRadius: '12px', 
            marginTop: '24px' 
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#0d7d3e' }}>
              ✅ Import Complete
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#0d7d3e' }}>{results.total}</div>
                <div style={{ fontSize: '14px', color: '#0a5f2e' }}>Total</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#0d7d3e' }}>{results.success}</div>
                <div style={{ fontSize: '14px', color: '#0a5f2e' }}>Success</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#0d7d3e' }}>{results.errors}</div>
                <div style={{ fontSize: '14px', color: '#0a5f2e' }}>Errors</div>
              </div>
            </div>

            {results.cities.length > 0 && (
              <>
                <h4>Cities Imported:</h4>
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  background: 'white', 
                  padding: '16px', 
                  borderRadius: '8px' 
                }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {results.cities.map((city: any, index: number) => (
                      <li key={index} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f7' }}>
                        {city.city}, {city.state_code} - Pop: {city.population.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}