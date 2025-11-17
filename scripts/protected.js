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

// Only enforce auth on specific "app" pages. Everything else should remain public.
const PROTECTED_PATTERNS = [
  /^\/dashboard(\.html)?\/?$/i,
  /^\/account(\.html)?\/?$/i,
  /^\/profile(\.html)?\/?$/i,
  /^\/saved-deals(\.html)?\/?$/i,
  /^\/compare-deals(\.html)?\/?$/i
];

function isProtectedPath() {
  return PROTECTED_PATTERNS.some((re) => re.test(window.location.pathname));
}

async function requireAuth() {
  if (!isProtectedPath()) {
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
