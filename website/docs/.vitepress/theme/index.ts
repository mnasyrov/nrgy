import { inBrowser, onContentUpdated } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './custom.css';

let mermaidModulePromise: Promise<typeof import('mermaid')> | undefined;
let mermaidInitialized = false;

async function loadMermaid() {
  mermaidModulePromise ??= import('mermaid');

  const module = await mermaidModulePromise;
  const mermaid = module.default;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'neutral',
    });
    mermaidInitialized = true;
  }

  return mermaid;
}

async function renderMermaidDiagrams() {
  if (!inBrowser) {
    return;
  }

  const mermaid = await loadMermaid();
  const diagrams = document.querySelectorAll<HTMLElement>('.vp-doc .mermaid');

  await Promise.all(
    Array.from(diagrams).map(async (diagram, index) => {
      if (diagram.dataset.processed === 'true') {
        return;
      }

      const rawSource = diagram.dataset.mermaidSource
        ? decodeURIComponent(diagram.dataset.mermaidSource)
        : diagram.textContent;
      const source = rawSource?.trim();

      if (!source) {
        return;
      }

      try {
        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-${index}-${Math.random().toString(36).slice(2, 10)}`,
          source,
        );

        diagram.innerHTML = svg;
        diagram.dataset.processed = 'true';
        bindFunctions?.(diagram);
      } catch (error) {
        diagram.dataset.processed = 'error';
        console.error('Failed to render Mermaid diagram.', error);
      }
    }),
  );
}

const theme = {
  extends: DefaultTheme,
  setup() {
    onContentUpdated(() => {
      void renderMermaidDiagrams();
    });
  },
};

export default theme;
