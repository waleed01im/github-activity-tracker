import '../Styles/KpiCard.css'

export default function KpiCard({ label, value, change, color, icon }) {
    // Agar change null hai (jaise Stars mein), toh error na aaye
    const up = change > 0 || change === null;

    return (
        <div className="card kpi-card">
            <div className="kpi-top">
                <div>
                    <p className="kpi-value">{value.toLocaleString()}</p>
                    <p className="kpi-label">{label}</p>
                </div>
                
                <div className="kpi-icon" style={{ color: color, backgroundColor: color + '15' }}>
                    {icon}
                </div>
            </div>
            
            {change !== null && (
                <p className={up ? 'kpi-change up' : 'kpi-change down'}>
                    {up ? (
                  <><i className="fa-solid fa-arrow-trend-up"></i> +{change}%</>
                ) : (
                  <><i className="fa-solid fa-arrow-trend-down"></i> {change}%</>
                )}
                </p>
            )}
        </div>
    )
}