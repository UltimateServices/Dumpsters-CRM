import { createClient } from '@supabase/supabase-js'
import { ContentGenerator } from '../content/content-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class ResearchOrchestrator {
  private contentGenerator: ContentGenerator

  constructor(anthropicKey: string) {
    this.contentGenerator = new ContentGenerator(anthropicKey)
  }

  async researchCity(cityId: string) {
    console.log(`Starting research for city: ${cityId}`)

    // Get city data
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      throw new Error('City not found')
    }

    // Create research job
    const { data: job, error: jobError } = await supabase
      .from('research_jobs')
      .insert({
        city_id: cityId,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      throw new Error('Failed to create research job')
    }

    try {
      // Generate content
      const generatedContent = await this.contentGenerator.generateCityContent(city)

      // Update job with results
      await supabase
        .from('research_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results_json: { generatedContent }
        })
        .eq('id', job.id)

      console.log(`Research completed for ${city.city}`)
      return generatedContent

    } catch (error: any) {
      console.error('Research error:', error)
      
      await supabase
        .from('research_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', job.id)

      throw error
    }
  }
}