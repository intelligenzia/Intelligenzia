'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title || 'YouTube video'}
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
        className="group relative aspect-video w-full overflow-hidden rounded-lg bg-muted"
        aria-label={`Play video: ${title || 'YouTube video'}`}
      >
        <Image
          src={thumbnailUrl}
          alt={title || 'Video thumbnail'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackThumbnailUrl) {
              target.src = fallbackThumbnailUrl;
            }
          }}
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 fill-white text-white ml-0.5" />
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
