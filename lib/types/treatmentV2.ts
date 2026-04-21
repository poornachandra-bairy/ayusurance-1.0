// ============================================================
// Phase 7 — Treatment Plan V2 & PK Consultation Types
// ============================================================

// ─── Treatment Plan ──────────────────────────────────────────

export type TreatmentPlanV2Status =
  | "draft"
  | "protocol_complete"
  | "schedule_distributed"
  | "medicines_dispatched"
  | "approved";

export type ScheduleTarget = "aco" | "therapy_team" | "patient_portal";
export type MedicineCategoryId = "amapachana" | "pre_pk" | "during_pk" | "post_pk";

export interface TherapyScheduleShare {
  target: ScheduleTarget;
  shared: boolean;
  sharedAt?: string;
}

export interface MedicineEntry {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface MedicineCategory {
  categoryId: MedicineCategoryId;
  medicines: MedicineEntry[];
  pharmacyForwarded: boolean;
  pharmacyForwardedAt?: string;
  shippingRequired: boolean;
  shippingForwarded: boolean;
  shippingForwardedAt?: string;
}

export interface TreatmentPlanV2 {
  id: string; // TPV2-XXX
  patientId: string;
  screeningRecordId: string;

  status: TreatmentPlanV2Status;

  // Protocol (keyed by section id from JSON)
  protocol: Record<string, string>;

  // Therapy schedule distribution
  scheduleShares: TherapyScheduleShare[];

  // Medicine lists
  medicineCategories: MedicineCategory[];

  // Treating Vaidya
  treatingVaidyaName?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── PK Consultation ─────────────────────────────────────────

export type PKConsultationStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "follow_up_pending";

export interface AmapachanaPrescription {
  digestiveHerbs?: string;
  detoxPreparationMedicines?: string;
  dietGuidelines?: string;
  purchaseLinks?: string;
}

export interface PKConsultationV2 {
  id: string; // PKC2-XXX
  patientId: string;
  treatmentPlanId: string;

  status: PKConsultationStatus;
  feePaidUSD: 100;
  feePaid: boolean;
  scheduledDate?: string;
  conductedAt?: string;

  // Treating Vaidya
  treatingVaidyaName?: string;

  // Checklist (itemId -> done boolean)
  checklistItems: Record<string, boolean>;

  // SHIVA Academy
  orientationVideosSent: boolean;
  orientationVideosDone: boolean;

  // Amapachana prescription
  amapachana: AmapachanaPrescription;

  // Notes
  consultationNotes?: string;

  createdAt: string;
  updatedAt: string;
}
