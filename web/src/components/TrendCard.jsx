import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export default function TrendCard({ title, labels, values, wide, showline = true, color = '#4f46e5' }) {
    const chartData = {
        labels: labels,
        datasets: [
            {
                data: values,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ffffff',
                borderColor: color,
                backgroundColor: color + '26',
                pointBorderColor: color,
                pointBorderWidth: 2,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 8,
                cornerRadius: 8,
                displayColors: false,
                titleFont: { family: "Google Sans", size: 12, weight: '700' },
                bodyFont: { family: "Google Sans", size: 12 },
                callbacks: {
                    label: (context) => context.parsed.y.toLocaleString() + ' commits',
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 12 } },
            },
            y: {
                // beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.15)' },
                ticks: { display: showline, color: '#94a3b8', font: { size: 12 } },
            },
        },
    }

    return (
        <div className={wide ? 'card chart-card wide' : 'card chart-card'}>
            <div className="chart-head">
                <h3 className="chart-title">
                    <span className="chart-icon" />
                    {title}
                </h3>
            </div>
            <div className="line-wrap">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
}