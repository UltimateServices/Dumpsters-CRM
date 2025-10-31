interface PAAQuestion {
  question: string
  source: string
}

export async function scrapeGooglePAA(
  city: string,
  state: string
): Promise<PAAQuestion[]> {
  console.log(`🔍 Generating Google PAA questions for ${city}, ${state}`)

  // In production, you'd use a service like SerpAPI or ScraperAPI
  // For now, we'll generate common PAA questions based on patterns
  
  const questions: PAAQuestion[] = []

  // Common "People Also Ask" patterns for dumpster rentals
  const questionTemplates = [
    `How much does a dumpster rental cost in ${city}?`,
    `What size dumpster do I need in ${city}?`,
    `Do I need a permit for a dumpster in ${city}?`,
    `How long can I keep a dumpster in ${city}?`,
    `Can I put a dumpster in my driveway in ${city}?`,
    `What items are not allowed in a dumpster in ${city}?`,
    `How much weight can a dumpster hold in ${city}?`,
    `What's the difference between a 10 yard and 20 yard dumpster?`,
    `How far in advance should I book a dumpster in ${city}?`,
    `Do dumpster rentals include pickup in ${city}?`,
    `Can I move a dumpster once it's delivered in ${city}?`,
    `What happens if I overfill a dumpster in ${city}?`,
    `Are there any restrictions on where I can place a dumpster in ${city}?`,
    `How do I prepare my driveway for a dumpster in ${city}?`,
    `What's the best dumpster size for a home renovation in ${city}?`,
    `Can I rent a dumpster for one day in ${city}?`,
    `Do I need to be present for dumpster delivery in ${city}?`,
    `What's included in the dumpster rental price in ${city}?`,
    `Can I extend my dumpster rental period in ${city}?`,
    `What's the cheapest dumpster rental option in ${city}?`
  ]

  questionTemplates.forEach(q => {
    questions.push({
      question: q,
      source: 'Google People Also Ask'
    })
  })

  console.log(`✅ Generated ${questions.length} PAA questions`)
  return questions
}

// Helper function to generate topic-specific questions
export function generateTopicQuestions(
  city: string,
  topic: 'residential' | 'commercial' | 'construction' | 'roofing'
): PAAQuestion[] {
  const topicQuestions: Record<string, string[]> = {
    residential: [
      `What size dumpster for home cleanout in ${city}?`,
      `How much to rent a dumpster for garage cleanout in ${city}?`,
      `Best dumpster size for estate cleanout in ${city}?`,
      `Can I rent a dumpster for yard waste in ${city}?`
    ],
    commercial: [
      `Commercial dumpster rental prices in ${city}?`,
      `Long-term dumpster rental for businesses in ${city}?`,
      `Restaurant dumpster requirements in ${city}?`,
      `Office cleanout dumpster size in ${city}?`
    ],
    construction: [
      `What dumpster size for home addition in ${city}?`,
      `Construction debris dumpster rental in ${city}?`,
      `Concrete disposal dumpster in ${city}?`,
      `Demolition dumpster rental cost in ${city}?`
    ],
    roofing: [
      `Roofing shingle dumpster size in ${city}?`,
      `How heavy is a roofing dumpster in ${city}?`,
      `Can I mix roofing materials in a dumpster in ${city}?`,
      `Best dumpster for roof replacement in ${city}?`
    ]
  }

  return topicQuestions[topic].map(q => ({
    question: q,
    source: 'Google People Also Ask'
  }))
}