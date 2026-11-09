import '../Styles/Header.css';

export default function Header({ theme, toggleTheme }) {
    return (
        <header className="header">
            <div className="header-left">
                <div className="header-icon">
                    <i class="fa-solid fa-chart-simple text-xl"></i>
                </div>
                <div className="header-title">
                    <h1>Github Activity Tracker</h1>
                    <p>Welcome to the Github Activity Tracker</p>
                </div>
            </div>
            <div className="header-right">
                <select>
                    <option>All Repositories</option>
                </select>
                <select>
                    <option>Last 8 Weeks</option>
                    <option>Last 4 Weeks</option>
                </select>
                <button onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? (
                        <i className="fa-solid fa-moon" style={{ color: '#64748b' }}></i>
                    ) : (
                        <i className="fa-solid fa-sun" style={{ color: '#f59e0b' }}></i>
                    )}
                </button>
            </div>

        </header>
    )
}