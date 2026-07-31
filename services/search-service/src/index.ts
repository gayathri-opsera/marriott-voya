import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env["SEARCH_SERVICE_PORT"] ?? 3005;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "search-service" }));

app.get("/api/v1/search/flights", async (req, res) => {
  res.json({ results: [], message: "Search service running — connect supplier adapters to enable results" });
});

app.get("/api/v1/search/hotels", async (_req, res) => {
  res.json({ results: [] });
});

app.get("/api/v1/search/cars", async (_req, res) => {
  res.json({ results: [] });
});

app.listen(PORT, () => {
  console.log(`[search-service] listening on :${PORT}`);
});

export default app;
