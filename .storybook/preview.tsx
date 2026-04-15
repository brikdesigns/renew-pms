import React, { useLayoutEffect, useState } from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import { DocsContainer as DefaultDocsContainer } from '@storybook/addon-docs/blocks';
import { create } from 'storybook/theming';

// Iconify — register Phosphor icon collection for offline/SSR use
import { addCollection } from '@iconify/react';
import phData from '@iconify-json/ph/icons.json';
addCollection(phData as Parameters<typeof addCollection>[0]);

// Token cascade:
// 1. BDS foundations + gap-fills (npm package)
// 2. BDS component styles (npm package)
// 3. Renew brand theme (light + dark)
import '@brikdesigns/bds/tokens.css';
import '@brikdesigns/bds/styles.css';
import '../src/styles/theme-renew.css';

// ─── Theme definitions ──────────────────────────────────────────
// Only 3 themes: Renew Light, Renew Dark, Font Audit

type RenewTheme = 'renew' | 'renew-dark' | 'client-sim';

interface ThemeConfig {
  base: 'light' | 'dark';
  name: string;
  colorPrimary: string;
  colorSecondary: string;
  appBg: string;
  appBorderColor: string;
  textColor: string;
  textMutedColor: string;
  barTextColor: string;
  barSelectedColor: string;
  barHoverColor: string;
  barBg: string;
  inputBg: string;
  inputBorder: string;
  inputTextColor: string;
  fontBase: string;
}

const themes: Record<RenewTheme, ThemeConfig> = {
  renew: {
    base: 'light',
    name: 'Renew Light',
    colorPrimary: '#855f91',
    colorSecondary: '#855f91',
    appBg: '#faf9fb',
    appBorderColor: '#e6e6e6',
    textColor: '#2e2e2e',
    textMutedColor: '#a5a5a5',
    barTextColor: '#575757',
    barSelectedColor: '#855f91',
    barHoverColor: '#855f91',
    barBg: '#faf9fb',
    inputBg: 'white',
    inputBorder: '#e6e6e6',
    inputTextColor: '#2e2e2e',
    fontBase: 'Avenir, sans-serif',
  },
  'renew-dark': {
    base: 'dark',
    name: 'Renew Dark',
    colorPrimary: '#ba9cc5',
    colorSecondary: '#ba9cc5',
    appBg: '#0a0a0a',
    appBorderColor: '#575757',
    textColor: '#f5f5f5',
    textMutedColor: '#a5a5a5',
    barTextColor: '#a5a5a5',
    barSelectedColor: '#ba9cc5',
    barHoverColor: '#ba9cc5',
    barBg: '#0a0a0a',
    inputBg: '#2e2e2e',
    inputBorder: '#575757',
    inputTextColor: '#f5f5f5',
    fontBase: 'Avenir, sans-serif',
  },
  'client-sim': {
    base: 'light',
    name: 'Font Audit',
    colorPrimary: '#333',
    colorSecondary: '#333',
    appBg: 'white',
    appBorderColor: '#bdbdbd',
    textColor: '#333',
    textMutedColor: '#828282',
    barTextColor: '#828282',
    barSelectedColor: '#333',
    barHoverColor: '#333',
    barBg: 'white',
    inputBg: 'white',
    inputBorder: '#bdbdbd',
    inputTextColor: '#333',
    fontBase: 'Verdana, sans-serif',
  },
};

// Build Storybook theme objects for the preview iframe
const previewThemes: Record<string, ReturnType<typeof create>> = {};
for (const [id, cfg] of Object.entries(themes)) {
  previewThemes[id] = create({
    base: cfg.base,
    appContentBg: 'transparent',
    appPreviewBg: 'transparent',
    appBorderColor: cfg.appBorderColor,
    barBg: cfg.barBg,
    barTextColor: cfg.barTextColor,
    barSelectedColor: cfg.barSelectedColor,
    barHoverColor: cfg.barHoverColor,
    textColor: cfg.textColor,
    textMutedColor: cfg.textMutedColor,
    colorPrimary: cfg.colorPrimary,
    colorSecondary: cfg.colorSecondary,
    inputBg: cfg.inputBg,
    inputBorder: cfg.inputBorder,
    inputTextColor: cfg.inputTextColor,
    fontBase: cfg.fontBase,
    fontCode: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    appBorderRadius: 4,
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function applyThemeToBody(themeId: RenewTheme) {
  const body = document.body;
  body.className = body.className.replace(/\btheme-\S+/g, '');
  body.classList.remove('dark', 'light');

  if (themeId === 'renew-dark') {
    body.classList.add('body', 'theme-renew', 'dark');
  } else if (themeId === 'client-sim') {
    body.classList.add('body', 'theme-client-sim');
  } else {
    body.classList.add('body', 'theme-renew', 'light');
  }

  const isDark = themes[themeId]?.base === 'dark';
  body.setAttribute('data-bds-dark', String(isDark));
}

// ─── Custom DocsContainer ───────────────────────────────────────

const ThemedDocsContainer: typeof DefaultDocsContainer = (props) => {
  const [themeId, setThemeId] = useState<RenewTheme>('renew');
  const channel = props.context.channel;

  useLayoutEffect(() => {
    const handler = ({ globals }: { globals: Record<string, unknown> }) => {
      const id = globals?.themeNumber as RenewTheme;
      if (id) setThemeId(id);
    };
    channel.on('globalsUpdated', handler);
    return () => channel.off('globalsUpdated', handler);
  }, [channel]);

  useLayoutEffect(() => {
    applyThemeToBody(themeId);
  }, [themeId]);

  const theme = previewThemes[themeId] || previewThemes['renew'];
  return React.createElement(DefaultDocsContainer, { ...props, theme });
};

// ─── Theme decorator ────────────────────────────────────────────

const withTheme: Decorator = (Story, context) => {
  const themeId = (context.globals.themeNumber || 'renew') as RenewTheme;
  const baseFont = (context.globals.baseFont || '16') as string;

  useLayoutEffect(() => {
    applyThemeToBody(themeId);
    document.body.style.fontSize = `${baseFont}px`;
  }, [themeId, baseFont]);

  if (context.viewMode === 'docs') {
    return <Story />;
  }

  return (
    <div
      style={{
        padding: 'var(--padding-md)',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Story />
    </div>
  );
};

// ─── Preview config ─────────────────────────────────────────────

const preview: Preview = {
  globalTypes: {
    themeNumber: {
      name: 'Theme',
      description: 'Renew brand theme',
      defaultValue: 'renew',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'renew', title: 'Renew Light' },
          { value: 'renew-dark', title: 'Renew Dark' },
          { value: 'client-sim', title: 'Font Audit' },
        ],
        dynamicTitle: true,
      },
    },
    baseFont: {
      name: 'Base Font',
      description: 'Root font size (scales all rem-based tokens)',
      defaultValue: '16',
      toolbar: {
        icon: 'grow',
        items: [
          { value: '14', title: '14px' },
          { value: '16', title: '16px' },
          { value: '18', title: '18px' },
          { value: '20', title: '20px' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    options: {
      storySort: {
        order: [
          'Components',
          ['Action', 'Form', 'Input', 'Control', 'Indicator', 'Feedback', 'Structure', '*'],
          'Navigation',
          'Displays',
          '*',
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      disabled: true,
    },
    docs: {
      toc: true,
      container: ThemedDocsContainer,
      source: {
        type: 'dynamic',
        excludeDecorators: true,
        format: false,
      },
    },
  },
};

export default preview;
