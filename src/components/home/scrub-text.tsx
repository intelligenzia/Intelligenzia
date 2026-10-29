'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A statement that is read word by word as it scrolls through the viewport.
 * The scrub ties reading pace to the reader, which is the point: it slows the
 * one sentence on the page that defines the field. Static under reduced motion.
 */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-word]',
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.08,
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 82%',
              end: 'bottom 50%',
              scrub: 0.6,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} data-word>
          {word}{' '}
        </span>
      ))}
    </p>
  );
}
