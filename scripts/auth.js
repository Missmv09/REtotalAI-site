// Initialize Supabase client (update URL/KEY if yours are different)
const supabaseUrl = 'https://xxznsuufzcysqzqqqaqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4em5zdXVmemN5c3F6cXFxYXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzUxNzcsImV4cCI6MjA3MjExMTE3N30.Dizsg4ZtMhwdos15UxfqPIJ2bS6IeFBRfed4pETiG14';
const supabase = window.supabase
  ? window.supabase.createClient(supabaseUrl, supabaseKey)
  : null;

// Expose the client on window to preserve existing usage
if (supabase && !window.sb) {
  window.sb = supabase;
}

/**
 * Only enforce auth on specific "app" pages.
 * Everything else (marketing pages, Deal Analyzer, Stripe test, etc.)
 * should be public and NEVER redirect to login automatically.
 */
(function enforceAuthOnProtectedPages() {
  if (!supabase) {
    console.warn('Supabase not initialized in auth.js');
    return;
  }

  const path = window.location.pathname;

  // List of routes that REQUIRE login
  const PROTECTED_PATTERNS = [
    /^\/dashboard(\.html)?\/?$/i,
    /^\/account(\.html)?\/?$/i,
    /^\/profile(\.html)?\/?$/i,
    /^\/saved-deals(\.html)?\/?$/i,
    /^\/compare-deals(\.html)?\/?$/i
  ];

  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(path));

  // If page is NOT in the protected list, do nothing (public page)
  if (!isProtected) {
    return;
  }

  // Protected page → check auth
  supabase.auth.getUser().then(({ data, error }) => {
    const user = data?.user || null;

    if (!user) {
      // No user = redirect to login
      window.location.href = '/login.html';
    }
  });
})();

async function requireAuth() {
  const path = window.location.pathname;
  const PROTECTED_PATTERNS = [
    /^\/dashboard(\.html)?\/?$/i,
    /^\/account(\.html)?\/?$/i,
    /^\/profile(\.html)?\/?$/i,
    /^\/saved-deals(\.html)?\/?$/i,
    /^\/compare-deals(\.html)?\/?$/i
  ];

  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(path));
  if (!isProtected) {
    return true;
  }

  if (!supabase) {
    return false;
  }
  const { data } = await supabase.auth.getSession();
  if (!data?.session) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = `/login.html?next=${next}`;
    return false;
  }
  return true;
}

async function currentUserEmail() {
  if (!supabase) {
    return '';
  }
  const { data } = await supabase.auth.getUser();
  return data?.user?.email || '';
}

async function signOut() {
  if (!supabase) {
    location.href = '/login.html';
    return;
  }
  await supabase.auth.signOut();
  location.href = '/login.html';
}

window.requireAuth = requireAuth;
window.currentUserEmail = currentUserEmail;
window.signOut = signOut;
