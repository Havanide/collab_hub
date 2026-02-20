import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/** @typedef {{
 * users: any[],
 * profiles: any[],
 * listings: any[],
 * projects: any[],
 * match_requests: any[],
 * matches: any[],
 * consents: any[]
 * }} DbShape */

function emptyDb() {
  return {
    users: [],
    profiles: [],
    listings: [],
    projects: [],
    match_requests: [],
    matches: [],
    consents: []
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function nowIso() {
  return new Date().toISOString();
}

export function loadDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const db = emptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...emptyDb(), ...parsed };
  } catch {
    const db = emptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
}

export function normalizeDb(db) {
  // Defensive normalization for older db.json shapes.
  db.users = Array.isArray(db.users) ? db.users : [];
  db.profiles = Array.isArray(db.profiles) ? db.profiles : [];
  db.listings = Array.isArray(db.listings) ? db.listings : [];
  db.projects = Array.isArray(db.projects) ? db.projects : [];
  db.match_requests = Array.isArray(db.match_requests) ? db.match_requests : [];
  db.matches = Array.isArray(db.matches) ? db.matches : [];
  db.consents = Array.isArray(db.consents) ? db.consents : [];

  // Listings: default published=true and updated_at=created_at
  db.listings = db.listings.map(l => ({
    ...l,
    published: l.published ?? true,
    updated_at: l.updated_at ?? l.created_at ?? nowIso(),
    tags: Array.isArray(l.tags) ? l.tags : [],
    marketplaces: Array.isArray(l.marketplaces) ? l.marketplaces : [],
    categories: Array.isArray(l.categories) ? l.categories : []
  }));

  // Profiles arrays
  db.profiles = db.profiles.map(p => ({
    ...p,
    marketplaces: Array.isArray(p.marketplaces) ? p.marketplaces : [],
    categories: Array.isArray(p.categories) ? p.categories : []
  }));

  // Match requests: align statuses with matches (if match exists -> confirmed)
  const reqIdsWithMatch = new Set(db.matches.map(m => m.request_id).filter(Boolean));
  db.match_requests = db.match_requests.map(r => {
    let status = r.status ?? 'pending';
    if (reqIdsWithMatch.has(r.id) && (status === 'accepted' || status === 'pending')) status = 'confirmed';
    if (!['pending', 'accepted', 'confirmed', 'rejected', 'canceled'].includes(status)) status = 'pending';
    return { ...r, status, updated_at: r.updated_at ?? r.created_at ?? nowIso() };
  });

  // Matches
  db.matches = db.matches.map(m => ({
    ...m,
    status: m.status ?? 'active',
    ended_at: m.ended_at ?? null,
    ended_by: m.ended_by ?? null
  }));
}

export function saveDb(db) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function resetDb() {
  ensureDataDir();
  const db = emptyDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export const paths = {
  DATA_DIR,
  DB_FILE
};
