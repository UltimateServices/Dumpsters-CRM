require('dotenv').config({ path: '.env.local' })

// Script to seed US cities data into Supabase
// Run with: node scripts/seed-cities.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample top US cities data (you would expand this to 1000+ cities)
const sampleCities = [
  // Major metro areas
  { city: 'Los Angeles', state: 'California', state_code: 'CA', county: 'Los Angeles', population: 3898747, median_income: 65290, latitude: 34.0522, longitude: -118.2437, search_volume: 8100, competition_score: 8 },
  { city: 'Houston', state: 'Texas', state_code: 'TX', county: 'Harris', population: 2304580, median_income: 52338, latitude: 29.7604, longitude: -95.3698, search_volume: 5400, competition_score: 7 },
  { city: 'Phoenix', state: 'Arizona', state_code: 'AZ', county: 'Maricopa', population: 1608139, median_income: 59896, latitude: 33.4484, longitude: -112.0740, search_volume: 4800, competition_score: 6 },
  { city: 'San Antonio', state: 'Texas', state_code: 'TX', county: 'Bexar', population: 1547253, median_income: 53420, latitude: 29.4241, longitude: -98.4936, search_volume: 3600, competition_score: 5 },
  { city: 'San Diego', state: 'California', state_code: 'CA', county: 'San Diego', population: 1423851, median_income: 83454, latitude: 32.7157, longitude: -117.1611, search_volume: 4400, competition_score: 8 },
  { city: 'Dallas', state: 'Texas', state_code: 'TX', county: 'Dallas', population: 1304379, median_income: 54747, latitude: 32.7767, longitude: -96.7970, search_volume: 4200, competition_score: 7 },
  { city: 'San Jose', state: 'California', state_code: 'CA', county: 'Santa Clara', population: 1021795, median_income: 117324, latitude: 37.3382, longitude: -121.8863, search_volume: 2900, competition_score: 7 },
  { city: 'Austin', state: 'Texas', state_code: 'TX', county: 'Travis', population: 978908, median_income: 75413, latitude: 30.2672, longitude: -97.7431, search_volume: 5200, competition_score: 8 },
  { city: 'Jacksonville', state: 'Florida', state_code: 'FL', county: 'Duval', population: 949611, median_income: 59227, latitude: 30.3322, longitude: -81.6557, search_volume: 2800, competition_score: 5 },
  { city: 'Fort Worth', state: 'Texas', state_code: 'TX', county: 'Tarrant', population: 918915, median_income: 63334, latitude: 32.7555, longitude: -97.3308, search_volume: 2400, competition_score: 6 },
  
  // Medium cities
  { city: 'Charlotte', state: 'North Carolina', state_code: 'NC', county: 'Mecklenburg', population: 874579, median_income: 62817, latitude: 35.2271, longitude: -80.8431, search_volume: 3100, competition_score: 6 },
  { city: 'Columbus', state: 'Ohio', state_code: 'OH', county: 'Franklin', population: 905748, median_income: 58575, latitude: 39.9612, longitude: -82.9988, search_volume: 2700, competition_score: 5 },
  { city: 'Indianapolis', state: 'Indiana', state_code: 'IN', county: 'Marion', population: 876384, median_income: 52853, latitude: 39.7684, longitude: -86.1581, search_volume: 2500, competition_score: 5 },
  { city: 'Seattle', state: 'Washington', state_code: 'WA', county: 'King', population: 749256, median_income: 105391, latitude: 47.6062, longitude: -122.3321, search_volume: 4600, competition_score: 8 },
  { city: 'Denver', state: 'Colorado', state_code: 'CO', county: 'Denver', population: 715522, median_income: 78177, latitude: 39.7392, longitude: -104.9903, search_volume: 3900, competition_score: 7 },
  { city: 'Nashville', state: 'Tennessee', state_code: 'TN', county: 'Davidson', population: 689447, median_income: 64577, latitude: 36.1627, longitude: -86.7816, search_volume: 2900, competition_score: 6 },
  { city: 'Oklahoma City', state: 'Oklahoma', state_code: 'OK', county: 'Oklahoma', population: 681054, median_income: 59679, latitude: 35.4676, longitude: -97.5164, search_volume: 2100, competition_score: 4 },
  { city: 'Portland', state: 'Oregon', state_code: 'OR', county: 'Multnomah', population: 652503, median_income: 77675, latitude: 45.5152, longitude: -122.6784, search_volume: 3200, competition_score: 7 },
  { city: 'Las Vegas', state: 'Nevada', state_code: 'NV', county: 'Clark', population: 641903, median_income: 62739, latitude: 36.1699, longitude: -115.1398, search_volume: 4100, competition_score: 7 },
  { city: 'Memphis', state: 'Tennessee', state_code: 'TN', county: 'Shelby', population: 633104, median_income: 43440, latitude: 35.1495, longitude: -90.0490, search_volume: 1800, competition_score: 4 },
  
  // Growing suburbs and mid-tier cities
  { city: 'Plano', state: 'Texas', state_code: 'TX', county: 'Collin', population: 288253, median_income: 99131, latitude: 33.0198, longitude: -96.6989, search_volume: 1400, competition_score: 6 },
  { city: 'Irvine', state: 'California', state_code: 'CA', county: 'Orange', population: 307670, median_income: 108318, latitude: 33.6846, longitude: -117.8265, search_volume: 1600, competition_score: 7 },
  { city: 'Raleigh', state: 'North Carolina', state_code: 'NC', county: 'Wake', population: 474069, median_income: 68825, latitude: 35.7796, longitude: -78.6382, search_volume: 2200, competition_score: 6 },
  { city: 'Boise', state: 'Idaho', state_code: 'ID', county: 'Ada', population: 235684, median_income: 63415, latitude: 43.6150, longitude: -116.2023, search_volume: 1700, competition_score: 5 },
  { city: 'Scottsdale', state: 'Arizona', state_code: 'AZ', county: 'Maricopa', population: 241361, median_income: 88175, latitude: 33.4942, longitude: -111.9261, search_volume: 1500, competition_score: 7 },
  
  // Add Oceanside for Dylan!
  { city: 'Oceanside', state: 'New York', state_code: 'NY', county: 'Nassau', population: 32109, median_income: 112000, latitude: 40.6387, longitude: -73.6401, search_volume: 720, competition_score: 6 }
]

async function seedCities() {
  console.log('🌱 Starting city seeding...')
  console.log(`📊 Seeding ${sampleCities.length} cities`)
  
  try {
    const { data, error } = await supabase
      .from('geo_locations')
      .upsert(sampleCities, {
        onConflict: 'city,state_code',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('❌ Error seeding cities:', error)
      process.exit(1)
    }

    console.log('✅ Successfully seeded cities!')
    console.log(`📍 ${data?.length || sampleCities.length} cities added to database`)
    
    // Show top 5 priority cities
    const { data: topCities } = await supabase
      .from('geo_locations')
      .select('city, state_code, priority_score')
      .order('priority_score', { ascending: false })
      .limit(5)

    console.log('\n🎯 Top 5 Priority Cities:')
    topCities?.forEach((city, index) => {
      console.log(`${index + 1}. ${city.city}, ${city.state_code} (Score: ${city.priority_score})`)
    })

    console.log('\n💡 Next steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Visit: http://localhost:3000/dashboard')
    console.log('3. Start creating content!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

seedCities()