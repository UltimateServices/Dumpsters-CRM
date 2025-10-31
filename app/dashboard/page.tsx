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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCities()
  }, [])

  const fetchCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('*')
      .order('population', { ascending: false })

    if (data) setCities(data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>City Content Manager</h1>
      
      <div style={{ display: 'flex', gap: '12px', margin: '20px 0' }}>
        <Link href="/bulk" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Bulk Operations
        </Link>
        <Link href="/import" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Import Cities
        </Link>
        <Link href="/analytics" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Analytics
        </Link>
        <Link href="/settings" style={{ padding: '12px 24px', background: '#667eea', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Settings
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>City</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>State</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Population</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.id}>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{city.city}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{city.state_code}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{city.population.toLocaleString()}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                <button style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', marginRight: '8px' }}>
                  Research
                </button>
                <button style={{ padding: '8px 16px', background: '#0d7d3e', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Publish
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}