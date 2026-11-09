import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import DonutCard from './components/DonutCard'
import TrendCard from './components/TrendCard'
import BarCard from './components/BarCard'
import ContributorsCard from './components/ContributorsCard'
import data from './data/sample.json'


export default function App() {
  const [theme, setTheme] = useState('light')
  const [tab, setTab] = useState('Dashboard')

  function toggleTheme() {
    const newtheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newtheme)
    document.documentElement.dataset.theme = newtheme
  }
  return (
    <div className="layout">
      <Sidebar tab={tab} setTab={setTab} />
      <div className='main'>
        <Header theme={theme} toggleTheme={toggleTheme} />
        <main className='content'>
          {tab === 'Dashboard' ? (
            <>
              <div className="kpi-row">
                {data.kpis.map((k) => (
                  <KpiCard
                    key={k.label} {...k} />
                ))}
              </div>

              <div className="charts-grid">
                <DonutCard title="Commits per Repository" centerLabel="Commits"
                  items={data.commitsPerRepo}
                />
                <DonutCard title="Activity by Category" centerLabel="Commits"
                  items={data.categories}
                />
                <TrendCard
                  title="Hour Pattern (PKT)"
                  labels={data.hours.labels}
                  values={data.hours.values}
                  color="#14b8a6"
                />
                <TrendCard
                  wide
                  title="Weekly Commit Trend"
                  labels={data.weeklyTrend.labels}
                  values={data.weeklyTrend.values}
                />

                <BarCard
                  title="Weekday Pattern"
                  labels={data.weekday.labels}
                  values={data.weekday.values}
                  color="#6366f1"
                />
                <BarCard
                  title="PR Merge Time"
                  big={data.mergeTime.median}
                  bigLabel="Median Time"
                  labels={data.mergeTime.labels}
                  values={data.mergeTime.values}
                  color="#3ce0cd"
                />
                
                <ContributorsCard items={data.contributors} />

                <DonutCard title="Event Types" centerLabel="Events" items={data.events} />
              </div>
            </>
          ) : (
            <p>{tab} content</p>
          )}
        </main>
      </div>
    </div>
  )
}