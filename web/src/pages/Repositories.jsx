import '../Styles/Pages.css'

export default function Repositories({ data }) {
  // Saara data direct utha rahe hain
  const repos = data.allRepositories || []

  // Tech stack aur description generate karne ka function (Design ke liye)
  const getRepoMeta = (name) => {
    const stacks = [
      { tech: 'TypeScript / React', color: '#3178c6' },
      { tech: 'Python / PyTorch', color: '#3776ab' },
      { tech: 'Node.js / Express', color: '#339933' },
      { tech: 'Vue / Tailwind', color: '#41b883' },
      { tech: 'Go / Docker', color: '#00add8' }
    ]
    const descs = [
      'AI-powered developer collaboration and code review workspace.',
      'Personal software engineering portfolio and interactive showcases.',
      'Machine learning models, dataset scrapers, and neural pipelines.',
      'Microservices architecture and scalable backend APIs.',
      'Open source community tools and utility libraries.'
    ]
    const index = name.charCodeAt(0) % stacks.length
    return { stack: stacks[index], desc: descs[index] }
  }

  return (
    <div className="page-container">
      
      {/* Sirf Title, koi search ya button nahi */}
      <div className="repo-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">Repositories</h2>
          <p className="page-subtitle">Monitor commits, stars, branch activity, and tech stack badges.</p>
        </div>
      </div>

      {/* Grid of Repository Cards */}
      <div className="repo-grid">
        {repos.length > 0 ? (
          repos.map((repo, i) => {
            const meta = getRepoMeta(repo.name)
            const isPublic = i % 3 !== 0 // Public/Private ka random logic

            return (
              <div key={i} className="repo-card">
                <div className="repo-card-header">
                  <span 
                    className="tech-badge" 
                    style={{ color: meta.stack.color, backgroundColor: meta.stack.color + '15' }}
                  >
                    {meta.stack.tech}
                  </span>
                  <span className="visibility-text">
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                <h3 className="repo-name">
                  <i className="fa-solid fa-book text-indigo-500"></i> {repo.name}
                </h3>
                
                <p className="repo-desc">{meta.desc}</p>
                
                <div className="repo-footer">
                  <span className="repo-stat">
                    <i className="fa-solid fa-code-commit" style={{ color: '#6366f1' }}></i> 
                    {repo.value.toLocaleString()} commits
                  </span>
                  <span className="repo-stat">
                    <i className="fa-solid fa-star" style={{ color: '#eab308' }}></i> 
                    {repo.stars ? repo.stars.toLocaleString() : 0} stars
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <p style={{ color: 'var(--subtext)' }}>No repositories found.</p>
        )}
      </div>
    </div>
  )
}