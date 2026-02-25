import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { api, MatchListItem, API_BASE } from '../api';

export default function MatchesPage() {
  const [rows, setRows] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listMatches();
      setRows(data);
    } catch (e: any) {
      setToast(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <TopNav />
      <div className="container page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="sectionTitle">Матчи</h1>
          <button className="btn btn-ghost" onClick={load}>Обновить</button>
        </div>

        <hr className="hr" />

        {loading ? (
          <div>Загрузка…</div>
        ) : rows.length === 0 ? (
          <div className="card cardPad">Пока нет match. Прими/получи заявку.</div>
        ) : (
          <div className="list">
            {rows.map(m => (
              <Link key={m.id} to={`/app/match/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card cardPad" style={{ cursor: 'pointer' }}>
                  <div className="kpiRow">
                    <span className="badge">{m.status === 'active' ? 'Активный' : 'Завершён'}</span>
                    {m.other?.trust_level ? <span className="badge">Trust: {m.other.trust_level}</span> : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.other?.logo_path ? (
                        <img
                          src={`${API_BASE}${m.other.logo_path}`}
                          alt="logo"
                          style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div className="brand-dot" />
                      )}
                      <div>
                        <div className="cardTitle" style={{ margin: 0 }}>{m.other?.brand_name || m.other?.display_name || 'Партнёр'}</div>
                        <div className="small">{m.other?.region || ''}</div>
                      </div>
                    </div>
                    <div className="small">
                      {m.status === 'ended' && m.ended_at ? `Завершён: ${new Date(m.ended_at).toLocaleString()}` : ''}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}
