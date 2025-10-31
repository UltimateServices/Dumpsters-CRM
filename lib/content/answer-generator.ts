import Anthropic from '@anthropic-ai/sdk'

export interface AnswerRequest {
  question: string
  category: string
  cityData: {
    city: string
    state: string
    stateCode: string
    county?: string | null
  }
  localData?: {
    main_streets?: string[]
    landmarks?: string[]
    neighborhoods?: string[]
    permit_cost?: number | null
    permit_department?: string | null
    challenges?: string[]
    town_rules?: string[]
  }
  targetLength: 'short' | 'medium' | 'long'
}

export interface GeneratedAnswer {
  question: string
  answer: string
  wordCount: number
  htmlAnswer: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export async function generateAnswer(request: AnswerRequest): Promise<GeneratedAnswer> {
  const { question, category, cityData, localData, targetLength } = request
  const { city, state, stateCode, county } = cityData

  // Determine target word count
  const wordCountTarget = {
    short: '75-150 words',
    medium: '200-350 words',
    long: '400-600 words'
  }[targetLength]

  // Build context for AI
  const context = buildContext(cityData, localData)

  const prompt = `You are an expert SEO content writer for Ultimate Dumpsters, a dumpster rental company.

Write a natural, conversational answer to this question for ${city}, ${stateCode}:

"${question}"

REQUIREMENTS:
- Target length: ${wordCountTarget}
- Category: ${category}
- Write in second person ("you") addressing homeowners, contractors, or business owners
- Include specific local details naturally (streets, landmarks, costs, rules)
- Be direct and helpful - answer the question immediately
- Use natural language, avoid corporate jargon
- Include practical tips and real-world examples
- If discussing prices, use realistic ranges for ${city}

${context}

Format as plain text paragraphs (no markdown, no bullet points). Write conversationally like you're explaining to a friend.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const answerText = message.content[0].type === 'text' ? message.content[0].text : ''
    const wordCount = answerText.split(/\s+/).length

    // Convert to HTML with paragraphs
    const htmlAnswer = answerText
      .split('\n\n')
      .map(para => `<p>${para.trim()}</p>`)
      .join('\n')

    return {
      question,
      answer: answerText,
      wordCount,
      htmlAnswer
    }
  } catch (error) {
    console.error('Error generating answer:', error)
    
    // Fallback answer if API fails
    const fallbackAnswer = generateFallbackAnswer(question, cityData)
    return {
      question,
      answer: fallbackAnswer,
      wordCount: fallbackAnswer.split(/\s+/).length,
      htmlAnswer: `<p>${fallbackAnswer}</p>`
    }
  }
}

function buildContext(
  cityData: { city: string; state: string; stateCode: string; county?: string | null },
  localData?: any
): string {
  const { city, stateCode, county } = cityData
  let context = `\nLOCAL CONTEXT FOR ${city}, ${stateCode}:\n`

  if (county) {
    context += `- County: ${county} County\n`
  }

  if (localData?.permit_cost) {
    context += `- Permit cost: $${localData.permit_cost}\n`
  }

  if (localData?.permit_department) {
    context += `- Permit department: ${localData.permit_department}\n`
  }

  if (localData?.main_streets && localData.main_streets.length > 0) {
    context += `- Main streets: ${localData.main_streets.slice(0, 3).join(', ')}\n`
  }

  if (localData?.landmarks && localData.landmarks.length > 0) {
    context += `- Landmarks: ${localData.landmarks.slice(0, 3).join(', ')}\n`
  }

  if (localData?.challenges && localData.challenges.length > 0) {
    context += `- Local challenges: ${localData.challenges.slice(0, 3).join(', ')}\n`
  }

  if (localData?.town_rules && localData.town_rules.length > 0) {
    context += `- Key rules: ${localData.town_rules.slice(0, 2).join(', ')}\n`
  }

  return context
}

function generateFallbackAnswer(question: string, cityData: any): string {
  const { city, stateCode } = cityData
  
  return `When it comes to dumpster rentals in ${city}, ${stateCode}, this is a common question. The answer depends on your specific project needs and local regulations. We recommend contacting Ultimate Dumpsters directly for the most accurate information tailored to your situation in ${city}. Our team is familiar with local requirements and can provide detailed guidance.`
}

// Batch generate answers for multiple questions
export async function generateAnswersBatch(
  requests: AnswerRequest[]
): Promise<GeneratedAnswer[]> {
  console.log(`📝 Generating ${requests.length} answers...`)
  
  const answers: GeneratedAnswer[] = []
  
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    
    const batchPromises = batch.map(req => generateAnswer(req))
    const batchResults = await Promise.all(batchPromises)
    
    answers.push(...batchResults)
    
    console.log(`   ✅ Generated ${answers.length}/${requests.length} answers`)
    
    // Small delay between batches
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return answers
}