export default function App() {
  const toggle = () => {
    const root = document.documentElement
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
  }

  return (
    <div style={{ padding: 32 }}>
      <div className="card" style={{ padding: 24, maxWidth: 480 }}>
        <h1 style={{ margin: 0, color: 'var(--heading)' }}>Repository Analytics</h1>
        <p style={{ color: 'var(--subtext)' }}>Track your development activity at a glance</p>
        <button onClick={toggle}>Toggle theme</button>
      </div>
    </div>
  )
}