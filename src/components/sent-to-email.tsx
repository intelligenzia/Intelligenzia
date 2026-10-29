'use client';

import { useSyncExternalStore } from 'react';
import { SENT_TO_KEY } from '@/components/magic-link-form';

function readSentTo(): string | null {
  try {
    return sessionStorage.getItem(SENT_TO_KEY);
  } catch {
    // Storage blocked; the generic wording stands.
    return null;
  }
}

/** The address the magic link went to, if this tab just asked for one. */
export function SentToEmail({ fallback }: { fallback: string }) {
  const email = useSyncExternalStore(
    () => () => {},
    readSentTo,
    () => null
  );

  return email ? <strong className="font-medium text-foreground">{email}</strong> : <>{fallback}</>;
}
