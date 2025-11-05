(function () {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

    const DEFAULT_SUPABASE_URL = 'https://xxznsuufzcysqzqqqaqo.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4em5zdXVmemN5c3F6cXFxYXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzUxNzcsImV4cCI6MjA3MjExMTE3N30.Dizsg4ZtMhwdos15UxfqPIJ2bS6IeFBRfed4pETiG14';

    let supabaseClient = null;
    let currentSession = null;
    let currentUser = null;

    function setSession(session) {
        currentSession = session || null;
        currentUser = session?.user || null;
        if (currentUser) {
            window.currentUser = currentUser;
        } else if (window.currentUser) {
            delete window.currentUser;
        }
    }

    function resolveSupabaseConfig() {
        if (!isBrowser) {
            return { url: '', anonKey: '' };
        }
        const url = window.SUPABASE_URL
            || document.querySelector('meta[name="supabase-url"]')?.content
            || DEFAULT_SUPABASE_URL;
        const anonKey = window.SUPABASE_ANON_KEY
            || document.querySelector('meta[name="supabase-anon-key"]')?.content
            || DEFAULT_SUPABASE_ANON_KEY;
        return { url, anonKey };
    }

    function initClient() {
        if (!isBrowser) {
            return null;
        }
        if (supabaseClient) {
            return supabaseClient;
        }
        if (!window.supabase) {
            console.warn('[Auth] Supabase library has not been loaded.');
            return null;
        }
        const { url, anonKey } = resolveSupabaseConfig();
        if (!url || !anonKey) {
            console.warn('[Auth] Missing Supabase configuration.');
            return null;
        }
        supabaseClient = window.supabase.createClient(url, anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });

        supabaseClient.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('[Auth] Failed to fetch session', error);
                return;
            }
            setSession(data?.session || null);
        });

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            setSession(session || null);
        });

        return supabaseClient;
    }

    async function ensureSession() {
        const client = initClient();
        if (!client) {
            return null;
        }
        try {
            const { data, error } = await client.auth.getSession();
            if (error) {
                console.error('[Auth] Failed to get session', error);
                return null;
            }
            setSession(data?.session || null);
            if (!currentSession) {
                const { data: userData, error: userError } = await client.auth.getUser();
                if (userError) {
                    if (userError.message && !/authenticated/i.test(userError.message)) {
                        console.warn('[Auth] getUser returned error:', userError.message);
                    }
                }
                if (userData?.user) {
                    setSession({ user: userData.user });
                }
            }
            return currentSession;
        } catch (err) {
            console.error('[Auth] Unexpected error while fetching session', err);
            return null;
        }
    }

    function buildRedirectUrl(redirectTo, redirectParam) {
        if (!redirectTo) {
            return null;
        }
        try {
            const url = new URL(redirectTo, window.location.origin);
            if (redirectParam) {
                const currentLocation = window.location.pathname + window.location.search + window.location.hash;
                url.searchParams.set(redirectParam, currentLocation);
            }
            return url.toString();
        } catch (err) {
            return redirectTo;
        }
    }

    async function requireAuth(options = {}) {
        if (!isBrowser) {
            return null;
        }
        const { redirectTo = '/login.html', redirectParam = 'redirectTo', onAuthenticated } = options;
        const client = initClient();
        if (!client) {
            const destination = buildRedirectUrl(redirectTo, redirectParam);
            if (destination) {
                window.location.replace(destination);
            }
            const error = new Error('AUTH_UNAVAILABLE');
            error.code = 'AUTH_UNAVAILABLE';
            throw error;
        }

        if (!currentSession) {
            await ensureSession();
        }

        if (currentSession?.user) {
            if (typeof onAuthenticated === 'function') {
                try {
                    onAuthenticated(currentSession.user, currentSession);
                } catch (err) {
                    console.error('[Auth] onAuthenticated callback failed', err);
                }
            }
            return currentSession.user;
        }

        const destination = buildRedirectUrl(redirectTo, redirectParam);
        if (destination) {
            window.location.replace(destination);
        }
        const error = new Error('AUTH_REQUIRED');
        error.code = 'AUTH_REQUIRED';
        throw error;
    }

    async function signOut(options = {}) {
        if (!isBrowser) {
            return;
        }
        const { redirectTo = '/login.html' } = options;
        const client = initClient();
        if (client) {
            try {
                const { error } = await client.auth.signOut();
                if (error) {
                    console.error('[Auth] Sign out failed', error);
                }
            } catch (err) {
                console.error('[Auth] Unexpected error during sign out', err);
            }
        }
        setSession(null);
        if (redirectTo !== null && redirectTo !== false) {
            const destination = buildRedirectUrl(redirectTo, null);
            if (destination) {
                window.location.replace(destination);
            }
        }
    }

    function getSupabaseClient() {
        return initClient();
    }

    function getCurrentUser() {
        return currentUser;
    }

    function getCurrentSession() {
        return currentSession;
    }

    function onAuthStateChange(callback) {
        const client = initClient();
        if (!client || typeof callback !== 'function') {
            return () => {};
        }
        const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
            setSession(session || null);
            try {
                callback(session?.user || null, session || null);
            } catch (err) {
                console.error('[Auth] onAuthStateChange callback failed', err);
            }
        });
        return () => {
            try {
                subscription?.subscription?.unsubscribe();
            } catch (err) {
                console.error('[Auth] Failed to unsubscribe from auth changes', err);
            }
        };
    }

    if (typeof window !== 'undefined') {
        window.requireAuth = requireAuth;
        window.signOut = signOut;
        window.getSupabaseClient = getSupabaseClient;
        window.getCurrentUser = getCurrentUser;
        window.getCurrentSession = getCurrentSession;
        window.onAuthStateChange = onAuthStateChange;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            requireAuth,
            signOut,
            getSupabaseClient,
            getCurrentUser,
            getCurrentSession,
            onAuthStateChange,
        };
    }
})();
