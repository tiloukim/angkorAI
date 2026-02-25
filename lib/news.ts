export interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

const FEEDS = [
  // Khmer language
  { name: 'RFA Khmer',          url: 'https://www.rfa.org/khmer/rss2.xml' },
  { name: 'VOD Khmer',          url: 'https://vodkhmer.news/feed/' },
  { name: 'Thmey Thmey',        url: 'https://thmeythmey.com/?feed=rss2' },
  { name: 'Dap News',           url: 'https://dap-news.com/feed/' },
  { name: 'Fresh News',         url: 'https://freshnewsasia.com/feed/' },
  // English language
  { name: 'Khmer Times',        url: 'https://www.khmertimeskh.com/feed/' },
  { name: 'Phnom Penh Post',    url: 'https://www.phnompenhpost.com/rss.xml' },
  { name: 'Cambodianess',       url: 'https://cambodianess.com/feed/' },
  { name: 'Cambodia Investment Review', url: 'https://cambodiainvestmentreview.com/feed/' },
  { name: 'The Mirror',         url: 'https://cambodiamirror.wordpress.com/feed/' },
]

function extractCDATA(tag: string, xml: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return plainMatch ? plainMatch[1].replace(/<[^>]*>/g, '').trim() : ''
}

function parseRSS(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = []
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? []

  for (const block of blocks.slice(0, 4)) {
    const title = extractCDATA('title', block)
    const description = extractCDATA('description', block).slice(0, 300)
    const link = extractCDATA('link', block) || block.match(/<link\s*\/?>(.*?)<\/link>/)?.[1]?.trim() || ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() ?? ''

    if (title) items.push({ title, description, link, pubDate, source: sourceName })
  }
  return items
}

export async function fetchCambodiaNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ name, url }) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AngkorAI/1.0 (angkorai.ai)' },
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) return []
      const xml = await res.text()
      return parseRSS(xml, name)
    })
  )

  const all: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }
  return all.slice(0, 20)
}

// Detect if user is asking about current news/events
export function isNewsQuery(text: string): boolean {
  const lower = text.toLowerCase()
  const enKeywords = [
    'news', 'today', 'latest', 'current', 'breaking', 'recent',
    'what happened', 'what is happening', 'update', 'headlines',
    'this week', 'yesterday', 'tonight',
  ]
  const khKeywords = [
    'ព័ត៌មាន', 'ថ្ងៃនេះ', 'ថ្មីៗ', 'បច្ចុប្បន្ន', 'ថ្មី', 'ព្រឹត្តិការណ៍',
    'ចុងក្រោយ', 'ពាក់ព័ន្ធ', 'ស្ថានការណ៍',
  ]
  return (
    enKeywords.some((k) => lower.includes(k)) ||
    khKeywords.some((k) => text.includes(k))
  )
}

export function formatNewsContext(items: NewsItem[]): string {
  if (items.length === 0) return ''

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Phnom_Penh',
  })

  const lines = items.map(
    (item, i) =>
      `${i + 1}. [${item.source}] ${item.title}${
        item.description ? ` — ${item.description}` : ''
      }`
  )

  return `\n\n[LIVE CAMBODIA NEWS — fetched ${today}]\n${lines.join('\n')}\n\nWhen answering about current news, cite the source name (e.g. "According to Khmer Times..."). If the user asks in Khmer, summarize the news in Khmer first then English.`
}
