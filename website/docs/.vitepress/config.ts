import { defineConfig } from 'vitepress';

const githubLink = 'https://github.com/mnasyrov/nrgy';

export default defineConfig({
  title: 'Nrgy.js',
  description:
    'Documentation website for Nrgy.js packages and developer guides.',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: createThemeConfig('en'),
    },
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      link: '/ru/',
      themeConfig: createThemeConfig('ru'),
    },
  },
  head: [['link', { rel: 'icon', href: '/assets/favicon.svg' }]],
});

function createThemeConfig(locale: 'en' | 'ru') {
  const prefix = locale === 'ru' ? '/ru' : '';
  const labels =
    locale === 'ru'
      ? {
          home: 'Главная',
          docs: 'Документация',
          packages: 'Пакеты',
          guide: 'Гайд',
          website: 'Сайт',
          overview: 'Обзор',
          project: 'Проект',
          repositoryOverview: 'Обзор репозитория',
          changelog: 'История изменений',
          documentationOverview: 'Обзор документации',
          developerDocs: 'Документация для разработчиков',
          developerOverview: 'Обзор для разработчиков',
          documentationRequirements: 'Требования к документации',
          documentationPrompt: 'Prompt для документации',
          codingStyle: 'Стиль кодирования',
          developmentWorkflow: 'Процесс разработки',
          agentGuide: 'Гайд для агентов',
          github: 'GitHub',
          languageMenu: 'Язык',
          returnToTop: 'Наверх',
          outlineTitle: 'На странице',
          darkMode: 'Оформление',
          light: 'Светлая',
          dark: 'Тёмная',
          system: 'Системная',
          sidebarMenu: 'Меню',
        }
      : {
          home: 'Home',
          docs: 'Docs',
          packages: 'Packages',
          guide: 'Guide',
          website: 'Website',
          overview: 'Overview',
          project: 'Project',
          repositoryOverview: 'Repository Overview',
          changelog: 'Changelog',
          documentationOverview: 'Documentation Overview',
          developerDocs: 'Developer Docs',
          developerOverview: 'Developer Overview',
          documentationRequirements: 'Documentation Requirements',
          documentationPrompt: 'Documentation Prompt',
          codingStyle: 'Coding Style',
          developmentWorkflow: 'Development Workflow',
          agentGuide: 'Agent Guide',
          github: 'GitHub',
          languageMenu: 'Languages',
          returnToTop: 'Return to top',
          outlineTitle: 'On this page',
          darkMode: 'Appearance',
          light: 'Light',
          dark: 'Dark',
          system: 'System',
          sidebarMenu: 'Menu',
        };

  return {
    logo: '/assets/logo.svg',
    nav: [
      { text: labels.home, link: withPrefix(prefix, '/') },
      { text: labels.docs, link: withPrefix(prefix, '/content/docs/README') },
      {
        text: labels.packages,
        link: withPrefix(prefix, '/content/packages/core/README'),
      },
      { text: labels.guide, link: withPrefix(prefix, '/guide') },
      { text: labels.github, link: githubLink },
    ],
    sidebar: [
      {
        text: labels.website,
        items: [
          { text: labels.overview, link: withPrefix(prefix, '/') },
          { text: labels.guide, link: withPrefix(prefix, '/guide') },
        ],
      },
      {
        text: labels.project,
        items: [
          {
            text: labels.repositoryOverview,
            link: withPrefix(prefix, '/content/project/README'),
          },
          {
            text: labels.changelog,
            link: withPrefix(prefix, '/content/project/CHANGELOG'),
          },
          {
            text: labels.documentationOverview,
            link: withPrefix(prefix, '/content/docs/README'),
          },
        ],
      },
      {
        text: labels.developerDocs,
        items: [
          {
            text: labels.developerOverview,
            link: withPrefix(prefix, '/content/docs/developers/README'),
          },
          {
            text: labels.documentationRequirements,
            link: withPrefix(
              prefix,
              '/content/docs/developers/docs_requirements',
            ),
          },
          {
            text: labels.documentationPrompt,
            link: withPrefix(prefix, '/content/docs/developers/docs_prompt'),
          },
          {
            text: labels.codingStyle,
            link: withPrefix(prefix, '/content/docs/developers/coding_style'),
          },
          {
            text: labels.developmentWorkflow,
            link: withPrefix(
              prefix,
              '/content/docs/developers/development_workflow',
            ),
          },
          {
            text: labels.agentGuide,
            link: withPrefix(prefix, '/content/docs/developers/agent_guide'),
          },
        ],
      },
      {
        text: labels.packages,
        items: [
          {
            text: '@nrgyjs/core',
            link: withPrefix(prefix, '/content/packages/core/README'),
          },
          {
            text: '@nrgyjs/react',
            link: withPrefix(prefix, '/content/packages/react/README'),
          },
          {
            text: '@nrgyjs/ditox',
            link: withPrefix(prefix, '/content/packages/ditox/README'),
          },
          {
            text: '@nrgyjs/ditox-react',
            link: withPrefix(prefix, '/content/packages/ditox-react/README'),
          },
          {
            text: '@nrgyjs/rxjs',
            link: withPrefix(prefix, '/content/packages/rxjs/README'),
          },
          {
            text: '@nrgyjs/rx-effects',
            link: withPrefix(prefix, '/content/packages/rx-effects/README'),
          },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: githubLink }],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: locale === 'ru' ? 'Поиск' : 'Search',
                buttonAriaLabel: locale === 'ru' ? 'Поиск' : 'Search',
              },
              modal: {
                noResultsText:
                  locale === 'ru' ? 'Ничего не найдено' : 'No results',
                resetButtonTitle: locale === 'ru' ? 'Очистить' : 'Clear query',
                footer: {
                  selectText: locale === 'ru' ? 'выбрать' : 'select',
                  navigateText: locale === 'ru' ? 'перейти' : 'navigate',
                  closeText: locale === 'ru' ? 'закрыть' : 'close',
                },
              },
            },
          },
        },
      },
    },
    outline: {
      level: [2, 3],
      label: labels.outlineTitle,
    },
    darkModeSwitchLabel: labels.darkMode,
    lightModeSwitchTitle: labels.light,
    darkModeSwitchTitle: labels.dark,
    sidebarMenuLabel: labels.sidebarMenu,
    returnToTopLabel: labels.returnToTop,
    langMenuLabel: labels.languageMenu,
  };
}

function withPrefix(prefix: string, route: string) {
  return `${prefix}${route}` || '/';
}
