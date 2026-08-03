import { Router } from "express";
import { CreateBookingRequestSchema } from "@travel/contracts/booking";
import { validateRequest } from "@travel/shared";

export const bookingRouter = Router();

const validateCreateBooking = validateRequest({ body: CreateBookingRequestSchema });

const DEMO_TRIPS = [
  {
    id: "book_001",
    status: "CONFIRMED",
    title: "New York → London",
    departureDate: "2026-09-15",
    price: { amount: 1240, currency: "USD" },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "book_002",
    status: "CONFIRMED",
    title: "Los Angeles → Paris",
    departureDate: "2026-10-02",
    price: { amount: 890, currency: "USD" },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

bookingRouter.get("/", (_req, res) => {
  res.json(DEMO_TRIPS);
});

bookingRouter.post("/", validateCreateBooking, (_req, res) => {
  res.status(201).json({
    bookingId: `book_${Date.now()}`,
    status: "confirmed",
    confirmationNumbers: { flight: `VY${Math.floor(Math.random() * 90000 + 10000)}` },
    pricePaid: { amount: 1240, currency: "USD" },
    createdAt: new Date().toISOString(),
  });
});

bookingRouter.get("/:bookingId", (req, res) => {
  const trip = DEMO_TRIPS.find(t => t.id === req.params.bookingId);
  if (!trip) return res.status(404).json({ error: "not_found" });
  return res.json(trip);
});
