import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function TopNav() {
  const { logout, me } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    await logout();
    nav('/login');
  }

  return (
    <header className="topnav wb-gradient">
      <div className="container topnav-inner">
        <Link to="/app/home" className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Сервис для коллабораций</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/app/home" className={({ isActive }) => (isActive ? 'active' : '')}>Главная</NavLink>
          <NavLink to="/app/filters" className={({ isActive }) => (isActive ? 'active' : '')}>Фильтры</NavLink>
          <NavLink to="/app/projects" className={({ isActive }) => (isActive ? 'active' : '')}>Проекты</NavLink>
          <NavLink to="/app/requests" className={({ isActive }) => (isActive ? 'active' : '')}>Заявки</NavLink>
          <NavLink to="/app/matches" className={({ isActive }) => (isActive ? 'active' : '')}>Матчи</NavLink>
        </nav>

        <div className="nav-right">
          <div className="nav-user">{me?.profile?.display_name || me?.email}</div>
          <button className="btn btn-ghost" onClick={onLogout}>Выйти</button>
        </div>
      </div>
    </header>
  );
}
