import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

interface Question {
  question: string
  category?: string
}

interface PageContent {
  title: string
  slug: string
  questions: Question[]
  metaDescription: string
  wordCount: number
  htmlContent: string
  faqSchema: any
  serviceSchema: any
  localBusinessSchema: any
  organizationSchema: any
}

interface GeneratedContent {
  mainCityPage: PageContent
  topicPages: {
    residential: PageContent
    commercial: PageContent
    construction: PageContent
    roofing: PageContent
  }
  neighborhoodPages: PageContent[]
  totalPages: number
  totalWordCount: number
}

export async function generateContent(
  hubAndSpoke: any,
  cityData: any,
  localData: any
): Promise<GeneratedContent> {
  console.log(`🎨 Starting content generation...`)

  const mainPage = await generateMainCityPage(
    hubAndSpoke.mainCityPage,
    cityData,
    localData
  )

  const residentialPage = await generateTopicPage(
    hubAndSpoke.topicPages.residential,
    cityData,
    localData,
    'residential'
  )

  const commercialPage = await generateTopicPage(
    hubAndSpoke.topicPages.commercial,
    cityData,
    localData,
    'commercial'
  )

  const constructionPage = await generateTopicPage(
    hubAndSpoke.topicPages.construction,
    cityData,
    localData,
    'construction'
  )

  const roofingPage = await generateTopicPage(
    hubAndSpoke.topicPages.roofing,
    cityData,
    localData,
    'roofing'
  )

  const neighborhoodPages: PageContent[] = []
  for (const neighborhoodPage of hubAndSpoke.neighborhoodPages) {
    const page = await generateNeighborhoodPage(
      neighborhoodPage,
      cityData,
      localData
    )
    neighborhoodPages.push(page)
  }

  const totalWordCount = 
    mainPage.wordCount +
    residentialPage.wordCount +
    commercialPage.wordCount +
    constructionPage.wordCount +
    roofingPage.wordCount +
    neighborhoodPages.reduce((sum, page) => sum + page.wordCount, 0)

  console.log(`\n📊 Content Generation Summary:`)
  console.log(`   📄 Total pages: ${1 + 4 + neighborhoodPages.length}`)
  console.log(`   📝 Total words: ${totalWordCount.toLocaleString()}`)

  return {
    mainCityPage: mainPage,
    topicPages: {
      residential: residentialPage,
      commercial: commercialPage,
      construction: constructionPage,
      roofing: roofingPage
    },
    neighborhoodPages,
    totalPages: 1 + 4 + neighborhoodPages.length,
    totalWordCount
  }
}

async function generateMainCityPage(
  pageData: any,
  cityData: any,
  localData: any
): Promise<PageContent> {
  console.log(`📄 Generating: ${pageData.title}`)

  const answers = await generateAnswersWithEnhancements(
    pageData.questions,
    cityData,
    localData,
    'main'
  )

  const htmlContent = buildMainPageHTML(
    pageData.title,
    answers,
    cityData,
    localData
  )

  const faqSchema = buildFAQSchema(pageData.questions, answers)
  const serviceSchema = buildServiceSchema(cityData)
  const localBusinessSchema = buildLocalBusinessSchema(cityData)
  const organizationSchema = buildOrganizationSchema()

  const wordCount = answers.reduce((sum, answer) => sum + countWords(answer.answer), 0)

  return {
    title: pageData.title,
    slug: pageData.slug,
    questions: pageData.questions,
    metaDescription: `${cityData.city} dumpster rental $295+. Same-day delivery. 4.9★ (1200+ reviews). Call (866) 858-3867 for free quote.`,
    wordCount,
    htmlContent,
    faqSchema,
    serviceSchema,
    localBusinessSchema,
    organizationSchema
  }
}

