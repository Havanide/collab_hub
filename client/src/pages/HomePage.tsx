import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { api, Listing, ListingKind } from '../api';

const KIND_TABS: Array<{key: ListingKind|''; label: string}> = [
  { key: '', label: 'Все' },
  { key: 'collab', label: 'Партнёрства' },
  { key: 'service', label: 'Услуги' },
  { key: 'supplier', label: 'Поставщики' }
];

const PAGE_SIZE = 10;

export default function HomePage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ListingKind|''>('');
  const [items, setItems] = useState<Listing[]>([]);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string|null>(null);
  const [page, setPage] = useState(1);

  // Считаем — есть ли активный поиск/фильтр
  const isFiltered = q.trim() !== '' || kind !== '';

  async function load() {
    setBusy(true);
    setPage(1);
    try {
      const data = await api.searchListings({ q, kind });
      setItems(data);
    } catch (e:any) {
      setToast(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Сброс страницы при смене фильтрации
  useEffect(() => {
    setPage(1);
  }, [isFiltered]);

  const topHint = useMemo(() => {
    if (!q) return 'Напиши запрос: "фулфилмент", "коллаборация", "инфографика", "поставщик"';
    return `Ищем по запросу: "${q}"`;
  }, [q]);

  // Пагинация — только когда нет фильтра
  const pagedItems = useMemo(() => {
    if (isFiltered) return items;
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page, isFiltered]);

  const totalPages = isFiltered ? 1 : Math.ceil(items.length / PAGE_SIZE);

  return (
    <>
      <TopNav />
      <div className="page">
        <div className="container">
          <div className="card cardPad" style={{ padding: 18 }}>
            <h1 className="sectionTitle">Поиск партнёров для коллабораций</h1>
            <div className="small">{topHint}</div>

            <div style={{ display:'grid', gap: 10, marginTop: 12 }}>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по названию, описанию, бренду…"
                onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
              />
              <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
                {KIND_TABS.map(t => (
                  <button
                    key={t.label}
                    className={`chip ${kind === t.key ? 'active' : ''}`}
                    onClick={() => setKind(t.key)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={load} type="button">
                  Найти
                </button>
                <button className="btn btn-match" onClick={() => nav('/app/match-swipe')} type="button">
                  🎯 Найти матч
                </button>
                <button className="btn" style={{ background: 'white', border: '1px solid var(--border)' }} onClick={() => setModal(true)} type="button">
                  + Добавить объявление
                </button>
              </div>
            </div>
          </div>

          <div className="small" style={{ marginTop: 14 }}>
            Ищешь точнее? <Link to="/app/filters" style={{ fontWeight: 800, color: 'var(--wb-midnight)' }}>Перейти к фильтрам</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            <h2 className="sectionTitle" style={{ margin: 0 }}>Результаты</h2>
            {!busy && items.length > 0 && (
              <div className="small" style={{ color: 'var(--muted)' }}>
                {isFiltered ? `Найдено: ${items.length}` : `${items.length} объявлений · страница ${page} из ${totalPages}`}
              </div>
            )}
          </div>

          {busy && <div className="small" style={{ marginTop: 12 }}>Загрузка…</div>}
          {!busy && items.length === 0 && <div className="small" style={{ marginTop: 12 }}>Пока пусто. Попробуй другой запрос или создай своё объявление.</div>}

          <div className="grid grid-2" style={{ marginTop: 12 }}>
            {pagedItems.map(it => <ListingCard key={it.id} listing={it} />)}
          </div>

          {/* Пагинация — только без фильтрации */}
          {!isFiltered && totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 24 }}>
              <button
                className="btn pagination-btn"
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
              >
                ← Назад
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`pagination-page ${p === page ? 'active' : ''}`}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                className="btn pagination-btn"
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} title="Создать объявление" onClose={() => setModal(false)}>
        <CreateListingForm
          onCreated={() => {
            setModal(false);
            setToast('Готово! Объявление создано.');
            load();
          }}
          onError={(m) => setToast(m)}
        />
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}

function CreateListingForm({
  onCreated,
  onError
}: {
  onCreated: () => void;
  onError: (m: string) => void;
}) {
  const [kind, setKind] = useState<ListingKind>('collab');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [marketplaces, setMarketplaces] = useState('Wildberries');
  const [categories, setCategories] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) return onError('Нужно название объявления.');
    setBusy(true);
    try {
      await api.createListing({
        kind,
        title: title.trim(),
        description: (description.trim() || '—'),
        region: region.trim() || null,
        marketplaces: marketplaces.split(',').map(s => s.trim()).filter(Boolean),
        categories: categories.split(',').map(s => s.trim()).filter(Boolean),
        tags: tags.split(',').map(s => s.trim()).filter(Boolean)
      });
      onCreated();
    } catch (e:any) {
      onError(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="formRow">
        <div>
          <div className="label">Тип</div>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as ListingKind)}>
            <option value="collab">Партнёрство</option>
            <option value="service">Услуга</option>
            <option value="supplier">Поставщик</option>
          </select>
        </div>
        <div>
          <div className="label">Название</div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Коллаборация: совместный набор" />
        </div>
        <div>
          <div className="label">Описание</div>
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что предлагаете / что ищете / формат сотрудничества" />
        </div>
        <div className="grid grid-2">
          <div>
            <div className="label">Регион</div>
            <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Москва" />
          </div>
          <div>
            <div className="label">Маркетплейсы (через запятую)</div>
            <input className="input" value={marketplaces} onChange={(e) => setMarketplaces(e.target.value)} placeholder="Wildberries, Ozon" />
          </div>
        </div>
        <div>
          <div className="label">Категории (через запятую)</div>
          <input className="input" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Одежда, Товары для дома" />
        </div>
        <div>
          <div className="label">Теги (через запятую)</div>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="коллаборация, кросс-промо" />
        </div>
      </div>

      <div className="cardActions" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? 'Создаю…' : 'Создать'}
        </button>
      </div>
    </div>
  );
}
