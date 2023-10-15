import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// https://astro.build/config
export default defineConfig({
  site: 'https://secco.lekoarts.de',
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
      social: {
        github: 'https://github.com/LekoArts/secco',
        mastodon: 'https://mastodon.social/@lekoarts',
        twitter: 'https://twitter.com/lekoarts_de',
      },
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
            { label: 'How It Works', link: '/guide/how-it-works/' },
            { label: 'Continuous Integration', link: '/guide/continuous-integration/' },
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
