'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  locale: string;
}

export function SignOutButton({ locale }: SignOutButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {locale === 'fi' ? 'Kirjaudu ulos' : 'Sign out'}
    </Button>
  );
}
