import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env["NOTIFICATION_SERVICE_PORT"] ?? 3008;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "notification-service" }));

app.listen(PORT, () => {
  console.log(`[notification-service] listening on :${PORT}`);
});

export default app;
