import '../Styles/Pages.css'

export default function Repositories({ data }) {
  // JSON se data uthaya
  const repos = data.allRepositories || []

  return (
    <div className="page-container">
      <h2 className="page-title">All Repositories</h2>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Repository Name</th>
              <th>Commits</th>
              <th>Stars</th>
              <th>Forks</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo, i) => (
              <tr key={i}>
                <td className="font-bold">
                  <i className="fa-solid fa-book text-indigo-500 mr-2"></i> 
                  {repo.name}
                </td>
                <td><span className="badge">{repo.value.toLocaleString()} Commits</span></td>
                
                {/* Real Stars */}
                <td>
                  <i className="fa-solid fa-star text-yellow-500"></i> {repo.stars ? repo.stars.toLocaleString() : 0}
                </td>
                
                {/* Real Forks */}
                <td>
                  <i className="fa-solid fa-code-fork text-gray-400"></i> {repo.forks ? repo.forks.toLocaleString() : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}