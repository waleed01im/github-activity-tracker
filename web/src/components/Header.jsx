import '../Styles/Header.css';

export default function Header({
    theme,
    toggleTheme,
    repos = [],
    selectedRepo = 'All',
    setSelectedRepo,
    selectedDays = 60,
    setSelectedDays
}) {
    return (
        <header className="header">
            <div className="header-left">
                <div className="header-icon">
                    <i className="fa-solid fa-chart-simple text-xl"></i>
                </div>
                <div className="header-title">
                    <h1>Github Activity Tracker</h1>
                    <p>Developer insights, simplified.</p>
                </div>
            </div>
            <div className="header-right">

                {repos.length > 0 && setSelectedRepo && (
                    <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                        <option value="All">All Repositories</option>
                        {repos.map((r) => (
                            <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                    </select>
                )}

                {/* Time Dropdown */}
                {setSelectedDays && (
                    <select
                        value={selectedDays}
                        onChange={(e) => {
                            const v = e.target.value
                            setSelectedDays(v === 'all' ? 'all' : Number(v))
                        }}
                    >
                        <option value="all">All Data</option>
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={60}>Last 60 Days</option>
                    </select>
                )}

                {/* Theme Toggle Button */}
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