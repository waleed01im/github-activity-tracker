import '../Styles/Pages.css'

export default function Contributors({ data }) {
  const contributors = data.allContributors || data.contributors || []

  // Role aur Peak Activity generate karne ka helper function
  const getContributorMeta = (index, commits) => {
    const roles = ['Backend Lead', 'Frontend Architect', 'Fullstack Eng', 'DevOps Eng', 'QA Engineer', 'UI/UX Dev']
    const times = ['09:00 PKT - 12:00 PKT', '11:00 PKT - 15:00 PKT', '14:00 PKT - 18:00 PKT', '16:00 PKT - 20:00 PKT', '20:00 PKT - 23:00 PKT']
    
    // Dummy calculation (Real backend se aane par isko hata dein)
    const linesAdded = Math.floor(commits * 35.5)
    const linesDeleted = Math.floor(commits * 8.2)

    return {
      role: roles[index % roles.length],
      time: times[index % times.length],
      linesAdded,
      linesDeleted
    }
  }

  return (
    <div className="page-container">
      
      {/* Header Section */}
      <div className="contrib-page-header">
        <div>
          <h2 className="page-title">Human Contributor Leaderboard</h2>
        </div>
        <div className="bot-filter-badge">
          <i className="fa-solid fa-shield-halved"></i> Bot Filter Active
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card table-card">
        <table className="data-table contrib-table">
          <thead>
            <tr>
              <th>Rank & Developer</th>
              <th>Commits</th>
              <th>Lines Added (+)</th>
              <th>Lines Deleted (-)</th>
              <th>Peak Activity (PKT)</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c, i) => {
              const meta = getContributorMeta(i, c.commits)
              return (
                <tr key={i}>
                  {/* Rank & Developer */}
                  <td>
                    <div className="dev-cell">
                      <span className="dev-rank">#{i + 1}</span>
                      <img 
                        src={`https://github.com/${c.login}.png?size=80`} 
                        alt={c.login} 
                        className="dev-avatar" 
                      />
                      <div className="dev-info">
                        <span className="dev-name">{c.login}</span>
                        <span className="dev-role">{meta.role}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Commits */}
                  <td className="font-bold">{c.commits.toLocaleString()}</td>
                  
                  {/* Lines Added */}
                  <td className="lines-added">+{meta.linesAdded.toLocaleString()}</td>
                  
                  {/* Lines Deleted */}
                  <td className="lines-deleted">-{meta.linesDeleted.toLocaleString()}</td>
                  
                  {/* Peak Activity */}
                  <td className="text-gray-500">{meta.time}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}