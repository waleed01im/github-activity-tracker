import { useState } from 'react'
import useTheme from './hooks/usetheme'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import DonutCard from './components/DonutCard'
import TrendCard from './components/TrendCard'
import BarCard from './components/BarCard'
import ContributorsCard from './components/ContributorsCard'
import InsightsCard from './components/InsightsCard'
import data from '../../data/dashboard_stats.json'


export default function App() {
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useState('Dashboard')

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
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
    <KpiCard key={k.label} {...k} />
  ))}
</div>

<div className="row row-3">
  <DonutCard
    title="Commits per Repository"
    centerLabel="Commits"
    items={data.commitsPerRepo}
    icon={<i className="fa-solid fa-code-branch" style={{ color: '#6366f1' }} />}
  />
  <DonutCard
    title="Activity by Category"
    centerLabel="Commits"
    items={data.categories}
    icon={<i className="fa-solid fa-layer-group" style={{ color: '#10b981' }} />}
  />
  <TrendCard
    title="Weekly Commit Trend"
    labels={data.weeklyTrend.labels}
    values={data.weeklyTrend.values}
    icon={<i className="fa-solid fa-chart-line" style={{ color: '#3b82f6' }} />}
  />
</div>

<div className="row row-4">
  <BarCard
    title="Weekday Pattern"
    labels={data.weekday.labels}
    values={data.weekday.values}
    color="#3b3ef5"
    rotate={30}
    icon={<i className="fa-solid fa-calendar-day" style={{ color: '#6366f1' }} />}
  />
  <TrendCard
    title="Hour Pattern (PKT)"
    labels={data.hours.labels}
    values={data.hours.values}
    showline={false}
    color="#14b8a6"
    icon={<i className="fa-solid fa-clock" style={{ color: '#3b82f6' }} />}
  />
  <ContributorsCard items={data.contributors} />
  <DonutCard
    title="Event Types"
    centerLabel="Events"
    items={data.events}
    height={130}
    width={130}
    compact
    icon={<i className="fa-solid fa-bolt" style={{ color: '#a855f7' }} />}
  />
</div>

<div className="row row-2">
  <BarCard
    title="PR Merge Time"
    big={data.mergeTime.median}
    bigLabel="Median Time"
    labels={data.mergeTime.labels}
    values={data.mergeTime.values}
    color="#30dfca"
    icon={<i className="fa-solid fa-stopwatch" style={{ color: '#6366f1' }} />}
  />
  <InsightsCard data={data} />
</div>            </>
          ) : (
            <p>{tab} content</p>
          )}
        </main>
      </div>
    </div>
  )
}



// <i class="fa-solid fa-[#4f46e5] fa-layer-group text-emerald-500"></i>  Activity by Category
// <i class="fa-solid fa-chart-line text-blue-500"></i> Weekly Commit Trend
// <i class="fa-solid fa-calendar-day text-indigo-500"></i> Weekday Pattern
// <i class="fa-solid fa-clock text-blue-500"></i> Hour Pattern (PKT)
// <i class="fa-solid fa-bolt text-purple-500"></i> Event Types
// <i class="fa-solid fa-stopwatch text-indigo-500"></i> PR Merge Time
// <i class="fa-solid fa-lightbulb text-amber-500 text-lg"></i> Insights