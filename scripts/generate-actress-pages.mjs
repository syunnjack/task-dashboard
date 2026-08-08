import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dataPath = path.join(root, 'public/data/actresses.json')
const outDir = path.join(root, 'public/actress')
const sitemapPath = path.join(root, 'public/sitemap.xml')

const SITE_URL = 'https://darekore.jp'
const GA_ID = 'G-5P2QCWYG8V'
const SITE_VERIFICATION = 'UkVs5hg-pf8rhHl-6SjNmf5AVU5fHm-ha3eBCk5Y5wA'

const affiliateConfig = {
  dmmId: process.env.VITE_DMM_AFFILIATE_ID || process.env.VITE_FANZA_AFFILIATE_ID || '',
  dugaTemplate: process.env.VITE_DUGA_AFFILIATE_URL || '',
  mgsTemplate: process.env.VITE_MGS_AFFILIATE_URL || '',
  sodTemplate: process.env.VITE_SOD_AFFILIATE_URL || '',
  dticashTemplate: process.env.VITE_DTICASH_AFFILIATE_URL || '',
}

function slugify(name, code) {
  const base = String(name || code || 'unknown')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return base || 'unknown'
}

function dmmSearchUrl(name) {
  return `https://www.dmm.co.jp/search/=/searchstr=${encodeURIComponent(name)}/`
}

function buildDmmAffiliateUrl(record) {
  const sourceUrl = typeof record.sourceUrl === 'string' ? record.sourceUrl : ''
  const targetUrl = sourceUrl.includes('dmm.co.jp')
    ? sourceUrl
    : dmmSearchUrl(record.name)

  if (!affiliateConfig.dmmId) return targetUrl
  if (targetUrl.includes('al.dmm.co.jp')) return targetUrl

  const params = new URLSearchParams({
    lurl: targetUrl,
    af_id: affiliateConfig.dmmId,
    ch: 'api',
  })
  return `https://al.dmm.co.jp/?${params}`
}

function buildTemplateUrl(template, record) {
  if (!template) return ''
  return template
    .replaceAll('{name}', encodeURIComponent(record.name))
    .replaceAll('{code}', encodeURIComponent(record.code || record.name))
    .replaceAll('{sourceUrl}', encodeURIComponent(record.sourceUrl || dmmSearchUrl(record.name)))
}

function affiliateLinks(record) {
  return [
    ['FANZAで探す', buildDmmAffiliateUrl(record)],
    ['DUGAで探す', buildTemplateUrl(affiliateConfig.dugaTemplate, record)],
    ['MGS動画で探す', buildTemplateUrl(affiliateConfig.mgsTemplate, record)],
    ['SODで探す', buildTemplateUrl(affiliateConfig.sodTemplate, record)],
    ['DTICASHで探す', buildTemplateUrl(affiliateConfig.dticashTemplate, record)],
  ].filter(([, url]) => Boolean(url))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function extractProfile(record) {
  const ruby = typeof record.ruby === 'string' ? record.ruby : ''
  const dmmId = typeof record.dmmId === 'string' ? record.dmmId : ''
  const prefecture = typeof record.prefecture === 'string' ? record.prefecture : ''
  const birthday = typeof record.birthday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.birthday) ? record.birthday : ''
  if (!ruby && !prefecture && !birthday) return null
  return { ruby, dmmId, prefecture, birthday }
}

