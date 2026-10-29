/** The society's own channels. Used by the footer, the home page and JSON-LD. */
export const YOUTUBE_CHANNEL_ID = 'UCWS8nWcc1Pfje21dbDZjzBQ';

export type SocialChannel = {
  id: 'youtube' | 'facebook' | 'instagram';
  name: string;
  handle: string;
  url: string;
  about: { fi: string; en: string };
};

export const socialChannels: SocialChannel[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'Intelligenzia Ry',
    url: `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`,
    about: {
      fi: '"Mitä kummaa on kognitiotiede?" -seminaarien luennot ja paneelit',
      en: 'Talks and panels from the "Mitä kummaa on kognitiotiede?" seminars',
    },
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'intelligenziary',
    url: 'https://www.facebook.com/intelligenziary/',
    about: { fi: 'Tapahtumakutsut ja yhdistyksen uutiset', en: 'Event invitations and society news' },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@intelligenzia',
    url: 'https://www.instagram.com/intelligenzia/',
    about: { fi: 'Kuvia tapahtumista', en: 'Photos from our events' },
  },
];

export type YouTubeVideo = {
  id: string;
  title: string;
  published: Date;
  /** The seminar year in the title ("… 2019 - …"), else the upload year. */
  year: number;
  /** The talk itself, without the series prefix or suffix. */
  talk: string;
  series: string | null;
};

export const SEMINAR_SERIES = 'Mitä kummaa on kognitiotiede?';

const SEMINAR = /^Mit[äa] kummaa on kogni\w*\??\s*(\d{4})\s*-\s*(.+)$/i;
const NUMBERED = /^(.+?)\s*-\s*(.+?)\s+\d+\/\d+$/;

/** "Mitä kummaa on kognitiotiede? 2019 - Ben Cowley - High Performance
 *  Cognition" → year 2019, talk "Ben Cowley: High Performance Cognition". */
function describe(title: string, published: Date) {
  const seminar = title.match(SEMINAR);
  if (seminar) {
    return {
      year: Number(seminar[1]),
      talk: seminar[2].replace(/\s+-\s+/, ': '),
      series: SEMINAR_SERIES,
    };
  }
  const numbered = title.match(NUMBERED);
  if (numbered) return { year: published.getFullYear(), talk: numbered[1], series: numbered[2] };
  return { year: published.getFullYear(), talk: title, series: null };
}

/**
 * Latest uploads from the channel's public RSS feed: no API key, refreshed
 * daily. An unreachable feed returns nothing and the section shows the
 * channel link alone.
 */
export async function latestVideos(limit = 3): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const decode = (s: string) =>
      s
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map(([, entry]) => {
        const title = decode(entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? '');
        const published = new Date(entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? 0);
        return {
          id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? '',
          title,
          published,
          ...describe(title, published),
        };
      })
      .filter((v) => v.id && v.title)
      .sort((a, b) => b.published.getTime() - a.published.getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}
