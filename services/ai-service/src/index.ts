import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env["AI_SERVICE_PORT"] ?? 3006;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "ai-service" }));

app.post("/api/v1/ai/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.write(`data: {"type":"message","content":"AI service running. Set ANTHROPIC_API_KEY to enable."}\n\n`);
  res.end();
});

app.listen(PORT, () => {
  console.log(`[ai-service] listening on :${PORT}`);
});

export default app;
