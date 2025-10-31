import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 45000,
})

export const maxDuration = 300

interface GenerateSectionRequest {
  cityId: string
  pageType: 'main' | 'neighborhood'
  section: string
  neighborhoodName?: string
  jobId: string
}

export async function POST(request: NextRequest) {
  console.log('📄 Generate section API called')
  
  try {
    const body = await request.json()
    const { cityId, pageType, section, neighborhoodName, jobId }: GenerateSectionRequest = body

    console.log(`🎨 Generating ${pageType} - ${section}`)

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    console.log(`✅ City: ${city.city}, ${city.state_code}`)

    let content: any

    if (pageType === 'main') {
      content = await generateMainSection(city, section)
    } else if (pageType === 'neighborhood' && neighborhoodName) {
      content = await generateNeighborhoodSection(city, neighborhoodName, section)
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    console.log(`✅ Section generated: ${section}`)

    // Store section in job
    const { data: job } = await supabase
      .from('research_jobs')
      .select('results_json')
      .eq('id', jobId)
      .single()

    const results = job?.results_json || { sections: {} }
    const pageKey = pageType === 'main' ? 'main' : `neighborhood_${neighborhoodName}`
    
    if (!results.sections[pageKey]) {
      results.sections[pageKey] = {}
    }
    
    results.sections[pageKey][section] = content

    await supabase
      .from('research_jobs')
      .update({ results_json: results })
      .eq('id', jobId)

    return NextResponse.json({
      success: true,
      section,
      wordCount: content.wordCount || 0
    })

  } catch (error: any) {
    console.error('💥 Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function generateMainSection(city: any, section: string) {
  const cityName = city.city
  const state = city.state_code
  
  let prompt = ''
  let maxTokens = 2000

  switch (section) {
    case 'hero_services':
      maxTokens = 3000
      prompt = `Write EXACTLY 1,200 words for a dumpster rental landing page in ${cityName}, ${state}.

Include:
1. Compelling hero section (3 paragraphs) emphasizing local expertise in ${cityName}
2. Comprehensive service breakdown (5-6 paragraphs):
   - Residential dumpster rental
   - Commercial dumpster services  
   - Construction & demolition debris
   - Roofing projects & tear-offs
   - Renovation & remodeling waste
   - Special waste disposal options

Write naturally and conversationally. Be specific to ${cityName}.

Return ONLY valid JSON:
{
  "content": "the full 1,200 word text",
  "wordCount": 1200
}`
      break

    case 'areas_whychoose':
      maxTokens = 2500
      prompt = `Write EXACTLY 1,000 words about service areas and value proposition for ${cityName}, ${state}.

Include:
1. Service Areas section (2-3 paragraphs):
   - List 4-6 real neighborhoods/areas in ${cityName}
   - Brief description of each area
   - Mention delivery capabilities throughout ${cityName}

2. Why Choose Us section (3-4 paragraphs):
   - Deep local knowledge of ${cityName} regulations
   - Fast same-day or next-day delivery
   - Transparent, upfront pricing
   - Professional, reliable service
   - Proper permitting assistance

Be specific to ${cityName}. Write naturally.

Return ONLY valid JSON:
{
  "content": "the full 1,000 word text",
  "neighborhoods": ["Area 1", "Area 2", "Area 3", "Area 4", "Area 5", "Area 6"],
  "wordCount": 1000
}`
      break

    case 'pricing_process':
      maxTokens = 2000
      prompt = `Write EXACTLY 700 words about pricing and process for dumpster rental in ${cityName}, ${state}.

Include:
1. Pricing Guide (2 paragraphs):
   - Typical price ranges for different sizes
   - What affects pricing in ${cityName}
   - Transparent pricing commitment
   - No hidden fees

2. How It Works (3 paragraphs):
   - Step 1: Call or book online
   - Step 2: Choose size and schedule delivery
   - Step 3: We deliver to ${cityName} location
   - Step 4: Fill at your pace
   - Step 5: We pick up and dispose properly

Be specific to ${cityName}. Write naturally.

Return ONLY valid JSON:
{
  "content": "the full 700 word text",
  "wordCount": 700
}`
      break

    case 'faqs_part1':
      maxTokens = 2500
      prompt = `Write EXACTLY 10 FAQs with detailed answers (total 1,000 words) for dumpster rental in ${cityName}, ${state}.

Focus on these topics:
1. How much does dumpster rental cost in ${cityName}?
2. Do I need a permit in ${cityName}?
3. What are ${cityName}'s regulations for dumpster placement?
4. How long can I keep the dumpster?
5. What's included in the rental price?
6. Are there any hidden fees?
7. What sizes are available?
8. How quickly can you deliver in ${cityName}?
9. Can I extend my rental period?
10. Do you offer discounts for ${cityName} residents?

Each answer should be 80-120 words. Be specific to ${cityName}.

Return ONLY valid JSON:
{
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "wordCount": 1000
}`
      break

    case 'faqs_part2':
      maxTokens = 2500
      prompt = `Write EXACTLY 10 FAQs with detailed answers (total 1,000 words) for dumpster rental in ${cityName}, ${state}.

Focus on these topics:
1. What can I put in the dumpster?
2. What items are prohibited?
3. What if I exceed the weight limit?
4. Can I put the dumpster on the street in ${cityName}?
5. How do I choose the right dumpster size?
6. What's the difference between 10, 20, 30, and 40 yard dumpsters?
7. Can you deliver to my ${cityName} neighborhood?
8. How do I book a dumpster rental?
9. What happens if I need to change my delivery date?
10. Do you haul away the waste?

Each answer should be 80-120 words. Be specific to ${cityName}.

Return ONLY valid JSON:
{
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "wordCount": 1000
}`
      break

    case 'testimonials_cta':
      maxTokens = 1500
      prompt = `Write EXACTLY 500 words for the closing section of a ${cityName}, ${state} dumpster rental page.

Include:
1. Testimonials section (2 paragraphs):
   - Why ${cityName} customers trust us
   - Common praise points (reliability, pricing, service)
   - Years serving ${cityName}

2. Final CTA (2 paragraphs):
   - Strong call to action
   - Phone number and online booking
   - Same-day service available in ${cityName}
   - Get free quote today

Write naturally and persuasively. Be specific to ${cityName}.

Return ONLY valid JSON:
{
  "content": "the full 500 word text",
  "wordCount": 500
}`
      break

    default:
      throw new Error('Invalid section')
  }

  console.log(`📡 Calling Anthropic for ${section}...`)
  const startTime = Date.now()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })

  const elapsed = Date.now() - startTime
  console.log(`✅ Anthropic responded in ${elapsed}ms`)

  const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = contentText.match(/\{[\s\S]*\}/)
  
  if (!jsonMatch) {
    throw new Error('No JSON in response')
  }

  return JSON.parse(jsonMatch[0])
}

async function generateNeighborhoodSection(city: any, neighborhood: string, section: string) {
  const cityName = city.city
  const state = city.state_code
  
  let prompt = ''
  let maxTokens = 2000

  switch (section) {
    case 'intro_projects':
      maxTokens = 2000
      prompt = `Write EXACTLY 800 words introducing dumpster rental services in ${neighborhood}, ${cityName}, ${state}.

Include:
1. Introduction (2-3 paragraphs):
   - Welcome to ${neighborhood}
   - Why ${neighborhood} residents need dumpster services
   - Our local expertise in this area

2. Common Projects (3-4 paragraphs):
   - Home renovations in ${neighborhood}
   - Landscaping and yard projects
   - Estate cleanouts and decluttering
   - Small business waste needs
   - Specific examples for ${neighborhood}

Be specific to ${neighborhood}. Write naturally.

Return ONLY valid JSON:
{
  "content": "the full 800 word text",
  "wordCount": 800
}`
      break

    case 'service_details':
      maxTokens = 1500
      prompt = `Write EXACTLY 600 words about service details for ${neighborhood}, ${cityName}, ${state}.

Include:
1. Dumpster Sizes (2 paragraphs):
   - Available sizes
   - Which size for which project in ${neighborhood}

2. Delivery Specifics (2 paragraphs):
   - Delivery process to ${neighborhood}
   - Parking considerations in this area
   - Street access in ${neighborhood}

3. Pricing (1 paragraph):
   - Transparent pricing for ${neighborhood}
   - What's included

Be specific to ${neighborhood}. Write naturally.

Return ONLY valid JSON:
{
  "content": "the full 600 word text",
  "wordCount": 600
}`
      break

    case 'faqs_cta':
      maxTokens = 2000
      prompt = `Write EXACTLY 10 FAQs (total 700 words) + CTA (100 words) for ${neighborhood}, ${cityName}, ${state}.

FAQs (10 questions, 60-80 words each):
1. How quickly can you deliver to ${neighborhood}?
2. Do I need a permit in ${neighborhood}?
3. What size dumpster for a ${neighborhood} home renovation?
4. Can you place dumpster in my ${neighborhood} driveway?
5. What can I throw away?
6. How long can I keep the dumpster?
7. What if I need more time?
8. Do you serve all of ${neighborhood}?
9. How much does it cost in ${neighborhood}?
10. How do I book?

CTA (100 words):
- Strong call to action for ${neighborhood} residents
- Phone and online booking

Return ONLY valid JSON:
{
  "faqs": [{"question": "...", "answer": "..."}],
  "cta": "cta text",
  "wordCount": 800
}`
      break

    default:
      throw new Error('Invalid section')
  }

  console.log(`📡 Calling Anthropic for ${section}...`)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })

  const contentText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = contentText.match(/\{[\s\S]*\}/)
  
  if (!jsonMatch) {
    throw new Error('No JSON in response')
  }

  return JSON.parse(jsonMatch[0])
}