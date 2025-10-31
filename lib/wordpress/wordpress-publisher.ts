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
  content?: { rendered?: string }
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
    console.log(`\n📤 Publishing ${content.neighborhoodPages ? content.neighborhoodPages.length + 1 : 1} pages to WordPress...`)
    
    const publishedPages: WordPressPage[] = []

    // Publish main city page
    console.log(`\n📄 Publishing main page: ${content.mainCityPage.title}`)
    const mainPage = await this.publishPage(content.mainCityPage)
    publishedPages.push(mainPage)

    // Publish neighborhood pages if they exist
    if (content.neighborhoodPages && content.neighborhoodPages.length > 0) {
      console.log(`\n🏘️  Publishing ${content.neighborhoodPages.length} neighborhood pages...`)
      
      for (const neighborhoodPage of content.neighborhoodPages) {
        console.log(`   📄 ${neighborhoodPage.title}`)
        const page = await this.publishPage(neighborhoodPage)
        publishedPages.push(page)
      }
    }

    console.log(`\n✅ Published ${publishedPages.length} pages successfully!`)
    publishedPages.forEach(page => {
      console.log(`   🔗 ${page.link}`)
    })

    return { success: true, pages: publishedPages }
  }

  private async publishPage(pageContent: {
    title: string
    slug: string
    htmlContent: string
    metaDescription: string
  }): Promise<WordPressPage> {
    const payload = {
      title: pageContent.title,
      slug: pageContent.slug,
      content: pageContent.htmlContent,
      status: 'publish',
      template: 'city-landing-template'
    }

    const response = await fetch(`${this.config.siteUrl}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ WordPress API error for ${pageContent.title}:`, response.status, errorText)
      throw new Error(`WordPress API returned ${response.status}: ${errorText}`)
    }

    const page = await response.json()
    return page
  }
}