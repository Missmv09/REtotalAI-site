(function () {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

    const baseUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
        ? process.env.NEXT_PUBLIC_API_URL
        : '';
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        console.log('[API]', baseUrl);
    }

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

    if (!supabaseClient && isBrowser && window.supabase && (supabaseUrl || supabaseAnonKey)) {
        console.warn('[Auth] Supabase configuration is incomplete. Falling back to API endpoints.');
    }

    if (!isBrowser) {
        return;
    }

    document.querySelectorAll('a[href^="#"]:not([data-open-auth]):not([data-open-login])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    function analyzeProperty() {
        const addressInput = document.getElementById('address');
        const priceInput = document.getElementById('price');
        if (!addressInput || !priceInput) {
            return;
        }

        const address = addressInput.value;
        const price = priceInput.value;

        if (!address || !price) {
            alert('Please fill in all fields');
            return;
        }

        const roi = (Math.random() * 20 + 8).toFixed(1);
        const cashFlow = Math.floor(Math.random() * 2000 + 500);
        const capRate = (Math.random() * 8 + 4).toFixed(1);

        const roiEl = document.getElementById('roi');
        const cashFlowEl = document.getElementById('cashflow');
        const capRateEl = document.getElementById('caprate');
        const resultsEl = document.getElementById('results');

        if (roiEl) roiEl.textContent = `${roi}%`;
        if (cashFlowEl) cashFlowEl.textContent = `$${cashFlow}`;
        if (capRateEl) capRateEl.textContent = `${capRate}%`;
        if (resultsEl) resultsEl.classList.add('show');
    }

    document.querySelectorAll('.tool-card button').forEach(btn => {
        btn.addEventListener('click', function () {
            const toolCard = this.closest('.tool-card');
            const toolTitle = toolCard?.querySelector('.tool-title')?.textContent || 'Tool';
            alert(`Launching ${toolTitle}...\n\nThis would open the full tool interface.`);
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.tool-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    if (mobileBtn && navContainer) {
        mobileBtn.addEventListener('click', () => {
            const isOpen = navContainer.classList.toggle('open');
            mobileBtn.setAttribute('aria-expanded', String(isOpen));
        });
        navContainer.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navContainer.classList.remove('open');
                mobileBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function openAuthModal(mode = 'signup') {
        const modal = document.getElementById('authModal');
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        if (!modal || !signupForm || !loginForm) {
            return;
        }

        modal.style.display = 'block';
        if (mode === 'login') {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        } else {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
        }
    }

    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function showSignup() {
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        if (signupForm && loginForm) {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
        }
    }

    function showLogin() {
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        if (signupForm && loginForm) {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        }
    }

    async function handleSignup() {
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');

        const name = nameInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value.trim() || '';

        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            if (supabaseClient) {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name },
                        emailRedirectTo: `${window.location.origin}/auth/callback.html`
                    }
                });

                if (error) {
                    const msg = error.message || 'Signup failed';
                    if (/redirect_to/i.test(msg)) {
                        alert('Invalid redirect URL. Add your domain in Supabase → Auth → URL Configuration.');
                        return;
                    }
                    if (/signups? not allowed/i.test(msg)) {
                        alert('Email signups are disabled in Supabase Auth.');
                        return;
                    }
                    throw error;
                }

                if (data?.user && !data.session) {
                    alert('Check your email to confirm your account.');
                } else {
                    alert('Signup successful!');
                    window.location.href = '/dashboard.html';
                }
                closeAuthModal();
                return;
            }

            if (baseUrl) {
                const res = await fetch(`${baseUrl}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (res.ok) {
                    alert('Signup successful!');
                    closeAuthModal();
                } else {
                    alert('Signup failed');
                }
                return;
            }

            alert('Authentication is not configured. Please contact support.');
        } catch (err) {
            console.error('[Auth] Signup failed', err);
            alert(err?.message || 'Signup failed');
        }
    }

    function getSafeRedirectPath() {
        const defaultPath = '/dashboard.html';

        if (!isBrowser) {
            return defaultPath;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next');
            if (!next) {
                return defaultPath;
            }

            const candidate = new URL(next, window.location.origin);
            if (candidate.origin !== window.location.origin) {
                return defaultPath;
            }

            if (!candidate.pathname.startsWith('/')) {
                return defaultPath;
            }

            return `${candidate.pathname}${candidate.search}${candidate.hash}`;
        } catch (err) {
            console.warn('[Auth] Invalid redirect path provided.', err);
            return defaultPath;
        }
    }

    async function handleLogin() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value.trim() || '';

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            if (supabaseClient) {
                const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) {
                    throw error;
                }

                const redirectPath = getSafeRedirectPath();
                alert('Login successful!');
                closeAuthModal();
                window.location.assign(redirectPath);
                return;
            }

            if (baseUrl) {
                const res = await fetch(`${baseUrl}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (res.ok) {
                    const redirectPath = getSafeRedirectPath();
                    alert('Login successful!');
                    closeAuthModal();
                    window.location.assign(redirectPath);
                } else {
                    alert('Login failed');
                }
                return;
            }

            alert('Authentication is not configured. Please contact support.');
        } catch (err) {
            console.error('[Auth] Login failed', err);
            alert(err?.message || 'Login failed');
        }
    }

    document.querySelectorAll('[data-open-auth]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            openAuthModal('signup');
        });
    });

    document.querySelectorAll('[data-open-login]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            openAuthModal('login');
        });
    });

    window.handleSignup = handleSignup;
    window.handleLogin = handleLogin;
    window.closeAuthModal = closeAuthModal;
    window.showSignup = showSignup;
    window.showLogin = showLogin;
    window.analyzeProperty = analyzeProperty;
})();
