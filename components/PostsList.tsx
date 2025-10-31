'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row'] & {
  geo_locations?: {
    city: string
    state_code: string
  }
}

interface PostsListProps {
  limit?: number
}

export default function PostsList({ limit = 20 }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [limit])

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          geo_locations (
            city,
            state_code
          )
        `)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data as Post[] || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      in_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Review' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
      scheduled: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Scheduled' },
      published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
      needs_update: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Needs Update' }
    }

    const badge = badges[status] || badges.draft

    return (
      <span className={`px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text} rounded`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return <div className="p-6 text-center">Loading posts...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Word Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 max-w-md truncate">
                  {post.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {post.geo_locations ? (
                  `${post.geo_locations.city}, ${post.geo_locations.state_code}`
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(post.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {post.word_count ? post.word_count.toLocaleString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(post.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="text-gray-400">No actions yet</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {posts.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p>No posts found. Create your first post to get started!</p>
        </div>
      )}
    </div>
  )
}