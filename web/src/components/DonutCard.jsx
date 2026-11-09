import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(ArcElement, Tooltip)

const COLORS = ['#6366f1', '#34d399', '#fbbf24', '#94a3b8']

export default function DonutCard({ title, centerLabel, items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  const chartData = {
    labels: items.map((item) => item.name),
    datasets: [
      {
        data: items.map((item) => item.value),
        backgroundColor: COLORS,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const options = {
    cutout: '78%',
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 8,
        cornerRadius: 8,
        boxWidth: 7,
        boxHeight: 7,
        titleFont: { family: "Google Sans", size: 12, weight: '700' },
        bodyFont: { family: "Google Sans", size: 12 },
        callbacks: {
          label: (context) => ' ' + context.parsed.toLocaleString(),
        },
      },
    },
  }

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">
          <span className="chart-icon" />
          {title}
        </h3>
      </div>

      <div className="donut-wrap">
        <Doughnut data={chartData} options={options} width={180} height={180} />
        <div className="donut-center">
          <strong>{total.toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className="legend">
        {items.map((item, i) => (
          <li key={item.name}>
            <span className="legend-dot" style={{ background: COLORS[i] }} />
            <span className="legend-name">{item.name}</span>
            <strong className="legend-pct">
              {((item.value / total) * 100).toFixed(1)}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}