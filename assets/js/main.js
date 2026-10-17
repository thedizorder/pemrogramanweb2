const STORAGE_KEYS = {
  users: 'elibrary_users',
  books: 'elibrary_books',
  session: 'elibrary_logged_in',
  currentUser: 'elibrary_current_user',
  currentRole: 'elibrary_current_role',
  currentMemberId: 'elibrary_current_member_id',
  members: 'elibrary_members'
};

const defaultUsers = [
  { username: 'admin@perpus.id', password: 'admin123', name: 'Admin Pustaka' }
];

window.elibraryHasRole = (role) => {
  const storedRole = localStorage.getItem(STORAGE_KEYS.currentRole) || 'admin';
  return localStorage.getItem(STORAGE_KEYS.session) === 'true' && storedRole === role;
};

function readAuthenticationArray(key, label) {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  const value = JSON.parse(stored);
  if (!Array.isArray(value)) throw new Error(`Data ${label} tidak valid.`);
  return value;
}

function ensureDefaultStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.books)) {
    const sampleBooks = [
      { id: 'BK-001', isbn: '978-602-123-456-7', title: 'Algoritma & Struktur Data', author: 'Rudi Hartono', category: 'Sains', status: 'Tersedia', stock: 24 },
      { id: 'BK-002', isbn: '978-602-987-321-1', title: 'Sejarah Indonesia Modern', author: 'Rina Kurnia', category: 'Sosial', status: 'Dipinjam', stock: 12 },
      { id: 'BK-003', isbn: '978-602-565-009-5', title: 'UI/UX untuk Perpustakaan Digital', author: 'Adi Wijaya', category: 'Teknik', status: 'Tersedia', stock: 30 },
      { id: 'BK-004', isbn: '978-602-113-778-4', title: 'Ekonomi Kreatif', author: 'Rizki Fauzan', category: 'Bisnis', status: 'Kosong', stock: 0 }
    ];
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(sampleBooks));
  }
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const tabs = document.querySelectorAll('[data-login-tab]');
  const panels = document.querySelectorAll('[data-login-panel]');

  if (localStorage.getItem(STORAGE_KEYS.session) === 'true') {
    const destination = localStorage.getItem(STORAGE_KEYS.currentRole) === 'member'
      ? 'pages/member.html'
      : 'pages/dashboard.html';
    window.location.href = destination;
    return;
  }

  ensureDefaultStorage();

  const showStatus = (id, message, isError = true) => {
    const status = document.getElementById(id);
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#15803d';
  };

  const setSession = (user, role, memberId = '') => {
    localStorage.setItem(STORAGE_KEYS.session, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUser, user.name);
    localStorage.setItem(STORAGE_KEYS.currentRole, role);
    if (memberId) localStorage.setItem(STORAGE_KEYS.currentMemberId, memberId);
    else localStorage.removeItem(STORAGE_KEYS.currentMemberId);
    window.location.href = role === 'member' ? 'pages/member.html' : 'pages/dashboard.html';
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.loginPanel !== tab.dataset.loginTab;
      });
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    let match;
    try {
      const users = readAuthenticationArray(STORAGE_KEYS.users, 'akun');
      match = users.find((user) =>
        typeof user.username === 'string' &&
        user.username.toLowerCase() === username &&
        user.password === password &&
        (!user.role || user.role === 'admin')
      );
    } catch (error) {
      showStatus('loginStatus', `Tidak dapat membaca data akun: ${error.message}`);
      return;
    }

    if (!match) {
      showStatus('loginStatus', 'Email/username atau password admin salah.');
      return;
    }

    setSession(match, 'admin');
  });

  document.getElementById('memberLoginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('memberLoginEmail').value.trim().toLowerCase();
    const password = document.getElementById('memberLoginPassword').value;
    let match;
    try {
      const users = readAuthenticationArray(STORAGE_KEYS.users, 'akun');
      match = users.find((user) =>
        user.role === 'member' &&
        typeof user.username === 'string' &&
        user.username.toLowerCase() === email &&
        user.password === password
      );
    } catch (error) {
      showStatus('memberLoginStatus', `Tidak dapat membaca data akun: ${error.message}`);
      return;
    }

    if (!match) {
      showStatus('memberLoginStatus', 'Email atau password anggota salah.');
      return;
    }

    setSession(match, 'member', match.memberId);
  });

  document.getElementById('memberRegisterForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const registrationForm = event.currentTarget;
    if (!registrationForm.reportValidity()) return;

    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const address = document.getElementById('registerAddress').value.trim();
    const password = document.getElementById('registerPassword').value;
    let users;
    let members;
    try {
      users = readAuthenticationArray(STORAGE_KEYS.users, 'akun');
      members = readAuthenticationArray(STORAGE_KEYS.members, 'anggota');
    } catch (error) {
      showStatus('memberRegisterStatus', `Tidak dapat memuat data pendaftaran: ${error.message}`);
      return;
    }

    if (users.some((user) => typeof user.username === 'string' && user.username.toLowerCase() === email) ||
        members.some((member) => typeof member.email === 'string' && member.email.toLowerCase() === email)) {
      showStatus('memberRegisterStatus', 'Email tersebut sudah terdaftar.');
      return;
    }

    const year = new Date().getFullYear();
    const prefix = `A-${year}-`;
    const highestSequence = members.reduce((highest, member) => {
      if (!member.id.startsWith(prefix)) return highest;
      const sequence = Number(member.id.slice(prefix.length));
      return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
    }, 0);
    const member = {
      id: `${prefix}${String(highestSequence + 1).padStart(3, '0')}`,
      name,
      phone,
      email,
      address,
      registeredAt: new Date().toISOString()
    };
    const user = { username: email, password, name, role: 'member', memberId: member.id };

    try {
      localStorage.setItem(STORAGE_KEYS.members, JSON.stringify([member, ...members]));
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([...users, user]));
    } catch (error) {
      showStatus('memberRegisterStatus', `Pendaftaran gagal disimpan: ${error.message}`);
      return;
    }

    showStatus('memberRegisterStatus', `Pendaftaran berhasil. ID anggota: ${member.id}. Silakan masuk.`, false);
    registrationForm.reset();
    document.querySelector('[data-login-tab="member"]').click();
    showStatus('memberLoginStatus', `Pendaftaran berhasil. ID anggota: ${member.id}. Silakan masuk.`, false);
  });

  const mascots = document.querySelectorAll('.login-mascot');
  const passwordFields = document.querySelectorAll(
    '#password, #memberLoginPassword, #registerPassword'
  );
  const updateMascotPasswordAnimation = (activeField = document.activeElement) => {
    const isPasswordActive = Array.from(passwordFields).includes(activeField);
    const isPeeking = isPasswordActive && Boolean(activeField.value);
    document.querySelector('.login-mascots')?.classList.toggle('password-active', isPasswordActive);
    document.querySelector('.login-mascots')?.classList.toggle('password-peek', isPeeking);
  };

  passwordFields.forEach((field) => {
    field.addEventListener('focus', () => updateMascotPasswordAnimation(field));
    field.addEventListener('input', () => updateMascotPasswordAnimation(field));
    field.addEventListener('blur', () => updateMascotPasswordAnimation());
  });

  document.addEventListener('pointermove', (event) => {
    mascots.forEach((mascot) => {
      const bounds = mascot.getBoundingClientRect();
      const deltaX = event.clientX - (bounds.left + bounds.width / 2);
      const deltaY = event.clientY - (bounds.top + bounds.height / 2);
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.min(3, Math.hypot(deltaX, deltaY) / 35);
      mascot.style.setProperty('--eye-x', `${Math.cos(angle) * distance}px`);
      mascot.style.setProperty('--eye-y', `${Math.sin(angle) * distance}px`);
    });
  });
}

