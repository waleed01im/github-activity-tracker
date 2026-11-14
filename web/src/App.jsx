import { useState, useEffect } from 'react'
import useTheme from './hooks/usetheme'
import { supabase } from './supabase/supabase_Client'

import loadVideo from './assets/loading.webm'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
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

export default function App() {
  const [theme, setTheme] = useTheme()
  const [tab, setTab] = useState('Dashboard')

  // --- Supabase Data Fetching with Smart Cache ---
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    async function fetchData() {
      try {
        const { data: dbMeta, error } = await supabase
          .from('dashboard_stats')
          .select('updated_at')
          .eq('id', 1)
          .single()

        if (error) throw error;

        const serverUpdatedTime = dbMeta.updated_at;
        const cachedTime = localStorage.getItem('dashboard_cache_time');
        const cachedData = localStorage.getItem('dashboard_cache');

        if (cachedData && cachedTime === serverUpdatedTime) {
          setData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const { data: dbData, error: fullError } = await supabase
          .from('dashboard_stats')
          .select('data')
          .eq('id', 1)
          .single()

        if (fullError) throw fullError;

        if (dbData && dbData.data) {
          setData(dbData.data);
          localStorage.setItem('dashboard_cache', JSON.stringify(dbData.data));
          localStorage.setItem('dashboard_cache_time', serverUpdatedTime);
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (loading) return <div className="layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <video
      src={loadVideo}
      width={150}
      height={150}
      autoPlay
      loop
      muted
      playsInline
    />
  </div>
  if (!data) return <div className="layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h2>Failed to load data.</h2></div>

  return (
    <div className="layout">
      <Sidebar tab={tab} setTab={setTab} />
      <div className='main'>
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          repos={data.allRepositories || []}
        />

        <main className='content'>
          {tab === 'Dashboard' && (
            <>
              {/* KPI ROW */}
              <div className="kpi-row">
                {data.kpis.map((k) => {
                  let kpiIcon = <i className="fa-solid fa-chart-simple" />;
                  if (k.label === 'Total Commits') kpiIcon = <i className="fa-solid fa-code-commit" />;
                  if (k.label === 'Total PRs') kpiIcon = <i className="fa-solid fa-code-pull-request" />;
                  if (k.label === 'Total Stars') kpiIcon = <i className="fa-solid fa-star" />;
                  if (k.label === 'Contributors') kpiIcon = <i className="fa-solid fa-users" />;
                  if (k.label === 'Total Forks') kpiIcon = <i className="fa-solid fa-code-fork" />;

                  return (
                    <KpiCard
                      key={k.label}
                      {...k}
                      icon={kpiIcon}
                    />
                  )
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
              <div className='row row01'>
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
                <BarCard title="Weekday Pattern" labels={data.weekday?.labels || []} values={data.weekday?.values || []} color="#3b3ef5" rotate={30} icon={<i className="fa-solid fa-calendar-day" style={{ color: '#6366f1' }} />} />
                <TrendCard title="Hour Pattern (PKT)" labels={data.hours?.labels || []} values={data.hours?.values || []} showline={false} color="#14b8a6" icon={<i className="fa-solid fa-clock" style={{ color: '#3b82f6' }} />} />
                <ContributorsCard items={data.contributors || []} />
                <DonutCard title="Event Types" centerLabel="Events" items={data.events || []} height={130} width={130} compact icon={<i className="fa-solid fa-bolt" style={{ color: '#a855f7' }} />} />
              </div>

              {/* ROW 4 */}
              <div className='row row04'>
                <BarCard title="PR Merge Time" big={data.mergeTime?.median || "0h"} bigLabel="Median Time" labels={data.mergeTime?.labels || []} values={data.mergeTime?.values || []} color="#30dfca" icon={<i className="fa-solid fa-stopwatch" style={{ color: '#6366f1' }} />} />
                {/* <InsightsCard data={data} /> */}
                <HorizontalBarCard
                  title="Top Languages by Repositories" color="#3b3ef5"
                  labels={data.topLanguages?.map(l => l.name) || []}
                  values={data.topLanguages?.map(l => l.value) || []}
                  icon={<i className="fa-solid fa-code" style={{ color: '#6366f1' }} />}
                />
              </div>
            </>
          )}

          {/* Baqi Pages */}
          {tab === 'Repositories' && <Repositories data={data} />}
          {tab === 'Contributors' && <Contributors data={data} />}
          {tab === 'Pull Requests' && <PullRequests data={data} />}
          {tab === 'Commits' && <Commits data={data} />}
          {tab === 'Events' && <Events data={data} />}
        </main>
      </div>
    </div>
  )
}