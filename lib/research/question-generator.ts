export interface GeneratedQuestion {
  question: string
  category: string
  source: string
  priority: number
}

export interface CityData {
  city: string
  state: string
  stateCode: string
  county?: string | null
  mainStreets?: string[]
  landmarks?: string[]
  neighborhoods?: string[]
}

export interface HubAndSpokeContent {
  mainCityPage: {
    questions: GeneratedQuestion[]
    slug: string
    title: string
    metaDescription: string
  }
  topicPages: {
    residential: { questions: GeneratedQuestion[]; slug: string; title: string; metaDescription: string }
    commercial: { questions: GeneratedQuestion[]; slug: string; title: string; metaDescription: string }
    construction: { questions: GeneratedQuestion[]; slug: string; title: string; metaDescription: string }
    roofing: { questions: GeneratedQuestion[]; slug: string; title: string; metaDescription: string }
  }
  neighborhoodPages: Array<{
    questions: GeneratedQuestion[]
    slug: string
    title: string
    metaDescription: string
    neighborhood: string
  }>
}

export function generateHubAndSpoke(
  scrapedQuestions: any[],
  cityData: CityData
): HubAndSpokeContent {
  console.log(`🏗️ Generating Hub & Spoke content for ${cityData.city}, ${cityData.stateCode}`)

  return {
    mainCityPage: generateMainCityPage(scrapedQuestions, cityData),
    topicPages: {
      residential: generateResidentialPage(cityData),
      commercial: generateCommercialPage(cityData),
      construction: generateConstructionPage(cityData),
      roofing: generateRoofingPage(cityData)
    },
    neighborhoodPages: generateNeighborhoodPages(cityData)
  }
}

