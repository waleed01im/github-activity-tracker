import '../Styles/Header.css';

export default function Header({ theme, toggleTheme, repos, selectedRepo, setSelectedRepo, selectedTime, setSelectedTime }) {
    return (
        <header className="header">
            <div className="header-left">
                <div className="header-icon">
                    <i className="fa-solid fa-chart-simple text-xl"></i>
                </div>
                <div className="header-title">
                    <h1>Github Activity Tracker</h1>
                    <p>Welcome to the Github Activity Tracker</p>
                </div>
            </div>
            <div className="header-right">
                {/* Repository Dropdown */}
                <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                    <option value="All">All Repositories</option>
                    {/* Real data se repos map karein */}
                    {repos?.map((r) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                </select>

                {/* Time Dropdown */}
                <select value={selectedTime} onChange={(e) => setSelectedTime(Number(e.target.value))}>
                    <option value={8}>Last 8 Weeks</option>
                    <option value={4}>Last 4 Weeks</option>
                </select>

                <button onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? (
                        <i className="fa-solid fa-sun" style={{ color: '#f59e0b' }}></i>
                    ) : (
                        <i className="fa-solid fa-moon" style={{ color: '#cbd5e1' }}></i>
                    )}
                </button>
            </div>
        </header>
    )
}