// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';
import * as path from 'node:path';

const packageNames = [
  // Core libs
  'core',
  'mvc',
  'mvc-react',
  'react',
  'store',

  // Extensions
  'ditox',
  'ditox-react',
  'rx-effects',
  'rxjs',
  'rxjs-react',
];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Nrgy.js',
  tagline: 'Javascript library for reactive programming with MVC/MVVM patterns',
  favicon: 'img/favicon.svg',

  url: 'https://nrgy.js.org',
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'mnasyrov',
  projectName: 'nrgy',

  // onBrokenLinks: 'throw',
  // onBrokenMarkdownLinks: 'warn',
  // onDuplicateRoutes: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/mnasyrov/nrgy/tree/main/website/',
        },
        theme: {
          customCss: ['./src/css/custom.css'],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og-image.png',
      navbar: {
        title: 'Nrgy.js',
        logo: {
          alt: 'Nrgy.js',
          src: 'img/logo.svg',
        },
        items: [
          // {
          //   label: `v${rootPackage.version}`,
          //   position: 'left',
          //   href: 'https://www.npmjs.com/package/nrgy',
          // },
          {
            type: 'docSidebar',
            sidebarId: 'docSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            label: 'API',
            to: 'api',
            position: 'left',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/mnasyrov/nrgy',
            position: 'right',
          },
        ],
      },
      footer: {
        copyright:
          `Released under the MIT License<br /> ` +
          `Copyright © <a href="https://github.com/mnasyrov/">Mikhail Nasyrov</a>`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),

  plugins: [
    [
      'docusaurus-plugin-typedoc-api',
      {
        projectRoot: path.join(__dirname, '..'),
        packages: packageNames.map((name) => ({
          path: `src/${name}`,
          entry: 'index.ts',
        })),

        // readmes: true,
        // debug: true,
      },
    ],
  ],
};

export default config;