// === MAIN CITY PAGE (50 questions) ===
function generateMainCityPage(scrapedQuestions: any[], cityData: CityData) {
  const { city, stateCode } = cityData
  const questions: GeneratedQuestion[] = []

  // Add scraped questions
  scrapedQuestions.forEach(q => {
    questions.push({
      question: q.question,
      category: q.category || 'general',
      source: q.source || 'scraped',
      priority: 100
    })
  })

  // Add core template questions
  const coreQuestions: GeneratedQuestion[] = [
    // Pricing (15)
    { question: `How much does a dumpster rental cost in ${city}, ${stateCode}?`, category: 'pricing', source: 'template', priority: 95 },
    { question: `What's the average price for a 10 yard dumpster in ${city}?`, category: 'pricing', source: 'template', priority: 94 },
    { question: `What's the average price for a 20 yard dumpster in ${city}?`, category: 'pricing', source: 'template', priority: 94 },
    { question: `What's the average price for a 30 yard dumpster in ${city}?`, category: 'pricing', source: 'template', priority: 94 },
    { question: `Are there any hidden fees for dumpster rental in ${city}?`, category: 'pricing', source: 'template', priority: 92 },
    { question: `What's included in the rental price in ${city}?`, category: 'pricing', source: 'template', priority: 91 },
    { question: `Is there a weight limit on dumpsters in ${city}?`, category: 'pricing', source: 'template', priority: 90 },
    { question: `What happens if I exceed the weight limit in ${city}?`, category: 'pricing', source: 'template', priority: 90 },
    { question: `Do you offer discounts for long-term rentals in ${city}?`, category: 'pricing', source: 'template', priority: 88 },
    { question: `How much does a week-long rental cost in ${city}?`, category: 'pricing', source: 'template', priority: 87 },
    { question: `Can I get same-day delivery in ${city}?`, category: 'pricing', source: 'template', priority: 86 },
    { question: `Are weekend rentals more expensive in ${city}?`, category: 'pricing', source: 'template', priority: 85 },
    { question: `What payment methods do you accept in ${city}?`, category: 'pricing', source: 'template', priority: 84 },
    { question: `Is there a deposit required in ${city}?`, category: 'pricing', source: 'template', priority: 83 },
    { question: `Can I extend my rental period in ${city}?`, category: 'pricing', source: 'template', priority: 82 },

    // Size Selection (12)
    { question: `What size dumpster do I need in ${city}?`, category: 'size', source: 'template', priority: 96 },
    { question: `What's the difference between a 10 and 20 yard dumpster?`, category: 'size', source: 'template', priority: 93 },
    { question: `What's the difference between a 20 and 30 yard dumpster?`, category: 'size', source: 'template', priority: 93 },
    { question: `How do I choose the right size for my project in ${city}?`, category: 'size', source: 'template', priority: 92 },
    { question: `What's the most popular dumpster size in ${city}?`, category: 'size', source: 'template', priority: 88 },
    { question: `Can I upgrade to a larger size after delivery in ${city}?`, category: 'size', source: 'template', priority: 86 },
    { question: `What are the dimensions of a 20 yard dumpster?`, category: 'size', source: 'template', priority: 85 },
    { question: `How many tons can a 20 yard dumpster hold?`, category: 'size', source: 'template', priority: 85 },
    { question: `What size dumpster for a kitchen remodel in ${city}?`, category: 'size', source: 'template', priority: 84 },
    { question: `What size dumpster for a bathroom remodel in ${city}?`, category: 'size', source: 'template', priority: 83 },
    { question: `Will a 10 yard dumpster fit in my driveway in ${city}?`, category: 'size', source: 'template', priority: 82 },
    { question: `What size for yard waste removal in ${city}?`, category: 'size', source: 'template', priority: 81 },

    // Permits (10)
    { question: `Do I need a permit for a dumpster in ${city}?`, category: 'permits', source: 'template', priority: 97 },
    { question: `How much is a dumpster permit in ${city}?`, category: 'permits', source: 'template', priority: 95 },
    { question: `How do I get a permit in ${city}?`, category: 'permits', source: 'template', priority: 94 },
    { question: `Do I need a permit if it's on my property in ${city}?`, category: 'permits', source: 'template', priority: 92 },
    { question: `What are the HOA rules for dumpsters in ${city}?`, category: 'permits', source: 'template', priority: 90 },
    { question: `Can I put a dumpster on the street in ${city}?`, category: 'permits', source: 'template', priority: 89 },
    { question: `What are the placement rules in ${city}?`, category: 'permits', source: 'template', priority: 88 },
    { question: `Can I put it in my driveway in ${city}?`, category: 'permits', source: 'template', priority: 87 },
    { question: `Are there time restrictions for delivery in ${city}?`, category: 'permits', source: 'template', priority: 84 },
    { question: `What happens if I don't get a permit in ${city}?`, category: 'permits', source: 'template', priority: 82 },

    // Logistics (8)
    { question: `How long can I keep a dumpster in ${city}?`, category: 'logistics', source: 'template', priority: 91 },
    { question: `Can I extend my rental in ${city}?`, category: 'logistics', source: 'template', priority: 89 },
    { question: `How far in advance should I book in ${city}?`, category: 'logistics', source: 'template', priority: 88 },
    { question: `Do I need to be present for delivery in ${city}?`, category: 'logistics', source: 'template', priority: 87 },
    { question: `What happens if I overfill the dumpster in ${city}?`, category: 'logistics', source: 'template', priority: 84 },
    { question: `How do I prepare my driveway in ${city}?`, category: 'logistics', source: 'template', priority: 82 },
    { question: `Will it damage my driveway in ${city}?`, category: 'logistics', source: 'template', priority: 81 },
    { question: `Can I move it after delivery in ${city}?`, category: 'logistics', source: 'template', priority: 80 }
  ]

  questions.push(...coreQuestions)
  questions.sort((a, b) => b.priority - a.priority)

  console.log(`✅ Main city page: ${questions.slice(0, 50).length} questions`)

  return {
    questions: questions.slice(0, 50),
    slug: `${city.toLowerCase().replace(/\s+/g, '-')}-${stateCode.toLowerCase()}`,
    title: `Dumpster Rental ${city}, ${stateCode} - Affordable Roll-Off Dumpsters`,
    metaDescription: `Rent a dumpster in ${city}, ${stateCode}. Fast delivery, transparent pricing, all sizes. Perfect for home, business & construction projects.`
  }
}

