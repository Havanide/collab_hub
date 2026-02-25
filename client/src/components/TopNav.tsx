import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function TopNav() {
  const { logout, me } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    await logout();
    nav('/login');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const navLinks = [
    { to: '/app/home', label: 'Главная' },
    { to: '/app/filters', label: 'Фильтры' },
    { to: '/app/projects', label: 'Проекты' },
    { to: '/app/requests', label: 'Заявки' },
    { to: '/app/matches', label: 'Матчи' },
  ];

  return (
    <header className="topnav wb-gradient">
      <div className="container topnav-inner">
        <Link to="/app/home" className="brand">
          <img src="/logo.png" alt="logo" className="brand-logo" />
          <span className="brand-name">Сервис для коллабораций</span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          <div className="nav-user">{me?.profile?.display_name || me?.email}</div>
          <button className="btn btn-ghost" onClick={onLogout}>Выйти</button>
          {/* Burger button — mobile only */}
          <button
            className="burger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Меню"
          >
            <span className={`burger-icon ${menuOpen ? 'open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="container">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            ))}
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-user">{me?.profile?.display_name || me?.email}</div>
            <button className="btn btn-ghost mobile-menu-logout" onClick={() => { closeMenu(); onLogout(); }}>
              Выйти
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
