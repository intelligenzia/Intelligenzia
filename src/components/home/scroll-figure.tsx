'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Wraps an image so it settles into place as it enters (0.86 to 1) and recedes
 * as it leaves, keeping attention on whichever item is mid-viewport while the
 * heading beside it stays pinned.
 */
export function ScrollFigure({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = ref.current!;
        gsap.fromTo(
          el,
          { scale: 0.86, opacity: 0.4 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 60%', scrub: true },
          },
        );
        gsap.to(el, {
          opacity: 0.25,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: el, start: 'center 30%', end: 'bottom top', scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
}
