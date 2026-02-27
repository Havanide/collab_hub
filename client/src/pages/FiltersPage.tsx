import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import { api, Listing, ListingKind } from '../api';

const MP_OPTIONS = [
  { key: 'wildberries', label: 'Wildberries' },
  { key: 'ozon', label: 'Ozon' },
  { key: 'yandex', label: 'Яндекс.Маркет' }
];

const BIZ_TYPES = ['ИП', 'ООО', 'Самозанятый'];

const SALES_RANGES = [
  { key: '', label: 'Любой', from: undefined, to: undefined },
  { key: '0-100k', label: '0–100k', from: 0, to: 100_000 },
  { key: '100k-500k', label: '100k–500k', from: 100_000, to: 500_000 },
  { key: '500k-2m', label: '500k–2m', from: 500_000, to: 2_000_000 },
  { key: '2m-10m', label: '2m–10m', from: 2_000_000, to: 10_000_000 },
  { key: '10m+', label: '10m+', from: 10_000_000, to: undefined }
];

export default function FiltersPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ListingKind | ''>('');
  const [region, setRegion] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [category, setCategory] = useState('');
  const [bizType, setBizType] = useState('');
  const [salesKey, setSalesKey] = useState('');
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  async function runSearch() {
    setLoading(true);
    try {
      const range = SALES_RANGES.find(r => r.key === salesKey) || SALES_RANGES[0];
      const data = await api.searchListings({
        q,
        kind,
        region,
        marketplace,
        category,
        biz_type: bizType || undefined,
        sales_from: range.from,
        sales_to: range.to
      });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TopNav />
      <div className="container page">
        <h1 className="sectionTitle">Поиск по фильтрам</h1>
        <div className="grid grid-2">
          <div className="card cardPad">
            <div className="label">Ключевые слова</div>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например: коллаборация, логистика, косметика" />

            <div className="formRow">
              <div>
                <div className="label">Тип</div>
                <select className="input" value={kind} onChange={(e) => setKind(e.target.value as any)}>
                  <option value="">Любой</option>
                  <option value="collab">Партнёрство</option>
                  <option value="service">Услуга</option>
                  <option value="supplier">Поставщик</option>
                </select>
              </div>

              <div>
                <div className="label">Регион</div>
                <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Москва, СПб, Казань…" />
              </div>

              <div>
                <div className="label">Маркетплейс</div>
                <select className="input" value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
                  <option value="">Любой</option>
                  {MP_OPTIONS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <div className="label">Категория</div>
                <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Одежда, косметика, товары для дома…" />
              </div>

              <div>
                <div className="label">Форма (в профиле)</div>
                <select className="input" value={bizType} onChange={(e) => setBizType(e.target.value)}>
                  <option value="">Любая</option>
                  {BIZ_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>

              <div>
                <div className="label">Оборот/месяц (в профиле)</div>
                <select className="input" value={salesKey} onChange={(e) => setSalesKey(e.target.value)}>
                  {SALES_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={runSearch}>Применить фильтры</button>
                <button className="btn btn-match" onClick={() => nav('/app/match-swipe')} type="button">🎯 Найти матч</button>
              </div>
              <div className="small">MVP: фильтры делаем по простым полям, без сложной ранжировки.</div>
            </div>
          </div>

          <div>
            <div className="small">Результаты</div>
            <hr className="hr" />
            {loading ? (
              <div>Загрузка…</div>
            ) : rows.length === 0 ? (
              <div className="card cardPad">Ничего не найдено. Попробуй снять часть фильтров.</div>
            ) : (
              <div className="list">
                {rows.map(r => <ListingCard key={r.id} listing={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
