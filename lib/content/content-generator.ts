import Anthropic from '@anthropic-ai/sdk'

export interface GeneratedContent {
  mainCityPage: {
    title: string
    slug: string
    htmlContent: string
    metaDescription: string
  }
  neighborhoodPages?: Array<{
    title: string
    slug: string
    htmlContent: string
    metaDescription: string
  }>
}

interface NeighborhoodData {
  [key: string]: string[]
}

const NEIGHBORHOOD_MAP: NeighborhoodData = {
  'Phoenix': ['Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale', 'Gilbert', 'Peoria', 'Surprise'],
  'Dallas': ['Plano', 'Irving', 'Arlington', 'Fort Worth', 'Frisco', 'McKinney', 'Garland', 'Richardson'],
  'Houston': ['Sugar Land', 'Pearland', 'The Woodlands', 'Katy', 'Pasadena', 'League City', 'Cypress', 'Spring'],
  'Los Angeles': ['Santa Monica', 'Pasadena', 'Long Beach', 'Glendale', 'Burbank', 'Torrance', 'Inglewood', 'El Monte'],
  'Chicago': ['Naperville', 'Evanston', 'Oak Park', 'Schaumburg', 'Palatine', 'Skokie', 'Des Plaines', 'Arlington Heights'],
  'San Antonio': ['New Braunfels', 'Boerne', 'Schertz', 'Seguin', 'Universal City', 'Leon Valley', 'Helotes', 'Converse']
}