async function generateTopicPage(
  pageData: any,
  cityData: any,
  localData: any,
  topic: string
): Promise<PageContent> {
  console.log(`📄 Generating: ${pageData.title}`)

  const answers = await generateAnswersWithEnhancements(
    pageData.questions,
    cityData,
    localData,
    topic
  )

  const htmlContent = buildTopicPageHTML(
    pageData.title,
    answers,
    cityData,
    localData,
    topic
  )

  const faqSchema = buildFAQSchema(pageData.questions, answers)
  const serviceSchema = buildServiceSchema(cityData, topic)
  const localBusinessSchema = buildLocalBusinessSchema(cityData)
  const organizationSchema = buildOrganizationSchema()

  const wordCount = answers.reduce((sum, answer) => sum + countWords(answer.answer), 0)

  const metaDescriptions: { [key: string]: string } = {
    residential: `${cityData.city} residential dumpster rental. 4.9★ rated. $295+. Call (866) 858-3867 for same-day delivery.`,
    commercial: `${cityData.city} commercial dumpster rental. Licensed & insured. 4.9★. Call (866) 858-3867 today.`,
    construction: `${cityData.city} construction dumpster rental. Heavy-duty containers. 4.9★. Call (866) 858-3867.`,
    roofing: `${cityData.city} roofing dumpster rental. Shingle disposal experts. 4.9★. Call (866) 858-3867.`
  }

  return {
    title: pageData.title,
    slug: pageData.slug,
    questions: pageData.questions,
    metaDescription: metaDescriptions[topic],
    wordCount,
    htmlContent,
    faqSchema,
    serviceSchema,
    localBusinessSchema,
    organizationSchema
  }
}

async function generateNeighborhoodPage(
  pageData: any,
  cityData: any,
  localData: any
): Promise<PageContent> {
  console.log(`📄 Generating: ${pageData.title}`)

  const answers = await generateAnswersWithEnhancements(
    pageData.questions,
    cityData,
    localData,
    'neighborhood'
  )

  const htmlContent = buildNeighborhoodPageHTML(
    pageData.title,
    answers,
    cityData,
    localData,
    pageData.neighborhood
  )

  const faqSchema = buildFAQSchema(pageData.questions, answers)
  const serviceSchema = buildServiceSchema(cityData)
  const localBusinessSchema = buildLocalBusinessSchema(cityData)
  const organizationSchema = buildOrganizationSchema()

  const wordCount = answers.reduce((sum, answer) => sum + countWords(answer.answer), 0)

  return {
    title: pageData.title,
    slug: pageData.slug,
    questions: pageData.questions,
    metaDescription: `Dumpster rental in ${pageData.neighborhood}, ${cityData.city}. Same-day delivery. 4.9★. Call (866) 858-3867.`,
    wordCount,
    htmlContent,
    faqSchema,
    serviceSchema,
    localBusinessSchema,
    organizationSchema
  }
}

async function generateAnswersWithEnhancements(
  questions: Question[],
  cityData: any,
  localData: any,
  pageType: string
): Promise<Array<{ 
    question: string
    answer: string
    realResult?: string
    takeaway?: string
    category?: string 
  }>> {
  const batchSize = 5
  const allAnswers: Array<{ 
    question: string
    answer: string
    realResult?: string
    takeaway?: string
    category?: string 
  }> = []

  console.log(`📝 Generating ${questions.length} enhanced answers...`)

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    const isFirstBatch = i === 0
    
    const prompt = buildEnhancedPrompt(batch, cityData, localData, pageType, isFirstBatch)
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const answers = parseEnhancedAnswers(content, batch, isFirstBatch)
    
    allAnswers.push(...answers)
    console.log(`   ✅ Generated ${allAnswers.length}/${questions.length} answers`)
  }

  return allAnswers
}

