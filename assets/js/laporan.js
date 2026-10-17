document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('admin')) return;

  const printButton = document.querySelector('#printButton');
  const exportButton = document.querySelector('#exportButton');
  const filterButton = document.querySelector('#filterPeriodButton');
  const reportTable = document.querySelector('#reportTable');
  const monthData = {
    'Juli 2026': [
      { jenis: 'Rekap Peminjaman', periode: 'Juli 2026', nilai: '1.240 transaksi', status: 'Tuntas' },
      { jenis: 'Analisis Kategori', periode: 'Juli 2026', nilai: '42% Sains', status: 'Siap' },
      { jenis: 'Monitoring Denda', periode: 'Juli 2026', nilai: 'Rp 3.6M', status: 'Perlu fokus' }
    ],
    'Agustus 2026': [
      { jenis: 'Rekap Peminjaman', periode: 'Agustus 2026', nilai: '1.310 transaksi', status: 'Tuntas' },
      { jenis: 'Analisis Kategori', periode: 'Agustus 2026', nilai: '45% Sains', status: 'Siap' },
      { jenis: 'Monitoring Denda', periode: 'Agustus 2026', nilai: 'Rp 3.1M', status: 'Baik' }
    ],
    'September 2026': [
      { jenis: 'Rekap Peminjaman', periode: 'September 2026', nilai: '1.420 transaksi', status: 'Tuntas' },
      { jenis: 'Analisis Kategori', periode: 'September 2026', nilai: '48% Sains', status: 'Siap' },
      { jenis: 'Monitoring Denda', periode: 'September 2026', nilai: 'Rp 2.8M', status: 'Baik' }
    ]
  };

  const monthOrder = Object.keys(monthData);
  let monthIndex = 0;

  function renderReportTable(monthName) {
    if (!reportTable) return;

    const rows = monthData[monthName] || monthData[monthOrder[0]];
    const tableBody = reportTable.querySelector('tbody');

    tableBody.innerHTML = rows.map((row) => {
      const statusClass = row.status === 'Tuntas' || row.status === 'Baik' || row.status === 'Siap' ? 'success' : row.status === 'Perlu fokus' ? 'warning' : 'info';
      return `
        <tr data-row>
          <td>${row.jenis}</td>
          <td>${row.periode}</td>
          <td>${row.nilai}</td>
          <td><span class="badge ${statusClass}">${row.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  renderReportTable(monthOrder[monthIndex]);

  if (filterButton) {
    filterButton.addEventListener('click', () => {
      monthIndex = (monthIndex + 1) % monthOrder.length;
      const selectedMonth = monthOrder[monthIndex];
      renderReportTable(selectedMonth);
      filterButton.textContent = `Filter Bulan (${selectedMonth})`;
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const table = document.querySelector('#reportTable');
      const selectedMonth = monthOrder[monthIndex];
      if (table) {
        window.exportTableToCsv(table, `laporan-${selectedMonth.toLowerCase().replace(/\s+/g, '-')}.csv`);
      }
    });
  }
});
