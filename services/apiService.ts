import { ServiceRequest, User, SignUpData } from '../types';

// The base URL for our new backend API.
// Using a relative path makes the app environment-agnostic.
// It will work in development (with a proxy) and in production.
const API_BASE_URL = '/api';

// Token helpers (localStorage)
const TOKEN_KEY = 'mdac_token';
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Wrapper for fetch that injects Authorization header when token is present
const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(input, { ...init, headers });
}

/**
 * A helper function to handle fetch responses.
 * It checks if the response was successful, and if not, throws an error
 * with the message from the backend.
 * @param response The fetch response object.
 * @returns The JSON parsed response.
 */
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    // If the server returns an error, use its message.
    throw new Error(data.message || 'Ocorreu um erro na comunicação com o servidor.');
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
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const resData = await handleResponse(response);
  // backend returns { user, token }
  if (resData?.token) setToken(resData.token);
  return resData.user ?? resData;
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

export const updateServiceRequestStatus = async (id: string, status: 'Aceito' | 'Recusado', quote?: number): Promise<ServiceRequest> => {
  const response = await authFetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, quote }),
  });
  return handleResponse(response);
};