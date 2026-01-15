'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Brain3D = dynamic(() => import('@/components/brain-3d'), {
  ssr: false,
  loading: () => null,
});

export default function HeroSection() {
  const t = useTranslations('home.hero');
  const locale = useLocale();
  const membershipHref = locale === 'fi' ? '/jaseneksi' : '/join';
  const learnMoreHref = locale === 'fi' ? '/kognitiotiede' : '/cognitive-science';

  return (
    <section className="relative border-b bg-muted/40 overflow-hidden">
      <Brain3D />
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
            <Image src="/icon.png" alt="" width={16} height={16} className="dark:invert" />
            <span>{t('subtitle')}</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            {t('description')}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={membershipHref}>
                {t('cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={learnMoreHref}>{t('learnMore')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
