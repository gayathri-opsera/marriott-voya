import express from "express";
import "dotenv/config";
import { createAuthRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env["AUTH_SERVICE_PORT"] ?? 3002;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth-service" }));

// createAuthRouter takes optional service deps; for local dev we pass no-op stubs
// so the server starts and /health works even without a full Prisma client wired up.
const stubRegistration: any = {
  register: async () => ({ userId: "stub", verificationRequired: false }),
  verifyEmail: async () => true,
  resendVerification: async () => {},
};
app.use("/api/v1/auth", createAuthRouter(stubRegistration));

app.listen(PORT, () => {
  console.log(`[auth-service] listening on :${PORT}`);
});

export default app;
