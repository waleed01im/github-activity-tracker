import {useState} from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import KpiCard from './components/KpiCard'
import data from '../data/sample.json'


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
      <Sidebar tab={tab} setTab={setTab}/>
      <div className='main'>
        <Header theme={theme} toggleTheme={toggleTheme}/>
        <main className='content'>
          {tab === 'Dashboard' ? (
            <div className= "kpi-row">
              {data.kpis.map((k) =>(
                <KpiCard
                  key={k.label} { ...k } />
              ))}
            </div>
          ):(
            <p>{tab} content</p>
          )}
        </main>
      </div>
    </div>
  )
}