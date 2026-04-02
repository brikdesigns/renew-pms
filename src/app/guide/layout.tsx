import 'fumadocs-ui/style.css';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { guideSource } from '@/lib/source';
import { baseOptions } from './layout.config';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={guideSource.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
