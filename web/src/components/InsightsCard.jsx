import '../Styles/InsightsCard.css'

export default function InsightsCard({ data }) {
  const commits = data.kpis[0]
  const total = data.categories.reduce((sum, c) => sum + c.value, 0)
  const top = data.categories.reduce((a, b) => (b.value > a.value ? b : a))
  const share = ((top.value / total) * 100).toFixed(0)

  const items = [
    {
      title: 'Commit activity',
      text:
        'Commit activity is ' +
        (commits.change >= 0 ? 'up ' : 'down ') +
        Math.abs(commits.change) +
        '% compared to the previous period.',
    },
    {
      title: 'Top category',
      text: top.name + ' remains top activity category at ' + share + '% of total commits.',
    },
    {
      title: 'Pull requests',
      text: 'PRs are merged in a median of ' + data.mergeTime.median + ' which is faster than before.',
    },
  ]

  return (
    <div className="card insights">
      <h3 className="chart-title insight-title">
        <i className="fa-solid fa-lightbulb text-amber-500 text-lg"></i> 
        Insights &amp; Key Takeaways</h3>
      <div className="insights-grid">
        {items.map((item, i) => (
          <div key={item.title} className="insight">
            <span className="insight-num">{i + 1}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}