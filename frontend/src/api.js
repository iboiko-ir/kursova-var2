const TOKEN_KEY = 'kursova.token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return null;
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
};

let memoryToken = null;

export class ApiError extends Error {
  constructor(status, messages) {
    super(messages[0]);
    this.status = status;
    this.messages = messages;
  }
}

function extractMessages(data, status) {
  if (data && Array.isArray(data.message)) {
    return data.message;
  }
  if (data && typeof data.message === 'string') {
    return [data.message];
  }
  return [`Request failed with status ${status}.`];
}

export function setSessionToken(token) {
  memoryToken = token;
  if (token) {
    tokenStore.set(token);
  } else {
    tokenStore.clear();
  }
}

export function getSessionToken() {
  return memoryToken || tokenStore.get();
}

export async function apiRequest(path, { method = 'GET', body, params: queryParameters } = {}) {
  const searchParameters = new URLSearchParams();
  Object.entries(queryParameters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      searchParameters.set(key, String(value));
    }
  });
  const url = `/api${path}${searchParameters.toString() ? `?${searchParameters}` : ''}`;
  const token = getSessionToken();

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, ['The server is not reachable. Try again later.']);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('kursova:unauthorized'));
    }
    throw new ApiError(response.status, extractMessages(data, response.status));
  }
  return data;
}

export function groupFieldErrors(error, fields) {
  const result = {};
  const general = [];
  (error ? error.messages : []).forEach((message) => {
    const field = fields.find((name) => message.startsWith(`${name} `));
    if (field) {
      result[field] = [...(result[field] || []), message];
    } else {
      general.push(message);
    }
  });
  return { fields: result, general };
}
