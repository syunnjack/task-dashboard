import { readFile, writeFile } from 'node:fs/promises'

const DATA_PATH = new URL('../public/data/actresses.json', import.meta.url)
const FANZA_ACTRESS_URL = 'https://api.dmm.com/affiliate/v3/ActressSearch'
const FANZA_ITEM_URL = 'https://api.dmm.com/affiliate/v3/ItemList'

const SOURCE_TAGS = {
  fanza: ['FANZA', 'API'],
  duga: ['DUGA', 'API'],
  apex: ['APEX', 'API'],
  mgs: ['MGS動画', 'API'],
  sod: ['SOD', 'API'],
  dticash: ['DTICASH', 'API'],
}

const apiId = process.env.FANZA_API_ID || process.env.DMM_API_ID
const affiliateId = process.env.FANZA_AFFILIATE_ID || process.env.DMM_AFFILIATE_ID

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))]
}

function compactRecord(record) {
  return {
    ...record,
    tags: unique(record.tags || []),
    aliases: unique(record.aliases || []),
  }
}

function mergeRecords(records) {
  const merged = new Map()
  for (const record of records.map(compactRecord)) {
    const key = record.name || record.code
    if (!key) continue

    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, record)
      continue
    }

    merged.set(key, {
      ...existing,
      ...record,
      aliases: unique([...(existing.aliases || []), ...(record.aliases || [])]),
      tags: unique([...(existing.tags || []), ...(record.tags || [])]),
      source: unique([existing.source, record.source]).join(' / '),
      sourceUrl: existing.sourceUrl || record.sourceUrl,
    })
  }
  return [...merged.values()]
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

function normalizeFanzaActress(actress) {
  return compactRecord({
    name: actress.name,
    aliases: [actress.ruby],
    work: 'セクシー女優',
    code: `FANZA-ACTRESS-${actress.id || actress.name}`,
    maker: 'FANZA ActressSearch',
    ruby: actress.ruby || '',
    dmmId: actress.id || '',
    prefecture: actress.prefectures || '',
    birthday: actress.birthday || '',
    tags: [
      actress.name,
      actress.ruby,
      actress.id,
      actress.prefectures,
      actress.birthday,
      ...SOURCE_TAGS.fanza,
    ],
    source: 'FANZA ActressSearch API',
    sourceUrl: actress.listURL || actress.URL || 'https://www.dmm.co.jp/',
  })
}

function normalizeFanzaItem(item, fallbackKeyword) {
  const actors = item.iteminfo?.actress || item.iteminfo?.actor || []
  const makers = item.iteminfo?.maker || []
  const genres = item.iteminfo?.genre || []
  const actorName = actors[0]?.name || fallbackKeyword

  return compactRecord({
    name: actorName,
    work: item.title || 'FANZA掲載作品',
    code: item.content_id || item.product_id || item.dmm_id || actorName,
    maker: makers[0]?.name || item.service_name || 'FANZA',
    tags: [
      actorName,
      item.content_id,
      makers[0]?.name,
      ...genres.slice(0, 6).map((genre) => genre.name),
      ...SOURCE_TAGS.fanza,
    ],
    source: 'FANZA ItemList API',
    sourceUrl: item.affiliateURL || item.URL || 'https://www.dmm.co.jp/',
  })
}

async function fetchFanzaActresses() {
  if (!apiId || !affiliateId) return []

  const records = []
  const hits = Number(process.env.FANZA_ACTRESS_HITS || 100)
  const maxPages = Number(process.env.FANZA_ACTRESS_MAX_PAGES || 50)

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams({
      api_id: apiId,
      affiliate_id: affiliateId,
      hits: String(hits),
      offset: String(page * hits + 1),
      output: 'json',
    })
    const data = await fetchJson(`${FANZA_ACTRESS_URL}?${params}`)
    const actresses = data.result?.actress || []
    records.push(...actresses.map(normalizeFanzaActress))
    if (actresses.length < hits) break
  }

  return records
}

async function fetchFanzaItems() {
  if (!apiId || !affiliateId) return []

  const keywords = (process.env.FANZA_KEYWORDS || '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
  if (keywords.length === 0) return []

  const records = []
  for (const keyword of keywords) {
    const params = new URLSearchParams({
      api_id: apiId,
      affiliate_id: affiliateId,
      site: process.env.FANZA_API_SITE || 'FANZA',
      service: process.env.FANZA_API_SERVICE || 'digital',
      floor: process.env.FANZA_API_FLOOR || 'videoa',
      hits: process.env.FANZA_API_HITS || '100',
      sort: process.env.FANZA_API_SORT || 'rank',
      keyword,
      output: 'json',
    })
    const data = await fetchJson(`${FANZA_ITEM_URL}?${params}`)
    const items = data.result?.items || []
    records.push(...items.map((item) => normalizeFanzaItem(item, keyword)))
  }
  return records
}

function normalizeGenericApiRecord(item, sourceName, sourceTags) {
  const name = item.name || item.actressName || item.performer || item.actor || item.title
  return compactRecord({
    name,
    aliases: item.aliases || item.alias || item.kana || item.ruby || [],
    work: item.work || item.title || 'API掲載プロフィール',
    code: item.id || item.code || item.productId || `${sourceName}-${name}`,
    maker: item.maker || item.label || item.production || sourceName,
    tags: [
      name,
      item.kana,
      item.genre,
      item.category,
      item.maker,
      item.label,
      ...sourceTags,
    ],
    source: `${sourceName} API`,
    sourceUrl: item.url || item.affiliateUrl || item.affiliateURL || item.link || '',
  })
}

async function fetchConfiguredFeed(envName, sourceName, sourceTags) {
  const endpoint = process.env[envName]
  if (!endpoint) return []

  const data = await fetchJson(endpoint)
  const items = Array.isArray(data)
    ? data
    : data.items || data.results || data.data || data.actresses || data.performers || []

  return items.map((item) => normalizeGenericApiRecord(item, sourceName, sourceTags))
}

async function main() {
  const existing = JSON.parse(await readFile(DATA_PATH, 'utf8'))
  const imported = [
    ...(await fetchFanzaActresses()),
    ...(await fetchFanzaItems()),
    ...(await fetchConfiguredFeed('DUGA_ACTRESS_FEED_URL', 'DUGA', SOURCE_TAGS.duga)),
    ...(await fetchConfiguredFeed('APEX_ACTRESS_FEED_URL', 'APEX', SOURCE_TAGS.apex)),
    ...(await fetchConfiguredFeed('MGS_ACTRESS_FEED_URL', 'MGS動画', SOURCE_TAGS.mgs)),
    ...(await fetchConfiguredFeed('SOD_ACTRESS_FEED_URL', 'SOD', SOURCE_TAGS.sod)),
    ...(await fetchConfiguredFeed('DTICASH_ACTRESS_FEED_URL', 'DTICASH', SOURCE_TAGS.dticash)),
  ]

  if (imported.length === 0) {
    console.log(
      'No API credentials/feed URLs set. Keeping existing records. Set FANZA_API_ID/FANZA_AFFILIATE_ID, DUGA_ACTRESS_FEED_URL, APEX_ACTRESS_FEED_URL, MGS_ACTRESS_FEED_URL, SOD_ACTRESS_FEED_URL, or DTICASH_ACTRESS_FEED_URL to import all available actress data.',
    )
    return
  }

  const records = mergeRecords([...existing, ...imported])
  await writeFile(DATA_PATH, `${JSON.stringify(records, null, 2)}\n`)
  console.log(`Merged ${imported.length} API records. Wrote ${records.length} total actress records.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