export class ContentGenerator {
  private anthropic: Anthropic

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey })
  }

  private getNeighborhoods(city: string): string[] {
    return NEIGHBORHOOD_MAP[city] || ['Downtown', 'North Side', 'South Side', 'East End', 'West End', 'Midtown', 'Uptown', 'Suburbs']
  }

  private generateSchema(cityData: any, neighborhoods: string[], faqs: Array<{question: string, answer: string}>) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          "@id": `https://ultimatedumpsters.com/dumpster-rental-${cityData.city.toLowerCase()}-${cityData.state_code.toLowerCase()}#business`,
          "name": "Ultimate Dumpsters",
          "image": "https://ultimatedumpsters.com/wp-content/uploads/logo.png",
          "url": `https://ultimatedumpsters.com/dumpster-rental-${cityData.city.toLowerCase()}-${cityData.state_code.toLowerCase()}`,
          "telephone": "866-858-3867",
          "priceRange": "$295-$695",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": cityData.city,
            "addressRegion": cityData.state_code,
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": cityData.latitude || 0,
            "longitude": cityData.longitude || 0
          },
          "areaServed": [
            {
              "@type": "City",
              "name": cityData.city
            },
            ...neighborhoods.map(n => ({
              "@type": "City",
              "name": n
            }))
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1247",
            "bestRating": "5",
            "worstRating": "1"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "08:00",
              "closes": "20:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "16:00"
            }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": faqs.slice(0, 15).map(qa => ({
            "@type": "Question",
            "name": qa.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": qa.answer
            }
          }))
        },
        {
          "@type": "Service",
          "serviceType": "Dumpster Rental",
          "provider": {
            "@id": `https://ultimatedumpsters.com/dumpster-rental-${cityData.city.toLowerCase()}-${cityData.state_code.toLowerCase()}#business`
          },
          "areaServed": neighborhoods.map(n => ({
            "@type": "City",
            "name": n
          })),
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Dumpster Sizes",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "10 Yard Dumpster Rental"
                },
                "price": "295",
                "priceCurrency": "USD"
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "20 Yard Dumpster Rental"
                },
                "price": "395",
                "priceCurrency": "USD"
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "30 Yard Dumpster Rental"
                },
                "price": "495",
                "priceCurrency": "USD"
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "40 Yard Dumpster Rental"
                },
                "price": "695",
                "priceCurrency": "USD"
              }
            ]
          }
        }
      ]
    }
  }

  async generateCityContent(cityData: any): Promise<GeneratedContent> {
    console.log(`\n🎨 Generating PREMIUM SEO/GEO content for ${cityData.city}, ${cityData.state_code}...`)

    const neighborhoods = this.getNeighborhoods(cityData.city)
    console.log(`📍 Targeting ${neighborhoods.length} neighborhoods: ${neighborhoods.join(', ')}`)

    // Main hub page questions (25 comprehensive questions across categories)
    const mainQuestions = [
      // Residential (7)
      `What do homeowners in ${cityData.city} need to know about dumpster rental for home renovations?`,
      `How much does a residential dumpster rental cost in ${cityData.city}, ${cityData.state_code}?`,
      `What size dumpster do I need for a home cleanout in ${cityData.city}?`,
      `Can I put a dumpster in my driveway in ${cityData.city}? What are the rules?`,
      `How long can I keep a rental dumpster at my ${cityData.city} home?`,
      `What's included in residential dumpster rental pricing in ${cityData.city}?`,
      `How do I prepare my ${cityData.city} property for dumpster delivery?`,
      
      // Commercial (6)
      `What commercial dumpster services are available in ${cityData.city}?`,
      `How do businesses in ${cityData.city} handle ongoing waste management?`,
      `What's the difference between residential and commercial dumpster rental in ${cityData.city}?`,
      `Do I need a permit for a commercial dumpster in ${cityData.city}?`,
      `What are the best dumpster sizes for retail businesses in ${cityData.city}?`,
      `How quickly can businesses get dumpster service in ${cityData.city}?`,
      
      // Construction (6)
      `What do construction companies need to know about dumpster rental in ${cityData.city}?`,
      `How do I dispose of construction debris in ${cityData.city}, ${cityData.state_code}?`,
      `What can't I throw in a construction dumpster in ${cityData.city}?`,
      `How quickly can I get a construction dumpster delivered in ${cityData.city}?`,
      `What's the typical rental period for construction projects in ${cityData.city}?`,
      `Do construction companies in ${cityData.city} get volume discounts?`,
      
      // Pricing & Logistics (6)
      `What factors affect dumpster rental pricing in ${cityData.city}?`,
      `Are there any hidden fees for dumpster rental in ${cityData.city}, ${cityData.state_code}?`,
      `How does weight limit work for dumpster rentals in ${cityData.city}?`,
      `What happens if I go over the weight limit in ${cityData.city}?`,
      `When is the best time to rent a dumpster in ${cityData.city}?`,
      `How far in advance should I book a dumpster in ${cityData.city}?`
    ]

    console.log(`\n📝 Generating main hub page (${mainQuestions.length} questions)...`)
    
    const mainAnswers: Array<{question: string, answer: string}> = []
    
    for (let i = 0; i < mainQuestions.length; i++) {
      console.log(`   ${i + 1}/${mainQuestions.length}: ${mainQuestions[i].substring(0, 60)}...`)
      
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Answer this question in 200-300 words with specific local details for ${cityData.city}, ${cityData.state_code}:

"${mainQuestions[i]}"

Include:
- Specific neighborhoods: ${neighborhoods.slice(0, 4).join(', ')}
- Local pricing ($295-$695 range)
- Actual permit requirements for ${cityData.city}
- Container sizes (10-40 yards)
- Phone number: (866) 858-3867
- Local landmarks or areas

Write conversationally and be helpful. Include real ${cityData.city} context.`
          }]
        })

        const answer = response.content[0].type === 'text' ? response.content[0].text : ''
        mainAnswers.push({ question: mainQuestions[i], answer })
        
      } catch (error) {
        console.error(`Error generating answer ${i + 1}:`, error)
        mainAnswers.push({ 
          question: mainQuestions[i],
          answer: `Contact us at (866) 858-3867 for information about ${mainQuestions[i]}`
        })
      }
    }

    const mainWords = mainAnswers.reduce((sum, qa) => sum + qa.answer.split(' ').length, 0)
    console.log(`✅ Main page: ${mainWords.toLocaleString()} words`)

    // Generate schema
    const schema = this.generateSchema(cityData, neighborhoods, mainAnswers)

    const mainHtmlContent = this.buildMainPage(cityData, neighborhoods, mainAnswers, schema)

    // Generate neighborhood pages
    console.log(`\n🏘️  Generating ${neighborhoods.length} neighborhood pages...`)
    const neighborhoodPages = []

    for (const neighborhood of neighborhoods) {
      const neighborhoodQuestions = [
        `What's the best dumpster rental service in ${neighborhood}, ${cityData.state_code}?`,
        `How much does dumpster rental cost in ${neighborhood}?`,
        `Do I need a permit for a dumpster in ${neighborhood}?`,
        `What size dumpsters are available in ${neighborhood}?`,
        `How quickly can I get a dumpster delivered to ${neighborhood}?`,
        `What areas of ${neighborhood} do you serve?`
      ]

      const neighborhoodAnswers: Array<{question: string, answer: string}> = []

      for (const question of neighborhoodQuestions) {
        try {
          const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 800,
            messages: [{
              role: 'user',
              content: `Answer this question in 150-200 words for ${neighborhood}, near ${cityData.city}, ${cityData.state_code}:

"${question}"

Include local ${neighborhood} context, pricing, and call (866) 858-3867.`
            }]
          })

          const answer = response.content[0].type === 'text' ? response.content[0].text : ''
          neighborhoodAnswers.push({ question, answer })
        } catch (error) {
          neighborhoodAnswers.push({ 
            question,
            answer: `Call (866) 858-3867 for ${neighborhood} dumpster rental information.`
          })
        }
      }

      const neighborhoodWords = neighborhoodAnswers.reduce((sum, qa) => sum + qa.answer.split(' ').length, 0)
      console.log(`   ✅ ${neighborhood}: ${neighborhoodWords} words`)

      neighborhoodPages.push({
        title: `Dumpster Rental ${neighborhood} ${cityData.state_code}`,
        slug: `dumpster-rental-${neighborhood.toLowerCase().replace(/\s+/g, '-')}-${cityData.state_code.toLowerCase()}`,
        htmlContent: this.buildNeighborhoodPage(cityData, neighborhood, neighborhoods, neighborhoodAnswers),
        metaDescription: `Dumpster rental in ${neighborhood}, ${cityData.state_code}. Fast delivery, competitive pricing. Call (866) 858-3867.`
      })
    }

    const totalWords = mainWords + neighborhoodPages.reduce((sum, page) => {
      const content = page.htmlContent.replace(/<[^>]*>/g, '')
      return sum + content.split(' ').length
    }, 0)

    console.log(`\n📊 Content Generation Complete:`)
    console.log(`   📄 Total pages: ${1 + neighborhoods.length}`)
    console.log(`   📝 Total words: ${totalWords.toLocaleString()}`)
    console.log(`   🏠 Main page: ${mainWords.toLocaleString()} words`)
    console.log(`   🏘️  Neighborhood pages: ${neighborhoodPages.length}`)

    return {
      mainCityPage: {
        title: `Dumpster Rental ${cityData.city} ${cityData.state_code} | Ultimate Dumpsters`,
        slug: cityData.slug,
        htmlContent: mainHtmlContent,
        metaDescription: `Professional dumpster rental in ${cityData.city}, ${cityData.state_code}. Serving ${neighborhoods.slice(0, 4).join(', ')} & more. Same-day delivery available. Call (866) 858-3867.`
      },
      neighborhoodPages
    }
  }

  private buildMainPage(cityData: any, neighborhoods: string[], answers: Array<{question: string, answer: string}>, schema: any): string {
    // Table of contents
    const tocItems = [
      { id: 'residential', title: '🏠 Residential Services', icon: '🏠' },
      { id: 'commercial', title: '🏢 Commercial Services', icon: '🏢' },
      { id: 'construction', title: '🏗️ Construction Services', icon: '🏗️' },
      { id: 'pricing', title: '💰 Pricing Guide', icon: '💰' },
      { id: 'sizes', title: '📏 Size Guide', icon: '📏' },
      { id: 'how-it-works', title: '⚙️ How It Works', icon: '⚙️' },
      { id: 'neighborhoods', title: '📍 Service Areas', icon: '📍' },
      { id: 'faq', title: '❓ FAQ', icon: '❓' }
    ]

    return `
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>

<!-- THIS IS A COMPLETE, SEO-OPTIMIZED PAGE -->

<div class="city-landing-premium">
  
  <!-- Breadcrumbs -->
  <nav class="breadcrumbs">
    <a href="https://ultimatedumpsters.com">Home</a>
    <span>›</span>
    <a href="https://ultimatedumpsters.com/service-areas">Service Areas</a>
    <span>›</span>
    <span>${cityData.city}, ${cityData.state_code}</span>
  </nav>

  <!-- Hero Section -->
  <div class="hero-premium">
    <div class="hero-content">
      <h1>Dumpster Rental in ${cityData.city}, ${cityData.state_code}</h1>
      <p class="hero-subtitle">Professional waste management for residential, commercial, and construction projects</p>
      
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <strong>4.9/5 Rating</strong>
            <span>1,200+ Reviews</span>
          </div>
        </div>
        <div class="stat">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <strong>15+ Years</strong>
            <span>In Business</span>
          </div>
        </div>
        <div class="stat">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <strong>Same-Day</strong>
            <span>Delivery Available</span>
          </div>
        </div>
      </div>
      
      <div class="hero-cta">
        <a href="tel:8668583867" class="cta-primary">
          📞 Call (866) 858-3867
        </a>
        <a href="#pricing" class="cta-secondary">
          View Pricing
        </a>
      </div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc-container">
    <h2>Quick Navigation</h2>
    <div class="toc-grid">
      ${tocItems.map(item => `
        <a href="#${item.id}" class="toc-item">
          <span class="toc-icon">${item.icon}</span>
          <span>${item.title}</span>
        </a>
      `).join('')}
    </div>
  </div>

  <!-- Service Areas Grid -->
  <div id="neighborhoods" class="section">
    <h2>🗺️ Areas We Serve in ${cityData.city}</h2>
    <p class="section-intro">Fast, reliable dumpster rental across all ${cityData.city} neighborhoods</p>
    <div class="neighborhoods-grid">
      ${neighborhoods.map(n => `
        <a href="/dumpster-rental-${n.toLowerCase().replace(/\s+/g, '-')}-${cityData.state_code.toLowerCase()}" class="neighborhood-card">
          <div class="neighborhood-icon">📍</div>
          <h3>${n}</h3>
          <p>Same-day delivery available</p>
        </a>
      `).join('')}
    </div>
  </div>

  <!-- Pricing Table -->
  <div id="pricing" class="section pricing-section">
    <h2>💰 Transparent Pricing for ${cityData.city}</h2>
    <p class="section-intro">No hidden fees. No surprises. Just honest pricing.</p>
    
    <div class="pricing-table">
      <div class="pricing-card">
        <div class="pricing-size">10 Yard</div>
        <div class="pricing-price">$295</div>
        <ul class="pricing-features">
          <li>✓ Perfect for bathroom remodels</li>
          <li>✓ Small cleanouts</li>
          <li>✓ Garage cleanouts</li>
          <li>✓ 3-day rental period</li>
          <li>✓ 2-ton weight limit</li>
        </ul>
        <a href="tel:8668583867" class="pricing-cta">Order Now</a>
      </div>
      
      <div class="pricing-card featured">
        <div class="pricing-badge">Most Popular</div>
        <div class="pricing-size">20 Yard</div>
        <div class="pricing-price">$395</div>
        <ul class="pricing-features">
          <li>✓ Kitchen remodels</li>
          <li>✓ Deck removal</li>
          <li>✓ Medium renovations</li>
          <li>✓ 7-day rental period</li>
          <li>✓ 3-ton weight limit</li>
        </ul>
        <a href="tel:8668583867" class="pricing-cta">Order Now</a>
      </div>
      
      <div class="pricing-card">
        <div class="pricing-size">30 Yard</div>
        <div class="pricing-price">$495</div>
        <ul class="pricing-features">
          <li>✓ Major renovations</li>
          <li>✓ New construction</li>
          <li>✓ Large cleanouts</li>
          <li>✓ 7-day rental period</li>
          <li>✓ 4-ton weight limit</li>
        </ul>
        <a href="tel:8668583867" class="pricing-cta">Order Now</a>
      </div>
      
      <div class="pricing-card">
        <div class="pricing-size">40 Yard</div>
        <div class="pricing-price">$695</div>
        <ul class="pricing-features">
          <li>✓ Commercial projects</li>
          <li>✓ Major construction</li>
          <li>✓ Large demolitions</li>
          <li>✓ 14-day rental period</li>
          <li>✓ 5-ton weight limit</li>
        </ul>
        <a href="tel:8668583867" class="pricing-cta">Order Now</a>
      </div>
    </div>
  </div>

  <!-- How It Works -->
  <div id="how-it-works" class="section how-it-works">
    <h2>⚙️ How It Works</h2>
    <p class="section-intro">Get your dumpster in 3 easy steps</p>
    
    <div class="steps-grid">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Call or Order Online</h3>
        <p>Contact us at (866) 858-3867 or place your order online. Tell us your project details and we'll recommend the perfect size.</p>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <h3>Fast Delivery</h3>
        <p>We'll deliver your dumpster to your ${cityData.city} location at your scheduled time. Same-day delivery available for most areas.</p>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <h3>We Pick It Up</h3>
        <p>When you're done, give us a call and we'll pick up the dumpster and handle all disposal. It's that simple.</p>
      </div>
    </div>
  </div>

  <!-- Size Guide -->
  <div id="sizes" class="section size-guide">
    <h2>📏 Dumpster Size Guide</h2>
    <p class="section-intro">Choose the right size for your ${cityData.city} project</p>
    
    <div class="size-comparison">
      <div class="size-item">
        <h3>10 Yard Dumpster</h3>
        <div class="size-visual">🗑️</div>
        <p><strong>Dimensions:</strong> 12' L × 8' W × 3.5' H</p>
        <p><strong>Holds:</strong> ~3 pickup truck loads</p>
        <p><strong>Best for:</strong> Small cleanouts, bathroom remodels, minor debris</p>
      </div>
      
      <div class="size-item">
        <h3>20 Yard Dumpster</h3>
        <div class="size-visual">🗑️🗑️</div>
        <p><strong>Dimensions:</strong> 22' L × 8' W × 4.5' H</p>
        <p><strong>Holds:</strong> ~6 pickup truck loads</p>
        <p><strong>Best for:</strong> Kitchen remodels, deck removal, medium renovations</p>
      </div>
      
      <div class="size-item">
        <h3>30 Yard Dumpster</h3>
        <div class="size-visual">🗑️🗑️🗑️</div>
        <p><strong>Dimensions:</strong> 22' L × 8' W × 6' H</p>
        <p><strong>Holds:</strong> ~9 pickup truck loads</p>
        <p><strong>Best for:</strong> Major renovations, new construction, large cleanouts</p>
      </div>
      
      <div class="size-item">
        <h3>40 Yard Dumpster</h3>
        <div class="size-visual">🗑️🗑️🗑️🗑️</div>
        <p><strong>Dimensions:</strong> 22' L × 8' W × 8' H</p>
        <p><strong>Holds:</strong> ~12 pickup truck loads</p>
        <p><strong>Best for:</strong> Commercial projects, major construction, demolitions</p>
      </div>
    </div>
  </div>

  <!-- FAQ Section - Residential -->
  <div id="residential" class="section faq-section">
    <h2>🏠 Residential Dumpster Rental in ${cityData.city}</h2>
    <div class="faq-grid">
      ${answers.slice(0, 7).map(qa => `
        <div class="faq-item">
          <h3 class="faq-question">${qa.question}</h3>
          <div class="faq-answer">${qa.answer.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- FAQ Section - Commercial -->
  <div id="commercial" class="section faq-section">
    <h2>🏢 Commercial Dumpster Services in ${cityData.city}</h2>
    <div class="faq-grid">
      ${answers.slice(7, 13).map(qa => `
        <div class="faq-item">
          <h3 class="faq-question">${qa.question}</h3>
          <div class="faq-answer">${qa.answer.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- FAQ Section - Construction -->
  <div id="construction" class="section faq-section">
    <h2>🏗️ Construction Dumpster Rental in ${cityData.city}</h2>
    <div class="faq-grid">
      ${answers.slice(13, 19).map(qa => `
        <div class="faq-item">
          <h3 class="faq-question">${qa.question}</h3>
          <div class="faq-answer">${qa.answer.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- FAQ Section - Pricing -->
  <div id="faq" class="section faq-section">
    <h2>💰 Pricing & Logistics in ${cityData.city}</h2>
    <div class="faq-grid">
      ${answers.slice(19, 25).map(qa => `
        <div class="faq-item">
          <h3 class="faq-question">${qa.question}</h3>
          <div class="faq-answer">${qa.answer.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Final CTA -->
  <div class="final-cta">
    <h2>Ready to Rent a Dumpster in ${cityData.city}?</h2>
    <p>Get your free quote today. Same-day delivery available.</p>
    <a href="tel:8668583867" class="cta-button-large">
      📞 Call (866) 858-3867
    </a>
    <p class="cta-subtext">Or <a href="https://ultimatedumpsters.com/contact-us">request a quote online</a></p>
  </div>

</div>
`
  }

  private buildNeighborhoodPage(cityData: any, neighborhood: string, allNeighborhoods: string[], answers: Array<{question: string, answer: string}>): string {
    return `
<div class="city-landing-premium">
  
  <!-- Breadcrumbs -->
  <nav class="breadcrumbs">
    <a href="https://ultimatedumpsters.com">Home</a>
    <span>›</span>
    <a href="https://ultimatedumpsters.com/service-areas">Service Areas</a>
    <span>›</span>
    <a href="/dumpster-rental-${cityData.city.toLowerCase()}-${cityData.state_code.toLowerCase()}">${cityData.city}, ${cityData.state_code}</a>
    <span>›</span>
    <span>${neighborhood}</span>
  </nav>

  <!-- Hero Section -->
  <div class="hero-premium neighborhood-hero">
    <div class="hero-content">
      <h1>Dumpster Rental in ${neighborhood}, ${cityData.state_code}</h1>
      <p class="hero-subtitle">Professional waste management serving ${neighborhood} residents and businesses</p>
      
      <div class="hero-cta">
        <a href="tel:8668583867" class="cta-primary">
          📞 Call (866) 858-3867
        </a>
        <a href="/dumpster-rental-${cityData.city.toLowerCase()}-${cityData.state_code.toLowerCase()}" class="cta-secondary">
          ← Back to ${cityData.city}
        </a>
      </div>
    </div>
  </div>

  <!-- FAQ Section -->
  <div class="section faq-section">
    <h2>Your ${neighborhood} Dumpster Rental Questions Answered</h2>
    <div class="faq-grid">
      ${answers.map(qa => `
        <div class="faq-item">
          <h3 class="faq-question">${qa.question}</h3>
          <div class="faq-answer">${qa.answer.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Other Neighborhoods -->
  <div class="section">
    <h2>Other ${cityData.city} Area Neighborhoods We Serve</h2>
    <div class="neighborhoods-grid">
      ${allNeighborhoods.filter(n => n !== neighborhood).map(n => `
        <a href="/dumpster-rental-${n.toLowerCase().replace(/\s+/g, '-')}-${cityData.state_code.toLowerCase()}" class="neighborhood-card">
          <div class="neighborhood-icon">📍</div>
          <h3>${n}</h3>
          <p>Learn more</p>
        </a>
      `).join('')}
    </div>
  </div>

  <!-- CTA -->
  <div class="final-cta">
    <h2>Need a Dumpster in ${neighborhood}?</h2>
    <p>Fast delivery to your ${neighborhood} location</p>
    <a href="tel:8668583867" class="cta-button-large">
      📞 Call (866) 858-3867
    </a>
  </div>

</div>
`
  }
}