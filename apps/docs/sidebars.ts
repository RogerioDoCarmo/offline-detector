import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'install',
    'web-quick-start',
    'native-quick-start',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'recheck-on-return',
        'dismissal',
        'slots',
        'theming',
        'accessibility',
        'i18n',
        'ssr',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['reference/core', 'reference/react', 'reference/web', 'reference/native'],
    },
    'faq',
    'privacy',
  ],
};

export default sidebars;
