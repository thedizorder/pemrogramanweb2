const BORROWER_STORAGE_KEY = 'elibrary_loans';
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function readBorrowerLoans() {
  const storedLoans = localStorage.getItem(BORROWER_STORAGE_KEY);
  if (!storedLoans) return [];

  const loans = JSON.parse(storedLoans);
  if (!Array.isArray(loans) || loans.some((loan) => !loan || typeof loan !== 'object' || Array.isArray(loan))) {
    throw new Error('Data peminjaman tidak valid.');
  }
  return loans;
}

function parseLocalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }
  return timestamp;
}

function formatLoanDate(value) {
  const timestamp = parseLocalDate(value);
  if (timestamp === null) return 'Tanggal tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(timestamp);
}

function createBorrowerCell(value) {
  const cell = document.createElement('td');
  cell.textContent = value == null || value === '' ? '—' : String(value);
  return cell;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('admin')) return;

  const tableBody = document.querySelector('#borrowerTable tbody');
  const searchField = document.getElementById('borrowerSearch');
  const statusFilter = document.getElementById('borrowerStatusFilter');
  const statusMessage = document.getElementById('borrowerStatus');
  const emptyState = document.getElementById('borrowerEmptyState');
  let loans = [];
  let todayTimestamp;

  const setStatus = (message, isError = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('error', isError);
  };

  const getLoanDetails = (loan) => {
    const startTimestamp = parseLocalDate(loan.loanDate);
    const dueTimestamp = parseLocalDate(loan.dueDate);
    const loanDays = Number(loan.loanDays);
    const duration = Number.isInteger(loanDays) && loanDays > 0
      ? loanDays
      : startTimestamp !== null && dueTimestamp !== null
        ? Math.max(0, Math.round((dueTimestamp - startTimestamp) / DAY_IN_MILLISECONDS))
        : null;
    const isReturned = ['Dikembalikan', 'Selesai'].includes(loan.status);
    const daysRemaining = dueTimestamp === null
      ? null
      : Math.ceil((dueTimestamp - todayTimestamp) / DAY_IN_MILLISECONDS);
    const isOverdue = !isReturned && daysRemaining !== null && daysRemaining < 0;
    const status = isReturned ? 'Selesai' : isOverdue ? 'Terlambat' : 'Aktif';

    let remainingLabel = 'Tanggal jatuh tempo belum valid';
    if (isReturned) {
      remainingLabel = 'Sudah dikembalikan';
    } else if (daysRemaining !== null) {
      remainingLabel = daysRemaining < 0
        ? `Terlambat ${Math.abs(daysRemaining)} hari`
        : daysRemaining === 0
          ? 'Jatuh tempo hari ini'
          : `Sisa ${daysRemaining} hari`;
    }

    return { duration, daysRemaining, isOverdue, isReturned, remainingLabel, status };
  };

  const updateSummary = () => {
    let active = 0;
    let dueSoon = 0;
    let overdue = 0;

    loans.forEach((loan) => {
      const details = getLoanDetails(loan);
      if (details.isReturned) return;
      active += 1;
      if (details.isOverdue) overdue += 1;
      else if (details.daysRemaining !== null && details.daysRemaining <= 3) dueSoon += 1;
    });

    document.getElementById('activeLoansCount').textContent = active;
    document.getElementById('dueSoonCount').textContent = dueSoon;
    document.getElementById('overdueCount').textContent = overdue;
    document.getElementById('totalLoansCount').textContent = loans.length;
  };

  const renderLoans = () => {
    const keyword = searchField.value.trim().toLocaleLowerCase('id-ID');
    const selectedStatus = statusFilter.value;
    const matchingLoans = loans.filter((loan) => {
      const details = getLoanDetails(loan);
      const searchableText = [
        loan.id,
        loan.memberId,
        loan.memberName,
        loan.bookId,
        loan.bookTitle
      ].filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
      return searchableText.includes(keyword) &&
        (selectedStatus === 'all' || details.status === selectedStatus);
    });

    const fragment = document.createDocumentFragment();
    matchingLoans.forEach((loan) => {
      const details = getLoanDetails(loan);
      const row = document.createElement('tr');
      row.dataset.row = '';
      row.append(
        createBorrowerCell(loan.id),
        createBorrowerCell(`${loan.memberName || 'Nama tidak tersedia'}${loan.memberId ? ` (${loan.memberId})` : ''}`),
        createBorrowerCell(`${loan.bookTitle || 'Judul tidak tersedia'}${loan.bookId ? ` (${loan.bookId})` : ''}`),
        createBorrowerCell(formatLoanDate(loan.loanDate)),
        createBorrowerCell(formatLoanDate(loan.dueDate)),
        createBorrowerCell(details.duration === null ? 'Tidak diketahui' : `${details.duration} hari`)
      );

      const remainingCell = document.createElement('td');
      const remainingBadge = document.createElement('span');
      remainingBadge.className = `badge ${details.isOverdue ? 'danger' : details.daysRemaining !== null && details.daysRemaining <= 3 && !details.isReturned ? 'warning' : 'info'}`;
      remainingBadge.textContent = details.remainingLabel;
      remainingCell.appendChild(remainingBadge);
      row.appendChild(remainingCell);

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${details.status === 'Selesai' ? 'success' : details.status === 'Terlambat' ? 'danger' : 'warning'}`;
      statusBadge.textContent = details.status;
      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);

      fragment.appendChild(row);
    });

    tableBody.replaceChildren(fragment);
    emptyState.hidden = matchingLoans.length > 0;
    emptyState.querySelector('strong').textContent = loans.length === 0
      ? 'Belum ada data peminjam'
      : 'Tidak ada peminjaman yang cocok';
    emptyState.querySelector('p').textContent = loans.length === 0
      ? 'Transaksi peminjaman yang sudah disimpan akan tampil di sini.'
      : 'Ubah kata kunci pencarian atau filter status untuk melihat data lainnya.';
  };

  const loadLoans = () => {
    try {
      loans = readBorrowerLoans();
      const today = new Date();
      todayTimestamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      if (todayTimestamp === null) throw new Error('Tanggal hari ini tidak dapat dibaca.');
      updateSummary();
      renderLoans();
      setStatus('');
    } catch (error) {
      tableBody.replaceChildren();
      emptyState.hidden = true;
      setStatus(`Gagal memuat daftar peminjam: ${error.message}`, true);
    }
  };

  searchField.addEventListener('input', renderLoans);
  statusFilter.addEventListener('change', renderLoans);
  window.addEventListener('storage', (event) => {
    if (event.key === BORROWER_STORAGE_KEY) loadLoans();
  });
  document.getElementById('exportBorrowers').addEventListener('click', () => {
    window.exportTableToCsv(document.getElementById('borrowerTable'), 'daftar-peminjam.csv');
  });

  loadLoans();
});