function initProtectedPages() {
  const isLoggedIn = localStorage.getItem(STORAGE_KEYS.session) === 'true';
  if (!isLoggedIn) {
    window.location.href = '../index.html';
    return false;
  }

  const currentPage = document.body.dataset.page;
  const role = localStorage.getItem(STORAGE_KEYS.currentRole) || 'admin';
  if (currentPage === 'member-portal' && !window.elibraryHasRole('member')) {
    window.location.href = 'dashboard.html';
    return false;
  }
  if (currentPage !== 'member-portal' && !window.elibraryHasRole('admin')) {
    window.location.href = 'member.html';
    return false;
  }

  const userName = localStorage.getItem(STORAGE_KEYS.currentUser) || 'Admin';
  const userBadge = document.querySelector('[data-user-name]');
  if (userBadge) {
    userBadge.textContent = userName;
  }

  const logoutButton = document.querySelector('[data-logout]');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEYS.session, 'false');
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      localStorage.removeItem(STORAGE_KEYS.currentRole);
      localStorage.removeItem(STORAGE_KEYS.currentMemberId);
      window.location.href = '../index.html';
    });
  }

  return true;
}

function escapeCsvValue(value) {
  const normalized = value == null ? '' : String(value).trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.exportTableToCsv = function(table, filename = 'export.csv') {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map((cell) => escapeCsvValue(cell.textContent)).join(',');
  }).join('\n');

  downloadCsvFile(filename, csv);
};

