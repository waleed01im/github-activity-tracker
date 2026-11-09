import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import '../Styles/ChartCard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function BarCard({ title, labels, color, values, rotate, big, bigLabel, icon }) {
    const chartData = {
        labels: labels,
        datasets: [
            {
                data: values,
                backgroundColor: color,
                hoverBackgroundColor: color
                    ? `color-mix(in srgb, ${color} 80%, black)`
                    : '',
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 8,
                cornerRadius: 8,
                displayColors: false,
                titleFont: { family: "Google Sans", size: 12, weight: '700' },
                bodyFont: { family: "Google Sans", size: 11 },
                callbacks: {
                    label: (context) => context.parsed.y.toLocaleString() + ' commits',
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11 }, minRotation: rotate },
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { display: false, color: 'rgba(148, 163, 184, 0.15)' },
                ticks: { display: false, color: '#94a3b8', font: { size: 11 } },
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
                {big && (

                    <div className="big-stat">
                        <strong>{big}</strong>
                        <span>{bigLabel}</span>
                    </div>
                )}
            </div>

            <div className="line-wrap">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    )
}