function buildEnhancedPrompt(
  questions: Question[],
  cityData: any,
  localData: any,
  pageType: string,
  isFirstBatch: boolean
): string {
  return `You are writing ELITE SEO content for Ultimate Dumpsters, targeting 90+/100 SEO scores and first-page rankings in both Google and AI search engines (ChatGPT, Claude, Perplexity).

CITY CONTEXT:
- City: ${cityData.city}, ${cityData.state_code}
- County: ${cityData.county}
- Population: ${cityData.population?.toLocaleString()}
- Main Streets: ${localData.main_streets?.join(', ') || 'Main Street'}
- Landmarks: ${localData.landmarks?.join(', ') || 'Downtown'}
- Permit Cost: $45 from ${cityData.city} Code Enforcement

COMPANY CREDENTIALS (Ultimate Dumpsters):
- 15+ years in business
- 100,000+ customers served nationwide
- 4.9 star rating (1,200+ verified reviews)
- Family owned and operated
- Licensed and insured in all 50 states
- Phone: (866) 858-3867

CRITICAL INSTRUCTIONS FOR 90+/100 SEO & GEO SCORES:

1. **FEATURED SNIPPET OPTIMIZATION**
   - First paragraph: Direct, complete answer (40-60 words)
   - Start with the exact question being answered
   - Include specific numbers, prices, timeframes
   - Format for voice search compatibility

2. **AI SEARCH ENGINE OPTIMIZATION (GEO)**
   - Write conversationally as if talking to a friend
   - Use "you'll need", "here's what", "the best approach is" phrasing
   - Include practical examples from ${cityData.city}
   - Answer follow-up questions naturally within content
   - Provide step-by-step guidance where applicable

3. **UNIQUENESS & LOCAL SPECIFICITY**
   - Every answer MUST include 3+ ${cityData.city}-specific details
   - Reference actual streets: "${localData.main_streets?.[0] || 'Main Street'}"
   - Mention local landmarks: "${localData.landmarks?.[0] || 'downtown'}"
   - Include local permit process ($45 from ${cityData.city} Code Enforcement)
   - Reference neighborhood characteristics (narrow streets, HOAs, parking)

4. **ANSWER STRUCTURE** (300-600 words each):
   - **Paragraph 1** (Featured Snippet): Direct answer with key facts (40-60 words)
   - **Paragraph 2-3**: Detailed explanation with ${cityData.city} examples
   - **Paragraph 4**: Practical tips and local insights
   - **Paragraph 5**: Common scenarios in ${cityData.city}
   - Use short paragraphs (2-4 sentences max) for scannability

5. **E-E-A-T SIGNALS**:
   - Reference 15+ years of experience naturally
   - Mention "we've helped 100,000+ customers"
   - Include specific ${cityData.city} project examples
   - Show expertise through detailed technical knowledge
   - Build trust with transparent pricing

6. **PRICING TRANSPARENCY** (Include naturally in answers):
   - 10-yard: $295-$395
   - 20-yard: $395-$495 (most popular for home projects)
   - 30-yard: $495-$595
   - 40-yard: $595-$695
   - Note: 7-day rental included, delivery + pickup + disposal

7. **EXTERNAL AUTHORITY LINKS** (1-2 per answer where relevant):
   - ${cityData.city} government: permits, codes, regulations
   - EPA guidelines: waste disposal, environmental standards
   - State environmental agencies
   - Format: [Link: https://example.gov]

8. **CONVERSION OPTIMIZATION**:
   - Naturally mention calling (866) 858-3867 for quotes
   - Reference same-day delivery when you call before noon
   - Mention free site assessments
   - Include "we can help you determine the right size" type language

${isFirstBatch ? `9. **FIRST ANSWER ONLY - ADD REAL RESULT & TAKEAWAY**:
   After the first answer, provide:
   
   REAL RESULT:
   [Write a specific, believable success story about helping a ${cityData.city} customer. Include actual project type, street/area mention if possible, specific problem solved, and positive outcome. Make it feel authentic and detailed. 2-3 sentences.]
   
   TAKEAWAY:
   [Write one actionable piece of advice specific to ${cityData.city} customers. Be direct and helpful. Make it memorable. 1 sentence.]
` : ''}

QUESTIONS TO ANSWER:
${questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

ANSWER 1:
[Your detailed 300-600 word answer optimized for featured snippets and AI search]
[Link: https://example.gov] (if relevant)

${isFirstBatch ? `REAL RESULT 1:
[Your specific ${cityData.city} success story - 2-3 sentences]

TAKEAWAY 1:
[Your actionable ${cityData.city}-specific advice - 1 sentence]

` : ''}ANSWER 2:
[Your detailed 300-600 word answer]
[Link: https://example.gov] (if relevant)

Continue for all ${questions.length} questions.

Remember: We're targeting 90+/100 SEO scores and top rankings in both traditional search AND AI search engines. Every word must be useful, unique, and optimized. Quality over everything.`
}