// === RESIDENTIAL PAGE (25 questions) ===
function generateResidentialPage(cityData: CityData) {
  const { city, stateCode } = cityData
  
  const questions: GeneratedQuestion[] = [
    { question: `What size dumpster for a home cleanout in ${city}?`, category: 'residential', source: 'template', priority: 95 },
    { question: `Best dumpster for garage cleanout in ${city}?`, category: 'residential', source: 'template', priority: 94 },
    { question: `Best dumpster for basement cleanout in ${city}?`, category: 'residential', source: 'template', priority: 94 },
    { question: `Best dumpster for attic cleanout in ${city}?`, category: 'residential', source: 'template', priority: 93 },
    { question: `How much does residential dumpster rental cost in ${city}?`, category: 'residential', source: 'template', priority: 92 },
    { question: `Can I put furniture in a dumpster in ${city}?`, category: 'residential', source: 'template', priority: 91 },
    { question: `Can I put appliances in a dumpster in ${city}?`, category: 'residential', source: 'template', priority: 91 },
    { question: `Can I put mattresses in a dumpster in ${city}?`, category: 'residential', source: 'template', priority: 90 },
    { question: `Best dumpster for estate cleanout in ${city}?`, category: 'residential', source: 'template', priority: 89 },
    { question: `Dumpster rental for moving in ${city}?`, category: 'residential', source: 'template', priority: 88 },
    { question: `Best dumpster for downsizing in ${city}?`, category: 'residential', source: 'template', priority: 88 },
    { question: `Dumpster for spring cleaning in ${city}?`, category: 'residential', source: 'template', priority: 87 },
    { question: `What size for full house cleanout in ${city}?`, category: 'residential', source: 'template', priority: 86 },
    { question: `Can I rent a dumpster for yard waste in ${city}?`, category: 'residential', source: 'template', priority: 85 },
    { question: `Best dumpster for decluttering in ${city}?`, category: 'residential', source: 'template', priority: 84 },
    { question: `Dumpster for foreclosure cleanout in ${city}?`, category: 'residential', source: 'template', priority: 83 },
    { question: `Best dumpster for hoarding cleanup in ${city}?`, category: 'residential', source: 'template', priority: 82 },
    { question: `What items can't go in a residential dumpster in ${city}?`, category: 'residential', source: 'template', priority: 81 },
    { question: `How long can I keep a residential dumpster in ${city}?`, category: 'residential', source: 'template', priority: 80 },
    { question: `Do I need a permit for my driveway in ${city}?`, category: 'residential', source: 'template', priority: 79 },
    { question: `Can I share a dumpster with my neighbor in ${city}?`, category: 'residential', source: 'template', priority: 78 },
    { question: `Best time to rent for home projects in ${city}?`, category: 'residential', source: 'template', priority: 77 },
    { question: `Dumpster for home renovation in ${city}?`, category: 'residential', source: 'template', priority: 76 },
    { question: `What size for bathroom remodel in ${city}?`, category: 'residential', source: 'template', priority: 75 },
    { question: `Dumpster for flooring removal in ${city}?`, category: 'residential', source: 'template', priority: 74 }
  ]

  console.log(`✅ Residential page: ${questions.length} questions`)

  return {
    questions,
    slug: 'residential',
    title: `Residential Dumpster Rental ${city}, ${stateCode} - Home Cleanout Experts`,
    metaDescription: `Residential dumpster rentals in ${city} for home cleanouts, renovations & decluttering. All sizes, fast delivery. Perfect for homeowners.`
  }
}

