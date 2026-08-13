export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="52" rx="5" fill="#4f6df5" />
      <rect x="24" y="6" width="16" height="34" rx="5" fill="#22d3ee" />
      <rect x="44" y="6" width="16" height="44" rx="5" fill="#7c8ff8" opacity="0.55" />
    </svg>
  );
}

export default function Nav() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <header className="nav">
      <button className="nav__brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <LogoMark />
        <span>TaskFlow</span>
      </button>
      <nav className="nav__links">
        <button onClick={() => scrollTo('board')}>Board</button>
        <button onClick={() => scrollTo('insights')}>Insights</button>
        <a
          className="nav__github"
          href="https://github.com/Aryan-theccool/taskflow-"
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.12v3.15c0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
          </svg>
        </a>
      </nav>
    </header>
  );
}
