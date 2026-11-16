import '../Styles/Header.css';

export default function Header({ theme, toggleTheme}) {
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