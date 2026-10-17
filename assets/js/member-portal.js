const MEMBER_PORTAL_STORAGE = {
  books: 'elibrary_books',
  members: 'elibrary_members',
  requests: 'elibrary_loan_requests',
  loans: 'elibrary_loans',
  memberId: 'elibrary_current_member_id'
};

function readMemberPortalArray(key, label) {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error(`Data ${label} tidak valid.`);
  return parsed;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('member')) return;

  const form = document.getElementById('memberLoanRequestForm');
  const bookSelect = document.getElementById('requestBook');
  const status = document.getElementById('memberRequestStatus');
  const tableBody = document.querySelector('#memberRequestTable tbody');
  const memberId = localStorage.getItem(MEMBER_PORTAL_STORAGE.memberId);

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#15803d';
  };

  const getData = () => ({
    books: readMemberPortalArray(MEMBER_PORTAL_STORAGE.books, 'buku'),
    requests: readMemberPortalArray(MEMBER_PORTAL_STORAGE.requests, 'permintaan'),
    loans: readMemberPortalArray(MEMBER_PORTAL_STORAGE.loans, 'peminjaman')
  });

  const renderBooks = () => {
    const { books, requests } = getData();
    bookSelect.replaceChildren(new Option('Pilih buku', ''));
    books.forEach((book) => {
      const waiting = requests.filter((request) =>
        request.bookId === book.id && request.status === 'Menunggu'
      ).length;
      const available = Number(book.stock) - waiting;
      const option = new Option(
        `${book.title} — ${book.category} (stok tersedia: ${Math.max(available, 0)})`,
        book.id
      );
      option.disabled = !Number.isInteger(Number(book.stock)) ||
        available <= 0 ||
        book.status === 'Kosong';
      bookSelect.add(option);
    });
  };

  const renderRequests = () => {
    const { requests } = getData();
    const myRequests = requests.filter((request) => request.memberId === memberId);
    const fragment = document.createDocumentFragment();

    myRequests.forEach((request) => {
      const row = document.createElement('tr');
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${request.status === 'Menunggu' ? 'warning' : request.status === 'Disetujui' ? 'success' : 'danger'}`;
      badge.textContent = request.status;
      statusCell.appendChild(badge);

      [
        request.bookTitle,
        request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('id-ID') : '',
        `${request.loanDays} hari`
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      row.appendChild(statusCell);
      fragment.appendChild(row);
    });

    tableBody.replaceChildren(fragment);
  };

  try {
    const members = readMemberPortalArray(MEMBER_PORTAL_STORAGE.members, 'anggota');
    if (!members.some((member) => member.id === memberId)) {
      throw new Error('Data akun anggota tidak ditemukan. Silakan daftar kembali.');
    }
    renderBooks();
    renderRequests();
  } catch (error) {
    setStatus(`Tidak dapat memuat portal anggota: ${error.message}`, true);
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  window.addEventListener('storage', (event) => {
    if (![MEMBER_PORTAL_STORAGE.books, MEMBER_PORTAL_STORAGE.requests].includes(event.key)) return;
    try {
      renderBooks();
      renderRequests();
    } catch (error) {
      setStatus(`Gagal memperbarui data: ${error.message}`, true);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    try {
      const { books, requests, loans } = getData();
      const members = readMemberPortalArray(MEMBER_PORTAL_STORAGE.members, 'anggota');
      const member = members.find((item) => item.id === memberId);
      const book = books.find((item) => item.id === bookSelect.value);
      const loanDays = Number(document.getElementById('requestLoanDays').value);

      if (!member || !book || !Number.isInteger(loanDays) || loanDays < 1 || loanDays > 30) {
        setStatus('Pilihan anggota atau buku tidak valid.', true);
        return;
      }

      const waiting = requests.filter((request) =>
        request.bookId === book.id && request.status === 'Menunggu'
      ).length;
      const available = Number(book.stock) - waiting;
      if (!Number.isInteger(Number(book.stock)) || available <= 0 || book.status === 'Kosong') {
        setStatus('Stok buku tidak tersedia untuk permintaan baru.', true);
        renderBooks();
        return;
      }

      const duplicateRequest = requests.some((request) =>
        request.memberId === memberId &&
        request.bookId === book.id &&
        request.status === 'Menunggu'
      );
      const alreadyBorrowed = loans.some((loan) =>
        loan.memberId === memberId &&
        loan.bookId === book.id &&
        loan.status === 'Aktif'
      );
      if (duplicateRequest || alreadyBorrowed) {
        setStatus('Anda sudah memiliki permintaan yang menunggu atau peminjaman aktif untuk buku ini.', true);
        return;
      }

      const request = {
        id: `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        memberId,
        memberName: member.name,
        bookId: book.id,
        bookTitle: book.title,
        loanDays,
        requestedAt: new Date().toISOString(),
        status: 'Menunggu'
      };
      localStorage.setItem(MEMBER_PORTAL_STORAGE.requests, JSON.stringify([request, ...requests]));
      form.reset();
      renderBooks();
      renderRequests();
      setStatus('Permintaan terkirim dan sedang menunggu konfirmasi admin.');
    } catch (error) {
      setStatus(`Permintaan gagal disimpan: ${error.message}`, true);
    }
  });
});
