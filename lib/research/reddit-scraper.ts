import axios from 'axios'

interface RedditQuestion {
  question: string
  source: string
  upvotes: number
  url: string
  context?: string
}

export async function scrapeRedditQuestions(
  city: string,
  state: string
): Promise<RedditQuestion[]> {
  const questions: RedditQuestion[] = []

  try {
    console.log(`🔍 Searching Reddit for dumpster questions in ${city}, ${state}`)

    // Search queries to try
    const searchQueries = [
      `dumpster rental ${city}`,
      `${city} dumpster`,
      `roll off ${city}`,
      `dumpster ${state}`
    ]

    for (const query of searchQueries) {
      try {
        // Use Reddit's JSON API (public, no auth needed)
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25&sort=relevance`
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
          },
          timeout: 10000
        })

        const posts = response.data?.data?.children || []

        for (const post of posts) {
          const data = post.data
          
          // Extract questions from titles and selftext
          if (data.title) {
            const isQuestion = 
              data.title.includes('?') ||
              data.title.toLowerCase().includes('how') ||
              data.title.toLowerCase().includes('what') ||
              data.title.toLowerCase().includes('where') ||
              data.title.toLowerCase().includes('when') ||
              data.title.toLowerCase().includes('why') ||
              data.title.toLowerCase().includes('should i')

            if (isQuestion) {
              questions.push({
                question: data.title,
                source: `r/${data.subreddit}`,
                upvotes: data.ups || 0,
                url: `https://www.reddit.com${data.permalink}`,
                context: data.selftext ? data.selftext.substring(0, 200) : undefined
              })
            }
          }
        }

        // Rate limiting - be nice to Reddit
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error searching Reddit for "${query}":`, error)
      }
    }

    // Sort by upvotes (more popular questions first)
    questions.sort((a, b) => b.upvotes - a.upvotes)

    // Remove duplicates
    const uniqueQuestions = questions.filter((q, index, self) =>
      index === self.findIndex(t => 
        t.question.toLowerCase() === q.question.toLowerCase()
      )
    )

    console.log(`✅ Found ${uniqueQuestions.length} Reddit questions`)
    return uniqueQuestions.slice(0, 20) // Return top 20

  } catch (error) {
    console.error('Reddit scraping error:', error)
    return []
  }
}