// Single source of truth for the signed-in session ({ accessToken, refreshToken, user }).
// The axios client and AuthContext both read and write through here, so a token
// refresh or forced logout is reflected in the UI immediately.
const KEY = 'user';
const listeners = new Set();

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  if (session) localStorage.setItem(KEY, JSON.stringify(session));
  else localStorage.removeItem(KEY);
  listeners.forEach((fn) => fn(session));
};

export const updateSession = (patch) => {
  const current = getSession();
  if (current) setSession({ ...current, ...patch });
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Keep multiple tabs in sync (e.g. logging out in one tab logs out the others)
window.addEventListener('storage', (e) => {
  if (e.key === KEY) listeners.forEach((fn) => fn(getSession()));
});
