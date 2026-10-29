import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const links = locale === 'fi' ? {
    cognitiveScience: { href: '/kognitiotiede', label: 'Kognitiotiede' },
    organization: { href: '/yhdistys', label: 'Yhdistys' },
    membership: { href: '/jaseneksi', label: 'Jäseneksi' },
    privacy: { href: '/tietosuoja', label: 'Tietosuojaseloste' },
  } : {
    cognitiveScience: { href: '/cognitive-science', label: 'Cognitive Science' },
    organization: { href: '/organization', label: 'Organization' },
    membership: { href: '/join', label: 'Join Us' },
    privacy: { href: '/privacy-policy', label: 'Privacy Policy' },
  };

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon.png" alt="Intelligenzia" width={24} height={24} className="dark:invert" />
              <span className="display-md text-lg">Intelligenzia</span>
            </Link>
            <p className="font-serif text-sm text-muted-foreground">
              {locale === 'fi' ? 'Kognitiotieteen alumniyhdistys' : 'Cognitive Science Alumni Society'}
              <br />
              {locale === 'fi' ? 'Helsingin yliopisto' : 'University of Helsinki'}
            </p>
          </div>

          <div>
            <h3 className="eyebrow mb-4">{t('about')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={links.cognitiveScience.href} className="hover:text-foreground">
                  {links.cognitiveScience.label}
                </Link>
              </li>
              <li>
                <Link href={links.organization.href} className="hover:text-foreground">
                  {links.organization.label}
                </Link>
              </li>
              <li>
                <Link href={links.membership.href} className="hover:text-foreground">
                  {links.membership.label}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">{t('contact')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:hallitus@intelligenzia.fi"
                  className="font-mono text-xs hover:text-foreground"
                >
                  hallitus@intelligenzia.fi
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">{t('privacy')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={links.privacy.href} className="hover:text-foreground">
                  {links.privacy.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center font-mono text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} Intelligenzia ry. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
