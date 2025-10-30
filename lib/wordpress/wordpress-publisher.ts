import { GeneratedContent } from '../content/content-generator'

interface WordPressConfig {
  siteUrl: string
  username: string
  applicationPassword: string
}

interface WordPressPage {
  id: number
  link: string
  title: { rendered: string }
  slug: string
}

export class WordPressPublisher {
  private config: WordPressConfig
  private authHeader: string

  constructor(config: WordPressConfig) {
    this.config = config
    this.authHeader = 'Basic ' + Buffer.from(
      `${config.username}:${config.applicationPassword}`
    ).toString('base64')
  }

  async publishCityContent(
    content: GeneratedContent,
    cityData: any
  ): Promise<{ success: boolean; pages: WordPressPage[] }> {
    console.log(`\n📤 Publishing content to WordPress...`)
    console.log(`   Site: ${this.config.siteUrl}`)

    try {
      const publishedPages: WordPressPage[] = []

      console.log(`\n📄 Creating main city page...`)
      const mainPage = await this.createPage({
        title: `Dumpster Rental ${cityData.city} ${cityData.state_code} | $295+ | 4.9★ (1200+) | Call Now`,
        slug: content.mainCityPage.slug,
        content: this.wrapContent(
          content.mainCityPage.htmlContent,
          content.mainCityPage.faqSchema,
          content.mainCityPage.localBusinessSchema,
          content.mainCityPage.serviceSchema,
          content.mainCityPage.organizationSchema,
          cityData
        ),
        metaDescription: content.mainCityPage.metaDescription,
        parent: 0
      })
      publishedPages.push(mainPage)
      console.log(`   ✅ ${mainPage.link}`)

      console.log(`\n📄 Creating topic pages...`)
      
      const residentialPage = await this.createPage({
        title: `Residential Dumpster Rental ${cityData.city} ${cityData.state_code} | 4.9★ | (866) 858-3867`,
        slug: content.topicPages.residential.slug,
        content: this.wrapContent(
          content.topicPages.residential.htmlContent,
          content.topicPages.residential.faqSchema,
          content.topicPages.residential.localBusinessSchema,
          content.topicPages.residential.serviceSchema,
          content.topicPages.residential.organizationSchema,
          cityData
        ),
        metaDescription: content.topicPages.residential.metaDescription,
        parent: mainPage.id
      })
      publishedPages.push(residentialPage)
      console.log(`   ✅ ${residentialPage.link}`)

      const commercialPage = await this.createPage({
        title: `Commercial Dumpster Rental ${cityData.city} ${cityData.state_code} | 4.9★ | (866) 858-3867`,
        slug: content.topicPages.commercial.slug,
        content: this.wrapContent(
          content.topicPages.commercial.htmlContent,
          content.topicPages.commercial.faqSchema,
          content.topicPages.commercial.localBusinessSchema,
          content.topicPages.commercial.serviceSchema,
          content.topicPages.commercial.organizationSchema,
          cityData
        ),
        metaDescription: content.topicPages.commercial.metaDescription,
        parent: mainPage.id
      })
      publishedPages.push(commercialPage)
      console.log(`   ✅ ${commercialPage.link}`)

      const constructionPage = await this.createPage({
        title: `Construction Dumpster Rental ${cityData.city} ${cityData.state_code} | 4.9★ | (866) 858-3867`,
        slug: content.topicPages.construction.slug,
        content: this.wrapContent(
          content.topicPages.construction.htmlContent,
          content.topicPages.construction.faqSchema,
          content.topicPages.construction.localBusinessSchema,
          content.topicPages.construction.serviceSchema,
          content.topicPages.construction.organizationSchema,
          cityData
        ),
        metaDescription: content.topicPages.construction.metaDescription,
        parent: mainPage.id
      })
      publishedPages.push(constructionPage)
      console.log(`   ✅ ${constructionPage.link}`)

      const roofingPage = await this.createPage({
        title: `Roofing Dumpster Rental ${cityData.city} ${cityData.state_code} | 4.9★ | (866) 858-3867`,
        slug: content.topicPages.roofing.slug,
        content: this.wrapContent(
          content.topicPages.roofing.htmlContent,
          content.topicPages.roofing.faqSchema,
          content.topicPages.roofing.localBusinessSchema,
          content.topicPages.roofing.serviceSchema,
          content.topicPages.roofing.organizationSchema,
          cityData
        ),
        metaDescription: content.topicPages.roofing.metaDescription,
        parent: mainPage.id
      })
      publishedPages.push(roofingPage)
      console.log(`   ✅ ${roofingPage.link}`)

      if (content.neighborhoodPages.length > 0) {
        console.log(`\n📄 Creating neighborhood pages...`)
        
        for (const neighborhoodPage of content.neighborhoodPages) {
          const page = await this.createPage({
            title: neighborhoodPage.title,
            slug: neighborhoodPage.slug,
            content: this.wrapContent(
              neighborhoodPage.htmlContent,
              neighborhoodPage.faqSchema,
              neighborhoodPage.localBusinessSchema,
              neighborhoodPage.serviceSchema,
              neighborhoodPage.organizationSchema,
              cityData
            ),
            metaDescription: neighborhoodPage.metaDescription,
            parent: mainPage.id
          })
          publishedPages.push(page)
          console.log(`   ✅ ${page.link}`)
        }
      }

      console.log(`\n🔗 Adding internal links...`)
      await this.addInternalLinks(mainPage.id, publishedPages, cityData)

      console.log(`\n✅ Publishing complete!`)
      console.log(`   📄 Total pages: ${publishedPages.length}`)
      console.log(`   🏠 Main page: ${mainPage.link}`)

      return { success: true, pages: publishedPages }

    } catch (error) {
      console.error('❌ WordPress publishing error:', error)
      throw error
    }
  }

