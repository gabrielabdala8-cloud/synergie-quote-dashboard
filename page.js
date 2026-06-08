import path from "path";
import { processData } from "../lib/parseData";
import Dashboard from "./Dashboard";

export default function Page() {
  const csvPath = path.join(process.cwd(), "data", "quotes.csv");
  const { rawRows } = processData(csvPath, "Synergie Canada");
  return <Dashboard rawRows={rawRows} />;
}
