import type MarkdownIt from 'markdown-it';
import { defineConfig } from 'vitepress';

const githubLink = 'https://github.com/mnasyrov/nrgy';

export default defineConfig({
  title: 'Nrgy.js',
  description:
    'Documentation website for Nrgy.js packages and developer guides.',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  markdown: {
    config: configureMarkdown,
  },
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
          overview: 'Обзор',
          project: 'Проект',
          documentation: 'Документация',
          contributing: 'Contributing',
          repositoryOverview: 'Обзор репозитория',
          changelog: 'История изменений',
          introduction: 'Введение',
          quickStart: 'Быстрый старт',
          core: 'Core',
          architecture: 'Архитектура',
          mvvm: 'MVVM и Controllers',
          integrations: 'Интеграции',
          recipes: 'Рецепты',
          migration: 'Миграция',
          faq: 'FAQ',
          contributingOverview: 'Обзор для контрибьюторов',
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
          overview: 'Overview',
          project: 'Project',
          documentation: 'Documentation',
          contributing: 'Contributing',
          repositoryOverview: 'Repository Overview',
          changelog: 'Changelog',
          introduction: 'Introduction',
          quickStart: 'Quick Start',
          core: 'Core',
          architecture: 'Architecture',
          mvvm: 'MVVM and Controllers',
          integrations: 'Integrations',
          recipes: 'Recipes',
          migration: 'Migration',
          faq: 'FAQ',
          contributingOverview: 'Contributor Overview',
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
      { text: labels.github, link: githubLink },
    ],
    sidebar: [
      {
        text: labels.documentation,
        items: [
          {
            text: labels.overview,
            link: withPrefix(prefix, '/content/docs/README'),
          },
          {
            text: labels.introduction,
            link: withPrefix(prefix, '/content/docs/introduction'),
          },
          {
            text: labels.quickStart,
            link: withPrefix(prefix, '/content/docs/quick-start'),
          },
          {
            text: labels.core,
            link: withPrefix(prefix, '/content/docs/core/README'),
          },
          {
            text: labels.architecture,
            link: withPrefix(prefix, '/content/docs/architecture/README'),
          },
          {
            text: labels.mvvm,
            link: withPrefix(prefix, '/content/docs/mvvm/README'),
          },
          {
            text: labels.integrations,
            link: withPrefix(prefix, '/content/docs/integrations/README'),
          },
          {
            text: labels.recipes,
            link: withPrefix(prefix, '/content/docs/recipes/README'),
          },
          {
            text: labels.migration,
            link: withPrefix(prefix, '/content/docs/migration/README'),
          },
          {
            text: labels.faq,
            link: withPrefix(prefix, '/content/docs/faq/README'),
          },
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
            text: labels.contributing,
            link: withPrefix(prefix, '/content/docs/contributing/README'),
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

function configureMarkdown(md: MarkdownIt) {
  const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    if (token.info.trim() !== 'mermaid') {
      return defaultFence
        ? defaultFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    }

    const source = encodeURIComponent(token.content);

    return `<div class="mermaid" data-mermaid-source="${source}"></div>\n`;
  };
}