function renderPage(record, slug, related) {
  const canonical = `${SITE_URL}/actress/${slug}/`
  const profile = extractProfile(record)
  const title = `${escapeHtml(record.name)}の出演作品・検索結果｜この子だれ？`
  const profileBits = profile
    ? [profile.prefecture && `${profile.prefecture}出身`, profile.birthday && `生年月日: ${profile.birthday}`].filter(Boolean).join('、')
    : ''
  const description = `${record.name}${profile?.ruby ? `（${profile.ruby}）` : ''}の出演作品、品番、メーカー、公開クレジットをまとめています。${profileBits ? `${profileBits}。` : ''}${(record.aliases || []).length ? `別名義: ${record.aliases.join(' / ')}。` : ''}FANZA等での検索・購入リンクも掲載。`

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: record.name,
    alternateName: [...new Set([profile?.ruby, ...(record.aliases || [])].filter(Boolean))],
    url: canonical,
    birthDate: profile?.birthday || undefined,
    homeLocation: profile?.prefecture ? { '@type': 'Place', name: profile.prefecture } : undefined,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: record.name, item: canonical },
    ],
  }

  const links = affiliateLinks(record)
  const linksHtml = links.length
    ? links.map(([label, url]) => `<a class="aff-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer sponsored">${escapeHtml(label)}</a>`).join('')
    : `<a class="aff-link" href="${escapeHtml(dmmSearchUrl(record.name))}" target="_blank" rel="noreferrer sponsored">FANZAで検索</a>`

  const tagsHtml = (record.tags || []).map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')
  const aliasesHtml = record.aliases?.length
    ? `<p class="aliases">別名義・旧名義: ${escapeHtml(record.aliases.join(' / '))}</p>`
    : ''

  const relatedHtml = related.length
    ? `<section class="related"><h2>関連する候補</h2><div class="related-grid">${related
        .map((r) => `<a href="/actress/${r.slug}/">${escapeHtml(r.name)}</a>`)
        .join('')}</div></section>`
    : ''

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="google-site-verification" content="${SITE_VERIFICATION}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="profile" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:site_name" content="この子だれ？" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${jsonLd(personSchema)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbSchema)}</script>
    <title>${title}</title>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
    <style>
      body { margin:0; font-family:"Hiragino Sans","Yu Gothic",sans-serif; color:#18151f; background:linear-gradient(135deg,#fff8f2 0%,#f4fbff 46%,#f7f3ff 100%); }
      .wrap { max-width:720px; margin:0 auto; padding:32px 20px 60px; }
      a.back { color:#8b4054; font-weight:700; text-decoration:none; font-size:13px; }
      h1 { font-size:clamp(28px,6vw,42px); margin:16px 0 4px; }
      .meta { color:#5a5566; font-size:14px; margin:0 0 4px; }
      .aliases { color:#5a5566; font-size:14px; }
      .tags { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0; }
      .tag { background:#fff; border:1px solid #eadfe0; border-radius:20px; padding:4px 12px; font-size:12px; color:#8b4054; }
      .aff-links { display:flex; flex-wrap:wrap; gap:10px; margin:20px 0; }
      .aff-link { background:#ff7b62; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:700; font-size:14px; }
      .related { margin-top:32px; border-top:1px solid #eadfe0; padding-top:20px; }
      .related-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
      .related-grid a { color:#8b4054; text-decoration:none; font-size:13px; border:1px solid #eadfe0; border-radius:20px; padding:4px 12px; background:#fff; }
      .note { color:#948e9e; font-size:12px; margin-top:32px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <a class="back" href="/">← この子だれ？トップへ戻る</a>
      <h1>${escapeHtml(record.name)}</h1>
      ${profile?.ruby ? `<p class="meta">読み: ${escapeHtml(profile.ruby)}</p>` : ''}
      ${profileBits ? `<p class="meta">${escapeHtml(profileBits)}</p>` : ''}
      <p class="meta">${escapeHtml(record.work || '')} ${record.maker ? `/ ${escapeHtml(record.maker)}` : ''}</p>
      ${aliasesHtml}
      <div class="tags">${tagsHtml}</div>
      <div class="aff-links">${linksHtml}</div>
      ${relatedHtml}
      <p class="note">掲載情報は公開されている作品ページ、メーカー情報をもとに整理しています。誤りの報告やUGC投稿はトップページから受け付けています。</p>
    </div>
  </body>
</html>
`
}

async function main() {
  const records = JSON.parse(await readFile(dataPath, 'utf8'))

  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const seenSlugs = new Set()
  const pages = []

  for (const record of records) {
    let slug = slugify(record.name, record.code)
    let suffix = 2
    while (seenSlugs.has(slug)) {
      slug = `${slugify(record.name, record.code)}-${suffix}`
      suffix += 1
    }
    seenSlugs.add(slug)
    pages.push({ record, slug })
  }

  for (const { record, slug } of pages) {
    const related = pages
      .filter((p) => p.slug !== slug && p.record.maker === record.maker)
      .slice(0, 8)
      .map((p) => ({ name: p.record.name, slug: p.slug }))

    const html = renderPage(record, slug, related)
    const dir = path.join(outDir, slug)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'index.html'), html, 'utf8')
  }

  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...pages.map(
      ({ slug }) =>
        `  <url>\n    <loc>${SITE_URL}/actress/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  await writeFile(sitemapPath, sitemap, 'utf8')

  const recordsWithSlug = pages.map(({ record, slug }) => ({ ...record, slug }))
  await writeFile(dataPath, `${JSON.stringify(recordsWithSlug, null, 2)}\n`, 'utf8')

  console.log(`Generated ${pages.length} actress pages and updated sitemap.xml (${pages.length + 1} URLs).`)
}

main()
