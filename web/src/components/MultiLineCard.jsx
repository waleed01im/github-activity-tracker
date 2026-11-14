import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function MultiLineCard({ title, labels, datasets, icon }) {
  const chartData = {
    labels: labels,
    datasets: datasets.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color + '26',
      fill: index === 0,
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: ds.color,
      pointHoverBorderWidth: 2,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: {
      padding: {
        top: 10
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: false,
          cornerRadius: 5,
          boxWidth: 20,
          boxHeight: 0.5,
          padding: 10,
          font: { family: 'Google Sans', size: 12, weight: '600' },
          color: '#94a3b8',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8,
        usePointStyle: true,
        titleFont: { family: 'Google Sans', size: 12, weight: '700' },
        bodyFont: { family: 'Google Sans', size: 12 },
        callbacks: {
          label: (context) => ' ' + context.dataset.label + ': ' + context.parsed.y.toLocaleString(),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Google Sans', size: 11 } },
      },
      y: {
        // display: false,
        ticks: { color: '#94a3b8', font: { family: 'Google Sans', size: 11 } },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="card chart-card multiline-card">
      <div className="chart-head">
        <h3 className="chart-title">
          {icon ? icon : <span className="chart-icon" />}
          {title}
        </h3>
      </div>

      <div className="chart-bg-area">
        <div className="multiline-wrap">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  )
}