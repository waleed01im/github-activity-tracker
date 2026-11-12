import '../Styles/Pages.css'

export default function Events({ data }) {
  const events = data.allEvents || []

  // Event type ke hisaab se icon aur color decide karne ka function
  const getEventStyle = (eventName) => {
    switch (eventName) {
      case 'PushEvent': return { icon: 'fa-arrow-up', color: '#10b981' }
      case 'PullRequestEvent': return { icon: 'fa-code-pull-request', color: '#6366f1' }
      case 'IssuesEvent': return { icon: 'fa-circle-exclamation', color: '#f59e0b' }
      case 'WatchEvent': return { icon: 'fa-star', color: '#eab308' }
      default: return { icon: 'fa-bolt', color: '#a855f7' }
    }
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Recent Activity Events</h2>
      <div className="card list-card">
        {events.map((e, i) => {
          const style = getEventStyle(e.name)
          return (
            <div key={i} className="list-item">
              <div className="event-icon" style={{ background: style.color + '20', color: style.color }}>
                <i className={`fa-solid ${style.icon}`}></i>
              </div>
              <div className="list-content">
                <h4>{e.name}</h4>
                <p>Total {e.value} events recorded in this category.</p>
              </div>
              <div className="list-time">Recent</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}