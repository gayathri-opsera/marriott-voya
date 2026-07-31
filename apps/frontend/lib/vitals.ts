export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

export async function reportWebVitals(metric: WebVitalMetric): Promise<void> {
  try {
    await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
      }),
      keepalive: true,
    });
  } catch {
    // Vitals reporting must not disrupt the user experience
  }
}
