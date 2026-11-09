import '../Styles/ContributorsCard.css'

export default function ContributorsCard({ items }) {
  const max = Math.max(...items.map((item) => item.commits))

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3 className="chart-title">
          <span className="chart-icon" />
          Top Contributors
        </h3>
      </div>

      <ul className="contrib-list">
        {items.map((item, i) => (
          <li key={item.login} className="contrib-row">
            <span className="contrib-rank">{i + 1}</span>
            <img
              className="contrib-avatar"
              src={'https://github.com/' + item.login + '.png?size=80'}
              alt={item.login}
            />
            <div className="contrib-info">
              <div className="contrib-top">
                <span className="contrib-name">{item.login}</span>
                <span className="contrib-count">{item.commits} commits</span>
              </div>
              <div className="contrib-track">
                <div
                  className="contrib-fill"
                  style={{ width: (item.commits / max) * 100 + '%' }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}