'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

const pageStyle: CSSProperties = {
  flex: 1,
  padding: '32px',
  overflowY: 'auto',
};

const fullBleedStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

interface AuthLayoutInnerProps {
  children: ReactNode;
  topBar?: ReactNode;
}

export function AuthLayoutInner({ children, topBar }: AuthLayoutInnerProps) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/settings');
  const isTrainingDetail = pathname.startsWith('/training/') && pathname !== '/training';
  const useFullBleed = isSettings || isTrainingDetail;

  return (
    <>
      {!isSettings && topBar}
      <main style={useFullBleed ? fullBleedStyle : pageStyle}>
        {children}
      </main>
    </>
  );
}
