import '../Styles/Sidebar.css';

const TABS = [
  { name: 'Dashboard',     icon: 'fa-solid fa-chart-simple' },
  { name: 'Repositories',  icon: 'fa-solid fa-layer-group' },
  { name: 'Contributors',  icon: 'fa-solid fa-users' },
  { name: 'Pull Requests', icon: 'fa-solid fa-code-pull-request' },
  { name: 'Commits',       icon: 'fa-solid fa-code-commit' },
  { name: 'Events',        icon: 'fa-solid fa-bolt' },
]

export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <i className="fa-brands fa-github text-3xl text-white"></i>
        <p>TraceGit</p>
      </div>
      {TABS.map(({ name, icon }) => (
        <button
          key={name}
          className={tab === name ? 'sidebar-item active' : 'sidebar-item'}
          onClick={() => setTab(name)}
        >
          <i className={icon} />
          {name}
        </button>
      ))}
    </aside>
  )
}