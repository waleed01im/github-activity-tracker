import '../Styles/Pages.css'

export default function PullRequests({ data }) {
  const prStatus = data.prStatus || []
  const prs = data.recentPRs || []

  const merged = prStatus.find(p => p.name === 'Merged')?.value || 0
  const open = prStatus.find(p => p.name === 'Open')?.value || 0
  const closed = prStatus.find(p => p.name === 'Closed')?.value || 0
  const median = data?.mergeTime?.median || '-'

  return (
    <div className="page-container">

      {/* Header */}
      <div className="pr-header">
        <h2 className="page-title">Pull Requests</h2>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="pr-kpi-grid">
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Median Merge Time</span>
          <h2 className="pr-kpi-value medians">
            {median && median !== '-' ? median.replace('h', ' hours') : '-'}
          </h2>
        </div>

        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Open PRs</span>
          <h2 className="pr-kpi-value open">{open.toLocaleString()}</h2>
        </div>
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Closed PRs</span>
          <h2 className="pr-kpi-value close">{closed.toLocaleString()}</h2>
        </div>

        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Merged PRs</span>
          <h2 className="pr-kpi-value merge">{merged.toLocaleString()}</h2>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>PR Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {prs.length > 0 ? (
              prs.map((pr, i) => (
                <tr key={i}>
                  <td className="font-bold">
                    <i className="fa-solid fa-code-pull-request text-indigo-500 mr-2"></i>
                    {pr.title}
                  </td>
                  <td>{pr.author}</td>
                  <td>
                    <span className={`status-badge ${pr.status?.toLowerCase()}`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="text-gray-500">{pr.time || pr.created_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  No Pull Requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  )
}
