import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import { api, Listing, PublicProfile, API_BASE } from '../api';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const uid = String(userId || '');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.getPublicProfile(uid)
      .then((data) => {
        if (!alive) return;
        setProfile(data.profile);
        setListings(data.listings);
      })
      .catch((e) => alive && setError(String(e.message || e)));
    return () => { alive = false; };
  }, [uid]);

  return (
    <div>
      <TopNav />
      <div className="container page">
        {error && <div className="card cardPad">Ошибка: {error}</div>}
        {!profile && !error && <div>Загрузка…</div>}

        {profile && (
          <>
            <div className="card cardPad">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {profile.logo_path ? (
                  <img src={`${API_BASE}${profile.logo_path}`} alt="logo" style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
                ) : (
                  <div className="brand-dot" />
                )}
                <div>
                  <div className="kpiRow">
                    <span className="badge">Профиль</span>
                    <span className="badge">Trust: {profile.trust_level} ({profile.trust_score}%)</span>
                  </div>
                  <h2 style={{ margin: '10px 0 6px' }}>
                    {profile.brand_name || profile.display_name || 'Без названия'}
                  </h2>
                  <div className="small">Приватные контакты откроются только после match.</div>
                </div>
              </div>

              <div className="hr" />
              <div className="small"><b>Представитель:</b> {profile.display_name}</div>
              <div className="small"><b>Регион:</b> {profile.region || '—'}</div>
              <div className="small"><b>Форма:</b> {profile.biz_type || '—'}</div>
              <div className="small"><b>Оборот/месяц:</b> {profile.sales_monthly_rub ? `${profile.sales_monthly_rub.toLocaleString()} ₽` : '—'}</div>
              <div className="small"><b>Маркетплейсы:</b> {(profile.marketplaces || []).join(', ') || '—'}</div>
              <div className="small"><b>Категории:</b> {(profile.categories || []).join(', ') || '—'}</div>

              {profile.about ? (
                <>
                  <div className="hr" />
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{profile.about}</div>
                </>
              ) : null}
            </div>

            <h3 className="sectionTitle" style={{ marginTop: 18 }}>Публикации</h3>
            <div className="grid grid-2">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
            {listings.length === 0 && <div className="small">У пользователя пока нет публикаций.</div>}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
