import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ProposeProjectForm from '../components/ProposeProjectForm';
import { api, Listing } from '../api';
import { useAuth } from '../auth';

function kindLabel(kind: Listing['kind']) {
  if (kind === 'collab') return 'Партнёрство';
  if (kind === 'service') return 'Услуга';
  return 'Поставщик';
}

export default function ListingPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const listingId = String(id || '');
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getListing(listingId)
      .then(d => mounted && setListing(d))
      .catch(() => mounted && setListing(null))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [listingId]);

  const owner = listing?.owner;
  const isOwner = !!listing && me?.userId === listing.owner_user_id;

  return (
    <>
      <TopNav />
      <div className="container page">
        {loading && <div className="small">Загрузка…</div>}
        {!loading && !listing && <div className="small">Объявление не найдено</div>}

        {listing && (
          <div className="grid grid-2">
            <div className="card cardPad">
              <h1 className="sectionTitle" style={{ marginTop: 0 }}>{listing.title}</h1>
              <div className="kpiRow">
                <span className="badge">{kindLabel(listing.kind)}</span>
                {owner?.trust_level ? <span className="badge">Trust: {owner.trust_level} ({owner.trust_score}%)</span> : null}
                {listing.region && <span className="badge">📍 {listing.region}</span>}
              </div>

              <div className="cardMeta" style={{ marginTop: 10 }}>
                <span>👤 {owner?.brand_name || owner?.display_name || `Seller #${listing.owner_user_id}`}</span>
                {owner?.region ? <span>Регион: {owner.region}</span> : null}
                {listing.marketplaces?.length ? <span>МП: {listing.marketplaces.join(', ')}</span> : null}
              </div>

              <hr className="hr" />
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {listing.description || '—'}
              </div>

              {listing.tags?.length ? (
                <div className="kpiRow" style={{ marginTop: 12 }}>
                  {listing.tags.map(t => <span className="badge" key={t}>#{t}</span>)}
                </div>
              ) : null}

              <div className="cardActions">
                {!isOwner ? (
                  <>
                    <button className="btn btn-primary" onClick={() => setOpen(true)}>
                      Предложить проект
                    </button>
                    <Link to={`/app/seller/${listing.owner_user_id}`} className="btn" style={{ background: 'white', border: '1px solid var(--border)' }}>
                      Профиль
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="badge">{listing.published ? 'Опубликовано' : 'Черновик'}</span>
                    <button className="btn" onClick={() => setEditOpen(true)}>
                      Редактировать
                    </button>
                    {listing.published ? (
                      <button className="btn btn-ghost" onClick={async () => {
                        try {
                          const upd = await api.unpublishListing(listing.id);
                          setListing(upd);
                          setToast('Снято с публикации');
                        } catch (e: any) {
                          setToast(e.message || 'Ошибка');
                        }
                      }}>
                        Снять с публикации
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={async () => {
                        try {
                          const upd = await api.publishListing(listing.id);
                          setListing(upd);
                          setToast('Опубликовано');
                        } catch (e: any) {
                          setToast(e.message || 'Ошибка');
                        }
                      }}>
                        Опубликовать
                      </button>
                    )}
                    <button className="btn btn-ghost" onClick={async () => {
                      if (!confirm('Удалить объявление?')) return;
                      try {
                        await api.deleteListing(listing.id);
                        setToast('Удалено');
                        nav('/app/home');
                      } catch (e: any) {
                        setToast(e.message || 'Ошибка');
                      }
                    }}>
                      Удалить
                    </button>
                  </>
                )}
              </div>

              <p className="small" style={{ marginTop: 14 }}>
                Юридические реквизиты (ИНН, юр.название, телефон) скрыты и откроются только после взаимного согласия (match).
              </p>
            </div>

            <div className="card cardPad">
              <h2 className="sectionTitle" style={{ marginTop: 0 }}>Как работает match (MVP)</h2>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Вы выбираете (или создаёте) проект и отправляете заявку</li>
                <li>Партнёр видит заявку и ваш проект</li>
                <li>Партнёр принимает заявку (шаг 1)</li>
                <li>Вы подтверждаете match (шаг 2) — только тогда открываются контакты</li>
                <li>Любая сторона может разорвать сотрудничество</li>
              </ol>
              <hr className="hr" />
              <div className="small">Входящие/исходящие заявки: «Заявки». Активные match: «Матчи».</div>
            </div>
          </div>
        )}
      </div>

      <Modal open={open} title="Предложить проект" onClose={() => setOpen(false)}>
        {listing ? (
          <ProposeProjectForm
            listing={listing}
            onDone={() => {
              setOpen(false);
              setToast('Заявка отправлена ✅');
            }}
            onError={(m) => setToast(m)}
          />
        ) : null}
      </Modal>

      <Modal open={editOpen} title="Редактировать объявление" onClose={() => setEditOpen(false)}>
        {listing ? (
          <EditListingForm
            listing={listing}
            onSaved={(l) => {
              setListing(l);
              setEditOpen(false);
              setToast('Сохранено ✅');
            }}
            onError={(m) => setToast(m)}
          />
        ) : null}
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}

function EditListingForm({
  listing,
  onSaved,
  onError
}: {
  listing: Listing;
  onSaved: (l: Listing) => void;
  onError: (m: string) => void;
}) {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [region, setRegion] = useState(listing.region || '');
  const [tags, setTags] = useState((listing.tags || []).join(', '));
  const [marketplaces, setMarketplaces] = useState((listing.marketplaces || []).join(', '));
  const [categories, setCategories] = useState((listing.categories || []).join(', '));

  async function save() {
    try {
      const upd = await api.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        region: region.trim() || null,
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        marketplaces: marketplaces.split(',').map(s => s.trim()).filter(Boolean),
        categories: categories.split(',').map(s => s.trim()).filter(Boolean)
      });
      onSaved(upd);
    } catch (e: any) {
      onError(e.message || 'Ошибка');
    }
  }

  return (
    <div>
      <div className="formRow">
        <label className="label">Название</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="label">Описание</label>
        <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="label">Регион</label>
        <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Москва, СПб…" />

        <label className="label">Маркетплейсы (через запятую)</label>
        <input className="input" value={marketplaces} onChange={(e) => setMarketplaces(e.target.value)} placeholder="wildberries, ozon" />

        <label className="label">Категории (через запятую)</label>
        <input className="input" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="одежда, косметика" />

        <label className="label">Теги (через запятую)</label>
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="коллаборация, услуги" />
      </div>

      <div className="cardActions" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={save}>Сохранить</button>
      </div>
    </div>
  );
}
