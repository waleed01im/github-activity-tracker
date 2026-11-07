import '../Styles/Header.css';

export default function Header({ theme, toggleTheme }) {
    return (
        <header className="header">
            <div>
                <h1>Github Activity Tracker</h1>
                <p>Welcome to the Github Activity Tracker</p>
            </div>
            <div className="header-right">
                <select>
                    <option>All Repositories</option>
                </select>
                <select>
                    <option>Last 8 Weeks</option>
                    <option>Last 4 Weeks</option>
                </select>
                <button onClick={toggleTheme}>
                    {theme === 'light' ? 'Dark' : 'Light'}
                </button>
            </div>

        </header>
    )
}