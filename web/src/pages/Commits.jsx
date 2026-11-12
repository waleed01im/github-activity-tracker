import '../Styles/Pages.css'

export default function Commits({ data }) {

  const commits = data.recentCommits || [];

  return (
    <div className="page-container">
      <h2 className="page-title">Recent Commits</h2>
      <div className="card list-card">
        {commits.map((c, i) => (
          <div key={i} className="list-item">
            <div className="commit-icon">
              <i className="fa-solid fa-code-commit"></i>
            </div>
            <div className="list-content">
              <h4>{c.msg}</h4>
              <p><strong>{c.author}</strong> committed in <strong>{c.repo}</strong></p>
            </div>
            <div className="list-time">{c.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}