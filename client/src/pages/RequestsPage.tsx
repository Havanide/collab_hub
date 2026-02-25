import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { api, MatchRequest } from '../api';

export default function RequestsPage() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<MatchRequest[]>([]);
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([api.incomingRequests(), api.outgoingRequests()]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e: any) {
      setToast(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = tab === 'incoming' ? incoming : outgoing;

  return (
    <>
      <TopNav />
      <div className="container page">
        <h1 className="sectionTitle">Заявки на match</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={tab === 'incoming' ? 'chip active' : 'chip'} onClick={() => setTab('incoming')}>Входящие ({incoming.length})</button>
          <button className={tab === 'outgoing' ? 'chip active' : 'chip'} onClick={() => setTab('outgoing')}>Исходящие ({outgoing.length})</button>
          <button className="btn btn-ghost" onClick={load}>Обновить</button>
        </div>

        <hr className="hr" />

        {loading ? (
          <div>Загрузка…</div>
        ) : rows.length === 0 ? (
          <div className="card cardPad">Пока пусто.</div>
        ) : (
          <div className="list">
            {rows.map(r => (
              <RequestCard
                key={r.id}
                req={r}
                mode={tab}
                onAction={async (fn) => {
                  try {
                    await fn();
                    await load();
                  } catch (e: any) {
                    setToast(e.message || 'Ошибка');
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}

function statusBadge(status: MatchRequest['status']) {
  if (status === 'pending') return 'Ожидает';
  if (status === 'accepted') return 'Принята (ждёт подтверждения)';
  if (status === 'confirmed') return 'Подтверждена (match)';
  if (status === 'rejected') return 'Отклонена';
  return 'Отменена';
}

function RequestCard({
  req,
  mode,
  onAction
}: {
  req: MatchRequest;
  mode: 'incoming' | 'outgoing';
  onAction: (fn: () => Promise<any>) => void;
}) {
  return (
    <div className="card cardPad">
      <div className="kpiRow">
        <span className="badge">{statusBadge(req.status)}</span>
        {req.listing?.kind ? <span className="badge">{req.listing.kind}</span> : null}
      </div>

      <div className="cardTitle" style={{ marginTop: 10 }}>
        {req.listing?.title || `Listing #${req.listing_id}`}
      </div>

      <div className="small" style={{ marginTop: 6 }}>
        Проект: <b>{req.project?.title || `#${req.project_id}`}</b>
      </div>

      {req.pitch ? (
        <div className="small" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
          <b>Сообщение:</b> {req.pitch}
        </div>
      ) : null}

      <div className="small" style={{ marginTop: 6 }}>
        {mode === 'incoming' ? (
          <>От: <b>{req.from?.brand_name || req.from?.display_name || `#${req.from_user_id}`}</b></>
        ) : (
          <>Кому: <b>{req.to?.brand_name || req.to?.display_name || `#${req.to_user_id}`}</b></>
        )}
      </div>

      <div className="cardActions">
        {mode === 'incoming' && req.status === 'pending' ? (
          <>
            <button className="btn btn-primary" onClick={() => onAction(() => api.acceptRequest(req.id))}>
              Принять (шаг 1)
            </button>
            <button className="btn btn-ghost" onClick={() => onAction(() => api.rejectRequest(req.id))}>
              Отклонить
            </button>
          </>
        ) : null}

        {mode === 'incoming' && req.status === 'accepted' ? (
          <div className="small">Вы приняли заявку. Теперь отправитель должен подтвердить match (шаг 2).</div>
        ) : null}

        {mode === 'outgoing' && req.status === 'pending' ? (
          <button className="btn btn-ghost" onClick={() => onAction(() => api.cancelRequest(req.id))}>
            Отменить
          </button>
        ) : null}

        {mode === 'outgoing' && req.status === 'accepted' ? (
          <>
            <button
              className="btn btn-primary"
              onClick={() =>
                onAction(async () => {
                  const r = await api.confirmRequest(req.id);
                  return r;
                })
              }
            >
              Подтвердить match (шаг 2)
            </button>
            <button className="btn btn-ghost" onClick={() => onAction(() => api.cancelRequest(req.id))}>
              Отозвать
            </button>
          </>
        ) : null}

        {mode === 'outgoing' && req.status === 'confirmed' && req.match_id ? (
          <Link className="btn btn-primary" to={`/app/match/${req.match_id}`}>Открыть match</Link>
        ) : null}
      </div>
    </div>
  );
}
