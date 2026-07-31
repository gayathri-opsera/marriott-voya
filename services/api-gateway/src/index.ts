import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import "dotenv/config";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
}));
const PORT = process.env["API_GATEWAY_PORT"] ?? 3000;

const AUTH_URL    = `http://localhost:${process.env["AUTH_SERVICE_PORT"] ?? 3002}`;
const USER_URL    = `http://localhost:${process.env["USER_SERVICE_PORT"] ?? 3001}`;
const BOOKING_URL = `http://localhost:${process.env["BOOKING_SERVICE_PORT"] ?? 3003}`;
const PAYMENT_URL = `http://localhost:${process.env["PAYMENT_SERVICE_PORT"] ?? 3004}`;
const SEARCH_URL  = `http://localhost:${process.env["SEARCH_SERVICE_PORT"] ?? 3005}`;
const AI_URL      = `http://localhost:${process.env["AI_SERVICE_PORT"] ?? 3006}`;
const NOTIF_URL   = `http://localhost:${process.env["NOTIFICATION_SERVICE_PORT"] ?? 3008}`;

// When Express uses app.use('/prefix', middleware), it strips the prefix
// from req.url before the proxy sees it. pathRewrite restores it.
const proxy = (target: string, prefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/`]: `${prefix}/` },
    on: {
      error: (_err, _req, res: any) => res.status(502).json({ error: "upstream_unavailable" })
    },
  });

app.get("/health", (_req, res) =>
  res.json({
    status: "ok", service: "api-gateway",
    upstreams: { auth: AUTH_URL, user: USER_URL, booking: BOOKING_URL,
                 payment: PAYMENT_URL, search: SEARCH_URL, ai: AI_URL, notification: NOTIF_URL }
  })
);

app.use("/api/v1/auth",          proxy(AUTH_URL,    "/api/v1/auth"));
app.use("/api/v1/users",         proxy(USER_URL,    "/api/v1/users"));
app.use("/api/v1/bookings",      proxy(BOOKING_URL, "/api/v1/bookings"));
app.use("/api/v1/payments",      proxy(PAYMENT_URL, "/api/v1/payments"));
app.use("/api/v1/search",        proxy(SEARCH_URL,  "/api/v1/search"));
app.use("/search",               proxy(SEARCH_URL,  "/search"));
app.use("/api/v1/ai",            proxy(AI_URL,      "/api/v1/ai"));
app.use("/api/v1/notifications", proxy(NOTIF_URL,   "/api/v1/notifications"));

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on :${PORT}`);
  console.log(`  → Auth:         ${AUTH_URL}`);
  console.log(`  → User:         ${USER_URL}`);
  console.log(`  → Booking:      ${BOOKING_URL}`);
  console.log(`  → Payment:      ${PAYMENT_URL}`);
  console.log(`  → Search:       ${SEARCH_URL}`);
  console.log(`  → AI:           ${AI_URL}`);
  console.log(`  → Notification: ${NOTIF_URL}`);
});

export default app;
