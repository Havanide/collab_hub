// In production (Render), client and server are served from the same origin.
// In development, default to the local server port.
const DEFAULT_API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';
export const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type ListingKind = 'collab' | 'service' | 'supplier';

export type Trust = {
  trust_score: number;
  trust_level: 'low' | 'mid' | 'high';
  trust_missing?: string[];
};

export type PublicProfile = {
  user_id: string;
  display_name: string;
  brand_name: string | null;
  marketplaces: string[];
  categories: string[];
  region: string | null;
  about: string | null;
  biz_type: string | null;
  sales_monthly_rub: number;
  logo_path: string | null;
} & Trust;

export type PrivateProfileFields = {
  legal_name: string | null;
  inn: string | null;
  phone: string | null;
  contact_email: string | null;
  contact_telegram: string | null;
};

export type MyProfile = PublicProfile & PrivateProfileFields;

export type Listing = {
  id: string;
  owner_user_id: string;
  kind: ListingKind;
  title: string;
  description: string;
  tags: string[];
  region: string | null;
  marketplaces: string[];
  categories: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    user_id: string;
    display_name: string;
    brand_name: string | null;
    logo_path: string | null;
    region: string | null;
    trust_level: Trust['trust_level'];
    trust_score: number;
  };
};

export type Project = {
  id: string;
  owner_user_id: string;
  title: string;
  idea: string;
  goals: string | null;
  investments: string | null;
  responsibilities: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  listing_id: string;
  project_id: string;
  pitch: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'rejected' | 'canceled';
  match_id?: string | null;
  created_at: string;
  updated_at: string;
  listing?: { id: string; title: string; kind: ListingKind } | null;
  project?: { id: string; title: string } | null;
  from?: { user_id: string; display_name: string; brand_name: string | null; logo_path: string | null } | null;
  to?: { user_id: string; display_name: string; brand_name: string | null; logo_path: string | null } | null;
};

export type MatchListItem = {
  id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
  other: {
    user_id: string;
    display_name: string;
    brand_name: string | null;
    logo_path: string | null;
    region: string | null;
    trust_level: Trust['trust_level'];
    trust_score: number;
  } | null;
};

export type MatchDetails = {
  id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
  other: (PublicProfile & PrivateProfileFields) | null;
  request: { id: string; status: string; pitch: string } | null;
  listing: { id: string; title: string; kind: ListingKind } | null;
  project: { id: string; title: string; idea: string; goals: string | null; investments: string | null; responsibilities: string | null } | null;
};

export type Me = {
  userId: string;
  email: string;
  profile: MyProfile;
};

export const api = {
  health: () => request<{ ok: boolean; time: string }>(`/api/health`),
  privacy: () => request<{ cookies: string; personal_data: string }>(`/api/privacy`),
  consent: (type: 'privacy' | 'cookies') => request<{ ok: boolean }>(`/api/consents`, { method: 'POST', body: JSON.stringify({ type }) }),

  register: (email: string, password: string, displayName: string, acceptPrivacy: boolean) =>
    request<{ userId: string; email: string }>(`/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, acceptPrivacy })
    }),
  login: (email: string, password: string) =>
    request<{ userId: string; email: string }>(`/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: boolean }>(`/api/auth/logout`, { method: 'POST' }),
  me: () => request<Me>(`/api/me`),

  getMyProfile: () => request<MyProfile>(`/api/profile/me`),
  updateMyProfile: (profile: Partial<MyProfile>) => request<MyProfile>(`/api/profile/me`, { method: 'PUT', body: JSON.stringify(profile) }),
  uploadLogo: async (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return request<{ logo_path: string } & Trust>(`/api/profile/me/logo`, { method: 'POST', body: fd });
  },

  getPublicProfile: (userId: string) => request<{ profile: PublicProfile; listings: Listing[] }>(`/api/profile/${userId}`),

  searchListings: (params: {
    q?: string;
    kind?: ListingKind | '';
    region?: string;
    marketplace?: string;
    category?: string;
    biz_type?: string;
    sales_from?: number;
    sales_to?: number;
  }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set('q', params.q);
    if (params.kind) usp.set('kind', params.kind);
    if (params.region) usp.set('region', params.region);
    if (params.marketplace) usp.set('marketplace', params.marketplace);
    if (params.category) usp.set('category', params.category);
    if (params.biz_type) usp.set('biz_type', params.biz_type);
    if (params.sales_from !== undefined) usp.set('sales_from', String(params.sales_from));
    if (params.sales_to !== undefined) usp.set('sales_to', String(params.sales_to));
    const qs = usp.toString();
    return request<Listing[]>(`/api/listings${qs ? `?${qs}` : ''}`);
  },
  getListing: (id: string) => request<Listing>(`/api/listings/${id}`),
  createListing: (payload: Partial<Listing>) => request<Listing>(`/api/listings`, { method: 'POST', body: JSON.stringify(payload) }),

  myListings: () => request<Listing[]>(`/api/listings/mine`),
  updateListing: (id: string, payload: Partial<Listing>) => request<Listing>(`/api/listings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  publishListing: (id: string) => request<Listing>(`/api/listings/${id}/publish`, { method: 'POST' }),
  unpublishListing: (id: string) => request<Listing>(`/api/listings/${id}/unpublish`, { method: 'POST' }),
  deleteListing: (id: string) => request<{ ok: boolean }>(`/api/listings/${id}`, { method: 'DELETE' }),

  // projects
  listProjects: () => request<Project[]>(`/api/projects`),
  createProject: (payload: Partial<Project>) => request<Project>(`/api/projects`, { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id: string, payload: Partial<Project>) => request<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id: string) => request<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  // requests
  outgoingRequests: () => request<MatchRequest[]>(`/api/match-requests/outgoing`),
  incomingRequests: () => request<MatchRequest[]>(`/api/match-requests/incoming`),
  sendMatchRequest: (payload: { listing_id: string; project_id?: string; project_create?: any; pitch?: string }) =>
    request<MatchRequest>(`/api/match-requests`, { method: 'POST', body: JSON.stringify(payload) }),
  acceptRequest: (id: string) => request<MatchRequest>(`/api/match-requests/${id}/accept`, { method: 'POST' }),
  confirmRequest: (id: string) => request<{ ok: boolean; match_id: string; request: MatchRequest }>(`/api/match-requests/${id}/confirm`, { method: 'POST' }),
  rejectRequest: (id: string) => request<MatchRequest>(`/api/match-requests/${id}/reject`, { method: 'POST' }),
  cancelRequest: (id: string) => request<MatchRequest>(`/api/match-requests/${id}/cancel`, { method: 'POST' }),

  // matches
  listMatches: () => request<MatchListItem[]>(`/api/matches`),
  getMatch: (id: string) => request<MatchDetails>(`/api/matches/${id}`),
  terminateMatch: (id: string) => request<{ ok: boolean }>(`/api/matches/${id}/terminate`, { method: 'POST' })
};
