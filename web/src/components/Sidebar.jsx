import '../Styles/Sidebar.css';

const TABS = ['Dashboard', 'Repositories', 'Contributors', 'Pull Requests', 'Commits', 'Events']

export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">GH</div>
      {TABS.map((name) => (
        <button
          key={name}
          className={tab === name ? 'sidebar-item active' : 'sidebar-item'}
          onClick={() => setTab(name)}
        >
          {name}
        </button>
      ))}
    </aside>
  )
}