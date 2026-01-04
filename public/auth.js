document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const loginForm = document.getElementById('loginForm');
    const navAuthContainer = loginBtn ? loginBtn.parentElement : null;

    // 1. Check Login State on Load
    const user = JSON.parse(localStorage.getItem('ayurvaidya_user'));
    if (user) {
        setLoggedInState(user);
    }

    // 2. Event Listeners
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
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Demo Login Logic
            const email = document.getElementById('email').value;
            // Extract name from email (simple hack for demo)
            const name = email.split('@')[0];
            const demoUser = {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                email: email,
                role: 'patient'
            };

            // Save to LocalStorage
            localStorage.setItem('ayurvaidya_user', JSON.stringify(demoUser));

            // Update UI
            setLoggedInState(demoUser);

            // Close Modal
            if (loginModal) loginModal.classList.remove('active');

            // Success Feedback
            // Optional: Simple toast or just UI update
            console.log('Demo Login Successful:', demoUser);
        });
    }

    // Helper: Update UI to Logged In
    function setLoggedInState(user) {
        if (!loginBtn || !navAuthContainer) return;

        loginBtn.style.display = 'none';

        // Check if badge already exists
        let badge = document.getElementById('user-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'user-badge';
            badge.className = 'user-profile-badge';
            badge.innerHTML = `
                <div class="avatar-circle">${user.name.charAt(0)}</div>
                <span>${user.name}</span>
                <button id="logoutBtn" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:0.8em;margin-left:8px">Logout</button>
            `;
            // Insert before login button
            navAuthContainer.insertBefore(badge, loginBtn);

            // Add Badge Styles inline for simplicity
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '8px';
            badge.style.color = 'var(--text-dark)';
            badge.style.fontWeight = '500';

            const avatar = badge.querySelector('.avatar-circle');
            avatar.style.width = '32px';
            avatar.style.height = '32px';
            avatar.style.backgroundColor = 'var(--primary)';
            avatar.style.color = 'white';
            avatar.style.borderRadius = '50%';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.fontSize = '14px';

            // Logout Logic
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('ayurvaidya_user');
                badge.remove();
                loginBtn.style.display = 'inline-block';
            });
        }
    }
});
