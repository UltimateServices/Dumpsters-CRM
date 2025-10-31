interface LocalData {
  main_streets: string[]
  landmarks: string[]
  neighborhoods: string[]
  challenges: string[]
  permit_department: string | null
  permit_cost: number | null
  permit_processing_days: number | null
  permit_url: string | null
  town_rules: string[]
  local_wildlife: string[]
  seasonal_factors: string[]
  nearby_facilities: string[]
}

export async function scrapeLocalData(
  city: string,
  state: string,
  stateCode: string,
  county?: string | null
): Promise<LocalData> {
  console.log(`🏙️ Gathering local data for ${city}, ${stateCode}`)

  // For now, we'll generate smart defaults based on known patterns
  // In production, this would scrape Google Maps, city websites, etc.

  const localData: LocalData = {
    main_streets: generateMainStreets(city, stateCode),
    landmarks: generateLandmarks(city, stateCode),
    neighborhoods: generateNeighborhoods(city, stateCode),
    challenges: generateChallenges(city, stateCode),
    permit_department: `${city} Code Enforcement`,
    permit_cost: estimatePermitCost(city, stateCode),
    permit_processing_days: 3,
    permit_url: `https://${city.toLowerCase().replace(/\s+/g, '')}${stateCode.toLowerCase()}.gov/permits`,
    town_rules: generateTownRules(city),
    local_wildlife: generateWildlife(stateCode),
    seasonal_factors: generateSeasonalFactors(stateCode),
    nearby_facilities: ['County landfill', 'Recycling center', 'Transfer station']
  }

  console.log(`✅ Generated local data for ${city}`)
  return localData
}

function generateMainStreets(city: string, stateCode: string): string[] {
  const commonNames = ['Main Street', 'First Avenue', 'Broadway', 'Oak Street', 'Elm Street']
  return [
    `${city} Avenue`,
    'Main Street',
    `${stateCode} Highway`,
    'Downtown Boulevard'
  ]
}

function generateLandmarks(city: string, stateCode: string): string[] {
  const landmarks = [
    `${city} City Hall`,
    `Downtown ${city}`,
    `${city} Park`,
    'Municipal buildings'
  ]
  
  // Add state-specific landmarks
  if (stateCode === 'CA') landmarks.push('beaches', 'coastal areas')
  if (stateCode === 'TX') landmarks.push('highways', 'commercial districts')
  if (stateCode === 'FL') landmarks.push('waterfront', 'marina districts')
  if (stateCode === 'NY') landmarks.push('historic districts', 'waterfronts')
  
  return landmarks
}

function generateNeighborhoods(city: string, stateCode: string): string[] {
  return [
    `Downtown ${city}`,
    `East ${city}`,
    `West ${city}`,
    `${city} Heights`
  ]
}

function generateChallenges(city: string, stateCode: string): string[] {
  const challenges = ['narrow streets', 'parking restrictions', 'HOA restrictions']
  
  // State-specific challenges
  if (stateCode === 'CA') challenges.push('strict environmental regulations', 'earthquake zones')
  if (stateCode === 'TX') challenges.push('heat considerations', 'wide lots')
  if (stateCode === 'FL') challenges.push('hurricane season', 'flood zones')
  if (stateCode === 'NY') challenges.push('winter weather', 'dense neighborhoods')
  
  return challenges
}

function estimatePermitCost(city: string, stateCode: string): number {
  // Estimate based on state (in production, scrape actual data)
  const costsByState: Record<string, number> = {
    'CA': 75,
    'NY': 65,
    'TX': 45,
    'FL': 50,
    'WA': 60,
    'CO': 55
  }
  
  return costsByState[stateCode] || 50
}

function generateTownRules(city: string): string[] {
  return [
    'Permit required for public street placement',
    'Must not block sidewalks or hydrants',
    'Reflective tape required for overnight placement',
    'Maximum 14-day rental period in residential zones'
  ]
}

function generateWildlife(stateCode: string): string[] {
  const wildlifeByState: Record<string, string[]> = {
    'CA': ['seagulls', 'raccoons', 'coyotes'],
    'TX': ['armadillos', 'raccoons', 'possums'],
    'FL': ['alligators', 'raccoons', 'iguanas'],
    'NY': ['raccoons', 'possums', 'rats'],
    'WA': ['raccoons', 'bears', 'deer'],
    'CO': ['bears', 'deer', 'mountain lions']
  }
  
  return wildlifeByState[stateCode] || ['raccoons', 'possums']
}

function generateSeasonalFactors(stateCode: string): string[] {
  const factors = []
  
  if (['CA', 'TX', 'FL', 'AZ'].includes(stateCode)) {
    factors.push('extreme summer heat', 'high temperatures affect debris decomposition')
  }
  
  if (['NY', 'CO', 'WA'].includes(stateCode)) {
    factors.push('winter snow', 'ice and freezing temperatures', 'holiday season construction slowdowns')
  }
  
  if (['FL', 'TX', 'LA'].includes(stateCode)) {
    factors.push('hurricane season', 'storm debris')
  }
  
  return factors
}