import { ServiceRequest, User, SignUpData } from '../types';

// The base URL for our backend API. Use Vite env var when provided so the
// built frontend can call a remote API (e.g. Render) when hosted on GitHub Pages.
let API_BASE_URL = (import.meta.env.VITE_API_BASE as string) || '';

// Normalize trailing slash
if (API_BASE_URL && API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

// If no API base provided, default to relative '/api' for local dev; but warn in production builds
if (!API_BASE_URL) {
  const isProd = Boolean(import.meta.env && (import.meta.env.PROD || import.meta.env.MODE === 'production'));
  if (isProd) {
    // In production we expect the builder to set VITE_API_BASE to the remote backend.
    // Log a clear warning so deploy logs show the misconfiguration.
    // eslint-disable-next-line no-console
    console.warn('VITE_API_BASE is not defined in build. Frontend will call local relative /api which will 404 on GitHub Pages. Define RENDER_BACKEND_URL as secret and expose as VITE_API_BASE in the workflow.');
  }
  API_BASE_URL = '/api';
}

// Token helpers (localStorage)
const TOKEN_KEY = 'mdac_token';
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Wrapper for fetch that injects Authorization header when token is present
// Decode JWT payload (naive) to inspect exp claim
const decodeJwt = (token: string | null) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
};

const emitLogout = () => {
  try {
    window.dispatchEvent(new CustomEvent('mdac:logout'));
  } catch (e) {
    // ignore in non-browser environments
  }
};

// authFetch: inject Authorization header, pre-check token expiry, and on 401 emit logout event
const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const token = getToken();

  // If token exists, check expiry
  if (token) {
    const payload = decodeJwt(token);
    if (payload && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        // token expired — clear and notify
        clearToken();
        emitLogout();
        // fail fast
        return new Response(JSON.stringify({ message: 'Token expirado.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    }
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    // unauthorized — clear token and emit global logout so AuthProvider can react
    clearToken();
    emitLogout();
  }

  return response;
}

/**
 * A helper function to handle fetch responses.
 * It checks if the response was successful, and if not, throws an error
 * with the message from the backend.
 * @param response The fetch response object.
 * @returns The JSON parsed response.
 */
const handleResponse = async (response: Response) => {
  // Log detalhado apenas em desenvolvimento para evitar poluição de console em produção (polling frequente)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('handleResponse: status:', response.status, 'ok:', response.ok);
  }
  
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    console.error('handleResponse: erro ao parsear JSON:', jsonError);
    throw new Error('Resposta do servidor inválida. Tente novamente.');
  }
  
  if (!response.ok) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('handleResponse: erro:', data);
    }
    // If the server returns an error, use its message.
    const errorMessage = data.message || data.error || `Erro do servidor (${response.status})`;
    throw new Error(errorMessage);
  }
  
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('handleResponse: sucesso');
  }
  return data;
};

// --- API Functions hitting the backend ---

export const login = async (email: string, password?: string): Promise<User | null> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  // backend returns { user, token }
  if (data?.token) setToken(data.token);
  return data.user ?? null;
};

export const signUp = async (data: SignUpData): Promise<User> => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('signUp: usando API_BASE_URL:', API_BASE_URL);
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('signUp: status:', response.status);
    }
    const resData = await handleResponse(response);
    // backend returns { user, token }
    if (resData?.token) setToken(resData.token);
    return resData.user ?? resData;
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('signUp: erro:', error);
    }
    throw error;
  }
};

export const updateUser = async (updatedUser: User): Promise<User> => {
  const response = await authFetch(`${API_BASE_URL}/users/${encodeURIComponent(updatedUser.email)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser),
  });
  return handleResponse(response);
};

export const getServiceRequests = async (): Promise<ServiceRequest[]> => {
  const response = await authFetch(`${API_BASE_URL}/requests`);
  return handleResponse(response);
};

export const createServiceRequest = async (request: ServiceRequest): Promise<ServiceRequest> => {
  const response = await authFetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse(response);
};

// Atualiza status. Prestador: envia orçamento -> status 'Orçamento Enviado'. Cliente: aceita -> 'Aceito'.
export const updateServiceRequestStatus = async (
  id: string,
  status: ServiceRequest['status'],
  quote?: number,
  providerEmail?: string
): Promise<ServiceRequest> => {
  const response = await authFetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, quote, providerEmail }),
  });
  return handleResponse(response);
};