import '../Styles/Pages.css'

export default function PullRequests({ data }) {
  const prs = data.recentPRs || []

  return (
    <div className="page-container">
      <h2 className="page-title">Pull Requests</h2>
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
            {prs.map((pr, i) => (
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
                <td className="text-gray-500">{pr.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}