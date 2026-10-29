'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { YouTubeEmbed } from './youtube-embed';

interface MarkdownProps {
  content: string;
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map((child: React.ReactNode) => getTextContent(child)).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>;
    return getTextContent(element.props.children);
  }
  return '';
}

function generateId(children: React.ReactNode): string {
  const text = getTextContent(children);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\säöå]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Video titles mapped by video ID
const VIDEO_TITLES: Record<string, string> = {
  'wGp--YkeItQ': 'Jaana Simola – When attention wanders',
  '6c1ripw40JQ': 'Jussi Palomäki – Poker, emotions and cosmic injustice',
  '5upKDD-rtMg': 'Ben Cowley – High Performance Cognition',
  'azUrd2y71bo': 'Panel Discussion: Jaana Simola, Ben Cowley, Jussi Palomäki',
  'xOtUe9axI44': 'Intro',
  '4FYzkvIdrhc': 'Jukka Häkkinen',
  'Cb-VhTFR8Ms': 'Anna-Mari Rusanen',
  'OO9rDhGTWSM': 'Alina Leminen',
  'Su8jWIhw_1I': 'Minna Huotilainen',
  'Y1rKohUkMh0': 'Ben Cowley',
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Preprocess content to group consecutive YouTube URLs
function preprocessContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let youtubeUrls: string[] = [];

  const flushYouTubeUrls = () => {
    if (youtubeUrls.length > 0) {
      // Create a special marker for video grid
      result.push(`<!-- YOUTUBE_GRID_START -->`);
      youtubeUrls.forEach(url => result.push(url));
      result.push(`<!-- YOUTUBE_GRID_END -->`);
      youtubeUrls = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isYouTubeUrl = trimmed.match(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/);

    if (isYouTubeUrl) {
      youtubeUrls.push(trimmed);
    } else if (trimmed === '') {
      // Empty line - continue collecting if we have URLs
      if (youtubeUrls.length === 0) {
        result.push(line);
      }
    } else {
      // Non-YouTube content - flush any collected URLs
      flushYouTubeUrls();
      result.push(line);
    }
  }

  // Flush any remaining URLs
  flushYouTubeUrls();

  return result.join('\n');
}

interface VideoGridProps {
  videoIds: string[];
}

function VideoGrid({ videoIds }: VideoGridProps) {
  return (
    <div className="my-8 grid gap-6 sm:grid-cols-2">
      {videoIds.map((videoId) => (
        <YouTubeEmbed
          key={videoId}
          videoId={videoId}
          title={VIDEO_TITLES[videoId]}
        />
      ))}
    </div>
  );
}

export function Markdown({ content }: MarkdownProps) {
  // Check for video grid markers and split content
  const processedContent = preprocessContent(content);

  // Split by grid markers and render
  const parts = processedContent.split(/<!-- YOUTUBE_GRID_START -->|<!-- YOUTUBE_GRID_END -->/);

  return (
    <>
      {parts.map((part, index) => {
        // Odd indices are video grids (content between START and END)
        if (index % 2 === 1) {
          const urls = part.trim().split('\n').filter(Boolean);
          const videoIds = urls
            .map(url => extractYouTubeId(url))
            .filter((id): id is string => id !== null);
          return <VideoGrid key={index} videoIds={videoIds} />;
        }

        // Even indices are regular markdown content
        if (!part.trim()) return null;

        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="display-lg mb-6 text-4xl">{children}</h1>
              ),
              h2: ({ children }) => {
                const id = generateId(children);
                return (
                  <h2 id={id} className="display-md mt-12 mb-4 scroll-mt-24 text-[1.75rem]">
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const id = generateId(children);
                return (
                  <h3 id={id} className="display-md mt-9 mb-3 scroll-mt-24 text-xl">
                    {children}
                  </h3>
                );
              },
              h4: ({ children }) => (
                <h4 className="mt-7 mb-2 font-display text-lg font-semibold">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="mb-6 max-w-[66ch] font-serif text-[1.09375rem] leading-[1.64]">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-6 ml-6 max-w-[66ch] list-disc space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 ml-6 max-w-[66ch] list-decimal space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="pl-1 font-serif text-[1.09375rem] leading-[1.64]">
                  {children}
                </li>
              ),
              a: ({ href, children }) => {
                // Check if this is a YouTube link that should be embedded
                if (href) {
                  const videoId = extractYouTubeId(href);
                  if (videoId) {
                    // If the link text is just the URL, render as embed
                    const childText = typeof children === 'string' ? children :
                      Array.isArray(children) ? children.join('') : '';
                    if (childText === href || childText.includes('youtube.com') || childText.includes('youtu.be')) {
                      return (
                        <div className="my-6">
                          <YouTubeEmbed videoId={videoId} title={VIDEO_TITLES[videoId]} />
                        </div>
                      );
                    }
                  }
                }

                return (
                  <a
                    href={href}
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="my-7 max-w-[62ch] border-l-2 border-primary pl-6 font-serif text-[1.09375rem] leading-[1.6] text-muted-foreground italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="my-7 overflow-x-auto rounded-sm border">
                  <table className="w-full border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b bg-muted">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="p-3 text-left font-display text-sm font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b p-3 font-serif text-base">{children}</td>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              hr: () => <hr className="my-10 max-w-[66ch] border-border" />,
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-7 overflow-x-auto rounded-sm bg-muted p-4 font-mono text-sm">
                  {children}
                </pre>
              ),
            }}
          >
            {part}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