// === COMMERCIAL PAGE (25 questions) ===
function generateCommercialPage(cityData: CityData) {
  const { city, stateCode } = cityData
  
  const questions: GeneratedQuestion[] = [
    { question: `Commercial dumpster rental prices in ${city}?`, category: 'commercial', source: 'template', priority: 95 },
    { question: `Long-term dumpster rental for businesses in ${city}?`, category: 'commercial', source: 'template', priority: 94 },
    { question: `What size dumpster for retail store cleanout in ${city}?`, category: 'commercial', source: 'template', priority: 93 },
    { question: `What size dumpster for office cleanout in ${city}?`, category: 'commercial', source: 'template', priority: 93 },
    { question: `Restaurant dumpster requirements in ${city}?`, category: 'commercial', source: 'template', priority: 92 },
    { question: `Dumpster rental for property management in ${city}?`, category: 'commercial', source: 'template', priority: 91 },
    { question: `Can I get recurring dumpster service in ${city}?`, category: 'commercial', source: 'template', priority: 90 },
    { question: `Best dumpster for warehouse cleanout in ${city}?`, category: 'commercial', source: 'template', priority: 89 },
    { question: `Dumpster for commercial renovations in ${city}?`, category: 'commercial', source: 'template', priority: 88 },
    { question: `What size dumpster for a strip mall in ${city}?`, category: 'commercial', source: 'template', priority: 87 },
    { question: `Do businesses get discounts in ${city}?`, category: 'commercial', source: 'template', priority: 86 },
    { question: `Dumpster for business relocations in ${city}?`, category: 'commercial', source: 'template', priority: 85 },
    { question: `Can I get a locked dumpster in ${city}?`, category: 'commercial', source: 'template', priority: 84 },
    { question: `What permits do businesses need in ${city}?`, category: 'commercial', source: 'template', priority: 83 },
    { question: `Dumpster for hotel renovations in ${city}?`, category: 'commercial', source: 'template', priority: 82 },
    { question: `Best dumpster for medical office in ${city}?`, category: 'commercial', source: 'template', priority: 81 },
    { question: `Dumpster for gym or fitness center in ${city}?`, category: 'commercial', source: 'template', priority: 80 },
    { question: `Can dumpsters be in parking lots in ${city}?`, category: 'commercial', source: 'template', priority: 79 },
    { question: `Best commercial dumpster service in ${city}?`, category: 'commercial', source: 'template', priority: 78 },
    { question: `Dumpster for apartment complex in ${city}?`, category: 'commercial', source: 'template', priority: 77 },
    { question: `How often should commercial dumpsters be emptied in ${city}?`, category: 'commercial', source: 'template', priority: 76 },
    { question: `Dumpster for shopping center in ${city}?`, category: 'commercial', source: 'template', priority: 75 },
    { question: `Can I get a commercial dumpster with wheels in ${city}?`, category: 'commercial', source: 'template', priority: 74 },
    { question: `Best dumpster for auto shop in ${city}?`, category: 'commercial', source: 'template', priority: 73 },
    { question: `Dumpster for salon or spa in ${city}?`, category: 'commercial', source: 'template', priority: 72 }
  ]

  console.log(`✅ Commercial page: ${questions.length} questions`)

  return {
    questions,
    slug: 'commercial',
    title: `Commercial Dumpster Rental ${city}, ${stateCode} - Business Waste Solutions`,
    metaDescription: `Commercial dumpster rentals in ${city} for businesses, property managers & retail. Long-term rentals available. Reliable service.`
  }
}

