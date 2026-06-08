const fs = require("fs");

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

  const allRows = filterThreePl
    ? rows.filter((r) => r.three_pl === filterThreePl)
    : rows;

  // Return raw rows for client-side date filtering
  // Only keep fields needed by the dashboard to reduce payload
  const rawRows = allRows.map((r) => ({
    order_created: r.order_created,
    order_status: r.order_status,
    rfq_status: r.rfq_status,
    three_pl: r.three_pl,
    client: r.client,
    transport_type: r.transport_type,
    lane_type: r.lane_type,
    revenue_cad: r.revenue_cad,
    lazr_cost_cad: r.lazr_cost_cad,
    lazr_net_profit_cad: r.lazr_net_profit_cad,
    sales_rep: r.sales_rep,
    three_pl_agent_name: r.three_pl_agent_name,
    time_to_quote_minutes: r.time_to_quote_minutes,
  }));

  return { rawRows };
}

module.exports = { processData };
