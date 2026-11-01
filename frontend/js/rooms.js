(function () {
  const $ = (id) => document.getElementById(id);
  let rooms = [];
  let filter = 'all';
  let editId = null;

  function render() {
    const list = filter === 'all' ? rooms : rooms.filter((r) => r.status === filter);
    $('roomsGrid').innerHTML = list.length
      ? list.map((r) =>
          '<div class="room-card ' + r.status + '">' +
            '<h3>' + ui.esc(r.number) + '</h3><div class="sub">' + ui.esc(r.type) + (r.floor ? ' - Floor ' + ui.esc(r.floor) : '') + '</div>' +
            ui.badge(r.status) +
            '<div class="room-meta"><span><i class="fa-solid fa-user"></i> <b>' + r.capacity + '</b> guests</span><span><b>' + ui.money(r.price) + '</b> / night</span></div>' +
            '<div class="room-note">' + ui.esc(r.amenities || '') + '</div>' +
            '<div class="actions"><button class="btn btn-light btn-sm" data-edit="' + r._id + '"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="btn btn-danger btn-sm" data-del="' + r._id + '"><i class="fa-solid fa-trash"></i> Delete</button></div>' +
          '</div>').join('')
      : '<div class="card empty" style="grid-column:1/-1"><i class="fa-solid fa-bed"></i>No rooms found</div>';
  }

  async function load() {
    $('roomsGrid').innerHTML = '<div class="card empty" style="grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i>Loading...</div>';
    try { rooms = await api.get('/rooms'); render(); }
    catch (e) { ui.toast(e.message, 'error'); $('roomsGrid').innerHTML = '<div class="card empty" style="grid-column:1/-1">Could not load rooms</div>'; }
  }

  function openForm(room) {
    editId = room ? room._id : null;
    $('roomModalTitle').textContent = room ? 'Edit Room' : 'Add Room';
    $('fNumber').value = room ? room.number : '';
    $('fType').value = room ? room.type : 'Single';
    $('fPrice').value = room ? room.price : '';
    $('fCapacity').value = room ? room.capacity : '';
    $('fStatus').value = room ? room.status : 'available';
    $('fFloor').value = room ? room.floor || '' : '';
    $('fAmenities').value = room ? room.amenities || '' : '';
    ui.open('roomModal');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) return;
    load();

    $('filters').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      filter = b.dataset.f;
      document.querySelectorAll('#filters .chip').forEach((c) => c.classList.toggle('active', c === b));
      render();
    });
    $('addBtn').addEventListener('click', () => openForm(null));

    $('roomsGrid').addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit]');
      const dl = e.target.closest('[data-del]');
      if (ed) openForm(rooms.find((r) => r._id === ed.dataset.edit));
      if (dl && confirm('Delete this room? This cannot be undone.')) {
        try { await api.delete('/rooms/' + dl.dataset.del); ui.toast('Room deleted', 'success'); load(); }
        catch (ex) { ui.toast(ex.message, 'error'); }
      }
    });

    $('roomForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        number: $('fNumber').value.trim(), type: $('fType').value,
        price: Number($('fPrice').value), capacity: Number($('fCapacity').value),
        status: $('fStatus').value, floor: $('fFloor').value.trim(), amenities: $('fAmenities').value.trim(),
      };
      try {
        if (editId) await api.put('/rooms/' + editId, body); else await api.post('/rooms', body);
        ui.close('roomModal');
        ui.toast(editId ? 'Room updated' : 'Room added', 'success');
        load();
      } catch (ex) { ui.toast(ex.message, 'error'); }
    });
  });
})();
