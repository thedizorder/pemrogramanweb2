const BOOKS_KEY = 'elibrary_books';

function getBooks() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY) || '[]');
  return books.length ? books : [
    { id: 'BK-001', isbn: '978-602-123-456-7', title: 'Algoritma & Struktur Data', author: 'Rudi Hartono', category: 'Sains', status: 'Tersedia', stock: 24 },
    { id: 'BK-002', isbn: '978-602-987-321-1', title: 'Sejarah Indonesia Modern', author: 'Rina Kurnia', category: 'Sosial', status: 'Dipinjam', stock: 12 },
    { id: 'BK-003', isbn: '978-602-565-009-5', title: 'UI/UX untuk Perpustakaan Digital', author: 'Adi Wijaya', category: 'Teknik', status: 'Tersedia', stock: 30 },
    { id: 'BK-004', isbn: '978-602-113-778-4', title: 'Ekonomi Kreatif', author: 'Rizki Fauzan', category: 'Bisnis', status: 'Kosong', stock: 0 }
  ];
}

function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function getBadgeClass(status) {
  if (status === 'Tersedia') return 'success';
  if (status === 'Dipinjam') return 'warning';
  if (status === 'Kosong') return 'danger';
  return 'info';
}

function openBookModal(mode = 'create', book = null) {
  const modal = document.querySelector('.modal');
  const title = document.getElementById('bookModalTitle');
  const form = document.getElementById('bookForm');

  if (!modal || !title || !form) return;

  title.textContent = mode === 'edit' ? 'Edit Buku' : 'Tambah Buku Baru';

  document.getElementById('bookId').value = book?.id || '';
  document.getElementById('bookIsbn').value = book?.isbn || '';
  document.getElementById('bookTitle').value = book?.title || '';
  document.getElementById('bookAuthor').value = book?.author || '';
  document.getElementById('bookCategory').value = book?.category || '';
  document.getElementById('bookStatus').value = book?.status || '';
  document.getElementById('bookStock').value = book?.stock ?? 0;

  form.dataset.mode = mode;
  modal.classList.add('open');
}

function closeBookModal() {
  const modal = document.querySelector('.modal');
  const form = document.getElementById('bookForm');
  if (modal) modal.classList.remove('open');
  if (form) form.reset();
  document.getElementById('bookId').value = '';
}

function renderBookTable(filteredBooks = null) {
  const tbody = document.querySelector('#bookTable tbody');
  if (!tbody) return;

  const books = filteredBooks ?? getBooks();
  const fragment = document.createDocumentFragment();

  books.forEach((book) => {
    const row = document.createElement('tr');
    row.dataset.row = '';

    [book.id, book.isbn, book.title, book.author, book.category].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${getBadgeClass(book.status)}`;
    badge.textContent = book.status;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const stockCell = document.createElement('td');
    stockCell.textContent = book.stock;
    row.appendChild(stockCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'row-actions';
    const editButton = document.createElement('button');
    editButton.className = 'text-btn';
    editButton.type = 'button';
    editButton.dataset.bookEdit = book.id;
    editButton.textContent = 'Edit';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-btn danger';
    deleteButton.type = 'button';
    deleteButton.dataset.bookDelete = book.id;
    deleteButton.textContent = 'Hapus';
    actionsCell.append(editButton, deleteButton);
    row.appendChild(actionsCell);
    fragment.appendChild(row);
  });

  tbody.replaceChildren(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('admin')) return;

  const searchInput = document.getElementById('bookSearch');
  const modal = document.querySelector('.modal');
  const form = document.getElementById('bookForm');
  const addButton = document.querySelector('[data-open-modal]');
  const closeButton = document.querySelector('[data-close-modal]');
  const exportButton = document.getElementById('exportBookTable');
  const bookTableBody = document.querySelector('#bookTable tbody');

  renderBookTable();

  if (bookTableBody) {
    bookTableBody.addEventListener('click', (event) => {
      const button = event.target instanceof Element
        ? event.target.closest('[data-book-edit], [data-book-delete]')
        : null;
      if (!button) return;

      if (button.hasAttribute('data-book-edit')) {
        const target = getBooks().find((book) => book.id === button.dataset.bookEdit);
        if (target) openBookModal('edit', target);
        return;
      }

      const id = button.dataset.bookDelete;
      const books = getBooks();
      const target = books.find((book) => book.id === id);
      if (!target || !window.confirm(`Hapus buku ${target.title}?`)) return;

      saveBooks(books.filter((book) => book.id !== id));
      renderBookTable();
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const table = document.getElementById('bookTable');
      if (table) {
        window.exportTableToCsv(table, 'data-master-buku.csv');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      const keyword = event.target.value.toLowerCase();
      const books = getBooks();
      const filtered = books.filter((book) => {
        return [book.title, book.author, book.category, book.isbn, book.id].some((value) =>
          String(value).toLowerCase().includes(keyword)
        );
      });
      renderBookTable(filtered);
    });
  }

  if (addButton) {
    addButton.addEventListener('click', () => openBookModal('create'));
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeBookModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeBookModal();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const id = document.getElementById('bookId').value.trim();
      const isbn = document.getElementById('bookIsbn').value.trim();
      const title = document.getElementById('bookTitle').value.trim();
      const author = document.getElementById('bookAuthor').value.trim();
      const category = document.getElementById('bookCategory').value.trim();
      const status = document.getElementById('bookStatus').value.trim();
      const stock = Number(document.getElementById('bookStock').value);

      if (!isbn || !title || !author || !category || !status) {
        alert('Semua field wajib diisi.');
        return;
      }

      const books = getBooks();
      const highestSequence = books.reduce((highest, book) => {
        const match = /^BK-(\d+)$/.exec(book.id);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0);
      const payload = { id: id || `BK-${String(highestSequence + 1).padStart(3, '0')}`, isbn, title, author, category, status, stock };
      const index = books.findIndex((book) => book.id === payload.id);

      if (index >= 0) {
        books[index] = payload;
      } else {
        books.unshift(payload);
      }

      saveBooks(books);
      renderBookTable();
      closeBookModal();
    });
  }
});
