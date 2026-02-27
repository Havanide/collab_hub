import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import ProposeProjectForm from '../components/ProposeProjectForm';
import { api, Listing } from '../api';
import { useAuth } from '../auth';

function kindLabel(kind: Listing['kind']) {
  if (kind === 'collab') return 'Партнёрство';
  if (kind === 'service') return 'Услуга';
  return 'Поставщик';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'loading' | 'swipe' | 'empty';

export default function MatchSwipePage() {
  const nav = useNavigate();
  const { me } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [listings, setListings] = useState<Listing[]>([]);
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let fetchedListings: Listing[] = [];

    // Загружаем все листинги параллельно с таймером лоадера
    const fetchPromise = api.searchListings({}).then(all => {
      if (!mounted) return;
      const own = me?.userId;
      fetchedListings = shuffle(all.filter(l => l.owner_user_id !== own && l.published !== false));
      setListings(fetchedListings);
    }).catch(() => {
      if (mounted) setToast('Не удалось загрузить объявления');
    });

    // Минимум 3 секунды лоадер
    const timer = new Promise<void>(resolve => setTimeout(resolve, 3000));

    Promise.all([fetchPromise, timer]).then(() => {
      if (!mounted) return;
      setPhase(fetchedListings.length === 0 ? 'empty' : 'swipe');
    });

    return () => { mounted = false; };
  }, []);

  // Переключение к следующей карточке
  function goNext() {
    const nextIndex = index + 1;
    if (nextIndex >= listings.length) {
      setPhase('empty');
    } else {
      setIndex(nextIndex);
    }
  }

  function handleSkip() {
    goNext();
  }

  function handlePropose() {
    setModalOpen(true);
  }

  function handleProposeDone() {
    setModalOpen(false);
    setToast('Заявка отправлена ✅');
    goNext();
  }

  const current = listings[index] ?? null;

  // ── LOADING PHASE ──────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="swipe-screen">
        <div className="swipe-loader-ring" />
        <div className="swipe-loader-text">Подготавливаем матчи…</div>
        <div className="swipe-loader-sub">Ищем подходящих партнёров для вас</div>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // ── EMPTY PHASE ────────────────────────────────────────────────
  if (phase === 'empty' || !current) {
    return (
      <div className="swipe-screen">
        <div className="swipe-empty">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2>Вы просмотрели все объявления</h2>
          <p>Загляните позже — новые партнёры появляются каждый день</p>
          <button className="btn btn-match" onClick={() => nav(-1)}>
            ← Вернуться назад
          </button>
        </div>
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // ── SWIPE PHASE ────────────────────────────────────────────────
  const owner = current.owner;

  return (
    <>
      {/* Top bar */}
      <div className="swipe-topbar">
        <button className="swipe-exit-btn" onClick={() => nav(-1)}>
          ← Выйти
        </button>
        <span className="swipe-progress">
          {index + 1} / {listings.length}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="swipe-body">
        <div className="swipe-card-wrap">
          <div className="swipe-card">
            {/* Badges */}
            <div className="kpiRow" style={{ marginBottom: 12 }}>
              <span className="badge">{kindLabel(current.kind)}</span>
              {owner?.trust_level && (
                <span className="badge">Trust: {owner.trust_level}</span>
              )}
              {current.marketplaces?.slice(0, 2).map(m => (
                <span className="badge" key={m}>{m}</span>
              ))}
            </div>

            {/* Title */}
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'var(--wb-midnight)' }}>
              {current.title}
            </h2>

            {/* Owner + region */}
            <div className="cardMeta" style={{ marginBottom: 12 }}>
              <span>👤 {owner?.brand_name || owner?.display_name || 'Участник'}</span>
              {(owner?.region || current.region) && (
                <span>📍 {owner?.region || current.region}</span>
              )}
            </div>

            {/* Description */}
            {current.description && (
              <p style={{ margin: '0 0 16px', color: 'rgba(0,0,0,0.72)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {current.description}
              </p>
            )}

            {/* Categories */}
            {current.categories?.length ? (
              <div className="kpiRow" style={{ marginBottom: 10 }}>
                {current.categories.slice(0, 4).map(c => (
                  <span className="badge" key={c}>{c}</span>
                ))}
              </div>
            ) : null}

            {/* Tags */}
            {current.tags?.length ? (
              <div className="kpiRow">
                {current.tags.slice(0, 4).map(t => (
                  <span className="badge" key={t}>#{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="swipe-actions">
        <button className="swipe-btn-skip" onClick={handleSkip}>
          ✕ Пропустить
        </button>
        <button className="swipe-btn-propose" onClick={handlePropose}>
          ♥ Предложить проект
        </button>
      </div>

      {/* Modal: ProposeProjectForm */}
      {modalOpen && current && (
        <div
          className="modalOverlay"
          style={{ zIndex: 1005 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Предложить проект</h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="small" style={{ marginBottom: 8 }}>
              {current.title} · {owner?.brand_name || owner?.display_name}
            </div>
            <hr className="hr" />
            <ProposeProjectForm
              listing={current}
              onDone={handleProposeDone}
              onError={m => setToast(m)}
            />
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
