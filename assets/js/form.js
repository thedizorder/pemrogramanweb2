const BOOKS_STORAGE_KEY = 'elibrary_books';
const MEMBERS_STORAGE_KEY = 'elibrary_members';
const LOANS_STORAGE_KEY = 'elibrary_loans';
const REQUESTS_STORAGE_KEY = 'elibrary_loan_requests';

function readStoredArray(key, label) {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) return [];

  const value = JSON.parse(storedValue);
  if (!Array.isArray(value)) {
    throw new Error(`Data ${label} tidak valid.`);
  }
  return value;
}

function setFormStatus(message, isError = false) {
  const status = document.querySelector('#formStatus');
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#b91c1c' : '#15803d';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('admin')) return;

  const form = document.querySelector('#loanForm');
  if (!form) return;

  const memberField = document.querySelector('#memberId');
  const memberDetails = document.querySelector('#memberDetails');
  const bookField = document.querySelector('#bookId');
  const categoryField = document.querySelector('#category');
  const loanDateField = document.querySelector('#loanDate');
  const loanDaysField = document.querySelector('#loanDays');
  const dueDateField = document.querySelector('#dueDate');
  const feeField = document.querySelector('#dendaValue');
  const requestTableBody = document.querySelector('#loanRequestTable tbody');
  const requestAdminStatus = document.querySelector('#requestAdminStatus');
  let members = [];
  let books = [];

  const localDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const updateDueDate = () => {
    if (!loanDateField.value || !loanDaysField.value) {
      dueDateField.value = '';
      return;
    }
    const [year, month, day] = loanDateField.value.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    dueDate.setDate(dueDate.getDate() + Number(loanDaysField.value));
    dueDateField.value = localDateValue(dueDate);
  };

  const updateFee = () => {
    const amount = Number(loanDaysField.value || 0) * 2500;
    feeField.textContent = `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const populateSelections = () => {
    memberField.replaceChildren(new Option('Pilih anggota terdaftar', ''));
    bookField.replaceChildren(new Option('Pilih buku dari Data Master', ''));

    members.forEach((member) => {
      memberField.add(new Option(`${member.id} — ${member.name}`, member.id));
    });

    const pendingRequests = readStoredArray(REQUESTS_STORAGE_KEY, 'permintaan peminjaman')
      .filter((request) => request.status === 'Menunggu');
    books.forEach((book) => {
      const reserved = pendingRequests.filter((request) => request.bookId === book.id).length;
      const availableStock = Number(book.stock) - reserved;
      const availability = availableStock > 0 && book.status !== 'Kosong';
      const option = new Option(
        `${book.id} — ${book.title} (${book.status}; tersedia ${Math.max(availableStock, 0)} dari ${book.stock})`,
        book.id
      );
      option.disabled = !availability;
      bookField.add(option);
    });
  };

  const renderLoanRequests = () => {
    if (!requestTableBody) return;

    try {
      const requests = readStoredArray(REQUESTS_STORAGE_KEY, 'permintaan peminjaman');
      const fragment = document.createDocumentFragment();
      requests.forEach((request) => {
        const row = document.createElement('tr');
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        const statusClass = request.status === 'Menunggu'
          ? 'warning'
          : request.status === 'Disetujui' ? 'success' : 'danger';
        badge.className = `badge ${statusClass}`;
        badge.textContent = request.status;
        statusCell.appendChild(badge);

        [
          request.memberName,
          request.bookTitle,
          request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('id-ID') : '',
          `${request.loanDays} hari`
        ].forEach((value) => {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.appendChild(cell);
        });
        row.appendChild(statusCell);

        const actionCell = document.createElement('td');
        actionCell.className = 'row-actions';
        if (request.status === 'Menunggu') {
          const approveButton = document.createElement('button');
          approveButton.className = 'text-btn';
          approveButton.type = 'button';
          approveButton.dataset.requestApprove = request.id;
          approveButton.textContent = 'Konfirmasi';
          const rejectButton = document.createElement('button');
          rejectButton.className = 'text-btn danger';
          rejectButton.type = 'button';
          rejectButton.dataset.requestReject = request.id;
          rejectButton.textContent = 'Tolak';
          actionCell.append(approveButton, rejectButton);
        } else {
          actionCell.textContent = '—';
        }
        row.appendChild(actionCell);
        fragment.appendChild(row);
      });
      requestTableBody.replaceChildren(fragment);
    } catch (error) {
      if (requestAdminStatus) {
        requestAdminStatus.textContent = `Gagal memuat permintaan: ${error.message}`;
        requestAdminStatus.style.color = '#b91c1c';
      }
    }
  };

  try {
    members = readStoredArray(MEMBERS_STORAGE_KEY, 'anggota');
    books = readStoredArray(BOOKS_STORAGE_KEY, 'buku');
    populateSelections();
  } catch (error) {
    setFormStatus(`Gagal memuat pilihan peminjaman: ${error.message}`, true);
    return;
  }

  renderLoanRequests();
  if (requestTableBody) {
    window.addEventListener('storage', (event) => {
      if (![REQUESTS_STORAGE_KEY, BOOKS_STORAGE_KEY, MEMBERS_STORAGE_KEY].includes(event.key)) return;
      try {
        members = readStoredArray(MEMBERS_STORAGE_KEY, 'anggota');
        books = readStoredArray(BOOKS_STORAGE_KEY, 'buku');
        populateSelections();
        renderLoanRequests();
      } catch (error) {
        if (requestAdminStatus) {
          requestAdminStatus.textContent = `Gagal memperbarui data: ${error.message}`;
          requestAdminStatus.style.color = '#b91c1c';
        }
      }
    });

    requestTableBody.addEventListener('click', (event) => {
      const button = event.target instanceof Element
        ? event.target.closest('[data-request-approve], [data-request-reject]')
        : null;
      if (!button) return;

      try {
        const requests = readStoredArray(REQUESTS_STORAGE_KEY, 'permintaan peminjaman');
        const requestId = button.dataset.requestApprove || button.dataset.requestReject;
        const request = requests.find((item) => item.id === requestId && item.status === 'Menunggu');
        if (!request) return;

        if (button.hasAttribute('data-request-reject')) {
          request.status = 'Ditolak';
          request.resolvedAt = new Date().toISOString();
          localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
          if (requestAdminStatus) {
            requestAdminStatus.textContent = `Permintaan ${request.id} ditolak.`;
            requestAdminStatus.style.color = '#15803d';
          }
          renderLoanRequests();
          return;
        }

        const latestBooks = readStoredArray(BOOKS_STORAGE_KEY, 'buku');
        const book = latestBooks.find((item) => item.id === request.bookId);
        const stock = Number(book?.stock);
        const loanDays = Number(request.loanDays);
        if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > 30) {
          if (requestAdminStatus) {
            requestAdminStatus.textContent = 'Lama peminjaman pada permintaan tidak valid.';
            requestAdminStatus.style.color = '#b91c1c';
          }
          return;
        }
        if (!book || !Number.isInteger(stock) || stock <= 0 || book.status === 'Kosong') {
          if (requestAdminStatus) {
            requestAdminStatus.textContent = 'Stok buku sudah habis; permintaan tidak dapat dikonfirmasi.';
            requestAdminStatus.style.color = '#b91c1c';
          }
          return;
        }

        const loanDate = new Date();
        const dueDate = new Date(loanDate);
        dueDate.setDate(dueDate.getDate() + loanDays);
        const newLoan = {
          id: `PJ-${Date.now()}`,
          memberId: request.memberId,
          memberName: request.memberName,
          bookId: book.id,
          bookTitle: book.title,
          category: book.category,
          loanDate: localDateValue(loanDate),
          dueDate: localDateValue(dueDate),
          loanDays,
          status: 'Aktif'
        };
        const remainingStock = stock - 1;
        const nextBooks = latestBooks.map((item) => item.id === book.id
          ? { ...item, stock: remainingStock, status: remainingStock === 0 ? 'Kosong' : item.status }
          : item);
        const loans = readStoredArray(LOANS_STORAGE_KEY, 'peminjaman');
        request.status = 'Disetujui';
        request.resolvedAt = new Date().toISOString();

        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(nextBooks));
        localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify([newLoan, ...loans]));
        localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
        books = nextBooks;
        populateSelections();
        if (requestAdminStatus) {
          requestAdminStatus.textContent = `Permintaan disetujui. Peminjaman ${newLoan.id} berhasil dibuat.`;
          requestAdminStatus.style.color = '#15803d';
        }
        renderLoanRequests();
      } catch (error) {
        if (requestAdminStatus) {
          requestAdminStatus.textContent = `Gagal memproses permintaan: ${error.message}`;
          requestAdminStatus.style.color = '#b91c1c';
        }
      }
    });
  }

  memberField.addEventListener('change', () => {
    const member = members.find((item) => item.id === memberField.value);
    memberDetails.textContent = member
      ? `${member.phone} · ${member.email}`
      : 'Belum ada anggota terpilih.';
  });

  bookField.addEventListener('change', () => {
    const book = books.find((item) => item.id === bookField.value);
    categoryField.value = book ? book.category : '';
  });

  loanDateField.value = localDateValue(new Date());
  updateDueDate();
  updateFee();
  loanDateField.addEventListener('input', updateDueDate);
  loanDaysField.addEventListener('input', () => {
    updateDueDate();
    updateFee();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      memberDetails.textContent = 'Belum ada anggota terpilih.';
      categoryField.value = '';
      loanDateField.value = localDateValue(new Date());
      updateDueDate();
      updateFee();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const member = members.find((item) => item.id === memberField.value);
    const book = books.find((item) => item.id === bookField.value);
    const stock = Number(book?.stock);
    let pendingRequests;
    try {
      pendingRequests = readStoredArray(REQUESTS_STORAGE_KEY, 'permintaan peminjaman')
        .filter((request) => request.status === 'Menunggu' && request.bookId === book?.id).length;
    } catch (error) {
      setFormStatus(`Gagal memeriksa permintaan tertunda: ${error.message}`, true);
      return;
    }
    if (!member || !book || !Number.isInteger(stock) || stock - pendingRequests <= 0 || book.status === 'Kosong') {
      setFormStatus('Pilih anggota terdaftar dan buku yang masih tersedia.', true);
      return;
    }

    if (dueDateField.value <= loanDateField.value) {
      setFormStatus('Batas kembali harus setelah tanggal pinjam.', true);
      return;
    }

    try {
      const loans = readStoredArray(LOANS_STORAGE_KEY, 'peminjaman');
      const nextLoans = [{
        id: `PJ-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        loanDate: loanDateField.value,
        dueDate: dueDateField.value,
        loanDays: Number(loanDaysField.value),
        status: 'Aktif'
      }, ...loans];
      const nextBooks = books.map((item) => {
        if (item.id !== book.id) return item;
        const remainingStock = stock - 1;
        return {
          ...item,
          stock: remainingStock,
          status: remainingStock === 0 ? 'Kosong' : item.status
        };
      });
      localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(nextLoans));
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(nextBooks));
      books = nextBooks;
      populateSelections();
    } catch (error) {
      setFormStatus(`Peminjaman gagal disimpan: ${error.message}`, true);
      return;
    }

    setFormStatus('Peminjaman berhasil disimpan.');
    form.reset();
  });
});
