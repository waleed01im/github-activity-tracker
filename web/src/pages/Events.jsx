import '../Styles/Pages.css'

export default function Events({ data }) {
  const events = data.allEvents || []

  const getEventStyle = (eventName) => {
    switch (eventName) {
      case 'Push': return { icon: 'fa-arrow-up', color: '#10b981' } // Green
      case 'PRs': return { icon: 'fa-code-pull-request', color: '#6366f1' } // Indigo
      case 'Issues': return { icon: 'fa-circle-exclamation', color: '#f59e0b' } // Amber
      case 'Stars': return { icon: 'fa-star', color: '#eab308' } // Yellow
      case 'Forks': return { icon: 'fa-code-fork', color: '#14b8a6' } // Teal
      case 'Created': return { icon: 'fa-plus', color: '#8b5cf6' } // Purple
      case 'Deleted': return { icon: 'fa-trash', color: '#ef4444' } // Red
      case 'Releases': return { icon: 'fa-tag', color: '#f97316' } // Orange
      case 'Issue Comments': return { icon: 'fa-comment', color: '#3b82f6' } // Blue
      case 'PR Reviews': return { icon: 'fa-check-double', color: '#06b6d4' } // Cyan
      case 'Members': return { icon: 'fa-user-plus', color: '#8b5cf6' } // Purple
      default: return { icon: 'fa-bolt', color: '#a855f7' } // Default
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
                <p>Total {e.value.toLocaleString()} events recorded in this category.</p>
              </div>
              <div className="list-time">Recent</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}