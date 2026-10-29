import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { NeuralHexagonLazy } from '@/components/home/neural-hexagon-lazy';
import { vocabularyTerms } from '@/lib/vocabulary-data';
import { FULL_PRICE } from '@/lib/membership';

export default function HeroSection() {
  const t = useTranslations('home.hero');
  const locale = useLocale();
  const membershipHref = locale === 'fi' ? '/jaseneksi' : '/join';
  const glossaryHref = locale === 'fi' ? '/sanasto' : '/vocabulary';

  return (
    <section className="relative isolate overflow-hidden border-b">
      <div className="container mx-auto grid min-h-[calc(100dvh-4rem)] items-center gap-6 px-4 pt-14 pb-10 md:pt-20 lg:max-h-[960px] lg:grid-cols-12 lg:gap-0 lg:py-16">
        <div className="relative z-10 flex flex-col items-start gap-7 lg:col-span-6">
          <h1 className="display-hero max-w-[12ch] text-[clamp(2.75rem,6vw,5.75rem)] [text-wrap:initial]">
            {t('title')}
          </h1>

          <p className="max-w-[46ch] text-lg leading-relaxed text-pretty text-muted-foreground">
            {t('description')}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={membershipHref}
              className="group inline-flex items-center gap-3 rounded-sm bg-primary px-5 py-3.5 font-display text-[15px] font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              {t('ctaJoin')}
              <span className="font-mono text-xs font-normal opacity-75">
                {t('ctaJoinMeta', { price: FULL_PRICE })}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={glossaryHref}
              className="inline-flex items-center gap-3 rounded-sm border border-foreground/20 px-5 py-3.5 font-display text-[15px] font-semibold transition-[border-color,transform] duration-200 hover:border-foreground active:scale-[0.98]"
            >
              {t('ctaGlossary')}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {t('ctaGlossaryMeta', { count: vocabularyTerms.length })}
              </span>
            </Link>
          </div>
        </div>

        {/* Sized by the wrapper so the lazily loaded canvas causes no shift. */}
        <div className="h-[360px] w-full sm:h-[440px] lg:col-span-6 lg:h-[620px]">
          <NeuralHexagonLazy className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
