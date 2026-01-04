// Auth.js - Powered by Supabase
// "Industry Ready" Authentication

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const loginForm = document.getElementById('loginForm');
    const navAuthContainer = loginBtn ? loginBtn.parentElement : null;
    let supabase = null;

    // 1. Initialize Supabase
    try {
        const response = await fetch('/api/v1/config');
        const config = await response.json();

        if (config.success && config.data.supabaseUrl && config.data.supabaseAnonKey) {
            // @ts-ignore
            supabase = window.supabase.createClient(config.data.supabaseUrl, config.data.supabaseAnonKey);
            console.log('✅ Auth System Initialized');

            // Check Session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setLoggedInState(session.user);
            }

            // Listen for changes
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setLoggedInState(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setLoggedOutState();
                }
            });

        } else {
            console.warn('⚠️ Supabase Config Missing - Auth disabled');
        }
    } catch (err) {
        console.error('Auth Init Error:', err);
    }

    // 2. UI Event Listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginModal) loginModal.classList.add('active');
        });
    }

    if (closeModal && loginModal) {
        closeModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.classList.remove('active');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (!supabase) {
                alert('Authentication system is offline.');
                return;
            }

            // Loading State
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Verifying...';
            submitBtn.disabled = true;

            try {
                // Try Sign In
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    // If user not found, try Sign Up (Auto-register for demo convenience? Or explicit?)
                    // For "Industry Ready", we usually separate them. 
                    // But for hackathon speed, let's catch "Invalid login details" and maybe suggest signup?
                    // Let's keep it strict: Login Only.

                    alert('Login Failed: ' + error.message);
                    console.error('Login Error:', error);
                } else {
                    // Success handled by onAuthStateChange
                    if (loginModal) loginModal.classList.remove('active');
                }
            } catch (err) {
                alert('Unexpected error during login.');
                console.error(err);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Helper: Signup Link Handler (Optional - creates user)
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', async (e) => {
            e.preventDefault();
            // Simple prompt for now, or change modal state
            const email = prompt("Enter email for new account:");
            const password = prompt("Enter password (min 6 chars):");
            if (email && password && supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: email.split('@')[0] }
                    }
                });
                if (error) alert('Signup Error: ' + error.message);
                else alert('Account created! Please check your email to verify (if enabled) or sign in.');
            }
        });
    }

    // UI State Management
    function setLoggedInState(user) {
        if (!loginBtn || !navAuthContainer) return;

        loginBtn.style.display = 'none';

        // Name Logic
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const initial = name.charAt(0).toUpperCase();

        let badge = document.getElementById('user-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'user-badge';
            badge.className = 'user-profile-badge';
            badge.innerHTML = `
                <div class="avatar-circle" style="
                    width:32px;height:32px;background:var(--primary);color:white;
                    border-radius:50%;display:flex;align-items:center;justify-content:center;
                    font-size:14px;font-weight:bold;">${initial}</div>
                <span style="font-weight:500;color:var(--text-dark)">${name}</span>
                <button id="logoutBtn" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:0.8em;margin-left:8px">Logout</button>
            `;
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '8px';

            navAuthContainer.insertBefore(badge, loginBtn);

            // Logout Listener
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                if (supabase) await supabase.auth.signOut();
            });
        }
    }

    function setLoggedOutState() {
        const badge = document.getElementById('user-badge');
        if (badge) badge.remove();
        if (loginBtn) loginBtn.style.display = 'inline-block';
    }
});
