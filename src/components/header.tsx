'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Menu, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/page-mapping';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const locale = useLocale() as 'fi' | 'en';
  const items = navItems[locale];
  const loginHref = locale === 'fi' ? '/kirjaudu' : '/login';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
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
          <Button asChild variant="default" size="sm" className="hidden md:flex">
            <Link href={loginHref}>{t('login')}</Link>
          </Button>

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
                <Button asChild className="mt-4">
                  <Link href={loginHref}>{t('login')}</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
