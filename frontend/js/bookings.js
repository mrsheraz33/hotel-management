(function () {
  const $ = (id) => document.getElementById(id);
  let bookings = [], rooms = [], filter = 'all', editId = null;

  function render() {
    const list = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
    $('bookBody').innerHTML = list.length
      ? list.map((b) =>
          '<tr><td>' + ui.esc(b.guestName) + '<small>' + ui.esc(b.phone) + '</small></td>' +
          '<td>' + ui.esc(b.room ? b.room.number : 'Removed') + '</td>' +
          '<td>' + ui.date(b.checkIn) + '</td><td>' + ui.date(b.checkOut) + '</td><td>' + (b.nights || 0) + '</td>' +
          '<td>' + ui.badge(b.status) + '</td><td class="num">' + ui.money(b.amount) + '</td>' +
          '<td><div class="actions"><button class="btn btn-light btn-sm" data-edit="' + b._id + '">Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + b._id + '">Delete</button></div></td></tr>').join('')
      : ui.emptyRow(8, 'No bookings', 'fa-calendar');
  }

  async function load() {
    $('bookBody').innerHTML = ui.loadingRow(8);
    try {
      [bookings, rooms] = await Promise.all([api.get('/bookings'), api.get('/rooms')]);
      render();
    } catch (e) { ui.toast(e.message, 'error'); $('bookBody').innerHTML = ui.emptyRow(8, 'Could not load bookings', 'fa-triangle-exclamation'); }
  }

  function nightsFromForm() {
    const a = Date.parse($('fIn').value), b = Date.parse($('fOut').value);
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.round((b - a) / 86400000);
  }

  function calc() {
    const n = nightsFromForm();
    const opt = $('fRoom').selectedOptions[0];
    const price = opt ? Number(opt.dataset.price || 0) : 0;
    $('cNights').textContent = n > 0 ? n : 0;
    $('cAmount').textContent = ui.money(n > 0 ? n * price : 0);
  }

  function fillRooms(selectedId) {
    $('fRoom').innerHTML = '<option value="">Select a room</option>' + rooms
      .filter((r) => r.status !== 'maintenance' || r._id === selectedId)
      .map((r) => '<option value="' + r._id + '" data-price="' + r.price + '">' + ui.esc(r.number) + ' - ' + ui.esc(r.type) + ' (' + ui.money(r.price) + ')</option>').join('');
    $('fRoom').value = selectedId || '';
  }

  function openForm(b) {
    editId = b ? b._id : null;
    $('bookModalTitle').textContent = b ? 'Edit Booking' : 'New Booking';
    $('bookError').textContent = '';
    fillRooms(b && b.room ? b.room._id : '');
    $('fGuest').value = b ? b.guestName : '';
    $('fPhone').value = b ? b.phone : '';
    $('fIn').value = b ? ui.inputDate(b.checkIn) : '';
    $('fOut').value = b ? ui.inputDate(b.checkOut) : '';
    $('fStatus').value = b ? b.status : 'pending';
    calc();
    ui.open('bookModal');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return;
    load();

    $('filters').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      filter = c.dataset.f;
      document.querySelectorAll('#filters .chip').forEach((x) => x.classList.toggle('active', x === c));
      render();
    });
    $('addBtn').addEventListener('click', () => openForm(null));
    ['fRoom', 'fIn', 'fOut'].forEach((id) => $(id).addEventListener('change', calc));

    $('bookBody').addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openForm(bookings.find((b) => b._id === ed.dataset.edit));
      if (dl && confirm('Delete this booking?')) {
        try { await api.delete('/bookings/' + dl.dataset.del); ui.toast('Booking deleted', 'success'); load(); }
        catch (ex) { ui.toast(ex.message, 'error'); }
      }
    });

    $('bookForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      $('bookError').textContent = '';
      if (!$('fRoom').value) { $('bookError').textContent = 'Please select a room.'; return; }
      if (nightsFromForm() <= 0) { $('bookError').textContent = 'Check-out must be after check-in.'; return; }
      const body = {
        guestName: $('fGuest').value.trim(), phone: $('fPhone').value.trim(), room: $('fRoom').value,
        checkIn: $('fIn').value, checkOut: $('fOut').value, status: $('fStatus').value,
      };
      try {
        if (editId) await api.put('/bookings/' + editId, body); else await api.post('/bookings', body);
        ui.close('bookModal');
        ui.toast(editId ? 'Booking updated' : 'Booking created', 'success');
        load();
      } catch (ex) { $('bookError').textContent = ex.message; }
    });
  });
})();
