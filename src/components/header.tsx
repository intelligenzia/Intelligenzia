'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/page-mapping';
import { signOut } from 'next-auth/react';

type HeaderProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: 'USER' | 'ADMIN';
  } | null;
};

export function Header({ user }: HeaderProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const locale = useLocale() as 'fi' | 'en';
  const items = navItems[locale];
  const loginHref = locale === 'fi' ? '/kirjaudu' : '/login';
  const membershipHref = locale === 'fi' ? '/jasenyyys' : '/my-membership';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Intelligenzia" width={24} height={24} className="dark:invert" />
          <span className="font-semibold">Intelligenzia</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden gap-2 md:flex">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || 'Käyttäjä'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={membershipHref} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {locale === 'fi' ? 'Jäsenyys' : 'Membership'}
                  </Link>
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {locale === 'fi' ? 'Kirjaudu ulos' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="hidden md:flex">
              <Link href={loginHref}>{t('login')}</Link>
            </Button>
          )}

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="mt-8 flex flex-col gap-4">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-lg font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
                {user ? (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href={membershipHref}
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      {locale === 'fi' ? 'Jäsenyys' : 'Membership'}
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Admin
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => signOut({ callbackUrl: `/${locale}` })}
                      className="mt-2"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {locale === 'fi' ? 'Kirjaudu ulos' : 'Sign out'}
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-4">
                    <Link href={loginHref}>{t('login')}</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
