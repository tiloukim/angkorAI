export interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

const FEEDS = [
  // ── Khmer-language Cambodia ──────────────────────────────────────
  { name: 'RFA Khmer',          url: 'https://www.rfa.org/khmer/rss2.xml' },
  { name: 'VOD Khmer',          url: 'https://vodkhmer.news/feed/' },
  { name: 'Thmey Thmey',        url: 'https://thmeythmey.com/?feed=rss2' },
  { name: 'Dap News',           url: 'https://dap-news.com/feed/' },
  { name: 'Fresh News KH',      url: 'https://freshnews.com.kh/feed/' },

  // ── English-language Cambodia ────────────────────────────────────
  { name: 'Khmer Times',        url: 'https://www.khmertimeskh.com/feed/' },
  { name: 'Phnom Penh Post',    url: 'https://www.phnompenhpost.com/rss.xml' },
  { name: 'Cambodianess',       url: 'https://cambodianess.com/feed/' },
  { name: 'Khmer Post Asia',    url: 'https://en.khmerpostasia.com/feed/' },
  { name: 'Cambodia Post',      url: 'https://cambodiapost.com.kh/feed/' },
  { name: 'Khmer Post USA',     url: 'https://khmerpostusa.com/feed/' },
  { name: 'Cambodia Investment Review', url: 'https://cambodiainvestmentreview.com/feed/' },
  { name: 'The Mirror',         url: 'https://cambodiamirror.wordpress.com/feed/' },

  // ── International (Cambodia coverage) ────────────────────────────
  { name: 'Al Jazeera',         url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'The Diplomat',       url: 'https://thediplomat.com/countries/cambodia/feed/' },
  { name: 'BBC News',           url: 'https://feeds.bbci.co.uk/news/topics/c8nq32jwj8mt.rss' },
  { name: 'Reuters',            url: 'https://feeds.reuters.com/reuters/topNews' },
  { name: 'CNN',                url: 'https://rss.cnn.com/rss/edition_world.rss' },
  { name: 'ABC News',           url: 'https://feeds.abcnews.com/abcnews/internationalheadlines' },
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
  return all.slice(0, 30)
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

  return `\n\n[LIVE NEWS — fetched ${today} | Sources: Cambodia + International]\n${lines.join('\n')}\n\nWhen answering about current news, always cite the source (e.g. "According to Reuters..." or "Khmer Times reports..."). Prioritize Cambodia-specific sources for local questions. If the user asks in Khmer, answer in Khmer first then English.`
}
