import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import useMeta from '../lib/useMeta.js';

// Google Identity Services script, loaded once and only on pages that need it
let scriptPromise = null;
const loadGoogleScript = () =>
  (scriptPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next visit
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(script);
  }));

/**
 * Google's official "Continue with Google" button. Calls onCredential with the
 * ID token, which the backend verifies. Renders nothing when the server has no
 * Google client ID configured.
 */
export default function GoogleSignIn({ onCredential, text = 'continue_with', disabled = false }) {
  const meta = useMeta();
  const clientId = meta?.googleClientId;
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
        });
        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          // Google accepts 200–400px; match the form width
          width: Math.max(200, Math.min(400, el.offsetWidth || 320)),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, theme, text]);

  if (!clientId) return null;

  return (
    <div>
      <div className="relative py-2 my-2 text-center text-xs font-medium uppercase tracking-wider text-muted" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="relative bg-canvas px-3">or</span>
      </div>
      {/* color-scheme: light matches Google's iframe. In dark mode a mismatch makes
          the browser paint an opaque white box behind it; the button itself still
          uses Google's dark theme. */}
      <div
        ref={containerRef}
        className={`flex justify-center min-h-11 [color-scheme:light] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      />
      {failed && (
        <p className="mt-2 text-center text-xs text-muted">
          Google sign-in couldn’t load. Check your connection or ad blocker, or use your email instead.
        </p>
      )}
    </div>
  );
}
