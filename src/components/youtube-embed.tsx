'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from 'next-intl';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const fi = useLocale() === 'fi';
  const label = title || (fi ? 'YouTube-video' : 'YouTube video');
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {title && (
          <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">{title}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsPlaying(true)}
        className="group relative aspect-video w-full overflow-hidden bg-muted"
        aria-label={`${fi ? 'Toista video' : 'Play video'}: ${label}`}
      >
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackThumbnailUrl) {
              target.src = fallbackThumbnailUrl;
            }
          }}
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </div>
        </div>
      </button>
      {title && (
        <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">{title}</p>
      )}
    </div>
  );
}

interface YouTubeVideoGridProps {
  videos: { id: string; title: string }[];
}

export function YouTubeVideoGrid({ videos }: YouTubeVideoGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {videos.map((video) => (
        <YouTubeEmbed key={video.id} videoId={video.id} title={video.title} />
      ))}
    </div>
  );
}
