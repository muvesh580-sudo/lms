import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ServerWakingNotice from './ServerWakingNotice';

const Layout: React.FC = () => {
  const { pathname } = useLocation();

  // Start each page at the top; search filters only change the query string, so they stay put
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ServerWakingNotice />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;