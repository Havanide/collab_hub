import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Toast from '../components/Toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email.trim(), password, displayName.trim() || 'Без имени', acceptPrivacy);
      nav('/app/home');
    } catch (err: any) {
      setToast(err?.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container authWrap">
      <Toast message={toast} onClose={() => setToast(null)} />
      <div className="authHero wb-gradient">
        <h1>Регистрация</h1>
        <p>Сделаем профиль селлера и дадим доступ к поиску партнёров.</p>
      </div>

      <div className="card authCard">
        <form onSubmit={onSubmit}>
          <div className="formRow">
            <label className="label">Имя</label>
            <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Например, Константин" />

            <label className="label">Email</label>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.ru" />

            <label className="label">Пароль (минимум 6 символов)</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8 }} className="small">
              <input type="checkbox" checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} />
              <span>
                Принимаю условия обработки персональных данных и политики конфиденциальности.
                <a href="/privacy" style={{ marginLeft: 6 }}>Открыть</a>
              </span>
            </label>

            <button className="btn btn-primary" disabled={busy || !acceptPrivacy}>
              {busy ? 'Создаю…' : 'Создать аккаунт'}
            </button>
          </div>
        </form>
        <div style={{ marginTop: 12 }} className="small">
          Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--wb-accent)', fontWeight: 800 }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
