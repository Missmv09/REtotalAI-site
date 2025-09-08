         const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
         if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
             console.log('[API]', baseUrl);
         }

         // Smooth scrolling
         document.querySelectorAll('a[href^="#"]:not([data-open-auth]):not([data-open-login])').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Demo functionality
        function analyzeProperty() {
            const address = document.getElementById('address').value;
            const price = document.getElementById('price').value;
            
            if (!address || !price) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simulate analysis
            const roi = (Math.random() * 20 + 8).toFixed(1);
            const cashFlow = Math.floor(Math.random() * 2000 + 500);
            const capRate = (Math.random() * 8 + 4).toFixed(1);
            
            document.getElementById('roi').textContent = roi + '%';
            document.getElementById('cashflow').textContent = '$' + cashFlow;
            document.getElementById('caprate').textContent = capRate + '%';
            
            document.getElementById('results').classList.add('show');
        }

        // Tool launch
        document.querySelectorAll('.tool-card button').forEach(btn => {
            btn.addEventListener('click', function() {
                const toolName = this.closest('.tool-card').querySelector('.tool-title').textContent;
                alert(`Launching ${toolName}...\n\nThis would open the full tool interface.`);
            });
        });

        // Intersection Observer for animations
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

        // Observe elements
        document.querySelectorAll('.tool-card, .pricing-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Mobile navigation toggle
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navContainer = document.querySelector('.nav-container');
        if (mobileBtn && navContainer) {
            mobileBtn.addEventListener('click', () => {
                const isOpen = navContainer.classList.toggle('open');
                mobileBtn.setAttribute('aria-expanded', isOpen);
            });
            navContainer.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    navContainer.classList.remove('open');
                    mobileBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Auth modal handlers
        function openAuthModal(mode = 'signup') {
            const modal = document.getElementById('authModal');
            const signupForm = document.getElementById('signupForm');
            const loginForm = document.getElementById('loginForm');
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
            modal.style.display = 'none';
        }

        function showSignup() {
            document.getElementById('signupForm').style.display = 'block';
            document.getElementById('loginForm').style.display = 'none';
        }

        function showLogin() {
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }

        async function handleSignup() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value.trim();
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            try {
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
            } catch (err) {
                alert('Signup failed');
            }
        }

        async function handleLogin() {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            try {
                 const res = await fetch(`${baseUrl}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (res.ok) {
                    alert('Login successful!');
                    closeAuthModal();
                } else {
                    alert('Login failed');
                }
            } catch (err) {
                alert('Login failed');
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
