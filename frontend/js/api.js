/* ===== Central API helper + shared UI helpers (the only global script) ===== */
const API_BASE = (location.port === '5000') ? '/api' : 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('hms_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('hms_user') || 'null'); } catch (e) { return null; }
}
function saveSession(token, user) {
  localStorage.setItem('hms_token', token);
  localStorage.setItem('hms_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('hms_token');
  localStorage.removeItem('hms_user');
}

async function request(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearSession();
    location.href = 'index.html';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error((data && data.message) || ('Request failed (' + res.status + ')'));
  return data;
}

const api = {
  get: (p) => request(p, 'GET'),
  post: (p, b) => request(p, 'POST', b),
  put: (p, b) => request(p, 'PUT', b),
  delete: (p) => request(p, 'DELETE'),
};

const ui = {
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  money(n) { return 'Rs ' + Number(n || 0).toLocaleString('en-US'); },
  date(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  },
  inputDate(d) { return d ? new Date(d).toISOString().slice(0, 10) : ''; },
  badge(status) {
    const labels = { checkedin: 'Checked In' };
    return '<span class="badge ' + ui.esc(status) + '">' + ui.esc(labels[status] || status) + '</span>';
  },
  emptyRow(cols, msg, icon) {
    return '<tr><td colspan="' + cols + '"><div class="empty"><i class="fa-solid ' + (icon || 'fa-inbox') + '"></i>' + ui.esc(msg) + '</div></td></tr>';
  },
  loadingRow(cols) {
    return '<tr><td colspan="' + cols + '"><div class="empty"><i class="fa-solid fa-spinner fa-spin"></i>Loading...</div></td></tr>';
  },
  toast(msg, type) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
  open(id) { document.getElementById(id).classList.add('open'); },
  close(id) { document.getElementById(id).classList.remove('open'); },
  hotel() {
    const d = { name: 'Grand Horizon Hotel', phone: '+92 300 0000000', email: 'info@hotel.com', address: 'Main Boulevard, City Center' };
    try { return Object.assign(d, JSON.parse(localStorage.getItem('hms_hotel') || '{}')); } catch (e) { return d; }
  },
  setDark(on) {
    document.body.classList.toggle('dark', !!on);
    localStorage.setItem('hms_dark', on ? '1' : '0');
  },
};

// Dark mode is applied on every page
if (localStorage.getItem('hms_dark') === '1') document.body.classList.add('dark');

// Close any modal via [data-close], backdrop click or Escape
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) {
    const m = e.target.closest('.modal-backdrop');
    if (m) m.classList.remove('open');
  } else if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach((m) => m.classList.remove('open'));
});

// Build sidebar + topbar around protected pages (<body data-page data-title>)
(function buildShell() {
  const page = document.body.dataset.page;
  if (!page) return;                       // login page: no shell
  if (!getToken()) { location.replace('index.html'); return; }

  const user = getUser() || {};
  const links = [
    ['dashboard', 'Dashboard', 'fa-gauge-high'], ['rooms', 'Rooms', 'fa-bed'],
    ['bookings', 'Bookings', 'fa-calendar-check'], ['guests', 'Guests', 'fa-users'],
    ['billing', 'Billing', 'fa-file-invoice-dollar'], ['staff', 'Staff', 'fa-user-tie'],
    ['reports', 'Reports', 'fa-chart-column'], ['settings', 'Settings', 'fa-gear'],
  ];
  const content = document.getElementById('page');
  const shell = document.createElement('div');
  shell.className = 'layout';
  shell.innerHTML =
    '<aside class="sidebar">' +
      '<div class="brand"><img src="assets/images/logo.png" alt=""><span>Hotel System</span></div>' +
      '<nav>' + links.map((l) =>
        '<a href="' + l[0] + '.html" class="' + (l[0] === page ? 'active' : '') + '"><i class="fa-solid ' + l[2] + '"></i>' + l[1] + '</a>').join('') + '</nav>' +
      '<a href="#" class="logout" id="logoutLink"><i class="fa-solid fa-right-from-bracket"></i>Logout</a>' +
    '</aside>' +
    '<div class="main"><header class="topbar"><h1>' + ui.esc(document.body.dataset.title || '') + '</h1>' +
    '<span>Welcome, <strong>' + ui.esc(user.username || 'guest') + '</strong></span></header>' +
    '<div class="content" id="slot"></div></div>';
  document.body.insertBefore(shell, content);
  shell.querySelector('#slot').appendChild(content);
  shell.querySelector('#logoutLink').addEventListener('click', (e) => {
    e.preventDefault(); clearSession(); location.href = 'index.html';
  });
})();