  private async createPage(params: {
    title: string
    slug: string
    content: string
    metaDescription: string
    parent: number
  }): Promise<WordPressPage> {
    const response = await fetch(`${this.config.siteUrl}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader
      },
      body: JSON.stringify({
        title: params.title,
        slug: params.slug,
        content: params.content,
        status: 'publish',
        parent: params.parent,
        template: '',
        author: 1,
        meta: {
          _yoast_wpseo_metadesc: params.metaDescription,
          _et_pb_use_builder: 'off',
          _et_pb_old_content: '',
          _et_pb_page_layout: 'et_no_sidebar'
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create page: ${error}`)
    }

    return await response.json()
  }

  private wrapContent(
    htmlContent: string,
    faqSchema: any,
    localBusinessSchema: any,
    serviceSchema: any,
    organizationSchema: any,
    cityData: any
  ): string {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    return `
<!-- SEO Schemas for 90+/100 Score -->
<script type="application/ld+json">
${JSON.stringify(organizationSchema, null, 2)}
</script>

<script type="application/ld+json">
${JSON.stringify(localBusinessSchema, null, 2)}
</script>

<script type="application/ld+json">
${JSON.stringify(serviceSchema, null, 2)}
</script>

<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>

<!-- Premium Apple/Tesla Style CSS -->
<style>
${this.getPremiumCSS()}
</style>

<!-- E-E-A-T Trust Header -->
<div class="trust-header">
  <div class="trust-container">
    <div class="trust-badges">
      <div class="trust-badge">
        <span class="badge-icon">⭐</span>
        <div class="badge-content">
          <strong>4.9/5 Rating</strong>
          <span>1,200+ Reviews</span>
        </div>
      </div>
      <div class="trust-badge">
        <span class="badge-icon">🏆</span>
        <div class="badge-content">
          <strong>15+ Years</strong>
          <span>In Business</span>
        </div>
      </div>
      <div class="trust-badge">
        <span class="badge-icon">👥</span>
        <div class="badge-content">
          <strong>100,000+</strong>
          <span>Customers Served</span>
        </div>
      </div>
      <div class="trust-badge">
        <span class="badge-icon">✅</span>
        <div class="badge-content">
          <strong>Licensed</strong>
          <span>& Insured</span>
        </div>
      </div>
    </div>
    <div class="trust-meta">
      <span class="last-updated">Updated: ${currentDate}</span>
    </div>
  </div>
</div>

<!-- Floating Mobile CTA -->
<div class="floating-cta">
  <a href="tel:8668583867" class="floating-btn">
    📞 Call Now
  </a>
</div>

<!-- Main Content -->
${htmlContent}

<!-- Author Attribution -->
<div class="author-section">
  <div class="author-content">
    <div class="author-icon">✍️</div>
    <div class="author-text">
      <strong>Written by Ultimate Dumpsters Team</strong>
      <p>Expert dumpster rental professionals serving ${cityData.city}, ${cityData.state_code} with 15+ years of experience in waste management solutions.</p>
    </div>
  </div>
</div>
`
  }

  private getPremiumCSS(): string {
    return `
/* ============================================
   PREMIUM APPLE/TESLA DESIGN SYSTEM
   90+/100 SEO & UX Optimized
   ============================================ */

/* === RESET & BASE === */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* === TYPOGRAPHY === */
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  color: #1d1d1f;
}

/* === TRUST HEADER (E-E-A-T) === */
.trust-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px;
  margin-bottom: 40px;
}

.trust-container {
  max-width: 1200px;
  margin: 0 auto;
}

.trust-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-icon {
  font-size: 32px;
}

.badge-content {
  display: flex;
  flex-direction: column;
}

.badge-content strong {
  color: white;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.badge-content span {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.trust-meta {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.last-updated {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

/* === FLOATING MOBILE CTA === */
.floating-cta {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.floating-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
}

/* === MAIN CONTENT CONTAINER === */
.dumpster-rental-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 80px;
}

/* === PAGE HEADER === */
.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-header h1 {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -1.5px;
  color: #1d1d1f;
  margin-bottom: 16px;
  line-height: 1.1;
}

.header-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 16px;
}

.rating {
  color: #667eea;
  font-weight: 600;
}

.cta-phone a {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  border-bottom: 2px solid #667eea;
  transition: all 0.2s;
}

.cta-phone a:hover {
  color: #764ba2;
  border-color: #764ba2;
}

/* === INTRO SECTION === */
.intro-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px;
  border-radius: 24px;
  margin-bottom: 48px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.intro-section p {
  font-size: 18px;
  line-height: 1.8;
  color: #1d1d1f;
  text-align: center;
}

/* === HERO CTA === */
.hero-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 56px 40px;
  border-radius: 24px;
  margin-bottom: 56px;
  text-align: center;
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.3);
}

.hero-cta h2 {
  font-size: 40px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.hero-cta > p {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 32px;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 18px 36px;
  border-radius: 50px;
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}

.cta-primary {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.cta-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  backdrop-filter: blur(10px);
}

.cta-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.cta-assurance {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

/* === QUICK ANSWER BOX === */
.quick-answer-box {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  padding: 32px;
  border-radius: 20px;
  margin-bottom: 48px;
  border: 3px solid #fdcb6e;
  box-shadow: 0 8px 32px rgba(253, 203, 110, 0.3);
}

.quick-answer-box h3 {
  font-size: 28px;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 16px;
}

.quick-answer-box p {
  font-size: 17px;
  line-height: 1.7;
  color: #2d3436;
  margin-bottom: 16px;
}

.quick-answer-box a {
  color: #d63031;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 2px solid #d63031;
}

.quick-facts {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.quick-facts span {
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3436;
}

/* === PRICING CARDS === */
.pricing-cards {
  margin-bottom: 64px;
}

.pricing-cards h2 {
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 40px;
  color: #1d1d1f;
  letter-spacing: -1px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.pricing-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid transparent;
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
}

.pricing-card.featured {
  border-color: #667eea;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.card-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.price {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 16px;
}

.card-desc {
  color: #6e6e73;
  margin-bottom: 16px;
  font-size: 15px;
}

.card-features {
  list-style: none;
  margin-bottom: 24px;
}

.card-features li {
  padding: 8px 0;
  color: #1d1d1f;
  font-size: 15px;
}

.card-cta {
  display: block;
  text-align: center;
  background: #667eea;
  color: white;
  padding: 14px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.card-cta:hover {
  background: #764ba2;
  transform: scale(1.02);
}

.pricing-note {
  text-align: center;
  color: #6e6e73;
  font-size: 14px;
  font-style: italic;
}

/* === TABLE OF CONTENTS === */
.table-of-contents {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px;
  border-radius: 20px;
  margin-bottom: 56px;
}

.table-of-contents h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1d1d1f;
}

.table-of-contents ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  list-style: none;
}

.table-of-contents li {
  background: white;
  padding: 14px 18px;
  border-radius: 12px;
  transition: all 0.2s;
}

.table-of-contents li:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.table-of-contents a {
  color: #1d1d1f;
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
}

/* === FAQ SECTION === */
.section-header {
  font-size: 40px;
  font-weight: 700;
  margin: 64px 0 32px;
  color: #1d1d1f;
  letter-spacing: -1px;
}

.faq-item {
  background: white;
  padding: 40px;
  margin-bottom: 24px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.faq-item:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.faq-item h3 {
  font-size: 26px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
  line-height: 1.3;
}

.faq-item p {
  font-size: 17px;
  line-height: 1.8;
  color: #1d1d1f;
  margin-bottom: 20px;
}

.faq-item p:last-child {
  margin-bottom: 0;
}

.authority-link {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid #667eea;
  font-weight: 500;
  transition: all 0.2s;
}

.authority-link:hover {
  color: #764ba2;
  border-color: #764ba2;
}

/* === REAL RESULTS & TAKEAWAY BOXES === */
.real-results-box,
.takeaway-box {
  padding: 24px;
  border-radius: 16px;
  margin: 24px 0;
}

.real-results-box {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe4b3 100%);
  border-left: 4px solid #ff9f43;
}

.takeaway-box {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}

.real-results-box h4,
.takeaway-box h4 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.real-results-box h4 {
  color: #e17055;
}

.takeaway-box h4 {
  color: #1976d2;
}

.real-results-box p,
.takeaway-box p {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.real-results-box p {
  color: #5d4037;
  font-style: italic;
}

.takeaway-box p {
  color: #1565c0;
  font-weight: 500;
}

/* === CTA BANNERS === */
.cta-banner,
.inline-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px;
  border-radius: 20px;
  margin: 48px 0;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
}

.cta-banner-content,
.inline-cta-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.cta-banner-text h3,
.inline-cta-content h4 {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.cta-banner-text p,
.inline-cta-content p {
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
}

.inline-cta-content {
  flex-direction: column;
  text-align: center;
}

.inline-cta-content h4 {
  font-size: 24px;
}

/* === TABLES === */
.comparison-section,
.cost-factors-section {
  margin: 56px 0;
}

.comparison-section h2,
.cost-factors-section h2 {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 32px;
  text-align: center;
  color: #1d1d1f;
}

.comparison-table-wrapper {
  overflow-x: auto;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.comparison-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.comparison-table th {
  color: white;
  padding: 20px;
  text-align: left;
  font-weight: 600;
  font-size: 15px;
}

.comparison-table td {
  padding: 20px;
  border-bottom: 1px solid #f5f5f7;
  font-size: 15px;
  color: #1d1d1f;
}

.comparison-table tbody tr:hover {
  background: #f5f7fa;
}

/* === COST FACTORS GRID === */
.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.factor-card {
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.factor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.factor-card h3 {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.factor-card p {
  color: #6e6e73;
  line-height: 1.6;
  font-size: 15px;
}

/* === CHECKLIST === */
.checklist-section {
  margin: 56px 0;
}

.checklist-section h2 {
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 32px;
  color: #1d1d1f;
}

.checklist-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.checklist-box ul {
  list-style: none;
}

.checklist-box li {
  padding: 16px 0;
  font-size: 17px;
  color: #1d1d1f;
  border-bottom: 1px solid #f5f5f7;
}

.checklist-box li:last-child {
  border-bottom: none;
}

/* === QUICK SUMMARY === */
.quick-summary-box {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 40px;
  border-radius: 20px;
  margin: 56px 0;
  border: 3px solid #4caf50;
}

.quick-summary-box h3 {
  font-size: 32px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 20px;
}

.quick-summary-box > p {
  font-size: 18px;
  color: #1b5e20;
  margin-bottom: 20px;
  font-weight: 600;
}

.quick-summary-box ul {
  list-style: none;
}

.quick-summary-box li {
  padding: 12px 0 12px 32px;
  position: relative;
  font-size: 16px;
  line-height: 1.7;
  color: #1b5e20;
}

.quick-summary-box li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4caf50;
  font-weight: 700;
  font-size: 20px;
}

/* === FINAL CTA === */
.final-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 64px 40px;
  border-radius: 24px;
  text-align: center;
  margin: 64px 0;
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.3);
}

.final-cta-content h2 {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -1.5px;
}

.final-cta-content > p {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 32px;
}

.final-cta-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.final-cta-features span {
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  font-weight: 500;
}

.cta-large {
  font-size: 22px;
  padding: 22px 48px;
}

.cta-guarantee {
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

/* === AUTHOR SECTION === */
.author-section {
  background: #f5f7fa;
  padding: 32px;
  border-radius: 20px;
  margin-top: 64px;
  border-left: 4px solid #4caf50;
}

.author-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.author-icon {
  font-size: 32px;
}

.author-text strong {
  display: block;
  font-size: 18px;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.author-text p {
  font-size: 15px;
  color: #6e6e73;
  line-height: 1.6;
  margin: 0;
}

/* === MOBILE RESPONSIVE === */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }
  
  .hero-cta h2 {
    font-size: 28px;
  }
  
  .pricing-cards h2,
  .section-header,
  .comparison-section h2,
  .cost-factors-section h2,
  .checklist-section h2 {
    font-size: 28px;
  }
  
  .final-cta-content h2 {
    font-size: 32px;
  }
  
  .trust-badges {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-banner-content,
  .inline-cta-content {
    flex-direction: column;
    text-align: center;
  }
  
  .floating-cta {
    bottom: 16px;
    right: 16px;
  }
  
  .floating-btn {
    padding: 14px 20px;
    font-size: 14px;
  }
  
  .table-of-contents ul {
    grid-template-columns: 1fr;
  }
}

/* === SMOOTH ANIMATIONS === */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-item {
  animation: fadeInUp 0.5s ease-out;
}

/* === PRINT STYLES === */
@media print {
  .floating-cta,
  .hero-cta,
  .cta-banner,
  .inline-cta,
  .final-cta {
    display: none;
  }
}
`
  }

  private async addInternalLinks(
    mainPageId: number,
    allPages: WordPressPage[],
    cityData: any
  ): Promise<void> {
    const response = await fetch(
      `${this.config.siteUrl}/wp-json/wp/v2/pages/${mainPageId}`,
      {
        headers: { 'Authorization': this.authHeader }
      }
    )
    const mainPage = await response.json()

    const topicPages = allPages.filter(p => p.id !== mainPageId && !p.slug.includes(`-${cityData.slug}-`))
    const neighborhoodPages = allPages.filter(p => p.slug.includes(`-${cityData.slug}-`))

    const internalLinksHTML = `
<section class="internal-links-section" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 48px 40px; border-radius: 24px; margin-top: 64px;">
  <h2 style="font-size: 40px; font-weight: 700; color: #1d1d1f; text-align: center; margin-bottom: 32px;">Explore More ${cityData.city} Services</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
    ${topicPages.map(page => `
      <a href="${page.link}" style="background: white; padding: 24px; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transition: all 0.3s; display: block;">
        <strong style="color: #667eea; font-size: 20px; font-weight: 700;">${page.title.rendered.split('|')[0].trim()}</strong>
      </a>
    `).join('')}
  </div>
  ${neighborhoodPages.length > 0 ? `
    <h3 style="font-size: 28px; font-weight: 700; color: #1d1d1f; margin-bottom: 20px; text-align: center;">Neighborhood Coverage</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
      ${neighborhoodPages.map(page => `
        <a href="${page.link}" style="background: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; color: #667eea; border: 2px solid #667eea; font-weight: 600; transition: all 0.2s;">
          ${page.title.rendered.split('in ')[1]?.split(',')[0] || page.title.rendered}
        </a>
      `).join('')}
    </div>
  ` : ''}
</section>
`

    const updatedContent = mainPage.content.rendered.replace(
      '</article>',
      `${internalLinksHTML}</article>`
    )

    await fetch(`${this.config.siteUrl}/wp-json/wp/v2/pages/${mainPageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader
      },
      body: JSON.stringify({
        content: updatedContent
      })
    })
  }
}