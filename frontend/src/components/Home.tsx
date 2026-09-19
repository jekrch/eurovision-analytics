import React, { useEffect, useState } from 'react';
import Navbar from './NavBar';
import StatCharts from './StatCharts';
import CountriesPage from './countries/CountriesPage';
import JuryTelevotePage from './juryTelevote/JuryTelevotePage';
import VotingPage from './voting/VotingPage';

const pages: Record<string, React.FC> = {
  stats: StatCharts,
  countries: CountriesPage,
  voting: VotingPage,
  jury: JuryTelevotePage,
};

// the page lives in the URL hash so each one can be linked to and survives a reload
const pageFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  return hash in pages ? hash : 'stats';
};

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState(pageFromHash);

  useEffect(() => {
    const onHashChange = () => setActiveTab(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = (tab: string) => {
    window.location.hash = tab;
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const navItems = [
    { label: 'Stats', path: 'stats' },
    { label: 'Countries', path: 'countries' },
    { label: 'Voting Blocs', path: 'voting' },
    { label: 'Jury vs Televote', path: 'jury' },
    { label: 'Neo4J', url: 'http://localhost:7474' },
    { label: 'GraphQL', url: 'http://localhost:4000' },
  ];

  const Page = pages[activeTab];

  return (
    <div className="page-bg min-h-screen w-full text-[var(--er-text-tertiary)]">
      <Navbar
        items={navItems}
        activePath={activeTab}
        handleTabChange={handleTabChange}
      />

      <main>
        <Page />
      </main>
    </div>
  );
};

export default Home;
