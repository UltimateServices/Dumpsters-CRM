import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ResearchOrchestrator } from '@/lib/research/research-orchestrator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60 // Vercel Hobby max (upgrade to Pro for 300)

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json()

    if (!cityId) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Research API: Received cityId=${cityId}`)

    // Verify city exists
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      console.error('❌ City not found:', cityError)
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    console.log(`📍 Found city: ${city.city}, ${city.state_code}`)

    // Check if research already in progress
    const { data: existingJob } = await supabase
      .from('research_jobs')
      .select('*')
      .eq('city_id', cityId)
      .eq('status', 'processing')
      .single()

    if (existingJob) {
      return NextResponse.json(
        { error: 'Research already in progress for this city' },
        { status: 400 }
      )
    }

    // Verify ANTHROPIC_API_KEY
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('🚀 Starting research orchestrator...')

    // Start research in background
    const orchestrator = new ResearchOrchestrator(process.env.ANTHROPIC_API_KEY!)
    
    // Don't await - let it run in background
    // Note: On Vercel Hobby, this will timeout after 60 seconds
    // Upgrade to Pro for 5-minute timeout
    orchestrator.researchCity(cityId).catch(err => {
      console.error('💥 Background research error:', err)
    })

    return NextResponse.json({
      success: true,
      message: `Research started for ${city.city}, ${city.state_code}`,
      cityId,
      warning: 'Note: Functions on Vercel Hobby timeout after 60 seconds. Upgrade to Pro for longer research tasks.'
    })

  } catch (error: any) {
    console.error('💥 Research API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}