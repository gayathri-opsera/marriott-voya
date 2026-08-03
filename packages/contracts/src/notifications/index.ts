/**
 * Notification Contracts — WO-037
 *
 * Zod schemas for all platform notifications: push, email, SMS, and in-app.
 * Covers delivery, preference management, and template data payloads.
 */

import { z } from "zod";
import { isoDateTimeString, identifier } from "../common/primitives.js";

// ─── Notification Channels ────────────────────────────────────────────────────

export const NotificationChannelSchema = z.enum([
  "EMAIL",
  "PUSH",
  "SMS",
  "IN_APP",
  "WEBHOOK",
]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// ─── Notification Types ───────────────────────────────────────────────────────

export const NotificationTypeSchema = z.enum([
  // Booking lifecycle
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_MODIFIED",
  "BOOKING_REMINDER",
  "CHECK_IN_REMINDER",
  "CHECK_OUT_REMINDER",
  // Payment
  "PAYMENT_CAPTURED",
  "PAYMENT_FAILED",
  "REFUND_INITIATED",
  "REFUND_COMPLETED",
  // Availability / price
  "PRICE_HOLD_EXPIRING",
  "OFFER_PRICE_DROP",
  "AVAILABILITY_ALERT",
  // Itinerary / planning
  "ITINERARY_SHARED",
  "ITINERARY_UPDATED",
  // Bonvoy
  "POINTS_CREDITED",
  "ELITE_STATUS_UPGRADE",
  // System
  "SESSION_EXPIRY_WARNING",
  "SECURITY_ALERT",
  "SYSTEM_MAINTENANCE",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// ─── Notification Priority ────────────────────────────────────────────────────

export const NotificationPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

// ─── Delivery Status ──────────────────────────────────────────────────────────

export const DeliveryStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "FAILED",
  "BOUNCED",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

// ─── Notification Record ──────────────────────────────────────────────────────

export const NotificationRecordSchema = z.object({
  notificationId: identifier,
  userId: identifier,
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  priority: NotificationPrioritySchema.default("NORMAL"),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000),
  /** Deep-link or action URL */
  actionUrl: z.string().url().optional(),
  /** Reference to the booking/payment/offer this notification is about */
  relatedEntityId: identifier.optional(),
  relatedEntityType: z.enum(["BOOKING", "PAYMENT", "OFFER", "ITINERARY", "SESSION"]).optional(),
  deliveryStatus: DeliveryStatusSchema.default("PENDING"),
  sentAt: isoDateTimeString.optional(),
  deliveredAt: isoDateTimeString.optional(),
  openedAt: isoDateTimeString.optional(),
  createdAt: isoDateTimeString,
  /** True = user has dismissed this notification from in-app inbox */
  dismissed: z.boolean().default(false),
  dismissedAt: isoDateTimeString.optional(),
});
export type NotificationRecord = z.infer<typeof NotificationRecordSchema>;

// ─── Create Notification Request ─────────────────────────────────────────────

export const CreateNotificationRequestSchema = z.object({
  userId: identifier,
  type: NotificationTypeSchema,
  channels: z.array(NotificationChannelSchema).min(1),
  priority: NotificationPrioritySchema.optional().default("NORMAL"),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000),
  actionUrl: z.string().url().optional(),
  relatedEntityId: identifier.optional(),
  relatedEntityType: z.enum(["BOOKING", "PAYMENT", "OFFER", "ITINERARY", "SESSION"]).optional(),
  /** ISO datetime; if absent, deliver immediately */
  scheduledAt: isoDateTimeString.optional(),
  /** Idempotency key — prevents duplicate notifications on retry */
  idempotencyKey: z.string().min(1).max(200).optional(),
});
export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>;

// ─── Notification Preferences ─────────────────────────────────────────────────

export const NotificationPreferenceSchema = z.object({
  type: NotificationTypeSchema,
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  inAppEnabled: z.boolean().default(true),
  /** Quiet hours — no push/SMS in this window (UTC offset minutes) */
  quietHoursStart: z.number().int().min(0).max(1439).optional(),
  quietHoursEnd: z.number().int().min(0).max(1439).optional(),
});
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

export const UserNotificationPreferencesSchema = z.object({
  userId: identifier,
  preferences: z.array(NotificationPreferenceSchema),
  /** Master switch for marketing notifications */
  marketingOptIn: z.boolean().default(false),
  /** Master switch for all push notifications */
  pushMasterEnabled: z.boolean().default(true),
  updatedAt: isoDateTimeString,
});
export type UserNotificationPreferences = z.infer<typeof UserNotificationPreferencesSchema>;

// ─── Update Preferences Request ───────────────────────────────────────────────

export const UpdateNotificationPreferencesRequestSchema = z.object({
  preferences: z.array(NotificationPreferenceSchema.partial().extend({
    type: NotificationTypeSchema,
  })).optional(),
  marketingOptIn: z.boolean().optional(),
  pushMasterEnabled: z.boolean().optional(),
});
export type UpdateNotificationPreferencesRequest = z.infer<typeof UpdateNotificationPreferencesRequestSchema>;
