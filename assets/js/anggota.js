const MEMBERS_STORAGE_KEY = 'elibrary_members';

function getRegisteredMembers() {
  const storedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (!storedMembers) return [];

  const members = JSON.parse(storedMembers);
  if (!Array.isArray(members)) {
    throw new Error('Data anggota tidak valid.');
  }
  return members;
}

function renderMemberTable(members) {
  const tbody = document.querySelector('#memberTable tbody');
  tbody.replaceChildren();

  members.forEach((member) => {
    const row = document.createElement('tr');
    row.dataset.row = '';
    [member.id, member.name, member.phone, member.email, member.address].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#memberForm');
  const status = document.querySelector('#memberFormStatus');

  const loadMembers = () => {
    try {
      const members = getRegisteredMembers();
      renderMemberTable(members);
      return members;
    } catch (error) {
      status.textContent = `Gagal memuat daftar anggota: ${error.message}`;
      status.style.color = '#b91c1c';
      return null;
    }
  };

  loadMembers();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    let members = loadMembers();
    if (!members) return;

    const name = document.querySelector('#memberName').value.trim();
    const phone = document.querySelector('#memberPhone').value.trim();
    const email = document.querySelector('#memberEmail').value.trim();
    const address = document.querySelector('#memberAddress').value.trim();

    if (members.some((member) => member.email.toLowerCase() === email.toLowerCase())) {
      status.textContent = 'Email tersebut sudah terdaftar sebagai anggota.';
      status.style.color = '#b91c1c';
      return;
    }

    const year = new Date().getFullYear();
    const prefix = `A-${year}-`;
    const highestSequence = members.reduce((highest, member) => {
      if (!member.id.startsWith(prefix)) return highest;
      const sequence = Number(member.id.slice(prefix.length));
      return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
    }, 0);
    const newMember = {
      id: `${prefix}${String(highestSequence + 1).padStart(3, '0')}`,
      name,
      phone,
      email,
      address,
      registeredAt: new Date().toISOString()
    };

    try {
      members = [newMember, ...members];
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
      renderMemberTable(members);
    } catch (error) {
      status.textContent = `Pendaftaran gagal disimpan: ${error.message}`;
      status.style.color = '#b91c1c';
      return;
    }

    form.reset();
    status.textContent = `Pendaftaran berhasil. ID anggota: ${newMember.id}`;
    status.style.color = '#15803d';
  });
});
