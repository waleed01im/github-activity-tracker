import '../Styles/Pages.css'

export default function Commits({ data }) {
  // Aapka purana list data
  const commits = data?.recentCommits || [];

  // KPI Cards ke liye data nikalna
  const totalCommits = data?.kpis?.find(k => k.label === 'Total Commits')?.value || 0;
  const topRepo = data?.allRepositories?.[0]?.name || 'N/A';
  const totalContributors = data?.kpis?.find(k => k.label === 'Contributors')?.value || 0;
  
  // Pichle hafte ke commits nikalna (Weekly activity ke aakhri data point se)
  const weeklyData = data?.weeklyActivity?.datasets?.[0]?.data || [];
  const commitsThisWeek = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : 0;

  return (
    <div className="page-container">
      
      {/* 1. Naya Header */}
      <div className="pr-header">
        <h2 className="page-title">Commit Activity</h2>
        <p className="page-subtitle">Track code pushes, active repositories, and developer contributions.</p>
      </div>

      {/* 2. Naye 4 KPI Cards (Pull Request walay style mein) */}
      <div className="pr-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Total Commits</span>
          <h2 className="pr-kpi-value" style={{ color: 'var(--brand-600)' }}>
            {totalCommits.toLocaleString()}
          </h2>
        </div>
        
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Top Repository</span>
          <h2 className="pr-kpi-value" style={{ color: '#0f766e', fontSize: '22px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topRepo}
          </h2>
        </div>
        
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Active Contributors</span>
          <h2 className="pr-kpi-value" style={{ color: '#8b5cf6' }}>
            {totalContributors.toLocaleString()}
          </h2>
        </div>
        
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Commits This Week</span>
          <h2 className="pr-kpi-value" style={{ color: '#f43f5e' }}>
            {commitsThisWeek.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* 3. Aapka Purana List (Bilkul waisa hi) */}
      <div className="card list-card">
        {commits.map((c, i) => (
          <div key={i} className="list-item">
            <div className="commit-icon">
              <i className="fa-solid fa-code-commit"></i>
            </div>
            <div className="list-content">
              {/* <h4>{c.msg}</h4> */}
              <p><strong>{c.author}</strong> committed in <strong>{c.repo}</strong></p>
            </div>
            <div className="list-time">{c.time}</div>
          </div>
        ))}
      </div>

    </div>
  )
}