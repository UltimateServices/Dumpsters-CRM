import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 60000, // 60 second timeout
})

export const maxDuration = 300

interface GeneratePageRequest {
  cityId: string
  pageType: 'main' | 'neighborhood'
  neighborhoodName?: string
  jobId: string
}

export async function POST(request: NextRequest) {
  console.log('📄 Generate page API called')
  
  try {
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    const { cityId, pageType, neighborhoodName, jobId }: GeneratePageRequest = body

    if (!cityId || !pageType || !jobId) {
      console.error('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`🔍 Looking up city ${cityId}`)
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError) {
      console.error('❌ City lookup error:', cityError)
      return NextResponse.json({ error: 'City not found: ' + cityError.message }, { status: 404 })
    }

    if (!city) {
      console.error('❌ City not found')
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    console.log(`✅ Found city: ${city.city}, ${city.state_code}`)

    let content: any
    let pageTitle: string

    try {
      if (pageType === 'main') {
        console.log('🎨 Generating main city page...')
        pageTitle = `Dumpster Rental in ${city.city}, ${city.state_code}`
        content = await generateMainCityPage(city)
        console.log('✅ Main city page generated, word count:', content.wordCount)
      } else if (pageType === 'neighborhood' && neighborhoodName) {
        console.log(`🎨 Generating neighborhood page: ${neighborhoodName}`)
        pageTitle = `Dumpster Rental in ${neighborhoodName}, ${city.city}`
        content = await generateNeighborhoodPage(city, neighborhoodName)
        console.log('✅ Neighborhood page generated, word count:', content.wordCount)
      } else {
        console.error('❌ Invalid page type or missing neighborhood name')
        return NextResponse.json({ error: 'Invalid page type' }, { status: 400 })
      }
    } catch (genError: any) {
      console.error('💥 Content generation error:', genError)
      console.error('Error stack:', genError.stack)
      return NextResponse.json({ 
        error: 'Content generation failed: ' + genError.message 
      }, { status: 500 })
    }

    console.log('💾 Saving to database...')
    const { data: job } = await supabase
      .from('research_jobs')
      .select('results_json')
      .eq('id', jobId)
      .single()

    const existingResults = job?.results_json || { pages: [] }
    existingResults.pages.push({
      type: pageType,
      neighborhoodName,
      title: pageTitle,
      content,
      generatedAt: new Date().toISOString()
    })

    const { error: updateError } = await supabase
      .from('research_jobs')
      .update({ results_json: existingResults })
      .eq('id', jobId)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to save: ' + updateError.message }, { status: 500 })
    }

    console.log(`✅ Successfully generated and saved ${pageType} page: ${pageTitle}`)

    return NextResponse.json({
      success: true,
      pageTitle,
      pageType,
      wordCount: content.wordCount
    })

  } catch (error: any) {
    console.error('💥 Top-level error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        errorType: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function generateMainCityPage(city: any) {
  console.log(`🤖 Calling Anthropic API for main page: ${city.city}`)
  
  const prompt = `You are an SEO expert writing dumpster rental content. Create content for ${city.city}, ${city.state_code}.

Write 2,500-3,000 words with these sections:

1. Hero (2-3 paragraphs): Introduction to dumpster rental services in ${city.city}, emphasize local expertise
2. Services (4 paragraphs): Residential, commercial, construction, special waste
3. Why Choose Us (3 paragraphs): Local knowledge, fast service, transparent pricing
4. FAQ (8 questions with detailed answers): Pricing, permits in ${city.city}, sizes, delivery, duration, materials, booking, weight limits
5. Neighborhoods: List 4 areas in ${city.city}
6. CTA: Call to action

Return ONLY this JSON structure (no markdown, no extra text):
{
  "title": "SEO title",
  "metaDescription": "160 char description",
  "h1": "H1 heading",
  "heroContent": "hero text",
  "servicesContent": "services text",
  "whyChooseUs": "why choose us text",
  "faqs": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}],
  "neighborhoods": ["Area 1", "Area 2", "Area 3", "Area 4"],
  "ctaContent": "cta text",
  "wordCount": 2500
}

Make it specific to ${city.city}. Write naturally and comprehensively.`

  try {
    console.log('📡 Sending request to Anthropic...')
    const startTime = Date.now()
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const elapsed = Date.now() - startTime
    console.log(`✅ Anthropic responded in ${elapsed}ms`)

    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from Anthropic')
    }

    const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('📝 Response length:', contentText.length, 'characters')
    console.log('📝 First 200 chars:', contentText.substring(0, 200))
    
    // Try to extract JSON
    const jsonMatch = contentText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in response')
      console.error('Full response:', contentText)
      throw new Error('Failed to parse AI response - no JSON found')
    }

    console.log('🔍 Parsing JSON...')
    const parsed = JSON.parse(jsonMatch[0])
    console.log('✅ JSON parsed successfully')
    
    return parsed
    
  } catch (error: any) {
    console.error('💥 Anthropic API error:', error)
    if (error.status) console.error('Status:', error.status)
    if (error.response) console.error('Response:', error.response)
    throw error
  }
}

async function generateNeighborhoodPage(city: any, neighborhood: string) {
  console.log(`🤖 Calling Anthropic API for neighborhood: ${neighborhood}`)
  
  const prompt = `Create SEO content for dumpster rental in ${neighborhood}, ${city.city}, ${city.state_code}.

Write 1,200-1,500 words with:

1. Intro (2 paragraphs): Welcome to ${neighborhood}, why residents need dumpster services
2. Common Projects (3 paragraphs): Renovations, landscaping, cleanouts specific to ${neighborhood}
3. Service Details (2 paragraphs): Sizes, delivery to ${neighborhood}, parking, permits
4. FAQ (6 questions with answers specific to ${neighborhood})
5. CTA: Call to action

Return ONLY this JSON (no markdown, no extra text):
{
  "title": "SEO title",
  "metaDescription": "160 char description",
  "h1": "H1 heading",
  "introContent": "intro text",
  "projectsContent": "projects text",
  "serviceDetails": "service details text",
  "faqs": [{"question": "Q1", "answer": "A1"}],
  "ctaContent": "cta text",
  "wordCount": 1200
}

Be specific to ${neighborhood} in ${city.city}.`

  try {
    console.log('📡 Sending request to Anthropic...')
    const startTime = Date.now()
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const elapsed = Date.now() - startTime
    console.log(`✅ Anthropic responded in ${elapsed}ms`)

    const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('📝 Response length:', contentText.length, 'characters')
    
    const jsonMatch = contentText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response - no JSON found')
    }

    return JSON.parse(jsonMatch[0])
    
  } catch (error: any) {
    console.error('💥 Anthropic API error:', error)
    throw error
  }
}