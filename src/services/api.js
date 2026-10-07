const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const TOKEN_STORAGE_KEY = "financeflow_token";
export const SESSION_ACTIVITY_KEY = "financeflow_last_activity";

const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log("Token disimpan di localStorage:", token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log("Token dihapus dari localStorage");
  }
};

export const request = async (path, options = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  const renewedToken = response.headers.get("X-Session-Token");
  if (renewedToken) setToken(renewedToken);

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("financeflow:unauthorized"));
  }

  const responseBody = await response.text();
  let payload = {};

  if (responseBody) {
    try {
      payload = JSON.parse(responseBody);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const message =
      payload.message ||
      (response.status === 404
        ? "Endpoint API tidak ditemukan. Restart server API agar route terbaru dimuat."
        : `Request failed (HTTP ${response.status}).`);
    const error = new Error(message);
    error.code = payload.code;
    throw error;
  }

  return payload;
};
