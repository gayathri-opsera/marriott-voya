import { apiGet } from "./client";

export interface Trip {
  id: string;
  status: string;
  title: string;
  departureDate?: string;
  price: { amount: number; currency: string };
  createdAt: string;
}

export async function fetchTrips(): Promise<Trip[]> {
  return apiGet<Trip[]>("/api/v1/bookings");
}

export async function fetchTrip(id: string): Promise<Trip> {
  return apiGet<Trip>(`/api/v1/bookings/${id}`);
}
