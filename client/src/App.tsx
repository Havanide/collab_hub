import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';

import CookieBanner from './components/CookieBanner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import FiltersPage from './pages/FiltersPage';
import ListingPage from './pages/ListingPage';
import MyProfilePage from './pages/MyProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import ProjectsPage from './pages/ProjectsPage';
import RequestsPage from './pages/RequestsPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import PrivacyPage from './pages/PrivacyPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <div className="container page">Загрузка…</div>;
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/app/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route
          path="/app/home"
          element={
            <Protected>
              <HomePage />
            </Protected>
          }
        />
        <Route
          path="/app/filters"
          element={
            <Protected>
              <FiltersPage />
            </Protected>
          }
        />
        <Route
          path="/app/projects"
          element={
            <Protected>
              <ProjectsPage />
            </Protected>
          }
        />
        <Route
          path="/app/requests"
          element={
            <Protected>
              <RequestsPage />
            </Protected>
          }
        />
        <Route
          path="/app/matches"
          element={
            <Protected>
              <MatchesPage />
            </Protected>
          }
        />
        <Route
          path="/app/match/:id"
          element={
            <Protected>
              <MatchDetailsPage />
            </Protected>
          }
        />
        <Route
          path="/app/listing/:id"
          element={
            <Protected>
              <ListingPage />
            </Protected>
          }
        />
        <Route
          path="/app/profile"
          element={
            <Protected>
              <MyProfilePage />
            </Protected>
          }
        />
        <Route
          path="/app/seller/:userId"
          element={
            <Protected>
              <PublicProfilePage />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>

      <CookieBanner />
    </div>
  );
}
