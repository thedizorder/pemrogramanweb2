const BOOKS_STORAGE_KEY = 'elibrary_books';
const MEMBERS_STORAGE_KEY = 'elibrary_members';
const LOANS_STORAGE_KEY = 'elibrary_loans';

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

    books.forEach((book) => {
      const availability = book.stock > 0 && book.status !== 'Kosong';
      const option = new Option(`${book.id} — ${book.title} (${book.status}; stok ${book.stock})`, book.id);
      option.disabled = !availability;
      bookField.add(option);
    });
  };

  try {
    members = readStoredArray(MEMBERS_STORAGE_KEY, 'anggota');
    books = readStoredArray(BOOKS_STORAGE_KEY, 'buku');
    populateSelections();
  } catch (error) {
    setFormStatus(`Gagal memuat pilihan peminjaman: ${error.message}`, true);
    return;
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
    if (!member || !book || !Number.isInteger(stock) || stock <= 0 || book.status === 'Kosong') {
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
