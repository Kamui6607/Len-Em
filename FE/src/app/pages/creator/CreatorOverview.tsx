import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, PlayCircle, Share2, Users } from "lucide-react";
import { creatorCourses, creatorDiyPosts, linkedProducts, revenueByDay, topVideoProducts } from "../../../features/creator/data/creator.mock";

export function CreatorOverview() {
  const totalStudents = creatorCourses.reduce((sum, course) => sum + course.enrolledStudents, 0);
  const totalRevenue = linkedProducts.reduce((sum, product) => sum + product.estimatedRevenue, 0);
  const totalShares = creatorDiyPosts.reduce((sum, post) => sum + post.comboPurchases, 0);

  const stats = [
    { label: "Total students", value: totalStudents.toLocaleString(), icon: Users, tone: "bg-[#b7664e]/10 text-[#b7664e]" },
    { label: "Total videos", value: "10", icon: PlayCircle, tone: "bg-[#7f9b73]/10 text-[#6f8f63]" },
    { label: "Linked revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, tone: "bg-[#d79a62]/15 text-[#b66f34]" },
    { label: "DIY shares", value: totalShares.toLocaleString(), icon: Share2, tone: "bg-[#eadcc7] text-[#6d5c4d]" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-[#fff8ed] via-[#f4eadb] to-[#e8f0df] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b7664e]">Len&amp;em Creator Studio</p>
        <h1 className="mt-3 text-3xl font-bold text-[#3f342c]">Grow lessons that sell the perfect yarn combo.</h1>
        <p className="mt-2 max-w-3xl text-[#756557]">Track your closed loop: learners watch, add linked products, share DIY results, and return for the next tutorial.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-3xl border border-[#eadcc7] bg-card p-5 shadow-sm">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-[#3f342c]">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#eadcc7] bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3f342c]">30-day linked product revenue</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eadcc7" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#b7664e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-[#eadcc7] bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3f342c]">Top-selling products from videos</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVideoProducts} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eadcc7" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-18} height={72} textAnchor="end" />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="sales" fill="#7f9b73" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
