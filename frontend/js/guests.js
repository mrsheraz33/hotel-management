(function () {
  const $ = (id) => document.getElementById(id);
  let guests = [], editId = null;

  function render() {
    const q = $('search').value.trim().toLowerCase();
    const list = guests.filter((g) => !q || g.name.toLowerCase().includes(q) || g.phone.toLowerCase().includes(q));
    $('guestBody').innerHTML = list.length
      ? list.map((g) =>
          '<tr><td>' + ui.esc(g.name) + (g.email ? '<small>' + ui.esc(g.email) + '</small>' : '') + '</td>' +
          '<td>' + ui.esc(g.phone) + '</td><td>' + ui.esc(g.cnic || '-') + '</td><td>' + ui.esc(g.address || '-') + '</td>' +
          '<td><div class="actions"><button class="btn btn-light btn-sm" data-edit="' + g._id + '">Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + g._id + '">Delete</button></div></td></tr>').join('')
      : ui.emptyRow(5, q ? 'No guests match your search' : 'No guests yet', 'fa-users');
  }

  async function load() {
    $('guestBody').innerHTML = ui.loadingRow(5);
    try { guests = await api.get('/guests'); render(); }
    catch (e) { ui.toast(e.message, 'error'); $('guestBody').innerHTML = ui.emptyRow(5, 'Could not load guests', 'fa-triangle-exclamation'); }
  }

  function openForm(g) {
    editId = g ? g._id : null;
    $('guestModalTitle').textContent = g ? 'Edit Guest' : 'Add Guest';
    $('fName').value = g ? g.name : '';
    $('fPhone').value = g ? g.phone : '';
    $('fCnic').value = g ? g.cnic || '' : '';
    $('fEmail').value = g ? g.email || '' : '';
    $('fAddress').value = g ? g.address || '' : '';
    ui.open('guestModal');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return;
    load();
    $('search').addEventListener('input', render);
    $('addBtn').addEventListener('click', () => openForm(null));

    $('guestBody').addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openForm(guests.find((g) => g._id === ed.dataset.edit));
      if (dl && confirm('Delete this guest?')) {
        try { await api.delete('/guests/' + dl.dataset.del); ui.toast('Guest deleted', 'success'); load(); }
        catch (ex) { ui.toast(ex.message, 'error'); }
      }
    });

    $('guestForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        name: $('fName').value.trim(), phone: $('fPhone').value.trim(), cnic: $('fCnic').value.trim(),
        email: $('fEmail').value.trim(), address: $('fAddress').value.trim(),
      };
      try {
        if (editId) await api.put('/guests/' + editId, body); else await api.post('/guests', body);
        ui.close('guestModal');
        ui.toast(editId ? 'Guest updated' : 'Guest added', 'success');
        load();
      } catch (ex) { ui.toast(ex.message, 'error'); }
    });
  });
})();
