// ============================================================
// Phase 4 — Wish List V2 Types
// ============================================================

export type WishListV2Status = "draft" | "submitted" | "verified" | "forwarded";

export interface WishListV2Data {
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string;
  placeOfBirth: string;
  timeOfBirth: string;
  email: string;
  whatsappNumber: string;
  placeOfResidence: string;
  occupation: string;
  healthConcerns: string;
  seekingAyurveda: string;
  previousTreatments: string;
  availabilityTimeframe: string;
}

export interface WishListV2Entry {
  id: string; // WLV2-XXX
  pracharakaId: string; // The Pracharaka who created this (PR-XXX)
  patientId?: string;   // Generated once submitted & patient record is created (PAT-XXX)
  status: WishListV2Status;
  data: WishListV2Data;
  createdAt: string;    // ISO
  updatedAt: string;    // ISO
  submittedAt?: string; // ISO
  verifiedAt?: string;  // ISO
  forwardedAt?: string; // ISO
}
