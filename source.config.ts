import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export const guide = defineDocs({
  dir: 'content/guide',
});

export default defineConfig();
