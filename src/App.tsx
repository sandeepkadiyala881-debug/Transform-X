import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Transform } from '@/pages/Transform';
import { Outputs } from '@/pages/Outputs';
import { OutputPreview } from '@/pages/OutputPreview';
import { History } from '@/pages/History';
import { Analytics } from '@/pages/Analytics';
import { Workspace } from '@/pages/Workspace';
import { Settings } from '@/pages/Settings';

/** Scrolls to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transform" element={<Transform />} />
          <Route path="/outputs" element={<Outputs />} />
          <Route path="/outputs/:id" element={<OutputPreview />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
