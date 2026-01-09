import { useTranslations, useLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, Calendar, BookOpen, ArrowRight } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </>
  );
}

function HeroSection() {
  const t = useTranslations('home.hero');
  const locale = useLocale();
  const membershipHref = locale === 'fi' ? '/jaseneksi' : '/membership';
  const learnMoreHref = locale === 'fi' ? '/kognitiotiede' : '/cognitive-science';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
            <Brain className="h-4 w-4" />
            <span>{t('subtitle')}</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            {t('title')}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            {t('description')}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
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

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations('membership.benefits');
  const tHome = useTranslations('home');
  const locale = useLocale();

  const features = [
    {
      icon: Users,
      title: t('networking'),
      description: locale === 'fi'
        ? 'Tapaa alan ammattilaisia ja laajenna verkostoasi.'
        : 'Meet professionals in the field and expand your network.',
    },
    {
      icon: Calendar,
      title: t('events'),
      description: locale === 'fi'
        ? 'Osallistu jäsentapahtumiin ja seminaareihin.'
        : 'Participate in member events and seminars.',
    },
    {
      icon: BookOpen,
      title: t('newsletter'),
      description: locale === 'fi'
        ? 'Pysy ajan tasalla alan kehityksestä.'
        : 'Stay up to date with developments in the field.',
    },
    {
      icon: Brain,
      title: t('community'),
      description: locale === 'fi'
        ? 'Liity aktiiviseen kognitiotieteen yhteisöön.'
        : 'Join an active cognitive science community.',
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">
            {locale === 'fi'
              ? 'Miksi liittyä Intelligenzian jäseneksi?'
              : 'Why join Intelligenzia?'}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-muted/50">
              <CardHeader>
                <feature.icon className="mb-2 h-10 w-10 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const t = useTranslations('membership');
  const locale = useLocale();
  const membershipHref = locale === 'fi' ? '/jaseneksi' : '/membership';
  const loginHref = locale === 'fi' ? '/kirjaudu' : '/login';

  return (
    <section className="bg-muted/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">{t('title')}</h2>
          <p className="mb-8 text-muted-foreground">
            {locale === 'fi'
              ? 'Liity mukaan kognitiotieteen alumniyhteisöön ja verkostoidu alan ammattilaisten kanssa.'
              : 'Join the cognitive science alumni community and network with professionals in the field.'}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={membershipHref}>{t('join')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={loginHref}>{t('login')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
