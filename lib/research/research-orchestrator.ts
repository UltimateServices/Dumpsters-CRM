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

  private async updateProgress(jobId: string, progress: number, currentStep: string) {
    await supabase
      .from('research_jobs')
      .update({ 
        progress,
        current_step: currentStep 
      })
      .eq('id', jobId)
    
    console.log(`Progress: ${progress}% - ${currentStep}`)
  }

  async researchCity(cityId: string) {
    console.log(`Starting research for city: ${cityId}`)

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (cityError || !city) {
      throw new Error('City not found')
    }

    const { data: job, error: jobError } = await supabase
      .from('research_jobs')
      .insert({
        city_id: cityId,
        status: 'processing',
        progress: 0,
        current_step: 'Initializing research...',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      throw new Error('Failed to create research job')
    }

    try {
      await this.updateProgress(job.id, 5, 'Starting content generation...')
      
      await this.updateProgress(job.id, 10, 'Analyzing city demographics...')
      
      await this.updateProgress(job.id, 20, 'Researching local regulations...')
      
      await this.updateProgress(job.id, 30, 'Generating main city page...')
      
      const generatedContent = await this.contentGenerator.generateCityContent(city)
      
      await this.updateProgress(job.id, 80, 'Generating neighborhood pages...')
      
      await this.updateProgress(job.id, 90, 'Finalizing content...')

      await supabase
        .from('research_jobs')
        .update({
          status: 'completed',
          progress: 100,
          current_step: 'Complete!',
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
          progress: 0,
          current_step: 'Failed: ' + error.message,
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', job.id)

      throw error
    }
  }
}