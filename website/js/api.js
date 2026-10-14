/* Connection to the YSRCP NRI Wing backend (server/). If the backend is not running,
   API.online stays false and the website keeps working with data saved in the browser. */
const API = (() => {
  const BASE = "/api";
  const KEY = "nri_token";
  let online = false;

  const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const setToken = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {} };

  async function request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(data.error || "Something went wrong. Please try again.");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // is the backend there? (only when the site is served over http/https)
  const ready = (location.protocol.startsWith("http")
    ? fetch(BASE + "/health", { cache: "no-store" }).then((r) => r.ok).catch(() => false)
    : Promise.resolve(false)
  ).then((ok) => (online = ok));

  return {
    ready,
    get online() { return online; },
    getToken, setToken,
    get: (p) => request("GET", p),
    post: (p, b) => request("POST", p, b || {}),
    patch: (p, b) => request("PATCH", p, b || {}),
    put: (p, b) => request("PUT", p, b || {}),
    del: (p) => request("DELETE", p)
  };
})();
