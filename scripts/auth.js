(function () {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  const DEFAULT_SUPABASE_URL = 'https://xxznsuufzcysqzqqqaqo.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4em5zdXVmemN5c3F6cXFxYXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzUxNzcsImV4cCI6MjA3MjExMTE3N30.Dizsg4ZtMhwdos15UxfqPIJ2bS6IeFBRfed4pETiG14';

  const supabaseUrl = isBrowser
    ? window.SUPABASE_URL
      || document.querySelector('meta[name="supabase-url"]')?.content
      || DEFAULT_SUPABASE_URL
    : '';

  const supabaseAnonKey = isBrowser
    ? window.SUPABASE_ANON_KEY
      || document.querySelector('meta[name="supabase-anon-key"]')?.content
      || DEFAULT_SUPABASE_ANON_KEY
    : '';

  const supabaseClient = (isBrowser && window.supabase && supabaseUrl && supabaseAnonKey)
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      })
    : null;

  if (!supabaseClient && isBrowser) {
    console.warn('[Auth] Supabase client unavailable. Authentication guard will redirect immediately.');
  }

  async function getCurrentUser() {
    if (!isBrowser) return null;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) {
          console.error('[Auth] Failed to fetch Supabase user', error);
          return null;
        }
        return data?.user || null;
      } catch (err) {
        console.error('[Auth] Unexpected error while fetching user', err);
        return null;
      }
    }

    try {
      const raw = window.localStorage?.getItem('retotalai:user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[Auth] Unable to read fallback user from localStorage', err);
      window.localStorage?.removeItem('retotalai:user');
      return null;
    }
  }

  async function requireAuth(options = {}) {
    const { redirectTo = '/login.html', includeReturnTo = true } = options;
    const user = await getCurrentUser();
    if (user) {
      return true;
    }

    if (redirectTo && isBrowser) {
      const destination = includeReturnTo && window.location?.pathname
        ? `${redirectTo}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`
        : redirectTo;
      window.location.replace(destination);
    }
    return false;
  }

  async function currentUserEmail() {
    const user = await getCurrentUser();
    return user?.email || null;
  }

  async function signOut(options = {}) {
    const { redirectTo = '/login.html' } = options;
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
          console.error('[Auth] Supabase signOut failed', error);
        }
      } catch (err) {
        console.error('[Auth] Unexpected error during Supabase signOut', err);
      }
    }

    try {
      window.localStorage?.removeItem('retotalai:user');
    } catch (err) {
      console.warn('[Auth] Unable to clear fallback auth cache', err);
    }

    if (redirectTo && isBrowser) {
      window.location.replace(redirectTo);
    }
  }

  window.requireAuth = requireAuth;
  window.currentUserEmail = currentUserEmail;
  window.signOut = signOut;
})();
