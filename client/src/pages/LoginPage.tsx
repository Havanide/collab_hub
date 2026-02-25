import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Toast from '../components/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('collab1@collab.local');
  const [password, setPassword] = useState('demo1234');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      nav('/app/home');
    } catch (err: any) {
      setToast('Не удалось войти. Проверьте email/пароль.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container authWrap">
      <div className="authHero wb-gradient">
        <h1>Сервис для коллабораций</h1>
        <p>Вход в MVP: профиль селлера, поиск партнёров, фильтры, заявки.</p>
      </div>

      <div className="card authCard">
        <form onSubmit={onSubmit}>
          <div className="formRow">
            <div>
              <div className="label">Email</div>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="label">Пароль</div>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Вхожу…' : 'Войти'}
            </button>
            <div className="small">
              Нет аккаунта? <Link to="/register"><b>Зарегистрироваться</b></Link>
            </div>
          </div>
        </form>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
