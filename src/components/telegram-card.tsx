import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageCircle } from 'lucide-react';

/**
 * The members' Telegram group. The invite link comes from TELEGRAM_GROUP_URL
 * and is only rendered for members, so it never appears on a public page.
 */
export function TelegramCard({ locale }: { locale: string }) {
  const url = process.env.TELEGRAM_GROUP_URL;
  if (!url) return null;
  const fi = locale === 'fi';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Telegram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-serif text-muted-foreground">
          {fi
            ? 'Jäsenten oma Telegram-ryhmä: tapahtumat, kuulumiset ja keskustelu. Älä jaa kutsulinkkiä eteenpäin.'
            : "The members' own Telegram group: events, news and chat. Please don't pass the invite link on."}
        </p>
        <Button asChild variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {fi ? 'Liity ryhmään' : 'Join the group'}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
