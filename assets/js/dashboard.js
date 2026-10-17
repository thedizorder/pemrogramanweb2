document.addEventListener('DOMContentLoaded', () => {
  if (!window.elibraryHasRole('admin')) return;

  const trendCanvas = document.getElementById('trendChart');
  if (trendCanvas) {
    new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'Dipinjam',
            data: [220, 260, 232, 350, 335, 410, 460],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#2563eb'
          },
          {
            label: 'Dikembalikan',
            data: [180, 210, 205, 300, 318, 370, 410],
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#14b8a6'
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: '#e2e8f0'
            }
          }
        }
      }
    });
  }

  const categoryCanvas = document.getElementById('categoryChart');
  if (categoryCanvas) {
    new Chart(categoryCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Sains', 'Sosial', 'Teknik', 'Umum'],
        datasets: [{
          data: [38, 27, 23, 12],
          backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b', '#cbd5e1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
});
