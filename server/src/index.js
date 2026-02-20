import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

import { loadDb, saveDb, nowIso, paths, normalizeDb } from './store.js';
import { seedIfEmpty } from './seed.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from './auth.js';
import { computeTrust, isValidInn, normalizePhoneRu } from './validators.js';

const PORT = Number(process.env.PORT || 5174);
const isProd = process.env.NODE_ENV === 'production';
const CLIENT_DEV_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
// In production we usually serve the client from the same origin (Render), so
// CORS is not needed. Using `origin: true` keeps it flexible if you later
// separate frontend hosting.
app.use(cors({ origin: isProd ? true : CLIENT_DEV_ORIGIN, credentials: true }));

// --- DB bootstrap
const db = loadDb();
seedIfEmpty(db);
normalizeDb(db);
saveDb(db);

// --- uploads
const UPLOAD_DIR = path.join(paths.DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 10) || '';
      cb(null, `${Date.now()}_${nanoid(10)}${ext}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('INVALID_FILE_TYPE'), ok);
  }
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h', fallthrough: false }));

// --- Helpers
function publicProfile(profile) {
  if (!profile) return null;
  const { legal_name, inn, phone, contact_email, contact_telegram, ...rest } = profile;
  return rest;
}

function ownProfile(profile) {
  if (!profile) return null;
  return profile;
}

function getProfileByUserId(userId) {
  return db.profiles.find(p => p.user_id === userId) || null;
}

function getUserByEmail(email) {
  return db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

function requireListingKind(kind) {
  return ['collab', 'service', 'supplier'].includes(kind);
}

function findActiveMatchBetween(a, b) {
  return db.matches.find(m => m.status === 'active' && ((m.user_a === a && m.user_b === b) || (m.user_a === b && m.user_b === a))) || null;
}

function counterpart(match, myId) {
  return match.user_a === myId ? match.user_b : match.user_a;
}

// --- Health
app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowIso() }));

// --- Privacy / cookies
app.get('/api/privacy', (_req, res) => {
  res.json({
    cookies: 'Мы используем только технические cookie для авторизации и работы сервиса. Мы не собираем аналитику и не передаем данные третьим лицам в рамках MVP.',
    personal_data: 'Данные профиля используются для поиска партнёров. Приватные реквизиты раскрываются только после взаимного согласия (match).'
  });
});

app.post('/api/consents', requireAuth, (req, res) => {
  const { type } = req.body || {};
  if (!['privacy', 'cookies'].includes(type)) return res.status(400).json({ error: 'INVALID_TYPE' });
  db.consents.push({ id: nanoid(), user_id: req.user.userId, type, version: 'mvp-1', created_at: nowIso() });
  saveDb(db);
  res.json({ ok: true });
});

// --- Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName, acceptPrivacy } = req.body || {};
  if (!email || !password || !displayName) return res.status(400).json({ error: 'MISSING_FIELDS' });
  if (!acceptPrivacy) return res.status(400).json({ error: 'PRIVACY_REQUIRED' });
  if (String(password).length < 6) return res.status(400).json({ error: 'WEAK_PASSWORD' });
  if (getUserByEmail(email)) return res.status(409).json({ error: 'EMAIL_EXISTS' });

  const userId = nanoid();
  const hash = bcrypt.hashSync(String(password), 10);
  db.users.push({ id: userId, email: String(email).toLowerCase(), password_hash: hash, created_at: nowIso() });
  db.profiles.push({
    user_id: userId,
    display_name: String(displayName),
    brand_name: null,
    marketplaces: [],
    categories: [],
    region: null,
    about: null,
    biz_type: null,
    sales_monthly_rub: 0,
    logo_path: null,
    // private
    legal_name: null,
    inn: null,
    phone: null,
    contact_email: null,
    contact_telegram: null,
    updated_at: nowIso()
  });
  db.consents.push({ id: nanoid(), user_id: userId, type: 'privacy', version: 'mvp-1', created_at: nowIso() });

  saveDb(db);

  const token = signToken({ userId, email: String(email).toLowerCase() });
  setAuthCookie(res, token);
  res.json({ userId, email: String(email).toLowerCase() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'MISSING_FIELDS' });
  const user = getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  const ok = bcrypt.compareSync(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const token = signToken({ userId: user.id, email: user.email });
  setAuthCookie(res, token);
  res.json({ userId: user.id, email: user.email });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const profile = getProfileByUserId(req.user.userId);
  const trust = computeTrust(profile);
  res.json({ userId: req.user.userId, email: req.user.email, profile: { ...ownProfile(profile), ...trust } });
});

// --- Profile
app.get('/api/profile/me', requireAuth, (req, res) => {
  const profile = getProfileByUserId(req.user.userId);
  const trust = computeTrust(profile);
  res.json({ ...ownProfile(profile), ...trust });
});

app.put('/api/profile/me', requireAuth, (req, res) => {
  const userId = req.user.userId;
  const profile = getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'NOT_FOUND' });

  const body = req.body || {};

  // public
  profile.display_name = body.display_name ?? profile.display_name;
  profile.brand_name = body.brand_name ?? profile.brand_name;
  profile.marketplaces = Array.isArray(body.marketplaces) ? body.marketplaces : profile.marketplaces;
  profile.categories = Array.isArray(body.categories) ? body.categories : profile.categories;
  profile.region = body.region ?? profile.region;
  profile.about = body.about ?? profile.about;
  profile.biz_type = body.biz_type ?? profile.biz_type;
  if (body.sales_monthly_rub !== undefined) {
    const n = Number(body.sales_monthly_rub);
    profile.sales_monthly_rub = Number.isFinite(n) ? n : profile.sales_monthly_rub;
  }

  // private
  if (body.legal_name !== undefined) profile.legal_name = body.legal_name;
  if (body.inn !== undefined) {
    const inn = String(body.inn).replace(/\D/g, '');
    profile.inn = inn;
  }
  if (body.phone !== undefined) {
    const normalized = normalizePhoneRu(body.phone);
    if (!normalized) return res.status(400).json({ error: 'INVALID_PHONE_RU' });
    profile.phone = normalized;
  }
  if (body.contact_email !== undefined) profile.contact_email = body.contact_email;
  if (body.contact_telegram !== undefined) profile.contact_telegram = body.contact_telegram;

  // required validations: phone required (MVP)
  if (!profile.phone) return res.status(400).json({ error: 'PHONE_REQUIRED' });
  if (profile.inn && !isValidInn(profile.inn)) return res.status(400).json({ error: 'INVALID_INN' });

  profile.updated_at = nowIso();
  saveDb(db);

  const trust = computeTrust(profile);
  res.json({ ...ownProfile(profile), ...trust });
});

app.post('/api/profile/me/logo', requireAuth, upload.single('logo'), (req, res) => {
  const profile = getProfileByUserId(req.user.userId);
  if (!profile) return res.status(404).json({ error: 'NOT_FOUND' });

  const rel = `/uploads/${path.basename(req.file.path)}`;
  profile.logo_path = rel;
  profile.updated_at = nowIso();
  saveDb(db);

  const trust = computeTrust(profile);
  res.json({ logo_path: rel, ...trust });
});

app.get('/api/profile/:userId', requireAuth, (req, res) => {
  const userId = String(req.params.userId);
  const profile = getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'NOT_FOUND' });

  const trust = computeTrust(profile);
  const myId = req.user.userId;
  const listings = db.listings
    .filter(l => l.owner_user_id === userId && (l.published === true || l.owner_user_id === myId))
    .sort((a,b) => (b.updated_at||b.created_at||'').localeCompare(a.updated_at||a.created_at||''))
    .map(enrichListing);
  res.json({ profile: { ...publicProfile(profile), ...trust }, listings });
});

// --- Listings
function enrichListing(l) {
  const p = getProfileByUserId(l.owner_user_id);
  const trust = computeTrust(p);
  return {
    ...l,
    owner: {
      user_id: p?.user_id,
      display_name: p?.display_name,
      brand_name: p?.brand_name,
      logo_path: p?.logo_path,
      region: p?.region,
      trust_level: trust.trust_level,
      trust_score: trust.trust_score
    }
  };
}

function canViewListing(l, myId) {
  return (l.published === true) || (l.owner_user_id === myId);
}

app.get('/api/listings', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const kind = String(req.query.kind ?? '').trim();
  const region = String(req.query.region ?? '').trim().toLowerCase();
  const marketplace = String(req.query.marketplace ?? '').trim().toLowerCase();
  const category = String(req.query.category ?? '').trim().toLowerCase();
  const bizType = String(req.query.biz_type ?? '').trim();
  const salesFrom = req.query.sales_from !== undefined ? Number(req.query.sales_from) : null;
  const salesTo = req.query.sales_to !== undefined ? Number(req.query.sales_to) : null;

  // by default search shows published listings; owner can also see their drafts
  let items = db.listings.filter(l => canViewListing(l, myId));

  if (q) {
    items = items.filter(l =>
      String(l.title).toLowerCase().includes(q) ||
      String(l.description).toLowerCase().includes(q)
    );
  }
  if (kind) {
    const normalized = kind === 'partner' ? 'collab' : kind;
    if (requireListingKind(normalized)) items = items.filter(l => l.kind === normalized);
  }
  if (region) items = items.filter(l => String(l.region ?? '').toLowerCase().includes(region));
  if (marketplace) items = items.filter(l => (l.marketplaces || []).map(x => String(x).toLowerCase()).includes(marketplace));
  if (category) items = items.filter(l => (l.categories || []).map(x => String(x).toLowerCase()).includes(category));

  // profile-based filters
  if (bizType || salesFrom !== null || salesTo !== null) {
    items = items.filter(l => {
      const p = getProfileByUserId(l.owner_user_id);
      if (!p) return false;
      if (bizType && p.biz_type !== bizType) return false;
      if (salesFrom !== null && (p.sales_monthly_rub ?? 0) < salesFrom) return false;
      if (salesTo !== null && (p.sales_monthly_rub ?? 0) > salesTo) return false;
      return true;
    });
  }

  const out = items
    .sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''))
    .map(enrichListing);

  res.json(out);
});

app.get('/api/listings/mine', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const items = db.listings
    .filter(l => l.owner_user_id === myId)
    .sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''))
    .map(enrichListing);
  res.json(items);
});

app.get('/api/listings/:id', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const listing = db.listings.find(l => l.id === id);
  if (!listing) return res.status(404).json({ error: 'NOT_FOUND' });
  if (!canViewListing(listing, myId)) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(enrichListing(listing));
});

app.post('/api/listings', requireAuth, (req, res) => {
  const body = req.body || {};
  const kind = body.kind === 'partner' ? 'collab' : body.kind;
  if (!requireListingKind(kind)) return res.status(400).json({ error: 'INVALID_KIND' });
  if (!body.title || !body.description) return res.status(400).json({ error: 'MISSING_FIELDS' });

  const listing = {
    id: nanoid(),
    owner_user_id: req.user.userId,
    kind,
    title: String(body.title),
    description: String(body.description),
    region: body.region ?? null,
    marketplaces: Array.isArray(body.marketplaces) ? body.marketplaces : [],
    categories: Array.isArray(body.categories) ? body.categories : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    published: body.published === false ? false : true,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db.listings.push(listing);
  saveDb(db);
  res.json(listing);
});

app.put('/api/listings/:id', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const listing = db.listings.find(l => l.id === id);
  if (!listing) return res.status(404).json({ error: 'NOT_FOUND' });
  if (listing.owner_user_id !== myId) return res.status(403).json({ error: 'FORBIDDEN' });

  const body = req.body || {};
  if (body.kind) {
    const kind = body.kind === 'partner' ? 'collab' : body.kind;
    if (!requireListingKind(kind)) return res.status(400).json({ error: 'INVALID_KIND' });
    listing.kind = kind;
  }
  if (body.title !== undefined) listing.title = String(body.title);
  if (body.description !== undefined) listing.description = String(body.description);
  if (body.region !== undefined) listing.region = body.region ?? null;
  if (body.marketplaces !== undefined) listing.marketplaces = Array.isArray(body.marketplaces) ? body.marketplaces : [];
  if (body.categories !== undefined) listing.categories = Array.isArray(body.categories) ? body.categories : [];
  if (body.tags !== undefined) listing.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.published !== undefined) listing.published = !!body.published;

  listing.updated_at = nowIso();
  saveDb(db);
  res.json(enrichListing(listing));
});

app.post('/api/listings/:id/publish', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const listing = db.listings.find(l => l.id === id);
  if (!listing) return res.status(404).json({ error: 'NOT_FOUND' });
  if (listing.owner_user_id !== myId) return res.status(403).json({ error: 'FORBIDDEN' });
  listing.published = true;
  listing.updated_at = nowIso();
  saveDb(db);
  res.json(enrichListing(listing));
});

app.post('/api/listings/:id/unpublish', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const listing = db.listings.find(l => l.id === id);
  if (!listing) return res.status(404).json({ error: 'NOT_FOUND' });
  if (listing.owner_user_id !== myId) return res.status(403).json({ error: 'FORBIDDEN' });
  listing.published = false;
  listing.updated_at = nowIso();
  saveDb(db);
  res.json(enrichListing(listing));
});

app.delete('/api/listings/:id', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const listing = db.listings.find(l => l.id === id);
  if (!listing) return res.status(404).json({ error: 'NOT_FOUND' });
  if (listing.owner_user_id !== myId) return res.status(403).json({ error: 'FORBIDDEN' });

  const inUse = db.match_requests.some(r => r.listing_id === id && ['pending', 'accepted', 'confirmed'].includes(r.status));
  if (inUse) return res.status(400).json({ error: 'LISTING_IN_USE' });

  db.listings = db.listings.filter(l => l.id !== id);
  saveDb(db);
  res.json({ ok: true });
});


// --- Projects
app.get('/api/projects', requireAuth, (req, res) => {
  const items = db.projects.filter(p => p.owner_user_id === req.user.userId).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
  res.json(items);
});

app.post('/api/projects', requireAuth, (req, res) => {
  const mine = db.projects.filter(p => p.owner_user_id === req.user.userId);
  if (mine.length >= 3) return res.status(400).json({ error: 'PROJECT_LIMIT' });
  const body = req.body || {};
  if (!body.title || !body.idea) return res.status(400).json({ error: 'MISSING_FIELDS' });
  const project = {
    id: nanoid(),
    owner_user_id: req.user.userId,
    title: String(body.title),
    idea: String(body.idea),
    goals: body.goals ?? null,
    investments: body.investments ?? null,
    responsibilities: body.responsibilities ?? null,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db.projects.push(project);
  saveDb(db);
  res.json(project);
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const project = db.projects.find(p => p.id === id && p.owner_user_id === req.user.userId);
  if (!project) return res.status(404).json({ error: 'NOT_FOUND' });
  const body = req.body || {};
  project.title = body.title ?? project.title;
  project.idea = body.idea ?? project.idea;
  project.goals = body.goals ?? project.goals;
  project.investments = body.investments ?? project.investments;
  project.responsibilities = body.responsibilities ?? project.responsibilities;
  project.updated_at = nowIso();
  saveDb(db);
  res.json(project);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const inUse = db.match_requests.some(r => r.project_id === id && r.from_user_id === req.user.userId && ['pending','accepted','confirmed'].includes(r.status));
  if (inUse) return res.status(400).json({ error: 'PROJECT_IN_USE' });
  const before = db.projects.length;
  db.projects = db.projects.filter(p => !(p.id === id && p.owner_user_id === req.user.userId));
  if (db.projects.length === before) return res.status(404).json({ error: 'NOT_FOUND' });
  saveDb(db);
  res.json({ ok: true });
});

// --- Match Requests
app.get('/api/match-requests/incoming', requireAuth, (req, res) => {
  const items = db.match_requests.filter(r => r.to_user_id === req.user.userId).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
  res.json(items.map(enrichRequest));
});

app.get('/api/match-requests/outgoing', requireAuth, (req, res) => {
  const items = db.match_requests.filter(r => r.from_user_id === req.user.userId).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
  res.json(items.map(enrichRequest));
});

function enrichRequest(r) {
  const listing = db.listings.find(l => l.id === r.listing_id);
  const project = db.projects.find(p => p.id === r.project_id);
  const fromProfile = getProfileByUserId(r.from_user_id);
  const toProfile = getProfileByUserId(r.to_user_id);
  const match = db.matches.find(m => m.request_id === r.id) || null;
  return {
    ...r,
    match_id: match?.id ?? null,
    listing: listing ? { id: listing.id, title: listing.title, kind: listing.kind } : null,
    project: project ? { id: project.id, title: project.title } : null,
    from: fromProfile ? { user_id: fromProfile.user_id, display_name: fromProfile.display_name, brand_name: fromProfile.brand_name, logo_path: fromProfile.logo_path } : null,
    to: toProfile ? { user_id: toProfile.user_id, display_name: toProfile.display_name, brand_name: toProfile.brand_name, logo_path: toProfile.logo_path } : null
  };
}

app.post('/api/match-requests', requireAuth, (req, res) => {
  const body = req.body || {};
  const listingId = String(body.listing_id || '');
  const listing = db.listings.find(l => l.id === listingId);
  if (!listing) return res.status(404).json({ error: 'LISTING_NOT_FOUND' });
  if (listing.owner_user_id === req.user.userId) return res.status(400).json({ error: 'CANNOT_REQUEST_SELF' });
  if (listing.published === false) return res.status(400).json({ error: 'LISTING_NOT_PUBLISHED' });

  // project: existing or create
  let projectId = body.project_id ? String(body.project_id) : null;

  if (!projectId && body.project_create) {
    const mine = db.projects.filter(p => p.owner_user_id === req.user.userId);
    if (mine.length >= 3) return res.status(400).json({ error: 'PROJECT_LIMIT' });
    const pc = body.project_create;
    if (!pc.title || !pc.idea) return res.status(400).json({ error: 'PROJECT_MISSING_FIELDS' });
    const project = {
      id: nanoid(),
      owner_user_id: req.user.userId,
      title: String(pc.title),
      idea: String(pc.idea),
      goals: pc.goals ?? null,
      investments: pc.investments ?? null,
      responsibilities: pc.responsibilities ?? null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    db.projects.push(project);
    projectId = project.id;
  }

  if (!projectId) return res.status(400).json({ error: 'PROJECT_REQUIRED' });
  const project = db.projects.find(p => p.id === projectId && p.owner_user_id === req.user.userId);
  if (!project) return res.status(400).json({ error: 'INVALID_PROJECT' });

  const duplicate = db.match_requests.find(r =>
    r.from_user_id === req.user.userId &&
    r.to_user_id === listing.owner_user_id &&
    r.listing_id === listingId &&
    ['pending', 'accepted', 'confirmed'].includes(r.status)
  );
  if (duplicate) return res.status(409).json({ error: 'DUPLICATE_ACTIVE' });

  const request = {
    id: nanoid(),
    from_user_id: req.user.userId,
    to_user_id: listing.owner_user_id,
    listing_id: listingId,
    project_id: projectId,
    pitch: body.pitch ?? '',
    status: 'pending',
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db.match_requests.push(request);
  saveDb(db);
  res.json(enrichRequest(request));
});

// Step 1: receiver accepts (creates "accepted" request, still no private data)
app.post('/api/match-requests/:id/accept', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const r = db.match_requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (r.to_user_id !== req.user.userId) return res.status(403).json({ error: 'FORBIDDEN' });
  if (r.status !== 'pending') return res.status(400).json({ error: 'INVALID_STATUS' });

  r.status = 'accepted';
  r.updated_at = nowIso();
  saveDb(db);
  res.json(enrichRequest(r));
});

// Step 2: initiator confirms => creates Match and reveals contacts
app.post('/api/match-requests/:id/confirm', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const r = db.match_requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (r.from_user_id !== req.user.userId) return res.status(403).json({ error: 'FORBIDDEN' });
  if (r.status !== 'accepted') return res.status(400).json({ error: 'INVALID_STATUS' });

  // create match if not exists
  let match = db.matches.find(m => m.request_id === r.id) || null;
  if (!match) {
    const existingBetween = findActiveMatchBetween(r.from_user_id, r.to_user_id);
    if (existingBetween) {
      match = existingBetween;
    } else {
      match = {
        id: nanoid(),
        user_a: r.from_user_id,
        user_b: r.to_user_id,
        request_id: r.id,
        status: 'active',
        created_at: nowIso(),
        ended_at: null,
        ended_by: null
      };
      db.matches.push(match);
    }
  }

  r.status = 'confirmed';
  r.updated_at = nowIso();
  saveDb(db);
  res.json({ ok: true, match_id: match.id, request: enrichRequest(r) });
});

app.post('/api/match-requests/:id/reject', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const r = db.match_requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (r.to_user_id !== req.user.userId) return res.status(403).json({ error: 'FORBIDDEN' });
  if (r.status !== 'pending') return res.status(400).json({ error: 'INVALID_STATUS' });
  r.status = 'rejected';
  r.updated_at = nowIso();
  saveDb(db);
  res.json(enrichRequest(r));
});

app.post('/api/match-requests/:id/cancel', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const r = db.match_requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (r.from_user_id !== req.user.userId) return res.status(403).json({ error: 'FORBIDDEN' });
  if (!(r.status === 'pending' || r.status === 'accepted')) return res.status(400).json({ error: 'INVALID_STATUS' });
  r.status = 'canceled';
  r.updated_at = nowIso();
  saveDb(db);
  res.json(enrichRequest(r));
});


// --- Matches
app.get('/api/matches', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const items = db.matches
    .filter(m => m.user_a === myId || m.user_b === myId)
    .sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''))
    .map(m => {
      const otherId = counterpart(m, myId);
      const p = getProfileByUserId(otherId);
      const trust = computeTrust(p);
      return {
        id: m.id,
        status: m.status,
        created_at: m.created_at,
        ended_at: m.ended_at,
        other: p ? {
          user_id: p.user_id,
          display_name: p.display_name,
          brand_name: p.brand_name,
          logo_path: p.logo_path,
          region: p.region,
          trust_level: trust.trust_level,
          trust_score: trust.trust_score
        } : null
      };
    });
  res.json(items);
});

app.get('/api/matches/:id', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const m = db.matches.find(x => x.id === id);
  if (!m) return res.status(404).json({ error: 'NOT_FOUND' });
  if (!(m.user_a === myId || m.user_b === myId)) return res.status(403).json({ error: 'FORBIDDEN' });

  const otherId = counterpart(m, myId);
  const otherProfile = getProfileByUserId(otherId);
  const trust = computeTrust(otherProfile);

  // only if active match we return private
  const privateFields = (m.status === 'active') ? {
    legal_name: otherProfile?.legal_name ?? null,
    inn: otherProfile?.inn ?? null,
    phone: otherProfile?.phone ?? null,
    contact_email: otherProfile?.contact_email ?? null,
    contact_telegram: otherProfile?.contact_telegram ?? null
  } : {
    legal_name: null,
    inn: null,
    phone: null,
    contact_email: null,
    contact_telegram: null
  };

  // attach request + project + listing context
  const r = db.match_requests.find(x => x.id === m.request_id) || null;
  const listing = r ? db.listings.find(l => l.id === r.listing_id) : null;
  const project = r ? db.projects.find(p => p.id === r.project_id) : null;

  res.json({
    id: m.id,
    status: m.status,
    created_at: m.created_at,
    ended_at: m.ended_at,
    ended_by: m.ended_by,
    other: otherProfile ? { ...publicProfile(otherProfile), ...trust, ...privateFields } : null,
    request: r ? { id: r.id, status: r.status, pitch: r.pitch } : null,
    listing: listing ? { id: listing.id, title: listing.title, kind: listing.kind } : null,
    project: project ? { id: project.id, title: project.title, idea: project.idea, goals: project.goals, investments: project.investments, responsibilities: project.responsibilities } : null
  });
});

app.post('/api/matches/:id/terminate', requireAuth, (req, res) => {
  const myId = req.user.userId;
  const id = String(req.params.id);
  const m = db.matches.find(x => x.id === id);
  if (!m) return res.status(404).json({ error: 'NOT_FOUND' });
  if (!(m.user_a === myId || m.user_b === myId)) return res.status(403).json({ error: 'FORBIDDEN' });
  if (m.status !== 'active') return res.status(400).json({ error: 'INVALID_STATUS' });

  m.status = 'ended';
  m.ended_at = nowIso();
  m.ended_by = myId;
  saveDb(db);
  res.json({ ok: true });
});

// --- Start
// --- Serve built client (Vite) in production
if (isProd) {
  const distPath = path.resolve(process.cwd(), 'client', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback (must be after /api routes)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('[prod] client/dist not found. Did you run `npm run build --prefix client`?');
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