function parseEnhancedAnswers(
  content: string,
  questions: Question[],
  isFirstBatch: boolean
): Array<{ 
    question: string
    answer: string
    realResult?: string
    takeaway?: string
    category?: string 
  }> {
  const answers: Array<{ 
    question: string
    answer: string
    realResult?: string
    takeaway?: string
    category?: string 
  }> = []

  const sections = content.split(/ANSWER \d+:/i).filter(s => s.trim())

  for (let i = 0; i < questions.length && i < sections.length; i++) {
    const section = sections[i]
    
    const realResultMatch = section.match(/REAL RESULT \d+:(.*?)(?=TAKEAWAY|$)/is)
    const takeawayMatch = section.match(/TAKEAWAY \d+:(.*?)(?=ANSWER|$)/is)
    
    let answer = section
    if (realResultMatch) {
      answer = section.substring(0, section.indexOf('REAL RESULT'))
    }
    
    answer = answer.trim()
    
    const result: any = {
      question: questions[i].question,
      answer: answer,
      category: questions[i].category
    }

    if (isFirstBatch && i === 0) {
      if (realResultMatch) {
        result.realResult = realResultMatch[1].trim()
      }
      if (takeawayMatch) {
        result.takeaway = takeawayMatch[1].trim()
      }
    }

    answers.push(result)
  }

  return answers
}

function buildMainPageHTML(
  title: string,
  answers: Array<{ question: string; answer: string; realResult?: string; takeaway?: string }>,
  cityData: any,
  localData: any
): string {
  const city = cityData.city
  const state = cityData.state_code

  return `<article class="dumpster-rental-content">
  <header class="page-header">
    <h1>${title}</h1>
    <div class="header-meta">
      <span class="rating">⭐ 4.9 Rating (1,200+ Reviews)</span>
      <span class="cta-phone">📞 <a href="tel:8668583867">(866) 858-3867</a></span>
    </div>
  </header>
  
  <section class="intro-section">
    <p>Welcome to your complete guide for dumpster rentals in ${city}, ${state}. Whether you're a homeowner tackling a renovation, a contractor managing a construction site, or a business owner handling commercial waste, we've answered every question you might have about renting a dumpster in ${city}.</p>
  </section>

  ${buildHeroCTA(city)}
  
  ${buildQuickAnswerBox(city, state)}
  
  ${buildPricingCards(city)}
  
  ${buildTableOfContents(answers)}
  
  <section class="faq-content">
    ${buildSectionizedFAQsWithCTAs(answers, city, state)}
  </section>
  
  ${buildServiceComparisonTable(city)}
  
  ${buildCTABanner(city, 'middle')}
  
  ${buildCostFactorsTable(city)}
  
  ${buildPreparationChecklist(city)}
  
  ${buildQuickSummary(city)}
  
  ${buildFinalCTA(city)}
</article>`
}

function buildTopicPageHTML(
  title: string,
  answers: Array<{ question: string; answer: string; realResult?: string; takeaway?: string }>,
  cityData: any,
  localData: any,
  topic: string
): string {
  const city = cityData.city
  const state = cityData.state_code

  return `<article class="dumpster-rental-content">
  <header class="page-header">
    <h1>${title}</h1>
    <div class="header-meta">
      <span class="rating">⭐ 4.9 Rating</span>
      <span class="cta-phone">📞 <a href="tel:8668583867">(866) 858-3867</a></span>
    </div>
  </header>
  
  <section class="intro-section">
    <p>Your complete guide for ${topic} dumpster rentals in ${city}, ${state}. Expert advice, transparent pricing, and same-day delivery available.</p>
  </section>

  ${buildHeroCTA(city)}
  
  ${buildTableOfContents(answers)}
  
  <section class="faq-content">
    ${buildSectionizedFAQsWithCTAs(answers, city, state)}
  </section>
  
  ${buildFinalCTA(city)}
</article>`
}

function buildNeighborhoodPageHTML(
  title: string,
  answers: Array<{ question: string; answer: string; realResult?: string; takeaway?: string }>,
  cityData: any,
  localData: any,
  neighborhood: string
): string {
  const city = cityData.city

  return `<article class="dumpster-rental-content">
  <header class="page-header">
    <h1>${title}</h1>
    <div class="header-meta">
      <span class="rating">⭐ 4.9 Rating</span>
      <span class="cta-phone">📞 <a href="tel:8668583867">(866) 858-3867</a></span>
    </div>
  </header>
  
  <section class="intro-section">
    <p>Professional dumpster rental service in ${neighborhood}, ${city}. We understand the unique needs of this neighborhood and provide reliable, affordable solutions.</p>
  </section>

  ${buildHeroCTA(city)}
  
  ${buildTableOfContents(answers)}
  
  <section class="faq-content">
    ${buildSectionizedFAQsWithCTAs(answers, city, city)}
  </section>
  
  ${buildFinalCTA(city)}
</article>`
}

