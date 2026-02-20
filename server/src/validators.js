export function normalizePhoneRu(phoneRaw) {
  if (!phoneRaw) return null;
  const s = String(phoneRaw).trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '+7' + digits.slice(1);
  if (digits.length === 11 && digits.startsWith('7')) return '+7' + digits.slice(1);
  if (digits.length === 10) return '+7' + digits;
  return null;
}

export function isValidInn(innRaw) {
  if (!innRaw) return false;
  const inn = String(innRaw).replace(/\D/g, '');
  return inn.length === 10 || inn.length === 12;
}

export function computeTrust(profile) {
  const missing = [];

  // required for MVP trust calc
  if (!profile?.display_name) missing.push('display_name');
  if (!profile?.brand_name) missing.push('brand_name');
  if (!profile?.region) missing.push('region');
  if (!profile?.about) missing.push('about');
  if (!Array.isArray(profile?.marketplaces) || profile.marketplaces.length === 0) missing.push('marketplaces');
  if (!Array.isArray(profile?.categories) || profile.categories.length === 0) missing.push('categories');
  if (!profile?.biz_type) missing.push('biz_type');
  if (typeof profile?.sales_monthly_rub !== 'number') missing.push('sales_monthly_rub');

  // private required for full trust
  if (!profile?.legal_name) missing.push('legal_name');
  if (!profile?.inn || !isValidInn(profile.inn)) missing.push('inn');
  if (!profile?.phone) missing.push('phone');

  if (!profile?.logo_path) missing.push('logo');

  const total = 12;
  const score = Math.max(0, Math.round(((total - missing.length) / total) * 100));
  let level = 'low';
  if (score >= 80) level = 'high';
  else if (score >= 50) level = 'mid';

  return { trust_score: score, trust_level: level, trust_missing: missing };
}

export function salesRanges() {
  return [
    { key: '0-100k', from: 0, to: 100_000 },
    { key: '100k-500k', from: 100_000, to: 500_000 },
    { key: '500k-2m', from: 500_000, to: 2_000_000 },
    { key: '2m-10m', from: 2_000_000, to: 10_000_000 },
    { key: '10m+', from: 10_000_000, to: null }
  ];
}
