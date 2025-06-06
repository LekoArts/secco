import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const site = 'https://secco.lekoarts.de'

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'secco',
      logo: {
        src: './src/assets/secco.png',
      },
      description: 'Local package testing made easy. secco is a command-line tool for local development. It uses Verdaccio and direct file copying to apply your latest changes to other projects.',
      editLink: {
        baseUrl: 'https://github.com/LekoArts/secco/edit/main/docs/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/LekoArts/secco',
        },
        {
          icon: 'mastodon',
          label: 'Mastodon',
          href: 'https://mastodon.social/@lekoarts',
        },
        {
          icon: 'blueSky',
          label: 'Bluesky',
          href: 'https://bsky.app/profile/lekoarts.de',
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: `${site}/og.png?v=1` },
        },
        {
          tag: 'meta',
          attrs: { property: 'twitter:image', content: `${site}/og.png?v=1` },
        },
        {
          tag: 'script',
          attrs: {
            'src': '/js/script.js',
            'data-domain': 'secco.lekoarts.de',
            'defer': true,
          },
        },
      ],
      favicon: '/favicon.png',
      lastUpdated: true,
      pagination: false,
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', link: '/guide/' },
            { label: 'Learn secco', link: '/guide/learn-secco/' },
            { label: 'Features', link: '/guide/features/' },
            { label: 'Continuous Integration', link: '/guide/continuous-integration/' },
            { label: 'Terminology', link: '/guide/terminology/' },
          ],
        },
        {
          label: 'CLI Reference',
          autogenerate: { directory: 'reference' },
        },
        { label: 'Acknowledgements', link: '/acknowledgements' },
      ],
    }),
  ],
})
