import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export function RatingHistogram({ histogram, total }: { histogram: Record<string, number>; total: number }) {
  const data = ['5', '4', '3', '2', '1'].map((stars) => ({
    stars: `${stars}★`,
    count: histogram[stars] ?? 0,
    pct: total ? Math.round(((histogram[stars] ?? 0) / total) * 100) : 0,
  }));

  return (
    <div className="rating-histogram" style={{ height: 160 }} data-testid="rating-histogram">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="stars" width={40} tickLine={false} axisLine={false} />
          <Bar dataKey="pct" fill="#f2b33d" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
