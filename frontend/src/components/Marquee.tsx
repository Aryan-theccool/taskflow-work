import { useEffect, useRef } from 'react';
import { gsap } from '../gsapSetup';

const WORDS = ['Create', 'Prioritize', 'Move', 'Filter', 'Persist', 'Ship'];

export default function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const tween = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 26,
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  const row = (ariaHidden: boolean) => (
    <div className="marquee__row" aria-hidden={ariaHidden}>
      {WORDS.map((word) => (
        <span key={word} className="marquee__item">
          {word}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" fill="currentColor" opacity="0.7" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" aria-label="Create, prioritize, move, filter, persist, ship">
      <div className="marquee__track" ref={trackRef}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
