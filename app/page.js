import path from "path";
import { processData } from "../lib/parseData";
import Dashboard from "./Dashboard";

export default function Page() {
  const csvPath = path.join(process.cwd(), "data", "quotes.csv");
  const data = processData(csvPath, "Synergie Canada"); // filtered to Synergie only
  return <Dashboard data={data} />;
}
