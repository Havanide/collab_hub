import React, { useEffect, useMemo, useState } from 'react';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { api, API_BASE, MyProfile } from '../api';

const MP_OPTIONS = [
  { key: 'wildberries', label: 'Wildberries' },
  { key: 'ozon', label: 'Ozon' },
  { key: 'yandex', label: 'Яндекс.Маркет' }
];

const BIZ_TYPES = ['ИП', 'ООО', 'Самозанятый'];

function toNumberOrZero(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [draft, setDraft] = useState<MyProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trustLabel = useMemo(() => {
    if (!draft) return null;
    const lvl = draft.trust_level;
    if (lvl === 'high') return 'Высокое доверие';
    if (lvl === 'mid') return 'Среднее доверие';
    return 'Низкое доверие';
  }, [draft?.trust_level]);

  async function load() {
    const p = await api.getMyProfile();
    setProfile(p);
    setDraft(p);
  }

  useEffect(() => {
    load().catch(() => setToast('Не удалось загрузить профиль'));
  }, []);

  if (!draft) {
    return (
      <>
        <TopNav />
        <div className="container page">Загрузка…</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNav />
      <div className="container page">
        <h1 className="sectionTitle">Личный кабинет</h1>

        <div className="kpiRow" style={{ marginBottom: 12 }}>
          <span className="badge">Trust: {trustLabel} ({draft.trust_score}%)</span>
          {draft.trust_missing?.length ? (
            <span className="badge" title={draft.trust_missing.join(', ')}>Не заполнено: {draft.trust_missing.length}</span>
          ) : null}
        </div>

        <div className="grid grid-2">
          <div className="card cardPad">
            <div className="cardTitle">Публичные данные (видны в поиске)</div>
            <div className="small">Юр. реквизиты и контакты откроются только после взаимного match.</div>
            <div className="hr" />

            <div className="formRow">
              <label className="label">Имя</label>
              <input className="input" value={draft.display_name || ''} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />

              <label className="label">Название компании/бренда</label>
              <input className="input" value={draft.brand_name || ''} onChange={(e) => setDraft({ ...draft, brand_name: e.target.value })} placeholder="Например: MyBrand" />

              <label className="label">Описание</label>
              <textarea className="input" rows={4} value={draft.about || ''} onChange={(e) => setDraft({ ...draft, about: e.target.value })} placeholder="Что продаёте/делаете и что ищете" />

              <label className="label">Регион</label>
              <input className="input" value={draft.region || ''} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="Москва" />

              <label className="label">Маркетплейсы</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MP_OPTIONS.map((mp) => (
                  <button
                    key={mp.key}
                    className={draft.marketplaces?.includes(mp.key) ? 'chip active' : 'chip'}
                    onClick={() => {
                      const cur = new Set(draft.marketplaces || []);
                      if (cur.has(mp.key)) cur.delete(mp.key);
                      else cur.add(mp.key);
                      setDraft({ ...draft, marketplaces: Array.from(cur) });
                    }}
                    type="button"
                  >
                    {mp.label}
                  </button>
                ))}
              </div>

              <label className="label">Категории (через запятую)</label>
              <input
                className="input"
                value={(draft.categories || []).join(', ')}
                onChange={(e) => setDraft({ ...draft, categories: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })}
                placeholder="Одежда, Дом, Косметика"
              />

              <label className="label">Форма</label>
              <select className="input" value={draft.biz_type || ''} onChange={(e) => setDraft({ ...draft, biz_type: e.target.value || null })}>
                <option value="">—</option>
                {BIZ_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
              </select>

              <label className="label">Оборот/месяц (₽)</label>
              <input
                className="input"
                value={String(draft.sales_monthly_rub ?? 0)}
                onChange={(e) => setDraft({ ...draft, sales_monthly_rub: toNumberOrZero(e.target.value) })}
                placeholder="350000"
              />

              <label className="label">Логотип (png/jpg/webp до 2MB)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {draft.logo_path ? (
                  <img src={draft.logo_path.startsWith('http') ? draft.logo_path : `${API_BASE}${draft.logo_path}`} alt="logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
                ) : (
                  <div className="badge">нет</div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setBusy(true);
                      const r = await api.uploadLogo(f);
                      setDraft({ ...draft, logo_path: r.logo_path, trust_level: r.trust_level, trust_score: r.trust_score, trust_missing: r.trust_missing });
                      setToast('Логотип загружен');
                    } catch (err: any) {
                      setToast(err?.message || 'Не удалось загрузить');
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card cardPad">
            <div className="cardTitle">Скрытые данные (открываются после match)</div>
            <div className="small">Телефон обязателен для сохранения профиля (без SMS на MVP).</div>
            <div className="hr" />

            <div className="formRow">
              <label className="label">Юридическое название</label>
              <input className="input" value={draft.legal_name || ''} onChange={(e) => setDraft({ ...draft, legal_name: e.target.value })} placeholder={'ООО "Ромашка"'} />

              <label className="label">ИНН</label>
              <input className="input" value={draft.inn || ''} onChange={(e) => setDraft({ ...draft, inn: e.target.value })} placeholder="10 или 12 цифр" />

              <label className="label">Телефон (+7…)</label>
              <input className="input" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+7 999 000-00-00" />

              <label className="label">Email для связи</label>
              <input className="input" value={draft.contact_email || ''} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} placeholder="optional" />

              <label className="label">Telegram</label>
              <input className="input" value={draft.contact_telegram || ''} onChange={(e) => setDraft({ ...draft, contact_telegram: e.target.value })} placeholder="@nickname" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      const updated = await api.updateMyProfile(draft);
                      setProfile(updated);
                      setDraft(updated);
                      setToast('Сохранено');
                    } catch (err: any) {
                      setToast(err?.message || 'Ошибка сохранения');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  type="button"
                >
                  {busy ? 'Сохраняю…' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }} className="small">
          Подсказка: объявления для поиска создаются на страницах «Главная» и «Фильтры» (кнопка «Предложить проект» в карточке).
        </div>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}
