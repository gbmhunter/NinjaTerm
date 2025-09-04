import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'NinjaTerm',
  tagline: 'A serial port terminal that\'s got your back.',
  favicon: 'img/ninjaterm-logo.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://ninjaterm.mbedded.ninja',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'gbmhunter', // Usually your GitHub org/user name.
  projectName: 'NinjaTerm', // Usually your repo name.

  onBrokenLinks: 'ignore', // Ignore broken links to /app since it will be served separately
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Serve docs at the root instead of /docs/
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/gbmhunter/NinjaTerm/tree/main/docs/',
        },
        blog: false, // Disable blog functionality
        theme: {
          customCss: './src/css/custom.css',
        },
        pages: false, // Disable pages functionality
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'NinjaTerm',
      logo: {
        alt: 'NinjaTerm Logo',
        src: 'img/ninjaterm-logo.png',
      },
      items: [
        {
          href: '/app',
          label: 'Web App',
          position: 'left',
        },
        {
          href: 'https://github.com/gbmhunter/NinjaTerm',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
            {
              label: 'User Manual',
              to: '/manual',
            },
            {
              label: 'Features',
              to: '/features',
            },
          ],
        },
        {
          title: 'Application',
          items: [
            {
              label: 'Web App',
              href: '/app',
            },
            {
              label: 'Download Releases',
              href: 'https://github.com/gbmhunter/NinjaTerm/releases',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/gbmhunter/NinjaTerm',
            },
            {
              label: 'Blog',
              href: 'https://blog.mbedded.ninja/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Geoffrey Hunter. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
