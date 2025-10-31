import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WordPressPublisher } from '@/lib/wordpress/wordpress-publisher'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json()

    console.log(`\n📤 Publishing content for city: ${cityId}`)

    // Get city data
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      throw new Error('City not found')
    }

    console.log(`📍 Found: ${city.city}, ${city.state_code}`)

    // Check if content already exists in research_jobs
    const { data: existingJob, error: jobError } = await supabase
      .from('research_jobs')
      .select('results_json')
      .eq('city_id', cityId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let content

    if (existingJob && existingJob.results_json && existingJob.results_json.generatedContent) {
      console.log(`✅ Using cached content from research job`)
      content = existingJob.results_json.generatedContent
    } else {
      console.log(`⚠️  No cached content found - you need to run Research first!`)
      return NextResponse.json(
        { 
          error: 'No content available. Please run Research first.',
          requiresResearch: true
        },
        { status: 400 }
      )
    }

    // Publish to WordPress
    const publisher = new WordPressPublisher({
      siteUrl: process.env.WORDPRESS_SITE_URL!,
      username: process.env.WORDPRESS_USERNAME!,
      applicationPassword: process.env.WORDPRESS_APP_PASSWORD!
    })

    const result = await publisher.publishCityContent(content, city)

    // Update city record with published URLs
    const mainPageUrl = result.pages[0]?.link || ''
    
    await supabase
      .from('cities')
      .update({
        wordpress_url: mainPageUrl,
        published_at: new Date().toISOString()
      })
      .eq('id', cityId)

    return NextResponse.json({
      success: true,
      message: `Published ${result.pages.length} pages successfully`,
      pages: result.pages,
      mainUrl: mainPageUrl
    })

  } catch (error: any) {
    console.error('❌ Publishing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish' },
      { status: 500 }
    )
  }
}