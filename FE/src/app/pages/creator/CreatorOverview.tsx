import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, CirclePlay as PlayCircle, Share2, Users } from "lucide-react";
import { creatorCourses, creatorDiyPosts, linkedProducts, revenueByDay, topVideoProducts } from "../../../features/creator/data/creator.mock";

export function CreatorOverview() {
  const totalStudents = creatorCourses.reduce((sum, course) => sum + course.enrolledStudents, 0);
  const totalRevenue = linkedProducts.reduce((sum, product) => sum + product.estimatedRevenue, 0);
  const totalShares = creatorDiyPosts.reduce((sum, post) => sum + post.comboPurchases, 0);

  const stats = [
    { label: "Total students", value: totalStudents.toLocaleString(), icon: Users, tone: "bg-[var(--color-warm-accent)]/10 text-[var(--color-warm-accent)]" },
    { label: "Total videos", value: "10", icon: PlayCircle, tone: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
    { label: "Linked revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, tone: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" },
    { label: "DIY shares", value: totalShares.toLocaleString(), icon: Share2, tone: "bg-[var(--color-warm-surface)] text-[var(--color-warm-text-secondary)]" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-[var(--color-warm-bg)] via-[var(--color-warm-surface)] to-[var(--color-success-bg)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-warm-accent)]">Len&Em Creator Studio</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--color-warm-text)]">Grow lessons that sell the perfect yarn combo.</h1>
        <p className="mt-2 max-w-3xl text-[var(--color-warm-text-secondary)]">Track your closed loop: learners watch, add linked products, share DIY results, and return for the next tutorial.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-5 shadow-sm">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-[var(--color-warm-text)]">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--color-warm-text)]">30-day linked product revenue</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-warm-border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-warm-accent)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--color-warm-text)]">Top-selling products from videos</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVideoProducts} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-warm-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-18} height={72} textAnchor="end" />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="sales" fill="var(--color-success)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
