export default function Sparkline({ values, color }) {
    const max = Math.max(...values)
    const min = Math.min(...values)

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * 100
        const y = 100 - ((v - min) / (max - min)) * 100
        return x + ',' + y
    })
        .join(' ')

    return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="sparkline">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}