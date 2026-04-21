// ============================================================
// Phase 9 — Travel, Payment, Arrival & Documents Types
// ============================================================

// ─── Travel Preparation ──────────────────────────────────────

export interface TravelTaskStatus {
  taskId: string;
  done: boolean;
  doneAt?: string;
  notes?: string;
}

export interface TravelPreparationRecord {
  id: string; // TRV-XXX
  patientId: string;
  portalOnboardingId: string;

  tasks: TravelTaskStatus[];
  arrivalDate?: string;         // YYYY-MM-DD confirmed arrival
  flightDetails?: string;
  travelInsuranceRef?: string;
  medicalInsuranceRef?: string;

  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment Record ──────────────────────────────────────────

export type PaymentMode = "wire_transfer" | "bank_transfer" | "card" | "cash";
export type PaymentStatus = "not_paid" | "partial" | "paid";

export interface PaymentRecord {
  id: string; // PAY-XXX
  patientId: string;
  travelPrepId: string;

  // Advance payment
  advanceAmountUSD?: number;          // "to be finalized" — optional
  advanceAmountTBF: boolean;          // true = "to be finalized"
  advancePaid: boolean;
  advancePaidAt?: string;
  advanceMode?: PaymentMode;
  advanceReference?: string;

  // Final payment (due on arrival)
  finalAmountUSD?: number;
  finalPaid: boolean;
  finalPaidAt?: string;
  finalMode?: PaymentMode;
  finalReference?: string;
  declaredPaymentMode?: PaymentMode;  // mode declared in advance for final payment

  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Arrival & Admission ─────────────────────────────────────

export interface AdmissionChecklistItem {
  itemId: string;
  done: boolean;
  doneAt?: string;
  notes?: string;
}

export interface ArrivalAdmissionRecord {
  id: string; // ADM-XXX
  patientId: string;
  paymentRecordId: string;

  arrivalActualDate?: string;   // ISO — actual arrival datetime
  admissionChecklist: AdmissionChecklistItem[];
  admittedAt?: string;          // ISO — when officially admitted to PK program
  acoName?: string;
  roomNumber?: string;
  scheduleConfirmed?: boolean;
  consentSigned?: boolean;

  isAdmitted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Required Documents ──────────────────────────────────────

export type DocumentStatus = "not_submitted" | "submitted" | "verified" | "rejected";

export interface RequiredDocumentRecord {
  docId: string;
  status: DocumentStatus;
  submittedAt?: string;
  verifiedAt?: string;
  fileName?: string;
  notes?: string;
}

export interface PatientDocumentsRecord {
  id: string; // DOC-XXX
  patientId: string;
  isInternational: boolean;
  documents: RequiredDocumentRecord[];
  createdAt: string;
  updatedAt: string;
}
