import '../Styles/Pages.css'

export default function Contributors({ data }) {
  return (
    <div className="page-container">
      <h2 className="page-title">Top Contributors</h2>
      <div className="grid-3">
        {data.allContributors?.map((c, i) => (
          <div key={i} className="card contrib-card">
            <img src={`https://github.com/${c.login}.png?size=100`} alt={c.login} className="avatar-lg" />
            <h3>{c.login}</h3>
            <p>{c.commits} Commits</p>
            <div className="contrib-stats">
              <span className='custom-tooltip' data-tooltip="Commits">
                <i className="fa-solid fa-code-commit" ></i> {c.commits.toLocaleString()}</span>
              <span className='custom-tooltip' data-tooltip="Pull Requests">
                <i className="fa-solid fa-code-pull-request" ></i> {c.prs ? c.prs.toLocaleString() : 0}</span>
              <span className='custom-tooltip' data-tooltip="Issues">
                <i className="fa-solid fa-circle-exclamation"></i> {c.issues? c.issues.toLocaleString() : 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}