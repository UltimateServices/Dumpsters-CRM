import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export const maxDuration = 60

interface GeneratePageRequest {
  cityId: string
  pageType: 'main' | 'neighborhood'
  neighborhoodName?: string
  jobId: string
}

export async function POST(request: NextRequest) {
  try {
    const { cityId, pageType, neighborhoodName, jobId }: GeneratePageRequest = await request.json()

    console.log(`📄 Generating ${pageType} page for city ${cityId}`)

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    let content: any
    let pageTitle: string

    if (pageType === 'main') {
      pageTitle = `Dumpster Rental in ${city.city}, ${city.state_code}`
      content = await generateMainCityPage(city)
    } else if (pageType === 'neighborhood' && neighborhoodName) {
      pageTitle = `Dumpster Rental in ${neighborhoodName}, ${city.city}`
      content = await generateNeighborhoodPage(city, neighborhoodName)
    } else {
      return NextResponse.json({ error: 'Invalid page type' }, { status: 400 })
    }

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

    await supabase
      .from('research_jobs')
      .update({ results_json: existingResults })
      .eq('id', jobId)

    console.log(`✅ Generated ${pageType} page: ${pageTitle}`)

    return NextResponse.json({
      success: true,
      pageTitle,
      pageType
    })

  } catch (error: any) {
    console.error('💥 Generate page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate page' },
      { status: 500 }
    )
  }
}

async function generateMainCityPage(city: any) {
  const prompt = `Generate a comprehensive, SEO-optimized main landing page for dumpster rental services in ${city.city}, ${city.state_code}.

City Details:
- City: ${city.city}
- State: ${city.state_code}
- Population: ${city.population?.toLocaleString() || 'N/A'}

Create a detailed page with:

1. **Hero Section** (2-3 paragraphs) - Compelling introduction, emphasize local expertise, call-to-action
2. **Services Overview** (4-5 paragraphs) - Residential, commercial, construction, roofing, special waste
3. **Why Choose Us** (3-4 paragraphs) - Local knowledge, fast service, transparent pricing, professional
4. **FAQ Section** (10 detailed Q&A) - Pricing, permits, delivery, materials, sizes, duration, weights, regulations, booking
5. **Neighborhood Coverage** - List 4 neighborhoods in ${city.city}
6. **Call to Action** - Contact info and quote button

Format as JSON:
{
  "title": "page title",
  "metaDescription": "160 char meta description",
  "h1": "main heading",
  "heroContent": "hero paragraphs",
  "servicesContent": "services paragraphs",
  "whyChooseUs": "why choose us paragraphs",
  "faqs": [{"question": "...", "answer": "..."}],
  "neighborhoods": ["name1", "name2", "name3", "name4"],
  "ctaContent": "final cta paragraph",
  "wordCount": number
}

Target 3,000-4,000 words. Be specific to ${city.city}.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  })

  const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = contentText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('Failed to parse AI response')
}

async function generateNeighborhoodPage(city: any, neighborhood: string) {
  const prompt = `Generate an SEO-optimized neighborhood page for dumpster rental in ${neighborhood}, ${city.city}, ${city.state_code}.

Create:
1. **Introduction** (2 paragraphs) - Welcome, why residents need services, local expertise
2. **Common Projects** (3 paragraphs) - Renovations, landscaping, cleanouts, business needs
3. **Service Details** (2-3 paragraphs) - Sizes, delivery specifics, parking, permits
4. **FAQ Section** (6 Q&A specific to ${neighborhood})
5. **Call to Action**

Format as JSON:
{
  "title": "page title",
  "metaDescription": "160 char meta",
  "h1": "main heading",
  "introContent": "intro",
  "projectsContent": "projects",
  "serviceDetails": "details",
  "faqs": [{"question": "...", "answer": "..."}],
  "ctaContent": "cta",
  "wordCount": number
}

Target 1,200-1,500 words. Be specific to ${neighborhood}.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = contentText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('Failed to parse AI response')
}