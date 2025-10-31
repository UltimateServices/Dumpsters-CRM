'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type GeoLocation = Database['public']['Tables']['geo_locations']['Row']

export default function PriorityCitiesTable() {
  const [cities, setCities] = useState<GeoLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPriorityCities()
  }, [])

  const loadPriorityCities = async () => {
    try {
      const { data, error } = await supabase
        .from('geo_locations')
        .select('*')
        .eq('posts_published_count', 0)
        .order('priority_score', { ascending: false })
        .limit(50)

      if (error) throw error
      setCities(data || [])
    } catch (error) {
      console.error('Error loading cities:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCity = (cityId: string) => {
    const newSelected = new Set(selectedCities)
    if (newSelected.has(cityId)) {
      newSelected.delete(cityId)
    } else {
      newSelected.add(cityId)
    }
    setSelectedCities(newSelected)
  }

  const handleCreatePosts = async () => {
    if (selectedCities.size === 0) {
      alert('Please select at least one city')
      return
    }

    const cityIds = Array.from(selectedCities).join(',')
    window.location.href = `/posts/create?cities=${cityIds}`
  }

  const handleResearch = async (cityId: string, cityName: string) => {
    if (confirm(`Start research for ${cityName}?\n\nThis will:\n- Search Reddit for questions\n- Get Google PAA questions\n- Collect local data\n- Generate content with AI`)) {
      try {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          alert(`✅ Research started for ${cityName}!\n\nCheck the browser console for progress.`)
          console.log('Research response:', data)
        } else {
          alert(`Failed to start research: ${data.error}`)
        }
      } catch (error) {
        console.error('Research error:', error)
        alert('Error starting research')
      }
    }
  }

  const handlePublish = async (cityId: string, cityName: string) => {
    if (confirm(`Publish ${cityName} to WordPress?\n\nThis will create 9 pages on your site.`)) {
      try {
        const response = await fetch('/api/wordpress/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          alert(`✅ Published ${data.pagesPublished} pages!\n\nMain page: ${data.pages[0]?.url}`)
          console.log('Published pages:', data.pages)
          loadPriorityCities() // Refresh table
        } else {
          alert(`Failed to publish: ${data.error}`)
        }
      } catch (error) {
        console.error('Publish error:', error)
        alert('Error publishing to WordPress')
      }
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading cities...</div>
  }

  return (
    <div>
      {selectedCities.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedCities.size} cities selected
          </span>
          <button
            onClick={handleCreatePosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Create Posts for Selected Cities
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCities(new Set(cities.map(c => c.id)))
                    } else {
                      setSelectedCities(new Set())
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City, State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Population
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Search Volume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCities.has(city.id)}
                    onChange={() => toggleCity(city.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {city.city}, {city.state_code}
                  </div>
                  {city.county && (
                    <div className="text-sm text-gray-500">{city.county} County</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {city.population?.toLocaleString() || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {city.search_volume > 0 ? city.search_volume.toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {city.priority_score.toFixed(1)}
                    </div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(city.priority_score, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    0 / 5
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResearch(city.id, `${city.city}, ${city.state_code}`)}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      🔬 Research
                    </button>
                    <button
                      onClick={() => handlePublish(city.id, `${city.city}, ${city.state_code}`)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      📤 Publish
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cities.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p>No unpublished cities found. Great job! 🎉</p>
        </div>
      )}
    </div>
  )
}