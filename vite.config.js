import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function siteAnalyticsHead(env) {
  const parts = ['    <meta name="robots" content="index, follow" />']

  const verification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim()
  if (verification) {
    parts.push(`    <meta name="google-site-verification" content="${escapeHtml(verification)}" />`)
  }

  const measurementId = env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID?.trim()
  if (measurementId) {
    const id = escapeHtml(measurementId)
    parts.push(`    <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`)
    parts.push(`    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    </script>`)
  }

  return parts.join('\n')
}

function siteAnalyticsPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    name: 'site-analytics',
    transformIndexHtml(html) {
      return html.replace('</head>', `${siteAnalyticsHead(env)}\n  </head>`)
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react(), siteAnalyticsPlugin(mode)],
}))
