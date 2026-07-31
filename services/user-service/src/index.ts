import express from "express";
import "dotenv/config";
import { userRouter } from "./routes/user.js";

const app = express();
const PORT = process.env["USER_SERVICE_PORT"] ?? 3001;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "user-service" }));
app.use("/api/v1/users", userRouter);

app.listen(PORT, () => {
  console.log(`[user-service] listening on :${PORT}`);
});

export default app;
