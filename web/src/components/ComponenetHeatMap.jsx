import { useMemo } from 'react'
import '../Styles/ChartCard.css'

export default function ContributionHeatmap({ title, data = {}, icon }) {
  const { weeks, monthLabels } = useMemo(() => {
    
    const normalizedData = {};
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.date) {
          normalizedData[item.date] = Number(item.count) || 0;
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // Agar purane Object format mein aa raha hai
      Object.entries(data).forEach(([key, val]) => {
        const match = key.match(/\d{4}-\d{2}-\d{2}/); 
        if (match) {
          normalizedData[match[0]] = Number(val) || 0;
        }
      });
    }

    // 2. Data se latest date (Smart Range)
    const dates = Object.keys(normalizedData).map(d => new Date(d)).filter(d => !isNaN(d));
    let endDate = new Date();
    
    if (dates.length > 0) {
      const maxTime = Math.max(...dates.map(d => d.getTime()));
      endDate = new Date(maxTime);
    }

    // 3. Start Date calculation (Pichle Sunday se)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364); 
    startDate.setDate(startDate.getDate() - startDate.getDay()); 

    const weeksArray = [];
    const monthsArray = [];
    let currentDate = new Date(startDate);
    let lastMonth = -1;

    // 4. Grid 
    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (currentDate.getMonth() !== lastMonth && currentDate.getDate() <= 7) {
          monthsArray.push({
            label: currentDate.toLocaleString('en-US', { month: 'short' }),
            index: w
          });
          lastMonth = currentDate.getMonth();
        }

        week.push({
          date: dateStr,
          count: normalizedData[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArray.push(week);
    }

    return { weeks: weeksArray, monthLabels: monthsArray };
  }, [data]);

  // Colors
  const getColor = (count) => {
    if (count === 0) return 'var(--heatmap-empty)';
    if (count <= 3) return '#9be9a8';
    if (count <= 6) return '#40c463';
    if (count <= 9) return '#30a14e';
    return '#216e39';
  };

  return (
    <div className="card chart-card heatmap-card">
      <div className="chart-head">
        <h3 className="chart-title">
          {icon ? icon : <span className="chart-icon" />}
          {title}
        </h3>
      </div>
      
      <div className="heatmap-wrapper">
        <div className="heatmap-months-row">
          <div className="heatmap-spacer" />
          <div className="heatmap-months-container">
            {monthLabels.map((m, i) => (
              <span 
                key={i} 
                style={{ left: `${m.index / 53 * 100}%`, position: 'absolute' }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="heatmap-container">
          <div className="heatmap-days">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          <div className="heatmap-grid">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="heatmap-week" style={{ '--w': wIndex }}>
                {week.map((day, dIndex) => (
                  <div
                    key={dIndex}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(day.count) }}
                    data-tooltip={`${day.count} commits on ${day.date}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell" style={{ backgroundColor: 'var(--heatmap-empty)' }} />
          <div className="heatmap-cell" style={{ backgroundColor: '#9be9a8' }} />
          <div className="heatmap-cell" style={{ backgroundColor: '#40c463' }} />
          <div className="heatmap-cell" style={{ backgroundColor: '#30a14e' }} />
          <div className="heatmap-cell" style={{ backgroundColor: '#216e39' }} />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}