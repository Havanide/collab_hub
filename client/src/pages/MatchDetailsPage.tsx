import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Toast from '../components/Toast';
import { api, API_BASE, MatchDetails } from '../api';

export default function MatchDetailsPage() {
  const { id } = useParams();
  const matchId = String(id || '');
  const nav = useNavigate();

  const [data, setData] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api.getMatch(matchId);
      setData(d);
    } catch (e: any) {
      setToast(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [matchId]);

  const other = data?.other;

  return (
    <>
      <TopNav />
      <div className="container page">
        <div className="small"><Link to="/app/matches">← Назад к матчам</Link></div>

        {loading ? <div>Загрузка…</div> : null}

        {!loading && !data ? <div className="card cardPad">Матч не найден</div> : null}

        {data && other ? (
          <div className="grid grid-2">
            <div className="card cardPad">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {other.logo_path ? (
                  <img src={`${API_BASE}${other.logo_path}`} alt="logo" style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
                ) : (
                  <div className="brand-dot" />
                )}
                <div>
                  <h1 className="sectionTitle" style={{ margin: 0 }}>{other.brand_name || other.display_name}</h1>
                  <div className="small">Trust: {other.trust_level} ({other.trust_score}%) · {other.region || ''}</div>
                </div>
              </div>

              <hr className="hr" />

              <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{other.about || '—'}</div>

              <div className="kpiRow" style={{ marginTop: 10 }}>
                {(other.marketplaces || []).map(m => <span className="badge" key={m}>{m}</span>)}
                {(other.categories || []).slice(0, 6).map(c => <span className="badge" key={c}>{c}</span>)}
              </div>

              <div className="hr" />
              <div className="small"><b>Match статус:</b> {data.status === 'active' ? 'Активный' : 'Завершён'}</div>
              {data.ended_at ? <div className="small"><b>Завершён:</b> {new Date(data.ended_at).toLocaleString()}</div> : null}

              <div className="cardActions" style={{ marginTop: 12 }}>
                <Link className="btn" to={`/app/seller/${other.user_id}`}>Публичный профиль</Link>
                {data.status === 'active' ? (
                  <button
                    className="btn btn-ghost"
                    onClick={async () => {
                      if (!confirm('Разорвать сотрудничество?')) return;
                      try {
                        await api.terminateMatch(matchId);
                        setToast('Сотрудничество завершено');
                        await load();
                      } catch (e: any) {
                        setToast(e.message || 'Ошибка');
                      }
                    }}
                  >
                    Разорвать сотрудничество
                  </button>
                ) : null}
              </div>
            </div>

            <div className="card cardPad">
              <h2 className="sectionTitle" style={{ marginTop: 0 }}>Детали</h2>

              {data.project ? (
                <div style={{ marginBottom: 12 }}>
                  <div className="cardTitle">Проект: {data.project.title}</div>
                  <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{data.project.idea}</div>
                  {data.project.goals ? <div className="small"><b>Цели:</b> {data.project.goals}</div> : null}
                  {data.project.investments ? <div className="small"><b>Вложения:</b> {data.project.investments}</div> : null}
                  {data.project.responsibilities ? <div className="small"><b>Ответственности:</b> {data.project.responsibilities}</div> : null}
                </div>
              ) : null}

              {data.listing ? (
                <div style={{ marginBottom: 12 }}>
                  <div className="small"><b>По объявлению:</b> {data.listing.title}</div>
                </div>
              ) : null}

              {data.request?.pitch ? (
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                  <b>Сообщение:</b> {data.request.pitch}
                </div>
              ) : null}

              <hr className="hr" />
              <h3 className="cardTitle">Контакты и реквизиты</h3>
              {data.status === 'active' ? (
                <div className="small" style={{ lineHeight: 1.7 }}>
                  <div><b>Юр. название:</b> {other.legal_name || '—'}</div>
                  <div><b>ИНН:</b> {other.inn || '—'}</div>
                  <div><b>Телефон:</b> {other.phone || '—'}</div>
                  <div><b>Email:</b> {other.contact_email || '—'}</div>
                  <div><b>Telegram:</b> {other.contact_telegram || '—'}</div>
                </div>
              ) : (
                <div className="small">Match завершён — контакты скрыты.</div>
              )}

              <div className="small" style={{ marginTop: 12 }}>
                Если нужно поменять проект или условия — отправьте новую заявку.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