function buildHeroCTA(city: string): string {
  return `<div class="hero-cta">
  <div class="hero-cta-content">
    <h2>Get Your Free Quote Today</h2>
    <p>Same-day delivery available in ${city} when you call before noon</p>
    <div class="cta-buttons">
      <a href="tel:8668583867" class="cta-button cta-primary">
        <span class="cta-icon">📞</span>
        Call (866) 858-3867
      </a>
      <a href="tel:8668583867" class="cta-button cta-secondary">
        Get Free Quote
      </a>
    </div>
    <p class="cta-assurance">✓ No Credit Card Required  ✓ Free Site Assessment  ✓ Same-Day Delivery</p>
  </div>
</div>`
}

function buildCTABanner(city: string, position: string): string {
  return `<aside class="cta-banner cta-${position}">
  <div class="cta-banner-content">
    <div class="cta-banner-text">
      <h3>Need a Dumpster in ${city}?</h3>
      <p>Get your free quote in under 2 minutes. Same-day delivery available.</p>
    </div>
    <a href="tel:8668583867" class="cta-button cta-primary">
      📞 Call (866) 858-3867
    </a>
  </div>
</aside>`
}

function buildInlineCTA(index: number, city: string): string {
  const ctas = [
    {
      title: "Ready to Order Your Dumpster?",
      text: `Call us at (866) 858-3867 for same-day delivery in ${city}.`,
      button: "Get Free Quote"
    },
    {
      title: "Have Questions About Sizing?",
      text: "Our experts can help you choose the perfect dumpster for your project.",
      button: "Call (866) 858-3867"
    },
    {
      title: "Need Fast Delivery?",
      text: `Same-day dumpster delivery available in ${city} - call before noon.`,
      button: "Check Availability"
    }
  ]
  
  const cta = ctas[index % ctas.length]
  
  return `<aside class="inline-cta">
  <div class="inline-cta-content">
    <h4>${cta.title}</h4>
    <p>${cta.text}</p>
    <a href="tel:8668583867" class="cta-button cta-secondary">${cta.button}</a>
  </div>
</aside>`
}

function buildQuickAnswerBox(city: string, state: string): string {
  return `<div class="quick-answer-box">
  <h3>Quick Answer</h3>
  <p><strong>For most ${city} home renovations, a 20-yard dumpster ($395-$495) works best.</strong> Need street placement? Budget $45 for ${city} city permit. We deliver same-day when you call before noon at <a href="tel:8668583867">(866) 858-3867</a>.</p>
  <div class="quick-facts">
    <span>⭐ 4.9/5 Rating</span>
    <span>🏆 15+ Years</span>
    <span>✅ Licensed & Insured</span>
  </div>
</div>`
}

function buildPricingCards(city: string): string {
  return `<section class="pricing-cards">
  <h2>Dumpster Rental Pricing in ${city}</h2>
  <div class="cards-grid">
    <div class="pricing-card">
      <div class="card-header">
        <h3>10 Yard</h3>
        <div class="price">$295-$395</div>
      </div>
      <div class="card-body">
        <p class="card-desc">Perfect for small projects</p>
        <ul class="card-features">
          <li>✓ Bathroom remodels</li>
          <li>✓ Small cleanouts</li>
          <li>✓ 12' L × 8' W × 4' H</li>
        </ul>
      </div>
      <a href="tel:8668583867" class="card-cta">Get Quote</a>
    </div>
    
    <div class="pricing-card featured">
      <div class="badge">Most Popular</div>
      <div class="card-header">
        <h3>20 Yard</h3>
        <div class="price">$395-$495</div>
      </div>
      <div class="card-body">
        <p class="card-desc">Ideal for home renovations</p>
        <ul class="card-features">
          <li>✓ Kitchen remodels</li>
          <li>✓ Garage cleanouts</li>
          <li>✓ 22' L × 8' W × 4' H</li>
        </ul>
      </div>
      <a href="tel:8668583867" class="card-cta">Get Quote</a>
    </div>
    
    <div class="pricing-card">
      <div class="card-header">
        <h3>30 Yard</h3>
        <div class="price">$495-$595</div>
      </div>
      <div class="card-body">
        <p class="card-desc">Large renovation projects</p>
        <ul class="card-features">
          <li>✓ Whole house cleanouts</li>
          <li>✓ Large renovations</li>
          <li>✓ 22' L × 8' W × 6' H</li>
        </ul>
      </div>
      <a href="tel:8668583867" class="card-cta">Get Quote</a>
    </div>
    
    <div class="pricing-card">
      <div class="card-header">
        <h3>40 Yard</h3>
        <div class="price">$595-$695</div>
      </div>
      <div class="card-body">
        <p class="card-desc">Commercial & construction</p>
        <ul class="card-features">
          <li>✓ New construction</li>
          <li>✓ Commercial projects</li>
          <li>✓ 22' L × 8' W × 8' H</li>
        </ul>
      </div>
      <a href="tel:8668583867" class="card-cta">Get Quote</a>
    </div>
  </div>
  <p class="pricing-note">All prices include 7-day rental, delivery, pickup, and disposal. Street permits ($45) billed separately.</p>
</section>`
}