// === CONSTRUCTION PAGE (25 questions) ===
function generateConstructionPage(cityData: CityData) {
  const { city, stateCode } = cityData
  
  const questions: GeneratedQuestion[] = [
    { question: `What size dumpster for construction debris in ${city}?`, category: 'construction', source: 'template', priority: 95 },
    { question: `What size dumpster for a home addition in ${city}?`, category: 'construction', source: 'template', priority: 94 },
    { question: `What size dumpster for demolition in ${city}?`, category: 'construction', source: 'template', priority: 94 },
    { question: `Can I put concrete in a dumpster in ${city}?`, category: 'construction', source: 'template', priority: 93 },
    { question: `Can I put drywall in a dumpster in ${city}?`, category: 'construction', source: 'template', priority: 92 },
    { question: `Can I put wood in a dumpster in ${city}?`, category: 'construction', source: 'template', priority: 92 },
    { question: `Can I put bricks in a dumpster in ${city}?`, category: 'construction', source: 'template', priority: 91 },
    { question: `What size dumpster for deck removal in ${city}?`, category: 'construction', source: 'template', priority: 90 },
    { question: `What size dumpster for fence removal in ${city}?`, category: 'construction', source: 'template', priority: 89 },
    { question: `Best dumpster for landscaping debris in ${city}?`, category: 'construction', source: 'template', priority: 88 },
    { question: `Do contractors get discounts in ${city}?`, category: 'construction', source: 'template', priority: 87 },
    { question: `Can I get multiple dumpsters for one site in ${city}?`, category: 'construction', source: 'template', priority: 86 },
    { question: `What permits do contractors need in ${city}?`, category: 'construction', source: 'template', priority: 85 },
    { question: `Dumpster for new home construction in ${city}?`, category: 'construction', source: 'template', priority: 84 },
    { question: `Best dumpster for siding removal in ${city}?`, category: 'construction', source: 'template', priority: 83 },
    { question: `Can I put mixed construction debris in one dumpster in ${city}?`, category: 'construction', source: 'template', priority: 82 },
    { question: `What size dumpster for framing waste in ${city}?`, category: 'construction', source: 'template', priority: 81 },
    { question: `Dumpster for interior gutting in ${city}?`, category: 'construction', source: 'template', priority: 80 },
    { question: `Can I put insulation in a dumpster in ${city}?`, category: 'construction', source: 'template', priority: 79 },
    { question: `What items can't go in construction dumpsters in ${city}?`, category: 'construction', source: 'template', priority: 78 },
    { question: `How long can I keep a construction dumpster in ${city}?`, category: 'construction', source: 'template', priority: 77 },
    { question: `Best dumpster for commercial construction in ${city}?`, category: 'construction', source: 'template', priority: 76 },
    { question: `Dumpster for foundation work in ${city}?`, category: 'construction', source: 'template', priority: 75 },
    { question: `Can I get same-day delivery in ${city}?`, category: 'construction', source: 'template', priority: 74 },
    { question: `What's the weight limit for construction dumpsters in ${city}?`, category: 'construction', source: 'template', priority: 73 }
  ]

  console.log(`✅ Construction page: ${questions.length} questions`)

  return {
    questions,
    slug: 'construction',
    title: `Construction Dumpster Rental ${city}, ${stateCode} - Contractor Solutions`,
    metaDescription: `Construction dumpster rentals in ${city} for contractors & builders. Heavy-duty dumpsters, flexible rental periods. Reliable service.`
  }
}

