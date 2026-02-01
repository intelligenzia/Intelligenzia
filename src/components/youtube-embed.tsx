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
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-8 w-8 fill-white text-white ml-1" />
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-sm font-medium text-white line-clamp-2">{title}</p>
        </div>
      )}
    </button>
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
