import { createClient } from '@supabase/supabase-js'
import { scrapeLocalData } from '../local-data-scraper'
import { generateHubAndSpoke } from '../question-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ResearchJob {
  id: string
  city_id: string
  city_slug: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
}

export async function startResearch(cityId: string, citySlug: string) {
  console.log(`🔬 Starting research for ${citySlug}`)

  const jobs = [
    { type: 'local_data', city_id: cityId, city_slug: citySlug },
    { type: 'content', city_id: cityId, city_slug: citySlug },
    { type: 'background', city_id: cityId, city_slug: citySlug }
  ]

  const { data, error } = await supabase
    .from('research_jobs')
    .insert(jobs)
    .select()

  if (error) throw error

  console.log(`✅ Created ${data.length} research jobs`)

  // Start processing immediately
  for (const job of data) {
    processJob(job.id, job.city_id, job.city_slug).catch(console.error)
  }

  return data
}

async function processJob(jobId: string, cityId: string, citySlug: string) {
  try {
    await supabase
      .from('research_jobs')
      .update({ status: 'in_progress' })
      .eq('id', jobId)

    await runResearchForCity(jobId, cityId, citySlug)

    await supabase
      .from('research_jobs')
      .update({ status: 'completed' })
      .eq('id', jobId)
  } catch (error) {
    console.error('Job processing error:', error)
    await supabase
      .from('research_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId)
  }
}

async function runResearchForCity(
  jobId: string,
  cityId: string,
  citySlug: string
) {
  try {
    console.log(`🚀 Starting research for city: ${cityId}`)

    const { data: cityData } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (!cityData) {
      throw new Error('City not found')
    }

    console.log(`📍 City: ${cityData.city}, ${cityData.state_code}`)

    // Generate content using ContentGenerator class
    const { ContentGenerator } = await import('../content/content-generator')
    const generator = new ContentGenerator(process.env.ANTHROPIC_API_KEY!)
    const content = await generator.generateCityContent(cityData)

    // Save to Supabase
    const { error: saveError } = await supabase
      .from('city_research')
      .upsert({
        city_id: cityId,
        city_slug: citySlug,
        research_data: content,
        status: 'completed',
        updated_at: new Date().toISOString()
      })

    if (saveError) throw saveError

    console.log(`✅ Research completed for ${cityData.city}`)
  } catch (error) {
    console.error('Research orchestrator error:', error)
    throw error
  }
}

export async function getResearchStatus(citySlug: string) {
  const { data, error } = await supabase
    .from('research_jobs')
    .select('*')
    .eq('city_slug', citySlug)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}