"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatMoney } from "../../lib/money";

export interface ConfirmationItem {
  title: string;
  source: string;
  price: string;
  currency: string;
}

export interface ConfirmationSummaryProps {
  bookingRef: string;
  items: ConfirmationItem[];
}

function groupBySource(items: ConfirmationItem[]): Map<string, ConfirmationItem[]> {
  const groups = new Map<string, ConfirmationItem[]>();
  for (const item of items) {
    const existing = groups.get(item.source) ?? [];
    existing.push(item);
    groups.set(item.source, existing);
  }
  return groups;
}

function sumPrices(items: ConfirmationItem[]): number {
  return items.reduce((total, item) => total + Number(item.price), 0);
}

export function ConfirmationSummary({ bookingRef, items }: ConfirmationSummaryProps) {
  const groups = groupBySource(items);
  const grandTotal = sumPrices(items);
  const currency = items[0]?.currency ?? "USD";

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Booking confirmed</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-text-secondary">
          Your booking reference is <strong className="text-text-primary">{bookingRef}</strong>.
        </p>

        {Array.from(groups.entries()).map(([source, sourceItems]) => (
          <div key={source} className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
              {source}
            </h3>
            <ul className="space-y-1">
              {sourceItems.map((item) => (
                <li key={`${source}-${item.title}`} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.title}</span>
                  <span className="text-text-primary">{formatMoney(item.price, item.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm font-medium border-t border-surface-muted pt-2">
              <span className="text-text-tertiary">Subtotal ({source})</span>
              <span>{formatMoney(sumPrices(sourceItems), sourceItems[0]?.currency ?? currency)}</span>
            </div>
          </div>
        ))}

        <div className="flex justify-between text-base font-bold border-t border-surface-muted pt-3">
          <span>Grand total</span>
          <span className="text-brand-600">{formatMoney(grandTotal, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