function buildTableOfContents(answers: Array<{ question: string; answer: string }>): string {
  return `<nav class="table-of-contents">
  <h2>Quick Navigation</h2>
  <ul>
    ${answers.map((item, index) => `<li><a href="#question-${index + 1}">${item.question}</a></li>`).join('\n    ')}
  </ul>
</nav>`
}

function buildSectionizedFAQsWithCTAs(
  answers: Array<{ question: string; answer: string; realResult?: string; takeaway?: string }>,
  city: string,
  state: string
): string {
  let html = `<div class="faq-section">
  <h2 class="section-header">Understanding Dumpster Rental in ${city}</h2>\n\n`

  answers.forEach((item, index) => {
    html += `  <div class="faq-item" id="question-${index + 1}">
    <h3>${item.question}</h3>
    ${formatAnswerWithLinks(item.answer)}
    ${item.realResult ? buildRealResultsBox(item.realResult) : ''}
    ${item.takeaway ? buildTakeawayBox(item.takeaway) : ''}
  </div>\n\n`

    // Add CTA after every 4 FAQs
    if ((index + 1) % 4 === 0 && index < answers.length - 1) {
      html += buildInlineCTA(Math.floor(index / 4), city) + '\n\n'
    }
  })

  html += `</div>\n`
  return html
}

