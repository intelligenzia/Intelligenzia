'use client';

import { createContext, useContext, type ReactNode } from 'react';

type AlternatePaths = Partial<Record<string, string>>;

const AlternatePathContext = createContext<AlternatePaths>({});

export function AlternatePathProvider({
  paths,
  children,
}: {
  paths: AlternatePaths;
  children: ReactNode;
}) {
  return (
    <AlternatePathContext.Provider value={paths}>
      {children}
    </AlternatePathContext.Provider>
  );
}

export function useAlternatePath(locale: string): string | undefined {
  const paths = useContext(AlternatePathContext);
  return paths[locale];
}
