import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContentGenerator } from '@/lib/content/content-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json()

    console.log(`🔬 Starting research for city ID: ${cityId}`)

    // Get city data from geo_locations
    const { data: cityData, error: cityError } = await supabase
      .from('geo_locations')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !cityData) {
      console.error('City lookup error:', cityError)
      throw new Error('City not found')
    }

    console.log(`📍 Found: ${cityData.city}, ${cityData.state_code}`)

    // Generate content
    const generator = new ContentGenerator(process.env.ANTHROPIC_API_KEY!)
    const content = await generator.generateCityContent(cityData)

    console.log(`✅ Content generated!`)

    return NextResponse.json({ 
      success: true,
      message: 'Research completed',
      city: `${cityData.city}, ${cityData.state_code}`,
      content: content
    })

  } catch (error: any) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}