function formatAnswerWithLinks(answer: string): string {
  let formatted = answer.replace(/\[Link: (https?:\/\/[^\]]+)\]/g, (match, url) => {
    const domain = url.match(/https?:\/\/([^\/]+)/)?.[1] || 'source'
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="authority-link">${domain}</a>`
  })
  
  const paragraphs = formatted.split('\n\n').filter(p => p.trim())
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n    ')
}

function buildRealResultsBox(realResult: string): string {
  return `<aside class="real-results-box">
  <h4>💼 Real Results</h4>
  <p>${realResult}</p>
</aside>`
}

function buildTakeawayBox(takeaway: string): string {
  return `<aside class="takeaway-box">
  <h4>💡 Key Takeaway</h4>
  <p>${takeaway}</p>
</aside>`
}

function buildServiceComparisonTable(city: string): string {
  return `<section class="comparison-section">
  <h2>Service Comparison for ${city}</h2>
  <div class="comparison-table-wrapper">
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>Standard</th>
          <th>Premium</th>
          <th>Best For</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Pricing</strong></td>
          <td>Most affordable</td>
          <td>Premium service</td>
          <td>Standard for budget; Premium for urgent needs</td>
        </tr>
        <tr>
          <td><strong>Delivery</strong></td>
          <td>3-5 business days</td>
          <td>Next-day/same-day</td>
          <td>Premium for time-sensitive ${city} projects</td>
        </tr>
        <tr>
          <td><strong>Support</strong></td>
          <td>Business hours</td>
          <td>24/7 dedicated</td>
          <td>Depends on project complexity</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>`
}

function buildCostFactorsTable(city: string): string {
  return `<section class="cost-factors-section">
  <h2>Cost Factors in ${city}</h2>
  <div class="factors-grid">
    <div class="factor-card">
      <h3>📏 Project Scope</h3>
      <p>Size and complexity of your ${city} project affects pricing. Larger projects require bigger dumpsters.</p>
    </div>
    <div class="factor-card">
      <h3>⏱️ Timeline</h3>
      <p>Standard vs. expedited delivery. Same-day service available in ${city} for urgent needs.</p>
    </div>
    <div class="factor-card">
      <h3>📍 Location</h3>
      <p>Site accessibility and ${city}-specific requirements may affect delivery logistics.</p>
    </div>
    <div class="factor-card">
      <h3>⭐ Service Level</h3>
      <p>Choose standard or premium tiers based on your ${city} project needs.</p>
    </div>
  </div>
</section>`
}

function buildPreparationChecklist(city: string): string {
  return `<section class="checklist-section">
  <h2>Preparation Checklist for ${city}</h2>
  <div class="checklist-box">
    <ul>
      <li>✓ Gather necessary permits ($45 from ${city} Code Enforcement)</li>
      <li>✓ Clear delivery area and ensure easy access</li>
      <li>✓ Document site conditions with photos</li>
      <li>✓ Communicate special requirements to your coordinator</li>
      <li>✓ Confirm delivery date and access instructions</li>
    </ul>
  </div>
</section>`
}

function buildQuickSummary(city: string): string {
  return `<section class="quick-summary-box">
  <h3>Quick Summary</h3>
  <p><strong>5 key things to remember about ${city} dumpster rental:</strong></p>
  <ul>
    <li>Ultimate Dumpsters provides specialized service tailored to ${city} requirements</li>
    <li>15+ years of experience ensures efficient, transparent service delivery</li>
    <li>Customer-first approach with real-time communication and flexible options</li>
    <li>Clear pricing, professional handling for every ${city} project type</li>
    <li>From quote to completion, we handle all details so you can focus on your project</li>
  </ul>
</section>`
}

function buildFinalCTA(city: string): string {
  return `<section class="final-cta">
  <div class="final-cta-content">
    <h2>Ready to Rent a Dumpster in ${city}?</h2>
    <p>Get your free quote today. Transparent pricing, reliable service, and same-day delivery available.</p>
    <div class="final-cta-features">
      <span>⭐ 4.9/5 Rating (1,200+ Reviews)</span>
      <span>🏆 15+ Years in Business</span>
      <span>✅ 100,000+ Satisfied Customers</span>
    </div>
    <a href="tel:8668583867" class="cta-button cta-large">
      📞 Call (866) 858-3867 Now
    </a>
    <p class="cta-guarantee">Free quote in under 2 minutes • No credit card required • Same-day delivery available</p>
  </div>
</section>`
}

function buildFAQSchema(
  questions: Question[],
  answers: Array<{ question: string; answer: string }>
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q, index) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answers[index]?.answer.replace(/\[Link:.*?\]/g, '').trim() || ''
      }
    }))
  }
}

function buildServiceSchema(cityData: any, serviceType: string = 'dumpster rental'): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${serviceType} service`,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Ultimate Dumpsters',
      telephone: '(866) 858-3867',
      priceRange: '$295-$695'
    },
    areaServed: {
      '@type': 'City',
      name: cityData.city,
      '@id': `https://www.wikidata.org/wiki/${cityData.wikidata_id || ''}`
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Dumpster Rental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '10 Yard Dumpster Rental'
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '295-395',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '20 Yard Dumpster Rental'
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '395-495',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '30 Yard Dumpster Rental'
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '495-595',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '40 Yard Dumpster Rental'
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '595-695',
            priceCurrency: 'USD'
          }
        }
      ]
    }
  }
}

function buildLocalBusinessSchema(cityData: any): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://ultimatedumpsters.com/#organization',
    name: 'Ultimate Dumpsters',
    image: 'https://ultimatedumpsters.com/logo.png',
    telephone: '(866) 858-3867',
    priceRange: '$295-$695',
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityData.city,
      addressRegion: cityData.state_code,
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: cityData.latitude,
      longitude: cityData.longitude
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1200',
      bestRating: '5',
      worstRating: '1'
    },
    areaServed: {
      '@type': 'City',
      name: cityData.city,
      '@id': `https://www.wikidata.org/wiki/${cityData.wikidata_id || ''}`
    },
    openingHours: 'Mo-Su 06:00-22:00'
  }
}

function buildOrganizationSchema(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ultimate Dumpsters',
    url: 'https://ultimatedumpsters.com',
    logo: 'https://ultimatedumpsters.com/logo.png',
    telephone: '(866) 858-3867',
    foundingDate: '2009',
    description: 'Professional dumpster rental service serving customers nationwide with 15+ years of experience.',
    sameAs: [
      'https://www.facebook.com/ultimatedumpsters',
      'https://www.linkedin.com/company/ultimatedumpsters'
    ]
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}