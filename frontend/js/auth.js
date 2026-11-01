(function () {
  if (getToken()) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('loginForm');
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  document.querySelectorAll('.demo button').forEach((b) => {
    b.addEventListener('click', () => {
      document.getElementById('username').value = b.dataset.u;
      document.getElementById('password').value = b.dataset.p;
      document.getElementById('role').value = b.dataset.r;
      err.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    if (!username || !password) { err.textContent = 'Enter your username and password.'; return; }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      const data = await api.post('/auth/login', { username, password, role });
      saveSession(data.token, data.user);
      location.href = 'dashboard.html';
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
})();
