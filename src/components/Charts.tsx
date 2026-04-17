"use client"

import { Line, LineChart, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const COLORS: Record<string, string> = {
  Left: '#3b82f6',           // blue
  Center: '#10b981',         // green
  Right: '#ef4444',          // red
  Unclassified: '#9ca3af'    // gray
}

export function SentimentOverTime({ data }: { data: any[] }) {
  // Try to parse published_at and average sentiment per day
  const grouped = data.reduce((acc, curr) => {
    if (!curr.publishedAt) return acc
    const date = new Date(curr.publishedAt).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = { date, sentiment: 0, count: 0 }
    acc[date].sentiment += curr.sentimentScore
    acc[date].count += 1
    return acc
  }, {} as Record<string, any>)

  const chartData = Object.values(grouped).map((v: any) => ({
    date: v.date,
    sentiment: v.sentiment / v.count
  })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (chartData.length === 0) return <div className="text-gray-500">Not enough date data</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[-1, 1]} />
        <Tooltip />
        <Line type="monotone" dataKey="sentiment" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SourceDistribution({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([source, count]) => ({ source, count }))
  
  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="source" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function BiasDistribution({ data }: { data: { LEFT?: number, CENTER?: number, RIGHT?: number, UNKNOWN?: number } }) {
  console.log("Bias data:", data);
  const chartData = [
    { name: 'Left', value: data.LEFT || 0 },
    { name: 'Center', value: data.CENTER || 0 },
    { name: 'Right', value: data.RIGHT || 0 },
    { name: 'Unclassified Sources', value: data.UNKNOWN || 0 } // ✅ NEW
  ].filter(item => item.value > 0); // optional: hides empty categories

  if (chartData.every(d => d.value === 0)) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#9ca3af"} />
          ))} 
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
