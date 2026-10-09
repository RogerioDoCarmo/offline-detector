import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

/**
 * The live web demo is exported by apps/demo-web and published under /demo/ next to the docs, so
 * it is not a Docusaurus route. Link it by absolute URL: the broken-link checker (set to throw)
 * only knows routes it builds itself.
 */
const DEMO_URL = 'https://rogeriodocarmo.github.io/offline-detector/demo/';
const REPO_URL = 'https://github.com/RogerioDoCarmo/offline-detector';

const config: Config = {
  title: 'offline-detector',
  tagline: 'Know when your app has no internet, and say so calmly.',
  favicon: 'img/favicon.svg',

  url: 'https://rogeriodocarmo.github.io',
  baseUrl: '/offline-detector/',
  organizationName: 'RogerioDoCarmo',
  projectName: 'offline-detector',
  trailingSlash: true,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    // .md files are plain CommonMark (braces and angle brackets are safe in prose); only .mdx
    // files are parsed as MDX.
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR', 'es'],
    localeConfigs: {
      en: { label: 'English', htmlLang: 'en', direction: 'ltr' },
      'pt-BR': { label: 'Português (Brasil)', htmlLang: 'pt-BR', direction: 'ltr' },
      es: { label: 'Español', htmlLang: 'es', direction: 'ltr' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: `${REPO_URL}/tree/develop/apps/docs/`,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { defaultMode: 'light', respectPrefersColorScheme: true },
    navbar: {
      title: 'offline-detector',
      logo: { alt: '', src: 'img/logo.svg', srcDark: 'img/logo-dark.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { href: DEMO_URL, label: 'Live demo', position: 'left' },
        { href: REPO_URL, label: 'GitHub', position: 'right' },
        { type: 'localeDropdown', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/' },
            { label: 'Install', to: '/docs/install/' },
            { label: 'Privacy', to: '/docs/privacy/' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Live demo', href: DEMO_URL },
            { label: 'GitHub', href: REPO_URL },
          ],
        },
      ],
      copyright: 'MIT License. Copyright 2026 Rogério do Carmo.',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
