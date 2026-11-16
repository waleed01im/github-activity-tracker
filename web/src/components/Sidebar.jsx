import { useState } from 'react';
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
  // Yahan false ki jagah true kar dein
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fa-brands fa-github"></i>
          <p>TraceGit</p>
        </div>
        
        <button className="menu-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div className="sidebar-nav">
        {TABS.map(({ name, icon }) => (
          <button
            key={name}
            className={tab === name ? 'sidebar-item active' : 'sidebar-item'}
            onClick={() => setTab(name)}
            title={isCollapsed ? name : ''}
          >
            <i className={icon} />
            <span className="sidebar-text">{name}</span>
          </button>
        ))}
      </div>
      
    </aside>
  )
}