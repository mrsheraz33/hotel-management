(function () {
  const $ = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return;

    const user = getUser() || {};
    $('pUser').value = user.username || '';
    $('pRole').value = user.role || '';

    // hotel info
    const h = ui.hotel();
    $('hName').value = h.name; $('hPhone').value = h.phone; $('hEmail').value = h.email; $('hAddress').value = h.address;
    $('hotelForm').addEventListener('submit', (e) => {
      e.preventDefault();
      localStorage.setItem('hms_hotel', JSON.stringify({
        name: $('hName').value.trim(), phone: $('hPhone').value.trim(),
        email: $('hEmail').value.trim(), address: $('hAddress').value.trim(),
      }));
      ui.toast('Hotel info saved', 'success');
    });

    // change password (real endpoint)
    $('pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('pwMsg');
      msg.style.color = 'var(--danger)';
      msg.textContent = '';
      const cur = $('pwCur').value, nw = $('pwNew').value, conf = $('pwConf').value;
      if (!cur || !nw || !conf) { msg.textContent = 'Fill in all three fields.'; return; }
      if (nw.length < 6) { msg.textContent = 'New password must be at least 6 characters.'; return; }
      if (nw !== conf) { msg.textContent = 'New password and confirmation do not match.'; return; }
      try {
        await api.put('/auth/password', { currentPassword: cur, newPassword: nw });
        msg.style.color = 'var(--success)';
        msg.textContent = 'Password updated.';
        $('pwForm').reset();
      } catch (ex) { msg.textContent = ex.message; }
    });

    // dark mode
    const toggle = $('darkToggle');
    toggle.checked = document.body.classList.contains('dark');
    toggle.addEventListener('change', () => ui.setDark(toggle.checked));

    // danger zone
    $('clearBtn').addEventListener('click', () => {
      if (!confirm('Clear all data saved in this browser?')) return;
      if (!confirm('This will log you out and reset your preferences. Are you absolutely sure?')) return;
      localStorage.clear();
      location.href = 'index.html';
    });
  });
})();
