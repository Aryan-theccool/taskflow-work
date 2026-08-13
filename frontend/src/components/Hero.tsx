import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { scrollStore } from '../three/scrollStore';
import { gsap, ScrollTrigger } from '../gsapSetup';

// Three.js is heavy — load it as its own chunk after first paint.
const HeroScene = lazy(() => import('../three/HeroScene'));

function SplitChars({ text, className }: { text: string; className?: string }) {
  const chars = useMemo(
    () =>
      [...text].map((ch, i) => (
        <span key={i} className="hero-char" aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      )),
    [text]
  );
  return (
    <span className={className} aria-label={text}>
      {chars}
    </span>
  );
}

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Entrance — characters tumble in, then supporting copy
      gsap
        .timeline({ delay: 0.25 })
        .from('.hero-char', {
          yPercent: 118,
          rotateX: -75,
          opacity: 0,
          stagger: 0.032,
          duration: 0.9,
          ease: 'power4.out',
        })
        .from('.hero-badge', { y: 24, opacity: 0, duration: 0.6 }, '-=0.55')
        .from('.hero-sub', { y: 26, opacity: 0, filter: 'blur(10px)', duration: 0.7 }, '-=0.4')
        .from('.hero-actions > *', { y: 22, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.45')
        .from('.hero-scrollhint', { opacity: 0, duration: 0.6 }, '-=0.2');

      // Pinned scroll: fade the copy, drive the WebGL scene via scrollStore
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=95%',
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          scrollStore.hero = self.progress;
        },
      });
      gsap.to('.hero-content', {
        opacity: 0,
        y: -90,
        filter: 'blur(14px)',
        ease: 'none',
        scrollTrigger: { trigger: root, start: '12% top', end: '+=70%', scrub: true },
      });
      gsap.to('.hero-scrollhint', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: '+=18%', scrub: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  // Magnetic CTA
  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn) return;
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mousemove', onMove);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="hero" ref={rootRef} aria-label="TaskFlow intro">
      <div className="hero-canvas-wrap">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>

      <div className="hero-content">
        <p className="hero-badge">
          <span className="hero-badge__pulse" />
          React · Express · SQLite — a real full-stack board
        </p>
        <h1 className="hero-title">
          <SplitChars text="Work that" className="hero-title__line" />
          <SplitChars text="flows." className="hero-title__line hero-title__line--accent" />
        </h1>
        <p className="hero-sub">
          A kanban for one focused team. Every card you see is created, moved and
          persisted against a live SQLite API — no local state theater.
        </p>
        <div className="hero-actions">
          <button
            ref={ctaRef}
            className="btn btn--primary btn--lg"
            onClick={() =>
              document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Enter the board
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4v14m0 0 6-6m-6 6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a
            className="btn btn--ghost btn--lg"
            href="https://github.com/Aryan-theccool/taskflow-"
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        </div>
      </div>

      <div className="hero-scrollhint" aria-hidden="true">
        <span>scroll</span>
        <div className="hero-scrollhint__track">
          <div className="hero-scrollhint__thumb" />
        </div>
      </div>
    </section>
  );
}
