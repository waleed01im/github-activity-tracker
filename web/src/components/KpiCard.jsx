import Sparkline from "./Sparkline.jsx"
import '../Styles/KpiCard.css'


export default function KpiCard({ label, value, change, trend, color }) {
    const up = change > 0

    return (
        <div className="card kpi-card">
            <div className="kpi-top">
                <div>
                    <p className="kpi-value">{value.toLocaleString()}</p>
                    <p className="kpi-label">{label}</p>
                </div>
                <Sparkline values={trend} color={color} />
            </div>
            <p className={up ? 'kpi-change up' : 'kpi-change down'}>
                {up ? '↑ +' : '↓ '}
                {change}% vs previous period
            </p>
        </div>
    )
}

