import '../Styles/ContributorsCard.css'

export default function ContributorsCard({ items }) {
  const top = items.slice(0, 4)
  const max = Math.max(...top.map((item) => item.commits), 1)

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">
          {/* <span className="chart-icon"> */}
            <i className="fa-solid fa-trophy" />
          {/* </span> */}
          Top Contributors
        </h3>
      </div>

      <ul className="contrib-list">
        {top.map((item, i) => (
          <li key={item.login} className={`contrib-row rank-${i + 1}`}>
            <span className="contrib-rank">{i + 1}</span>
            <img
              className="contrib-avatar"
              src={'https://github.com/' + item.login + '.png?size=80'}
              alt={item.login}
            />
            <div className="contrib-info">
              <span className="contrib-name">{item.login}</span>

              <div className="contrib-line">
                <div className="contrib-track">
                  <div
                    className="contrib-fill"
                    style={{ width: (item.commits / max) * 100 + '%' }}
                  />
                </div>
                <span className="contrib-count">
                  <b>{item.commits.toLocaleString()}</b> 
                  <small> commits</small>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}