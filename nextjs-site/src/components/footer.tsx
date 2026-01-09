import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Brain } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              <span className="font-semibold">Intelligenzia</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Kognitiotieteen alumnijärjestö
              <br />
              Helsingin yliopisto
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t('about')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/kognitiotiede" className="hover:text-foreground">
                  Kognitiotiede
                </Link>
              </li>
              <li>
                <Link href="/yhdistys" className="hover:text-foreground">
                  Yhdistys
                </Link>
              </li>
              <li>
                <Link href="/jaseneksi" className="hover:text-foreground">
                  Jäseneksi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t('contact')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>intelligenzia-hallitus@helsinki.fi</li>
              <li>
                Oppimiskeskus Minerva
                <br />
                PL 9, 00014 Helsingin yliopisto
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t('privacy')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/tietosuoja" className="hover:text-foreground">
                  Tietosuojaseloste
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} Intelligenzia ry. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
