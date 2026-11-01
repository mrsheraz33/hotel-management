(function () {
  const $ = (id) => document.getElementById(id);
  let staff = [], editId = null;

  function render() {
    const q = $('search').value.trim().toLowerCase();
    const list = staff.filter((s) => !q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
    $('staffBody').innerHTML = list.length
      ? list.map((s) =>
          '<tr><td>' + ui.esc(s.name) + '</td><td>' + ui.badge(s.role) + '</td><td>' + ui.esc(s.phone) + '</td>' +
          '<td class="num">' + ui.money(s.salary) + '</td><td>' + ui.date(s.joinDate) + '</td>' +
          '<td><div class="actions"><button class="btn btn-light btn-sm" data-edit="' + s._id + '">Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + s._id + '">Delete</button></div></td></tr>').join('')
      : ui.emptyRow(6, q ? 'No staff match your search' : 'No staff members yet', 'fa-user-tie');
  }

  async function load() {
    $('staffBody').innerHTML = ui.loadingRow(6);
    try { staff = await api.get('/staff'); render(); }
    catch (e) { ui.toast(e.message, 'error'); $('staffBody').innerHTML = ui.emptyRow(6, 'Could not load staff', 'fa-triangle-exclamation'); }
  }

  function openForm(s) {
    editId = s ? s._id : null;
    $('staffModalTitle').textContent = s ? 'Edit Staff' : 'Add Staff';
    $('fName').value = s ? s.name : '';
    $('fRole').value = s ? s.role : 'manager';
    $('fPhone').value = s ? s.phone : '';
    $('fSalary').value = s ? s.salary : '';
    $('fJoin').value = s ? ui.inputDate(s.joinDate) : '';
    ui.open('staffModal');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return;
    load();
    $('search').addEventListener('input', render);
    $('addBtn').addEventListener('click', () => openForm(null));

    $('staffBody').addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openForm(staff.find((s) => s._id === ed.dataset.edit));
      if (dl && confirm('Delete this staff member?')) {
        try { await api.delete('/staff/' + dl.dataset.del); ui.toast('Staff member deleted', 'success'); load(); }
        catch (ex) { ui.toast(ex.message, 'error'); }
      }
    });

    $('staffForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        name: $('fName').value.trim(), role: $('fRole').value, phone: $('fPhone').value.trim(),
        salary: Number($('fSalary').value), joinDate: $('fJoin').value,
      };
      try {
        if (editId) await api.put('/staff/' + editId, body); else await api.post('/staff', body);
        ui.close('staffModal');
        ui.toast(editId ? 'Staff member updated' : 'Staff member added', 'success');
        load();
      } catch (ex) { ui.toast(ex.message, 'error'); }
    });
  });
})();
