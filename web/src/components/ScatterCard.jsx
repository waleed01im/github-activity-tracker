import { Scatter } from 'react-chartjs-2'
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

export default function ScatterCard({ title, data, icon }) {
  const chartData = {
    datasets: [{
        label: 'Repositories',
        data: data.map(item => ({ x: item.x, y: item.y, r: item.r, name: item.name, commits: item.commits })),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: '#4f46e5',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.9)',
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 10, cornerRadius: 8,
        bodyFont: { family: 'Google Sans', size: 11 },
        displayColors: false,
        callbacks: {
          label: (context) => {
            const item = context.raw;
            return [`Repo: ${item.name}`, `Stars: ${item.x.toLocaleString()}`, `Forks: ${item.y.toLocaleString()}`, `Commits: ${item.commits.toLocaleString()}`];
          }
        }
      },
    },
    scales: {
      x: { 
            title: { display: true, text: 'Stars', color: '#86878a', font: {size: 14,} },
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' },
        },
      y: {
            title: { display: true, text: 'Forks', color: '#86878a', font: {size: 14,} },
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' } },
            
    },
  }

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">{icon ? icon : <span className="chart-icon" />}{title}</h3>
      </div>
      <div className="line-wrap" style={{ height: '300px' }}>
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  )
}