// === ROOFING PAGE (20 questions) ===
function generateRoofingPage(cityData: CityData) {
  const { city, stateCode } = cityData
  
  const questions: GeneratedQuestion[] = [
    { question: `What size dumpster for roof replacement in ${city}?`, category: 'roofing', source: 'template', priority: 95 },
    { question: `Can I put shingles in a dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 94 },
    { question: `How heavy is a roofing dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 93 },
    { question: `What size dumpster for 1500 sq ft roof in ${city}?`, category: 'roofing', source: 'template', priority: 92 },
    { question: `What size dumpster for 2000 sq ft roof in ${city}?`, category: 'roofing', source: 'template', priority: 92 },
    { question: `What size dumpster for 3000 sq ft roof in ${city}?`, category: 'roofing', source: 'template', priority: 91 },
    { question: `Can I mix roofing materials in one dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 90 },
    { question: `What's the weight limit for roofing dumpsters in ${city}?`, category: 'roofing', source: 'template', priority: 89 },
    { question: `Can I put metal roofing in a dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 88 },
    { question: `Best dumpster for roof tear-off in ${city}?`, category: 'roofing', source: 'template', priority: 87 },
    { question: `Do roofers get special rates in ${city}?`, category: 'roofing', source: 'template', priority: 86 },
    { question: `How do I protect my driveway during roofing in ${city}?`, category: 'roofing', source: 'template', priority: 85 },
    { question: `Can I get same-day roofing dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 84 },
    { question: `What if my roofing dumpster is overweight in ${city}?`, category: 'roofing', source: 'template', priority: 83 },
    { question: `Can I put tar paper in a dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 82 },
    { question: `Best dumpster placement for roofing in ${city}?`, category: 'roofing', source: 'template', priority: 81 },
    { question: `Do I need a permit for roofing dumpster in ${city}?`, category: 'roofing', source: 'template', priority: 80 },
    { question: `How long for typical roofing rental in ${city}?`, category: 'roofing', source: 'template', priority: 79 },
    { question: `Can I extend my roofing rental in ${city}?`, category: 'roofing', source: 'template', priority: 78 },
    { question: `What size for commercial roof in ${city}?`, category: 'roofing', source: 'template', priority: 77 }
  ]

  console.log(`✅ Roofing page: ${questions.length} questions`)

  return {
    questions,
    slug: 'roofing',
    title: `Roofing Dumpster Rental ${city}, ${stateCode} - Shingle Disposal Experts`,
    metaDescription: `Roofing dumpster rentals in ${city} for roofers & contractors. Heavy-duty dumpsters for shingle disposal & roof tear-offs.`
  }
}

// === NEIGHBORHOOD PAGES (15 questions each) ===
function generateNeighborhoodPages(cityData: CityData) {
  const { city, stateCode, neighborhoods = [] } = cityData
  
  if (neighborhoods.length === 0) {
    console.log(`⚠️ No neighborhoods, skipping`)
    return []
  }

  const pages = neighborhoods.slice(0, 5).map(hood => {
    const questions: GeneratedQuestion[] = [
      { question: `Dumpster rental in ${hood}, ${city}?`, category: 'local', source: 'template', priority: 95 },
      { question: `How much does dumpster rental cost in ${hood}?`, category: 'local', source: 'template', priority: 94 },
      { question: `Best dumpster service in ${hood}, ${city}?`, category: 'local', source: 'template', priority: 93 },
      { question: `Can I put a dumpster on the street in ${hood}?`, category: 'local', source: 'template', priority: 92 },
      { question: `What size dumpster for ${hood} homes?`, category: 'local', source: 'template', priority: 91 },
      { question: `Are there HOA restrictions in ${hood}?`, category: 'local', source: 'template', priority: 90 },
      { question: `Same-day delivery in ${hood}?`, category: 'local', source: 'template', priority: 89 },
      { question: `Residential dumpster in ${hood}, ${city}?`, category: 'local', source: 'template', priority: 88 },
      { question: `Do I need a permit in ${hood}?`, category: 'local', source: 'template', priority: 87 },
      { question: `Parking rules for dumpsters in ${hood}?`, category: 'local', source: 'template', priority: 86 },
      { question: `Best time to rent in ${hood}?`, category: 'local', source: 'template', priority: 85 },
      { question: `Dumpster for home renovation in ${hood}?`, category: 'local', source: 'template', priority: 84 },
      { question: `Can I share a dumpster in ${hood}?`, category: 'local', source: 'template', priority: 83 },
      { question: `Typical driveway size in ${hood}?`, category: 'local', source: 'template', priority: 82 },
      { question: `Weight restrictions in ${hood}?`, category: 'local', source: 'template', priority: 81 }
    ]

    console.log(`✅ ${hood} page: ${questions.length} questions`)

    return {
      questions,
      slug: hood.toLowerCase().replace(/\s+/g, '-'),
      title: `Dumpster Rental in ${hood}, ${city} ${stateCode}`,
      metaDescription: `Local dumpster rental in ${hood}, ${city}. Fast delivery, transparent pricing, all sizes available.`,
      neighborhood: hood
    }
  })

  return pages
}