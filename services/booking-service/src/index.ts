import express from "express";
import "dotenv/config";
import { bookingRouter } from "./routes/booking.js";

const app = express();
const PORT = process.env["BOOKING_SERVICE_PORT"] ?? 3003;

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "booking-service" }));
app.use("/api/v1/bookings", bookingRouter);

app.listen(PORT, () => {
  console.log(`[booking-service] listening on :${PORT}`);
});

export default app;
