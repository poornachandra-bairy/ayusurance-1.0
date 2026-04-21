// ============================================================
// Phase 8 — Reservation & Patient Portal Onboarding Types
// ============================================================

// ─── Reservation Record ──────────────────────────────────────

export type ReservationStatus =
  | "pending_payment"
  | "payment_received"
  | "ekit_dispatched"
  | "onboarding_complete";

export type PaymentMode = "wire_transfer" | "upi" | "stripe" | "other";

export interface EKitItemStatus {
  itemId: string;
  dispatched: boolean;
  dispatchedAt?: string;
  notes?: string;
}

export interface ReservationV2Record {
  id: string; // RES2-XXX
  patientId: string;
  pkConsultationId: string;

  status: ReservationStatus;

  // Fee
  feeAmountUSD: 300;
  feePaid: boolean;
  feePaidAt?: string;
  paymentMode?: PaymentMode;
  paymentReference?: string;

  // Patient type for conditional e-Kit
  isInternationalPatient: boolean;
  destinationCountry?: string; // "India" triggers FORM C

  // e-Kit dispatch tracking
  ekitItems: EKitItemStatus[];
  ekitDispatchedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Patient Portal Onboarding ───────────────────────────────

export type PortalOnboardingStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export interface WhatsAppGroupMemberStatus {
  memberId: string;
  added: boolean;
  addedAt?: string;
}

export interface PortalOnboardingV2Record {
  id: string; // POB2-XXX
  patientId: string;
  reservationId: string;

  status: PortalOnboardingStatus;

  // Portal access checklist (itemId -> done)
  portalItems: Record<string, boolean>;

  // WhatsApp coordination group
  whatsappGroupCreated: boolean;
  whatsappGroupCreatedAt?: string;
  whatsappGroupName?: string;
  whatsappMembers: WhatsAppGroupMemberStatus[];

  createdAt: string;
  updatedAt: string;
}
