import { LogoMark } from './Nav';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <LogoMark size={22} />
          <span>TaskFlow</span>
        </div>
        <p className="footer__line">
          Board · Columns · Tasks — persisted in SQLite, validated on the server,
          rendered with React, sculpted in Three.js, moved by GSAP.
        </p>
        <p className="footer__meta">
          React 19 · Express · node:sqlite · @react-three/fiber · GSAP ScrollTrigger
        </p>
      </div>
    </footer>
  );
}
