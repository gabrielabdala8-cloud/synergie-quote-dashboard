const fs = require("fs");
const path = require("path");

function parseCSV(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        result.push(current.trim().replace(/\r/g, ""));
        current = "";
      } else current += ch;
    }
    result.push(current.trim().replace(/\r/g, ""));
    return result;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i] || ""));
    return obj;
  });
}

function processData(csvPath, filterThreePl = null) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  let rows = parseCSV(raw);

  // If filtering by 3PL
  const allRowsForRfq = filterThreePl
    ? rows.filter((r) => r.three_pl === filterThreePl)
    : rows;

  const num = (v) => (v && v !== "NULL" && v !== "" ? parseFloat(v) || 0 : 0);
  const rd = (v) => Math.round(v);

  // RFQ data (ALL rows for acceptance rate)
  const totalRfq = allRowsForRfq.length;
  const rfqBreakdown = {};
  allRowsForRfq.forEach((r) => {
    rfqBreakdown[r.rfq_status] = (rfqBreakdown[r.rfq_status] || 0) + 1;
  });

  const rfqAll = Object.entries(rfqBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => {
      const colorMap = {
        Dispatched: "#22d3ee",
        Expired: "#fbbf24",
        Cancelled: "#fb7185",
        Aborted: "#f97316",
        Accepted: "#34d399",
        Declined: "#ef4444",
        "Pending Cancellation": "#94a3b8",
        Booked: "#a78bfa",
        Revised: "#64748b",
      };
      return { name: name === "Pending Cancellation" ? "Pending Cancel" : name, value, color: colorMap[name] || "#64748b" };
    });

  const activeRfqStatuses = ["Dispatched", "Accepted", "Booked"];
  const activeRfqCount = allRowsForRfq.filter((r) => activeRfqStatuses.includes(r.rfq_status)).length;
  const nonActiveCount = totalRfq - activeRfqCount;
  const acceptanceRate = totalRfq > 0 ? ((activeRfqCount / totalRfq) * 100).toFixed(1) : "0.0";
  const lostRevenue = rd(allRowsForRfq.filter((r) => !activeRfqStatuses.includes(r.rfq_status)).reduce((s, r) => s + num(r.revenue_cad), 0));

  // RFQ by 3PL (only for main dashboard)
  let rfqBy3pl = [];
  if (!filterThreePl) {
    const rfq3pl = {};
    allRowsForRfq.forEach((r) => {
      const k = r.three_pl;
      if (!rfq3pl[k]) rfq3pl[k] = { threepl: k, total: 0, active: 0, cancelled: 0, expired: 0, declined: 0, aborted: 0 };
      rfq3pl[k].total++;
      if (activeRfqStatuses.includes(r.rfq_status)) rfq3pl[k].active++;
      if (r.rfq_status === "Cancelled") rfq3pl[k].cancelled++;
      if (r.rfq_status === "Expired") rfq3pl[k].expired++;
      if (r.rfq_status === "Declined") rfq3pl[k].declined++;
      if (r.rfq_status === "Aborted") rfq3pl[k].aborted++;
    });
    rfqBy3pl = Object.values(rfq3pl)
      .sort((a, b) => b.total - a.total)
      .map((p) => ({ ...p, rate: parseFloat(((p.active / p.total) * 100).toFixed(1)) }));
  }

  // Active orders for revenue KPIs
  const activeOrders = allRowsForRfq.filter(
    (r) =>
      activeRfqStatuses.includes(r.rfq_status) &&
      ["Completed", "Billing", "Reservation", "Transport", "Negotiation"].includes(r.order_status)
  );

  const totalRevenue = rd(activeOrders.reduce((s, r) => s + num(r.revenue_cad), 0));
  const totalCost = rd(activeOrders.reduce((s, r) => s + num(r.lazr_cost_cad), 0));
  const totalProfit = rd(activeOrders.reduce((s, r) => s + num(r.lazr_net_profit_cad), 0));
  const totalOrderCount = activeOrders.length;

  // 3PL breakdown (only main)
  let threepl = [];
  if (!filterThreePl) {
    const byPl = {};
    activeOrders.forEach((r) => {
      const k = r.three_pl;
      if (!byPl[k]) byPl[k] = { threepl: k, orders: 0, revenue: 0, profit: 0, cost: 0 };
      byPl[k].orders++;
      byPl[k].revenue += num(r.revenue_cad);
      byPl[k].profit += num(r.lazr_net_profit_cad);
      byPl[k].cost += num(r.lazr_cost_cad);
    });
    threepl = Object.values(byPl)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({ ...p, revenue: rd(p.revenue), profit: rd(p.profit), cost: rd(p.cost) }));
  }

  // Monthly
  const mn = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };
  const byMonth = {};
  activeOrders.forEach((r) => {
    const m = r.order_created.substring(0, 7);
    if (!byMonth[m]) byMonth[m] = { orders: 0, revenue: 0, profit: 0 };
    byMonth[m].orders++;
    byMonth[m].revenue += num(r.revenue_cad);
    byMonth[m].profit += num(r.lazr_net_profit_cad);
  });
  const monthly = Object.keys(byMonth)
    .sort()
    .map((k) => ({
      month: `${mn[k.substring(5, 7)]} ${k.substring(2, 4)}`,
      orders: byMonth[k].orders,
      revenue: rd(byMonth[k].revenue),
      profit: rd(byMonth[k].profit),
    }));

  // Order status
  const bySt = {};
  activeOrders.forEach((r) => {
    if (!bySt[r.order_status]) bySt[r.order_status] = { name: r.order_status, value: 0, revenue: 0 };
    bySt[r.order_status].value++;
    bySt[r.order_status].revenue += num(r.revenue_cad);
  });
  const orderStatus = Object.values(bySt)
    .sort((a, b) => b.value - a.value)
    .map((s) => ({ ...s, revenue: rd(s.revenue) }));

  // Top clients
  const byCl = {};
  activeOrders.forEach((r) => {
    if (!byCl[r.client]) byCl[r.client] = { name: r.client, orders: 0, revenue: 0 };
    byCl[r.client].orders++;
    byCl[r.client].revenue += num(r.revenue_cad);
  });
  const topClients = Object.values(byCl)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((c) => ({ ...c, name: c.name.length > 18 ? c.name.substring(0, 16) + "…" : c.name, revenue: rd(c.revenue) }));

  // Lane type
  const byLane = {};
  activeOrders.forEach((r) => {
    const k = r.lane_type;
    if (k === "NULL") return;
    if (!byLane[k]) byLane[k] = { name: k, orders: 0, revenue: 0 };
    byLane[k].orders++;
    byLane[k].revenue += num(r.revenue_cad);
  });
  const laneType = Object.values(byLane)
    .sort((a, b) => b.revenue - a.revenue)
    .map((l) => ({ ...l, revenue: rd(l.revenue) }));

  // Sales reps
  const byRep = {};
  activeOrders.forEach((r) => {
    const k = r.sales_rep;
    if (!k || k === "NULL") return;
    const parts = k.split(/\s+/);
    const short = parts.length >= 2 ? parts[0] + " " + parts[parts.length - 1].charAt(0) + "." : k;
    if (!byRep[k]) byRep[k] = { name: short, orders: 0, revenue: 0 };
    byRep[k].orders++;
    byRep[k].revenue += num(r.revenue_cad);
  });
  const salesReps = Object.values(byRep)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((r) => ({ ...r, revenue: rd(r.revenue) }));

  // Transport type
  const byTr = {};
  activeOrders.forEach((r) => {
    if (!byTr[r.transport_type]) byTr[r.transport_type] = { name: r.transport_type, orders: 0, revenue: 0 };
    byTr[r.transport_type].orders++;
    byTr[r.transport_type].revenue += num(r.revenue_cad);
  });
  const transportType = Object.values(byTr)
    .sort((a, b) => b.revenue - a.revenue)
    .map((t) => ({ ...t, revenue: rd(t.revenue) }));

  // Agent data
  const byAgent = {};
  allRowsForRfq.forEach((r) => {
    const agent = (r.three_pl_agent_name || "").trim();
    if (!agent) return;
    if (!byAgent[agent]) byAgent[agent] = { orders: 0, times: [], revenue: 0, active: 0, pl: "" };
    byAgent[agent].orders++;
    const t = num(r.time_to_quote_minutes);
    if (t > 0) byAgent[agent].times.push(t);
    byAgent[agent].revenue += num(r.revenue_cad);
    if (activeRfqStatuses.includes(r.rfq_status)) byAgent[agent].active++;
    // Track primary 3PL
    if (!byAgent[agent].plCounts) byAgent[agent].plCounts = {};
    byAgent[agent].plCounts[r.three_pl] = (byAgent[agent].plCounts[r.three_pl] || 0) + 1;
  });

  const agentData = Object.entries(byAgent)
    .sort((a, b) => b[1].orders - a[1].orders)
    .slice(0, 15)
    .map(([name, d]) => {
      const times = d.times.sort((a, b) => a - b);
      const median = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;
      const avg = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
      const acceptance = d.orders > 0 ? parseFloat(((d.active / d.orders) * 100).toFixed(1)) : 0;
      // Primary 3PL
      const plEntries = Object.entries(d.plCounts || {});
      const pl = plEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      return {
        name: name.length > 20 ? name.substring(0, 18) + "." : name,
        orders: d.orders,
        avgTime: parseFloat(avg.toFixed(1)),
        medianTime: parseFloat(median.toFixed(1)),
        revenue: rd(d.revenue),
        acceptance,
        pl,
      };
    });

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalOrders: totalOrderCount,
    threepl,
    monthly,
    orderStatus,
    topClients,
    laneType,
    salesReps,
    transportType,
    rfqAll,
    rfqBy3pl,
    totalRfq,
    activeRfqCount,
    nonActiveCount,
    acceptanceRate,
    lostRevenue,
    agentData,
  };
}

module.exports = { processData };
