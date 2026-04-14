"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";

const fmt = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtFull = (n) => `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const C = {
  bg: "#0a0e17", surface: "#0f1525", border: "#1a2540", text: "#e2e8f0", textMuted: "#64748b",
  green: "#34d399", greenDim: "rgba(52,211,153,0.12)", greenBright: "#6ee7b7",
  emerald: "#10b981", teal: "#14b8a6", cyan: "#22d3ee",
  amber: "#fbbf24", rose: "#fb7185", purple: "#a78bfa", orange: "#f97316",
};

const PIE_COLORS = [C.green, C.teal, C.amber, C.rose, C.purple];

const KPICard = ({ label, value, sub, color, icon }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden", minWidth: 0 }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: C.textMuted }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: C.green, margin: "36px 0 16px", paddingBottom: 8, borderBottom: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace" }}>{children}</h2>
);

const ChartCard = ({ title, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            {p.name === "Orders" ? p.value : fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const tabs = ["Overview", "Clients & Lanes", "Acceptance Rate", "Agent Performance"];

export default function Dashboard({ data }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const {
    totalRevenue, totalCost, totalProfit, totalOrders,
    monthly: MONTHLY, orderStatus: ORDER_STATUS,
    topClients: TOP_CLIENTS, laneType: LANE_TYPE, salesReps: SALES_REPS,
    transportType: TRANSPORT_TYPE, rfqAll: RFQ_ALL,
    totalRfq, activeRfqCount, nonActiveCount, acceptanceRate, lostRevenue,
    agentData: AGENT_DATA,
  } = data;
  const margin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "0 0 60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.surface} 0%, #0a1628 100%)`, borderBottom: `1px solid ${C.border}`, padding: "32px 40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, ${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#0a0e17" }}>S</div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Synergie Canada</span>
            <span style={{ fontSize: 22, fontWeight: 400, color: C.textMuted, marginLeft: 8 }}>Quote Analysis</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, marginLeft: 52 }}>3PL Operations · 2025 YTD · Revenue & Profitability Dashboard</div>

        <div style={{ display: "flex", gap: 4, marginTop: 20, marginLeft: 52 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              background: activeTab === t ? C.greenDim : "transparent",
              color: activeTab === t ? C.green : C.textMuted,
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 }}>
          <KPICard icon="💰" label="Total Revenue" value={fmt(totalRevenue)} sub={fmtFull(totalRevenue) + " CAD"} color={C.green} />
          <KPICard icon="📊" label="Total Cost" value={fmt(totalCost)} sub={fmtFull(totalCost) + " CAD"} color={C.amber} />
          <KPICard icon="✅" label="Net Profit" value={fmt(totalProfit)} sub={`${margin}% margin`} color={C.teal} />
          <KPICard icon="📦" label="Active Orders" value={totalOrders.toLocaleString()} sub="Synergie custom quotes" color={C.purple} />
        </div>

        {/* OVERVIEW */}
        {activeTab === "Overview" && (<>
          <SectionTitle>Monthly Revenue & Profit Trend</SectionTitle>
          <ChartCard title="Revenue vs Profit (CAD)">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={MONTHLY}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.3} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="prfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={0.3} /><stop offset="100%" stopColor={C.teal} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickFormatter={v => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.green} fill="url(#revG)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke={C.teal} fill="url(#prfG)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <SectionTitle>Order Status & Transport</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ChartCard title="Orders by Status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ORDER_STATUS} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                    {ORDER_STATUS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{d.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.value} orders · {fmtFull(d.revenue)}</div></div>); }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
                {ORDER_STATUS.map((s, i) => (<div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i] }} /><span style={{ color: C.textMuted }}>{s.name}</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.text }}>{s.value}</span></div>))}
              </div>
            </ChartCard>

            <ChartCard title="Transport Type">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={TRANSPORT_TYPE} dataKey="orders" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} strokeWidth={0}>
                    <Cell fill={C.green} /><Cell fill={C.amber} />
                  </Pie>
                  <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{d.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.orders} orders · {fmtFull(d.revenue)}</div></div>); }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 8 }}>
                {TRANSPORT_TYPE.map((t, i) => (<div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: i === 0 ? C.green : C.amber }} /><span style={{ color: C.textMuted }}>{t.name}</span><span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{t.orders}</span><span style={{ color: C.textMuted, fontSize: 11 }}>({((t.orders / totalOrders) * 100).toFixed(0)}%)</span></div>))}
              </div>
            </ChartCard>
          </div>

          <SectionTitle>Sales Representatives</SectionTitle>
          <ChartCard title="Revenue by Rep">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SALES_REPS} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickFormatter={v => fmt(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill={C.purple} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>)}

        {/* CLIENTS & LANES */}
        {activeTab === "Clients & Lanes" && (<>
          <SectionTitle>Top 10 Clients by Revenue</SectionTitle>
          <ChartCard title="Client Revenue (CAD)">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={TOP_CLIENTS} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickFormatter={v => fmt(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill={C.green} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <SectionTitle>Lane Type Distribution</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ChartCard title="Revenue by Lane">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={LANE_TYPE} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                    {LANE_TYPE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{d.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.orders} orders · {fmtFull(d.revenue)}</div></div>); }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {LANE_TYPE.map((l, i) => (<div key={l.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i] }} /><span style={{ color: C.textMuted }}>{l.name}</span></div>))}
              </div>
            </ChartCard>
            <ChartCard title="Orders by Lane">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LANE_TYPE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" name="Orders" fill={C.teal} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <SectionTitle>Client Detail Table</SectionTitle>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Client", "Orders", "Revenue (CAD)", "% of Total"].map(h => (<th key={h} style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.textMuted }}>{h}</th>))}
              </tr></thead>
              <tbody>
                {TOP_CLIENTS.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "12px 20px", fontFamily: "'JetBrains Mono', monospace" }}>{c.orders.toLocaleString()}</td>
                    <td style={{ padding: "12px 20px", fontFamily: "'JetBrains Mono', monospace" }}>{fmtFull(c.revenue)}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border }}><div style={{ height: "100%", borderRadius: 3, background: C.green, width: `${(c.revenue / totalRevenue) * 100}%` }} /></div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 40, textAlign: "right" }}>{((c.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ACCEPTANCE RATE */}
        {activeTab === "Acceptance Rate" && (<>
          <SectionTitle>RFQ Acceptance Overview</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <KPICard icon="📋" label="Total RFQs" value={totalRfq.toLocaleString()} sub="All Synergie quotes" color={C.green} />
            <KPICard icon="✅" label="Active" value={activeRfqCount.toLocaleString()} sub={`${acceptanceRate}% acceptance rate`} color={C.teal} />
            <KPICard icon="❌" label="Non-Active" value={nonActiveCount.toLocaleString()} sub="Cancelled + Expired + Aborted" color={C.rose} />
            <KPICard icon="💸" label="Lost Revenue" value={fmt(lostRevenue)} sub="Revenue on non-active RFQs" color={C.amber} />
          </div>

          <SectionTitle>RFQ Status Breakdown</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ChartCard title="All RFQ Statuses">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={RFQ_ALL} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} strokeWidth={0}>
                    {RFQ_ALL.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{d.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.value} quotes · {(d.value / totalRfq * 100).toFixed(1)}%</div></div>); }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 8 }}>
                {RFQ_ALL.map((s) => (<div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ color: C.textMuted }}>{s.name}</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.text }}>{s.value}</span></div>))}
              </div>
            </ChartCard>

            <ChartCard title="Non-Active Breakdown">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={RFQ_ALL.filter(r => !["Dispatched","Accepted","Booked"].includes(r.name))} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} width={120} />
                  <Tooltip content={({ active, payload, label }) => { if (!active || !payload?.length) return null; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{label}</div><div style={{ fontSize: 11, color: C.textMuted }}>{payload[0].value} quotes</div></div>); }} />
                  <Bar dataKey="value" name="Quotes" radius={[0, 6, 6, 0]}>
                    {RFQ_ALL.filter(r => !["Dispatched","Accepted","Booked"].includes(r.name)).map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <SectionTitle>Overall Acceptance Rate</SectionTitle>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: parseFloat(acceptanceRate) >= 90 ? C.green : C.amber }}>{acceptanceRate}%</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Synergie Canada Acceptance Rate</div>
            <div style={{ height: 16, borderRadius: 8, background: C.border, overflow: "hidden", maxWidth: 500, margin: "0 auto" }}>
              <div style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${C.green}, ${C.amber})`, width: `${acceptanceRate}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 20 }}>
              {RFQ_ALL.slice(0, 4).map(s => (
                <div key={s.name}><div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.name}</div></div>
              ))}
            </div>
          </div>
        </>)}

        {/* AGENT PERFORMANCE */}
        {activeTab === "Agent Performance" && (<>
          <SectionTitle>Agent Response Time & Acceptance</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {(() => {
              const sorted = [...AGENT_DATA].sort((a, b) => a.medianTime - b.medianTime);
              const best = sorted[0] || {};
              const worst = sorted[sorted.length - 1] || {};
              const topAcc = [...AGENT_DATA].sort((a, b) => b.acceptance - a.acceptance)[0] || {};
              const fmtT = (m) => m >= 60 ? `${(m/60).toFixed(1)}h` : `${m.toFixed(1)} min`;
              return (<>
                <KPICard icon="👥" label="Synergie Agents" value={String(AGENT_DATA.length)} sub="Active agents" color={C.green} />
                <KPICard icon="⚡" label="Best Median" value={fmtT(best.medianTime || 0)} sub={best.name || ""} color={C.teal} />
                <KPICard icon="🐢" label="Slowest Median" value={fmtT(worst.medianTime || 0)} sub={worst.name || ""} color={C.rose} />
                <KPICard icon="🏆" label="Top Acceptance" value={`${topAcc.acceptance || 0}%`} sub={`${topAcc.name || ""} (${topAcc.orders || 0} quotes)`} color={C.green} />
              </>);
            })()}
          </div>

          <SectionTitle>Agent Performance Table</SectionTitle>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 850 }}>
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Agent", "Quotes", "Median Time", "Avg Time", "Acceptance", "Revenue (CAD)"].map(h => (<th key={h} style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.textMuted, whiteSpace: "nowrap" }}>{h}</th>))}
              </tr></thead>
              <tbody>
                {AGENT_DATA.map((a, i) => {
                  const timeColor = a.medianTime <= 10 ? C.green : a.medianTime <= 60 ? C.teal : a.medianTime <= 200 ? C.amber : C.rose;
                  const accColor = a.acceptance >= 90 ? C.green : a.acceptance >= 75 ? C.amber : C.rose;
                  const fmtTime = (m) => m >= 60 ? `${(m/60).toFixed(1)}h` : `${m.toFixed(1)}m`;
                  return (
                    <tr key={a.name} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace" }}>{a.orders}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: timeColor }}>{fmtTime(a.medianTime)}</span></td>
                      <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", color: C.textMuted }}>{fmtTime(a.avgTime)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 3, background: C.border }}><div style={{ height: "100%", borderRadius: 3, background: accColor, width: `${a.acceptance}%` }} /></div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: accColor, fontSize: 12 }}>{a.acceptance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace" }}>{fmtFull(a.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <SectionTitle>Median Response Time by Agent</SectionTitle>
          <ChartCard title="Median Time to Quote (minutes) — lower is better">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={AGENT_DATA} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={{ stroke: C.border }} width={130} />
                <Tooltip content={({ active, payload, label }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; const fmtT = (m) => m >= 60 ? `${(m/60).toFixed(1)}h` : `${m.toFixed(1)}min`; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{label}</div><div style={{ fontSize: 11, color: C.textMuted }}>Median: {fmtT(d.medianTime)} · Avg: {fmtT(d.avgTime)}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.orders} quotes · {d.acceptance}% acceptance</div></div>); }} />
                <Bar dataKey="medianTime" name="Median Time" radius={[0, 6, 6, 0]}>
                  {AGENT_DATA.map((a, i) => (<Cell key={i} fill={a.medianTime <= 10 ? C.green : a.medianTime <= 60 ? C.teal : a.medianTime <= 200 ? C.amber : C.rose} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
              {[["< 10 min", C.green], ["10–60 min", C.teal], ["1–3.3 hrs", C.amber], ["> 3.3 hrs", C.rose]].map(([label, c]) => (<div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: c }} /><span style={{ color: C.textMuted }}>{label}</span></div>))}
            </div>
          </ChartCard>

          <SectionTitle>Acceptance Rate by Agent</SectionTitle>
          <ChartCard title="% of quotes accepted — higher is better">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={AGENT_DATA} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={{ stroke: C.border }} width={130} />
                <Tooltip content={({ active, payload, label }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#152035", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{label}</div><div style={{ fontSize: 11, color: C.textMuted }}>{d.acceptance}% acceptance · {d.orders} quotes</div></div>); }} />
                <Bar dataKey="acceptance" name="Acceptance %" radius={[0, 6, 6, 0]}>
                  {AGENT_DATA.map((a, i) => (<Cell key={i} fill={a.acceptance >= 90 ? C.green : a.acceptance >= 75 ? C.amber : C.rose} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
              {[[">= 90%", C.green], ["75–90%", C.amber], ["< 75%", C.rose]].map(([label, c]) => (<div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: c }} /><span style={{ color: C.textMuted }}>{label}</span></div>))}
            </div>
          </ChartCard>
        </>)}

        {/* Footer */}
        <div style={{ marginTop: 48, padding: "20px 0", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Synergie Canada · Custom Quote Analysis · 2025 YTD · All amounts in CAD unless noted</span>
        </div>
      </div>
    </div>
  );
}
