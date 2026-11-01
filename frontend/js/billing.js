(function () {
  const $ = (id) => document.getElementById(id);
  let invoices = [], rooms = [], filter = 'all';

  function stats() {
    $('sCount').textContent = invoices.length;
    $('sPaid').textContent = ui.money(invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0));
    $('sUnpaid').textContent = ui.money(invoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0));
  }

  function render() {
    const list = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
    $('billBody').innerHTML = list.length
      ? list.map((i) =>
          '<tr><td><b>' + ui.esc(i.invoiceNo) + '</b></td><td>' + ui.esc(i.guestName) + '</td>' +
          '<td>' + ui.esc(i.room ? i.room.number : '-') + '</td><td>' + ui.date(i.date) + '</td>' +
          '<td class="num">' + ui.money(i.amount) + '</td><td>' + ui.badge(i.status) + '</td>' +
          '<td><div class="actions"><button class="btn btn-light btn-sm" data-view="' + i._id + '">View</button>' +
          (i.status === 'unpaid' ? '<button class="btn btn-success btn-sm" data-pay="' + i._id + '">Mark paid</button>' : '') +
          '<button class="btn btn-danger btn-sm" data-del="' + i._id + '">Delete</button></div></td></tr>').join('')
      : ui.emptyRow(7, 'No invoices found', 'fa-file-invoice');
  }

  async function load() {
    $('billBody').innerHTML = ui.loadingRow(7);
    try {
      [invoices, rooms] = await Promise.all([api.get('/invoices'), api.get('/rooms')]);
      stats(); render();
    } catch (e) { ui.toast(e.message, 'error'); $('billBody').innerHTML = ui.emptyRow(7, 'Could not load invoices', 'fa-triangle-exclamation'); }
  }

  function total() {
    const opt = $('fRoom').selectedOptions[0];
    const price = opt ? Number(opt.dataset.price || 0) : 0;
    const t = (Number($('fNights').value) || 0) * price + (Number($('fExtra').value) || 0);
    $('cTotal').textContent = ui.money(t);
    return t;
  }

  function openCreate() {
    $('billError').textContent = '';
    $('fGuest').value = ''; $('fNights').value = 1; $('fExtra').value = 0; $('fStatus').value = 'unpaid';
    $('fRoom').innerHTML = '<option value="" data-price="0">No room (extra charges only)</option>' +
      rooms.map((r) => '<option value="' + r._id + '" data-price="' + r.price + '">' + ui.esc(r.number) + ' - ' + ui.esc(r.type) + ' (' + ui.money(r.price) + ')</option>').join('');
    total();
    ui.open('billModal');
  }

  function showInvoice(inv) {
    const h = ui.hotel();
    const roomCharge = inv.room ? inv.nights * inv.room.price : 0;
    let rows = '';
    if (inv.room) {
      rows += '<tr><td>Room ' + ui.esc(inv.room.number) + ' (' + ui.esc(inv.room.type) + ')</td><td>' + inv.nights + ' night(s)</td>' +
        '<td class="num">' + ui.money(inv.room.price) + '</td><td class="num">' + ui.money(roomCharge) + '</td></tr>';
    }
    if (inv.extra > 0 || !inv.room) {
      rows += '<tr><td>Extra charges</td><td>-</td><td class="num">-</td><td class="num">' + ui.money(inv.extra) + '</td></tr>';
    }
    $('invoiceArea').innerHTML =
      '<div class="invoice">' +
        '<div class="inv-head"><div><h2>' + ui.esc(h.name) + '</h2><p>' + ui.esc(h.address) + '</p><p>' + ui.esc(h.phone) + ' - ' + ui.esc(h.email) + '</p></div>' +
        '<div class="inv-meta"><h3>INVOICE</h3><p><b>' + ui.esc(inv.invoiceNo) + '</b></p><p>' + ui.date(inv.date) + '</p>' + ui.badge(inv.status) + '</div></div>' +
        '<p style="margin-bottom:12px">Billed to: <b>' + ui.esc(inv.guestName) + '</b></p>' +
        '<div class="table-wrap"><table><thead><tr><th>Description</th><th>Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="inv-total"><span>Total</span><span>' + ui.money(inv.amount) + '</span></div>' +
        '<p class="inv-foot">Thank you for staying with us.</p>' +
      '</div>';
    ui.open('viewModal');
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
    $('addBtn').addEventListener('click', openCreate);
    ['fRoom', 'fNights', 'fExtra'].forEach((id) => $(id).addEventListener('input', total));
    $('printBtn').addEventListener('click', () => window.print());

    $('billBody').addEventListener('click', async (e) => {
      const v = e.target.closest('[data-view]'), p = e.target.closest('[data-pay]'), d = e.target.closest('[data-del]');
      try {
        if (v) showInvoice(invoices.find((i) => i._id === v.dataset.view));
        if (p) { await api.put('/invoices/' + p.dataset.pay, { status: 'paid' }); ui.toast('Invoice marked as paid', 'success'); load(); }
        if (d && confirm('Delete this invoice?')) { await api.delete('/invoices/' + d.dataset.del); ui.toast('Invoice deleted', 'success'); load(); }
      } catch (ex) { ui.toast(ex.message, 'error'); }
    });

    $('billForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      $('billError').textContent = '';
      if (total() <= 0) { $('billError').textContent = 'Total must be greater than zero.'; return; }
      try {
        await api.post('/invoices', {
          guestName: $('fGuest').value.trim(), room: $('fRoom').value || undefined,
          nights: Number($('fNights').value) || 0, extra: Number($('fExtra').value) || 0, status: $('fStatus').value,
        });
        ui.close('billModal');
        ui.toast('Invoice created', 'success');
        load();
      } catch (ex) { $('billError').textContent = ex.message; }
    });
  });
})();
