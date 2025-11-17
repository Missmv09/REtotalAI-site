(function () {
    if (typeof window === 'undefined') {
        return;
    }

    if (!window.supabase) {
        console.error('Supabase client library is not loaded.');
        return;
    }

    const SB_URL = "https://xxznsuufzcysqzqqqaqo.supabase.co";
    const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4em5zdXVmemN5c3F6cXFxYXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzUxNzcsImV4cCI6MjA3MjExMTE3N30.Dizsg4ZtMhwdos15UxfqPIJ2bS6IeFBRfed4pETiG14";

    if (!window.sb) {
        window.sb = window.supabase.createClient(SB_URL, SB_ANON, {
            auth: { persistSession: true, autoRefreshToken: true }
        });
    }

    const PUBLIC_PAGES = [
        '/',
        '/index.html',
        '/deal-analyzer.html',
        '/stripe-test.html',
        '/pricing.html'
    ];

    function isPublicPath() {
        return PUBLIC_PAGES.includes(window.location.pathname);
    }

    async function requireAuth() {
        if (isPublicPath()) {
            return true;
        }

        if (!window.sb) {
            return false;
        }
        const { data } = await window.sb.auth.getSession();
        if (!data?.session) {
            const next = encodeURIComponent(location.pathname + location.search + location.hash);
            location.href = `/login.html?next=${next}`;
            return false;
        }
        return true;
    }

    async function currentUserEmail() {
        if (!window.sb) {
            return '';
        }
        const { data } = await window.sb.auth.getUser();
        return data?.user?.email || '';
    }

    async function signOut() {
        if (!window.sb) {
            location.href = '/login.html';
            return;
        }
        await window.sb.auth.signOut();
        location.href = '/login.html';
    }

    window.requireAuth = requireAuth;
    window.currentUserEmail = currentUserEmail;
    window.signOut = signOut;
})();
