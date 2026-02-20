import React from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../api';

function kindLabel(kind: Listing['kind']) {
  if (kind === 'collab') return 'Партнёрство';
  if (kind === 'service') return 'Услуга';
  return 'Поставщик';
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const owner = listing.owner;
  return (
    <div className="card cardPad">
      <div className="kpiRow">
        <span className="badge">{kindLabel(listing.kind)}</span>
        {owner?.trust_level ? <span className="badge">Trust: {owner.trust_level}</span> : null}
        {listing.marketplaces?.slice(0,3).map(m => (
          <span className="badge" key={m}>{m}</span>
        ))}
      </div>
      <h3 className="cardTitle" style={{ marginTop: 10 }}>{listing.title}</h3>
      <div className="cardMeta">
        <span>👤 {owner?.brand_name || owner?.display_name || `Seller #${listing.owner_user_id}`}</span>
        {(owner?.region || listing.region) ? <span>📍 {owner?.region || listing.region}</span> : null}
      </div>
      {listing.description ? (
        <p style={{ margin: '10px 0 0', color: 'rgba(0,0,0,0.72)' }}>{listing.description}</p>
      ) : null}
      <div className="cardActions">
        <Link className="btn btn-primary" to={`/app/listing/${listing.id}`}>Открыть</Link>
        <Link className="btn" style={{ background: 'rgba(203,17,171,0.12)', color: 'var(--wb-midnight)' }} to={`/app/seller/${listing.owner_user_id}`}>Профиль</Link>
      </div>
    </div>
  );
}
