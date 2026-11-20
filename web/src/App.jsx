import { useState, useEffect, useRef } from 'react'
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

const KPI_ICONS = {
  'Total Commits': 'fa-code-commit',
  'Total PRs': 'fa-code-pull-request',
  'Total Stars': 'fa-star',
  'Total Forks': 'fa-code-fork',
  Contributors: 'fa-users',
}

// ---- Cache Helpers ----
function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full ya unavailable ho to ignore karein
  }
}

export default function App() {
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useState('Dashboard')

  const [selectedRepo, setSelectedRepo] = useState('All')
  const [selectedDays, setSelectedDays] = useState('all')
  const [allRepos, setAllRepos] = useState([])

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // initialLoad state: render ke liye (full screen loading)
  // initialLoadRef: effect ke andar check ke liye
  const [initialLoad, setInitialLoad] = useState(true)
  const initialLoadRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const cacheKey = `dash_cache_${selectedRepo}_${selectedDays}`
      const cached = readCache(cacheKey)
      const isDefaultView = selectedRepo === 'All' && selectedDays === 'all'

      if (cached) {
        // Cache hai: data foran set karo
        setData(cached.data)
        if (selectedRepo === 'All' && cached.data?.allRepositories) {
          setAllRepos(cached.data.allRepositories)
        }
        // Refresh par loading chalti rahe, filter change par nahi
        if (!initialLoadRef.current) setLoading(false)
      } else {
        setLoading(true)
      }

      try {
        if (!isDefaultView) {
          const response = await fetch(
            `${API}/api/dashboard?repo=${selectedRepo}&days=${selectedDays}`
          )
          if (!response.ok) throw new Error('API Error')

          const result = await response.json()
          if (cancelled) return

          writeCache(cacheKey, { version: result.updatedAt, data: result })
          setData(result)
        } else {
          const versionRes = await fetch(`${API}/api/version`)
          if (!versionRes.ok) throw new Error('Version API Error')
          const versionData = await versionRes.json()

          if (!(cached && cached.version === versionData.updated_at)) {
            const response = await fetch(
              `${API}/api/dashboard?repo=All&days=all&client_version=${versionData.updated_at}`
            )
            if (!response.ok) throw new Error('API Error')

            const result = await response.json()
            if (cancelled) return

            writeCache(cacheKey, { version: result.updatedAt, data: result })
            setData(result)
            if (result.allRepositories) setAllRepos(result.allRepositories)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setInitialLoad(false)
          initialLoadRef.current = false
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    return () => {
      cancelled = true
    }
  }, [selectedRepo, selectedDays])

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Page refresh: full screen loading
  if (loading && initialLoad) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg)',
        }}
      >
        <video src={loadVideo} width={150} height={150} autoPlay loop muted playsInline />
      </div>
    )
  }

  // API fail ho jaye aur data na mile
  if (!data && !loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg)',
        }}
      >
        <h2>Failed to load data. Please check FastAPI server.</h2>
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

        <main className="content" style={{ position: 'relative' }}>
          {/* Cache na ho to purane charts ke upar loading overlay */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: '25vh',
                zIndex: 50,
                backdropFilter: 'blur(3px)',
                backgroundColor: 'rgba(128, 128, 128, 0.15)',
              }}
            >
              <video src={loadVideo} width={120} height={120} autoPlay loop muted playsInline />
            </div>
          )}

          {data && (
            <>
              {tab === 'Dashboard' && (
                <>
                  <div className="kpi-row">
                    {data.kpis.map((k) => (
                      <KpiCard
                        key={k.label}
                        {...k}
                        icon={
                          <i className={'fa-solid ' + (KPI_ICONS[k.label] || 'fa-chart-simple')} />
                        }
                      />
                    ))}
                  </div>

                  <div className="row row-full">
                    <ContributionHeatmap
                      title="Contribution Activity"
                      data={data.heatmap || {}}
                      icon={
                        <i className="fa-solid fa-calendar-check" style={{ color: '#10b981' }} />
                      }
                    />
                  </div>

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
                      icon={
                        <i
                          className="fa-solid fa-code-pull-request"
                          style={{ color: '#14b8a6' }}
                        />
                      }
                    />
                  </div>

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
                      icon={<i className="fa-solid fa-braille" style={{ color: '#f59e0b' }} />}
                    />
                  </div>

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

              {tab === 'Repositories' && <Repositories data={data} />}
              {tab === 'Contributors' && <Contributors data={data} />}
              {tab === 'Pull Requests' && <PullRequests data={data} />}
              {tab === 'Commits' && <Commits data={data} />}
              {tab === 'Events' && <Events data={data} />}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}