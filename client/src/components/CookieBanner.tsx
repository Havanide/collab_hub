import React, { useEffect, useState } from 'react';
import { api } from '../api';

const KEY = 'collab_cookie_ok_v1';

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem(KEY);
    if (!ok) setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 16,
      right: 16,
      bottom: 16,
      background: 'white',
      border: '1px solid #e6e6e6',
      borderRadius: 12,
      padding: 12,
      boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 860, lineHeight: 1.35 }}>
          Используем только технические cookie для авторизации и работы сервиса. Аналитику не собираем.
          <a href="/privacy" style={{ marginLeft: 8 }}>Подробнее</a>
        </div>
        <button
          className="btn"
          onClick={async () => {
            localStorage.setItem(KEY, '1');
            setOpen(false);
            // best-effort consent (если пользователь залогинен)
            try { await api.consent('cookies'); } catch {}
          }}
        >
          Ок
        </button>
      </div>
    </div>
  );
}