window.exportDataArrayToCsv = function(data, filename = 'export.csv') {
  if (!Array.isArray(data) || !data.length) return;
  const columns = Object.keys(data[0]);
  const csvRows = [
    columns.map((column) => escapeCsvValue(column)).join(','),
    ...data.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','))
  ];

  downloadCsvFile(filename, csvRows.join('\n'));
};

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const currentPage = body.dataset.page;

  ensureDefaultStorage();

  if (currentPage === 'login') {
    initLoginPage();
    return;
  }

  if (['dashboard', 'data-master', 'form', 'peminjam', 'anggota', 'laporan', 'member-portal'].includes(currentPage)) {
    if (!initProtectedPages()) return;
  }

  const sidebar = document.querySelector('.sidebar');
  const toggleButtons = document.querySelectorAll('[data-sidebar-toggle]');
  const modal = document.querySelector('.modal');
  const modalClose = document.querySelector('[data-close-modal]');
  const modalOpenButtons = document.querySelectorAll('[data-open-modal]');
  const searchInput = document.querySelector('[data-table-search]');

  if (toggleButtons.length && sidebar) {
    toggleButtons.forEach((toggleButton) => {
      toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    });
  }

  if (modalOpenButtons.length) {
    modalOpenButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (modal) modal.classList.add('open');
      });
    });
  }

  if (modalClose && modal) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      const keyword = event.target.value.toLowerCase();
      const tableRows = document.querySelectorAll('tbody tr[data-row]');

      tableRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

  const dashboardExportButton = document.querySelector('[data-download-report]');
  if (dashboardExportButton) {
    dashboardExportButton.addEventListener('click', () => {
      const dashboardRows = [
        { jenis: 'Rekap Peminjaman', periode: 'Juli 2026', nilai: '1.240 transaksi', status: 'Tuntas' },
        { jenis: 'Pengembalian', periode: 'Juli 2026', nilai: '1.105 transaksi', status: 'Tepat waktu' },
        { jenis: 'Denda', periode: 'Juli 2026', nilai: 'Rp 1.45M', status: 'Tertunggak' },
        { jenis: 'Koleksi Populer', periode: 'Juli 2026', nilai: 'Top 25', status: 'Aktif' }
      ];

      window.exportDataArrayToCsv(dashboardRows, 'laporan-dashboard.csv');
    });
  }

  const dashboardAddButton = document.querySelector('[data-add-transaction]');
  if (dashboardAddButton) {
    dashboardAddButton.addEventListener('click', () => {
      window.location.href = 'form.html';
    });
  }
});
