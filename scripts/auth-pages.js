const SUPABASE_URL = "https://xxznsuufzcysqzqqqaqo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4em5zdXVmemN5c3F6cXFxYXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzUxNzcsImV4cCI6MjA3MjExMTE3N30.Dizsg4ZtMhwdos15UxfqPIJ2bS6IeFBRfed4pETiG14";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

async function handleSignup() {
  const name = document.getElementById('signupName')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim();
  const password = document.getElementById('signupPassword')?.value.trim();
  if (!name || !email || !password) return alert('Please fill in all fields');

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback.html`
      }
    });

    if (error) {
      const msg = error.message || 'Signup failed';
      if (/redirect_to/i.test(msg)) return alert('Invalid redirect URL. Add your domain(s) in Supabase → Auth → URL Configuration.');
      if (/signups? not allowed/i.test(msg)) return alert('Email signups are disabled in Supabase Auth.');
      return alert('Signup failed: ' + msg);
    }

    if (data.user && !data.session) {
      alert('Check your email to confirm your account.');
    } else {
      window.location.href = "/app.html";
    }
  } catch (e) {
    console.error(e);
    alert('Signup failed');
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value.trim();
  if (!email || !password) return alert('Please fill in all fields');

  try {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return alert('Login failed: ' + (error.message || 'Unknown error'));

    const params = new URLSearchParams(location.search);
    const next = params.get("next");

  } catch (e) {
    console.error(e);
    alert('Login failed');
  }
}

window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
