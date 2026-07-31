import express from "express";
import "dotenv/config";
import { paymentRouter } from "./routes/payment.js";
import { webhookRouter } from "./routes/webhook.js";

const app = express();
const PORT = process.env["PAYMENT_SERVICE_PORT"] ?? 3004;

// Raw body needed for Stripe webhook signature verification
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "payment-service" }));
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/payments", webhookRouter);

app.listen(PORT, () => {
  console.log(`[payment-service] listening on :${PORT}`);
});

export default app;
