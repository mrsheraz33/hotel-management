(function () {
  const $ = (id) => document.getElementById(id);
  const COLORS = { available: '#16a34a', booked: '#2563eb', cleaning: '#ea580c', maintenance: '#dc2626' };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthLabel = (m) => { const [y, mo] = m.split('-'); return MONTHS[Number(mo) - 1] + ' ' + y; };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) return;
    const user = getUser();
    if (!user || user.role !== 'admin') {
      $('reportsBody').style.display = 'none';
      $('denied').style.display = 'block';
      return;
    }
    $('monthBody').innerHTML = ui.loadingRow(3);
    $('topBody').innerHTML = ui.loadingRow(3);
    try {
      const [sum, occ, months, top] = await Promise.all([
        api.get('/reports/summary'), api.get('/reports/occupancy'),
        api.get('/reports/monthly-revenue'), api.get('/reports/top-guests'),
      ]);
      $('rBookings').textContent = sum.totalBookings;
      $('rRevenue').textContent = ui.money(sum.revenue);
      $('rGuests').textContent = sum.totalGuests;
      $('rUnpaid').textContent = ui.money(sum.unpaid);

      $('occupancy').innerHTML = occ.total
        ? Object.keys(COLORS).map((k) =>
            '<div class="bar-row"><span style="text-transform:capitalize">' + k + ' (' + occ.counts[k] + ')</span>' +
            '<div class="bar"><span style="width:' + occ.percent[k] + '%;background:' + COLORS[k] + '"></span></div><em>' + occ.percent[k] + '%</em></div>').join('')
        : '<div class="empty">No rooms found</div>';

      $('monthBody').innerHTML = months.length
        ? months.map((m) => '<tr><td>' + monthLabel(m.month) + '</td><td class="num">' + m.bookings + '</td><td class="num">' + ui.money(m.revenue) + '</td></tr>').join('')
        : ui.emptyRow(3, 'No revenue data yet', 'fa-chart-column');
      $('topBody').innerHTML = top.length
        ? top.map((t) => '<tr><td>' + ui.esc(t.guest) + '</td><td class="num">' + t.totalBookings + '</td><td class="num">' + ui.money(t.totalSpent) + '</td></tr>').join('')
        : ui.emptyRow(3, 'No guests yet', 'fa-users');
    } catch (e) {
      ui.toast(e.message, 'error');
      $('monthBody').innerHTML = ui.emptyRow(3, 'Could not load report', 'fa-triangle-exclamation');
      $('topBody').innerHTML = ui.emptyRow(3, 'Could not load report', 'fa-triangle-exclamation');
    }
  });
})();
