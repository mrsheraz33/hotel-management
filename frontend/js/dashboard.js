(function () {
  const $ = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) return;
    $('recentBody').innerHTML = ui.loadingRow(6);
    try {
      const [rooms, bookings, invoices] = await Promise.all([
        api.get('/rooms'), api.get('/bookings'), api.get('/invoices'),
      ]);
      const today = new Date().toDateString();
      const todayRevenue = invoices
        .filter((i) => i.status === 'paid' && new Date(i.date).toDateString() === today)
        .reduce((sum, i) => sum + i.amount, 0);

      $('sTotal').textContent = rooms.length;
      $('sAvail').textContent = rooms.filter((r) => r.status === 'available').length;
      $('sBooked').textContent = rooms.filter((r) => r.status === 'booked').length;
      $('sRevenue').textContent = ui.money(todayRevenue);

      const recent = bookings.slice(0, 5);
      $('recentBody').innerHTML = recent.length
        ? recent.map((b) =>
            '<tr><td>' + ui.esc(b.guestName) + '</td><td>' + ui.esc(b.room ? b.room.number : '-') + '</td>' +
            '<td>' + ui.date(b.checkIn) + '</td><td>' + ui.date(b.checkOut) + '</td>' +
            '<td>' + ui.badge(b.status) + '</td><td class="num">' + ui.money(b.amount) + '</td></tr>').join('')
        : ui.emptyRow(6, 'No bookings yet', 'fa-calendar');
    } catch (e) {
      ui.toast(e.message, 'error');
      $('recentBody').innerHTML = ui.emptyRow(6, 'Could not load data', 'fa-triangle-exclamation');
    }
  });
})();
