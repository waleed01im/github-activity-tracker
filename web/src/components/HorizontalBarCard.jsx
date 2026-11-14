import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function HorizontalBarCard({ title, labels, values, icon , color}) {
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: color,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 25, 
        hoverBorderWidth: 1,
        hoverBackgroundColor: color
                    ? `color-mix(in srgb, ${color} 80%, black)`
                    : '',
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 8,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.parsed.x.toLocaleString()} Repos`,
        },
      },
    },
    scales: {
      x: {
        display: false, 
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { 
          color: '#94a3b8', 
          font: { family: 'Google Sans', size: 12, weight: '600' } 
        },
      },
    },
  }

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">
          {icon ? icon : <span className="chart-icon" />}
          {title}
        </h3>
      </div>
      <div className="line-wrap" style={{ height: '220px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}