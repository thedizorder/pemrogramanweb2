const STORAGE_KEYS = {
  users: 'elibrary_users',
  books: 'elibrary_books',
  session: 'elibrary_logged_in',
  currentUser: 'elibrary_current_user'
};

const defaultUsers = [
  { username: 'admin@perpus.id', password: 'admin123', name: 'Admin Pustaka' }
];

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
  const status = document.getElementById('loginStatus');

  if (localStorage.getItem(STORAGE_KEYS.session) === 'true') {
    window.location.href = 'pages/dashboard.html';
    return;
  }

  ensureDefaultStorage();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    const match = users.find((user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password);

    if (!match) {
      status.textContent = 'Username atau password salah.';
      status.style.color = '#b91c1c';
      return;
    }

    localStorage.setItem(STORAGE_KEYS.session, 'true');
    localStorage.setItem(STORAGE_KEYS.currentUser, match.name);
    window.location.href = 'pages/dashboard.html';
  });
}

function initProtectedPages() {
  const isLoggedIn = localStorage.getItem(STORAGE_KEYS.session) === 'true';
  if (!isLoggedIn) {
    window.location.href = '../index.html';
    return;
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
      window.location.href = '../index.html';
    });
  }
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

  if (['dashboard', 'data-master', 'form', 'anggota', 'laporan'].includes(currentPage)) {
    initProtectedPages();
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
