import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { SocialChannel } from '@/lib/social';

const icons = { youtube: Youtube, facebook: Facebook, instagram: Instagram };

export function SocialIcon({ id, className }: { id: SocialChannel['id']; className?: string }) {
  const Icon = icons[id];
  return <Icon className={className} aria-hidden="true" />;
}
