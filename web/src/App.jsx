import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useTheme from './hooks/usetheme'

import loadVideo from './assets/loading.webm'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/footer'
import KpiCard from './components/KpiCard'
import DonutCard from './components/DonutCard'
import TrendCard from './components/TrendCard'
import BarCard from './components/BarCard'
import ContributorsCard from './components/ContributorsCard'
import ContributionHeatmap from './components/ComponenetHeatMap'
import MultiLineCard from './components/MultiLineCard'
import ScatterCard from './components/ScatterCard'
import HorizontalBarCard from './components/HorizontalBarCard'

// Pages
import Repositories from './pages/Repositories.jsx'
import Contributors from './pages/Contributors.jsx'
import PullRequests from './pages/PullRequests.jsx'
import Commits from './pages/Commits.jsx'
import Events from './pages/Events.jsx'

const API = import.meta.env.VITE_API_URL 

export default function App() {
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useState('Dashboard')

  const [selectedRepo, setSelectedRepo] = useState('All')
  const [selectedDays, setSelectedDays] = useState('all')
  const [allRepos, setAllRepos] = useState([])

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firstLoad, setFirstLoad] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const cacheKey = `dash_cache_${selectedRepo}_${selectedDays}`
      const cachedData = localStorage.getItem(cacheKey)
      const cachedTime = Number(localStorage.getItem(cacheKey + '_time'))
      const TEN_MINUTES = 10 * 60 * 1000
      const cacheValid = cachedData && Date.now() - cachedTime < TEN_MINUTES


      if (cacheValid && !firstLoad) {
        if (cancelled) return
        const parsed = JSON.parse(cachedData)
        setData(parsed)
        if (selectedRepo === 'All' && parsed.allRepositories) setAllRepos(parsed.allRepositories)
        return
      }

      setLoading(true)
      const startTime = Date.now()

      let result = null
      if (cacheValid) {
        result = JSON.parse(cachedData)
      } else {
        try {
          const response = await fetch(
            `${API}/api/dashboard?repo=${selectedRepo}&days=${selectedDays}`
          )
          if (!response.ok) throw new Error('API Error')
          result = await response.json()
          localStorage.setItem(cacheKey, JSON.stringify(result))
          localStorage.setItem(cacheKey + '_time', Date.now().toString())
        } catch (error) {
          console.error(error)
        }
      }

      const remaining = Math.max(0, 800 - (Date.now() - startTime))
      await new Promise((r) => setTimeout(r, remaining))

      if (cancelled) return
      if (result) {
        setData(result)
        if (selectedRepo === 'All' && result.allRepositories) setAllRepos(result.allRepositories)
      }
      setLoading(false)
      setFirstLoad(false)
    }

    fetchData()
    return () => {
      cancelled = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo, selectedDays])


  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (loading && !data) {
    return (
      <div
        className="layout"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg)',
        }}
      >
        <video src={loadVideo} width={150} height={150} autoPlay loop muted playsInline />
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className="layout"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <h2>Failed to load data.</h2>
      </div>
    )
  }

  return (
    <div className="layout">
      <Sidebar tab={tab} setTab={setTab} />
      <div className="main">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          repos={allRepos}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
        />

        <main className="content">
          {tab === 'Dashboard' && (
            <>
              {/* KPI ROW */}
              <div className="kpi-row">
                {data.kpis.map((k) => {
                  let kpiIcon = <i className="fa-solid fa-chart-simple" />
                  if (k.label === 'Total Commits') kpiIcon = <i className="fa-solid fa-code-commit" />
                  if (k.label === 'Total PRs') kpiIcon = <i className="fa-solid fa-code-pull-request" />
                  if (k.label === 'Total Stars') kpiIcon = <i className="fa-solid fa-star" />
                  if (k.label === 'Contributors') kpiIcon = <i className="fa-solid fa-users" />
                  if (k.label === 'Total Forks') kpiIcon = <i className="fa-solid fa-code-fork" />

                  return <KpiCard key={k.label} {...k} icon={kpiIcon} />
                })}
              </div>

              <div className="row row-full">
                <ContributionHeatmap
                  title="Contribution Activity"
                  data={data.heatmap || {}}
                  icon={<i className="fa-solid fa-calendar-check" style={{ color: '#10b981' }} />}
                />
              </div>

              {/* ROW 1 */}
              <div className="row row01">
                <MultiLineCard
                  title="Weekly Activity"
                  labels={data.weeklyActivity?.labels || []}
                  datasets={data.weeklyActivity?.datasets || []}
                  icon={<i className="fa-solid fa-chart-line" style={{ color: '#6366f1' }} />}
                />
                <DonutCard
                  title="PR Status Distribution"
                  centerLabel="Total PRs"
                  items={data.prStatus || []}
                  icon={<i className="fa-solid fa-code-pull-request" style={{ color: '#14b8a6' }} />}
                />
              </div>

              {/* ROW 2 */}
              <div className="row row02">
                <DonutCard
                  title="Activity by Category"
                  centerLabel="Commits"
                  items={data.categories || []}
                  icon={<i className="fa-solid fa-layer-group" style={{ color: '#10b981' }} />}
                />
                <ScatterCard
                  title="Repository Engagement Matrix"
                  data={data.repoEngagement || []}
                  icon={<i className="fa-solid fa-chart-scatter" style={{ color: '#f59e0b' }} />}
                />
              </div>

              {/* ROW 3 */}
              <div className="row row03">
                <BarCard
                  title="Weekday Pattern"
                  labels={data.weekday?.labels || []}
                  values={data.weekday?.values || []}
                  color="#3b3ef5"
                  rotate={30}
                  icon={<i className="fa-solid fa-calendar-day" style={{ color: '#6366f1' }} />}
                />
                <TrendCard
                  title="Hour Pattern (PKT)"
                  labels={data.hours?.labels || []}
                  values={data.hours?.values || []}
                  showline={false}
                  color="#14b8a6"
                  icon={<i className="fa-solid fa-clock" style={{ color: '#3b82f6' }} />}
                />
                <ContributorsCard items={data.contributors || []} />
                <DonutCard
                  title="Event Types"
                  centerLabel="Events"
                  items={data.events || []}
                  height={130}
                  width={130}
                  compact
                  icon={<i className="fa-solid fa-bolt" style={{ color: '#a855f7' }} />}
                />
              </div>

              {/* ROW 4 */}
              <div className="row row04">
                <BarCard
                  title="PR Merge Time"
                  big={data.mergeTime?.median || '0h'}
                  bigLabel="Median Time"
                  labels={data.mergeTime?.labels || []}
                  values={data.mergeTime?.values || []}
                  color="#30dfca"
                  icon={<i className="fa-solid fa-stopwatch" style={{ color: '#6366f1' }} />}
                />
                <HorizontalBarCard
                  title="Top Languages by Repositories"
                  color="#3b3ef5"
                  labels={data.topLanguages?.map((l) => l.name) || []}
                  values={data.topLanguages?.map((l) => l.value) || []}
                  icon={<i className="fa-solid fa-code" style={{ color: '#6366f1' }} />}
                />
              </div>
            </>
          )}

          {/* Pages */}
          {tab === 'Repositories' && <Repositories data={data} />}
          {tab === 'Contributors' && <Contributors data={data} />}
          {tab === 'Pull Requests' && <PullRequests data={data} />}
          {tab === 'Commits' && <Commits data={data} />}
          {tab === 'Events' && <Events data={data} />}
        </main>
        <Footer />
      </div>

      {/* Filter change par overlay loading */}
      {loading && data && createPortal(
        <div className="loading-overlay">
          <video src={loadVideo} width={100} height={100} autoPlay loop muted playsInline />
        </div>,
        document.body
      )}
    </div>
  )
}