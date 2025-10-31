import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json()

    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 })
    }

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: job, error: jobError } = await supabase
      .from('research_jobs')
      .insert({
        city_id: cityId,
        status: 'processing',
        progress: 0,
        current_step: 'Initializing...',
        started_at: new Date().toISOString(),
        results_json: { pages: [], totalPages: 5, completedPages: 0 }
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Research initialized for ${city.city}`,
      cityId,
      jobId: job.id,
      totalPages: 5,
      neighborhoods: ['Downtown', 'Northside', 'Westside', 'Eastside']
    })

  } catch (error: any) {
    console.error('💥 Research API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}