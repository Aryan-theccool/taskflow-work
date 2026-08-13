import { useCallback, useState } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import BoardSection from './components/BoardSection';
import Insights from './components/Insights';
import Footer from './components/Footer';
import { ToastProvider } from './state/ToastContext';

export default function App() {
  // Bumped on every board mutation so Insights re-queries the database.
  const [dataVersion, setDataVersion] = useState(0);
  const handleDataChange = useCallback(() => setDataVersion((v) => v + 1), []);

  return (
    <ToastProvider>
      <Nav />
      <Hero />
      <Marquee />
      <main>
        <BoardSection onDataChange={handleDataChange} />
        <Insights version={dataVersion} />
      </main>
      <Footer />
    </ToastProvider>
  );
}
