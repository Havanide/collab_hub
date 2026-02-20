import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function PrivacyPage() {
  const [text, setText] = useState<{ cookies: string; personal_data: string } | null>(null);

  useEffect(() => {
    api.privacy().then(setText).catch(() => {
      setText({
        cookies: 'Используем только технические cookie для авторизации.',
        personal_data: 'Приватные реквизиты раскрываются только после match.'
      });
    });
  }, []);

  return (
    <div className="container page">
      <h1 className="sectionTitle">Политика конфиденциальности (MVP)</h1>
      <div className="card cardPad">
        <h3 className="cardTitle">Cookie</h3>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }} className="small">{text?.cookies || '…'}</div>
        <hr className="hr" />
        <h3 className="cardTitle">Персональные данные</h3>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }} className="small">{text?.personal_data || '…'}</div>
        <hr className="hr" />
        <div className="small">
          Важно: это учебный MVP. Не используйте реальные паспортные данные. Для ИНН и телефона допустимы тестовые значения.
        </div>
      </div>
    </div>
  );
}
