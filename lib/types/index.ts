// ============================================================
// Sadaika / Ayusurance — Panchakarma Ops App
// Domain Types — Phase 1
// ============================================================

// ── Shared primitives ────────────────────────────────────────

export type StageId =
  | "pracharaka"
  | "wish-list"
  | "astro-eligibility"
  | "screening"
  | "treatment-plan"
  | "pk-consultation"
  | "reservation"
  | "patient-portal"
  | "travel-payment"
  | "admission"
  | "documents"
  | "quality-control";

export type PracharakaStatus = "active" | "pending_verification" | "suspended" | "inactive";
export type PatientGender = "Male" | "Female" | "Other" | "Prefer Not To Say";
export type AlertPriority = "high" | "medium" | "low";
export type AlertType = "action_required" | "payment_pending" | "document_missing" | "info";
export type DocumentFormat = "PDF" | "JPEG" | "PNG" | "DOCX";
export type EligibilityVerdict = "Eligible" | "Deferred" | "Not Recommended" | "Pending";
export type ScreeningStatus = "pending" | "in_progress" | "cleared" | "not_cleared" | "more_info_required";
export type TreatmentPlanStatus = "draft" | "review" | "approved" | "signed";
export type ConsultationStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type ReservationStatus = "pending" | "confirmed" | "amended" | "cancelled";
export type PortalStatus = "not_created" | "credentials_sent" | "active" | "locked";
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "waived";
export type AdmissionStatus = "expected" | "admitted" | "in_program" | "discharged" | "early_exit";
export type QCStatus = "pending" | "in_progress" | "closed";
export type CommunicationChannel = "email" | "whatsapp" | "phone" | "portal" | "in_person";
export type DocumentStatus = "required" | "uploaded" | "verified" | "rejected";

// ── Pracharaka ───────────────────────────────────────────────

export interface Pracharaka {
  id: string; // PR-XXX
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country?: string;
  joinedDate: string; // ISO date
  status: PracharakaStatus;
  totalReferrals: number;
  agreementSigned: boolean;
  agreementDate?: string;
  notes?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

// ── Patient ──────────────────────────────────────────────────

export interface Patient {
  id: string; // PAT-XXX
  name: string;
  age: number;
  dateOfBirth?: string; // ISO date
  gender: PatientGender;
  phone: string;
  email: string;
  city: string;
  state: string;
  country?: string;
  nationality?: string;
  pracharakaId: string;
  currentStage: StageId;
  createdAt: string;
  updatedAt: string;
  chiefComplaint: string;
  preferredLanguage?: string;
  isNRI?: boolean;
}

// ── Wish List ────────────────────────────────────────────────

export type WishListStatus = "new" | "contacted" | "advanced" | "on_hold" | "withdrawn";

export interface WishList {
  id: string; // WL-XXX
  patientId: string;
  status: WishListStatus;
  motivation: string;
  programDuration: number; // days
  preferredMonths: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  followUpDate?: string;
}

// ── Astro-Eligibility ────────────────────────────────────────

export interface AstroEligibility {
  id: string; // AE-XXX
  patientId: string;
  assessedByDoctorId: string;
  dateAssessed: string;
  verdict: EligibilityVerdict;
  prakritType?: string; // Vata / Pitta / Kapha / combinations
  constitutionalNotes?: string;
  astrologicalNotes?: string;
  deferredUntil?: string;
  reportDocumentId?: string;
}

// ── Screening ────────────────────────────────────────────────

export interface ScreeningRecord {
  id: string; // SCR-XXX
  patientId: string;
  doctorId: string;
  status: ScreeningStatus;
  dateCompleted?: string;
  medicalHistory: string;
  currentMedications: string[];
  allergies: string;
  contraindications: string;
  clearanceNotes?: string;
  checklistItems: Record<string, boolean>;
  investigationsRequested?: string[];
  reportDocumentId?: string;
}

// ── Treatment Plan ───────────────────────────────────────────

export interface TreatmentPlanProcedure {
  procedureId: string;
  name: string;
  durationDays: number;
  sequenceOrder: number;
  notes?: string;
}

export interface TreatmentPlan {
  id: string; // TP-XXX
  patientId: string;
  doctorId: string;
  status: TreatmentPlanStatus;
  createdAt: string;
  approvedAt?: string;
  programDurationDays: number;
  procedures: TreatmentPlanProcedure[];
  dietaryGuidelines: string;
  lifestyleGuidelines: string;
  herbalFormulations?: string;
  estimatedCostINR?: number;
  notes?: string;
  documentId?: string;
}

// ── PK Consultation ──────────────────────────────────────────

export interface ConsultationRecord {
  id: string; // CON-XXX
  patientId: string;
  doctorId: string;
  status: ConsultationStatus;
  scheduledAt?: string;
  completedAt?: string;
  mode: "video" | "in_person" | "phone";
  treatmentPlanId: string;
  consentObtained: boolean;
  consentDate?: string;
  tentativeProgramStart?: string;
  sessionNotes?: string;
  followUpRequired?: boolean;
}

// ── Reservation & Orientation ──────────────────────────────

export interface ReservationRecord {
  id: string; // RES-XXX
  patientId: string;
  coordinatorId: string;
  status: ReservationStatus;
  programStartDate: string;
  programEndDate: string;
  accommodationType?: string;
  accommodationBlock?: string;
  depositAmountINR: number;
  depositPaidAt?: string;
  depositPaymentMode?: string;
  depositReceiptId?: string;
  orientationKitSentAt?: string;
  checklistItems: Record<string, boolean>;
  notes?: string;
}

// ── Patient Portal ──────────────────────────────────────────

export interface PortalAccess {
  id: string; // POR-XXX
  patientId: string;
  coordinatorId: string;
  status: PortalStatus;
  portalUsername?: string;
  credentialsSentAt?: string;
  patientConfirmedAt?: string;
  preFormCompletedAt?: string;
  documentsUploaded: string[];
  checklistItems: Record<string, boolean>;
  notes?: string;
}

// ── Travel & Payment ─────────────────────────────────────────

export interface TravelPaymentRecord {
  id: string; // TP-XXX
  patientId: string;
  coordinatorId: string;
  paymentStatus: PaymentStatus;
  totalAmountINR: number;
  depositAmountINR: number;
  balanceAmountINR: number;
  balancePaidAt?: string;
  balancePaymentMode?: string;
  balancePaymentRef?: string;
  travelMode?: "air" | "rail" | "road" | "not_applicable";
  flightTrainDetails?: string;
  arrivalDateTime?: string;
  pickupArranged?: boolean;
  pickupDetails?: string;
  finalChecklistSentAt?: string;
  notes?: string;
}

// ── Admission ────────────────────────────────────────────────

export interface AdmissionRecord {
  id: string; // ADM-XXX
  patientId: string;
  coordinatorId: string;
  admittingDoctorId: string;
  status: AdmissionStatus;
  admissionDate?: string;
  expectedDischargeDate?: string;
  actualDischargeDate?: string;
  roomNumber?: string;
  therapistAssigned?: string;
  admissionWeight?: number;
  admissionBP?: string;
  admissionNotes?: string;
  checklistItems: Record<string, boolean>;
  poorvakarmaStarted: boolean;
  earlyExitReason?: string;
}

// ── Documents ────────────────────────────────────────────────

export interface PatientDocument {
  id: string; // DOC-XXX
  patientId: string;
  documentTypeId: string;
  stageId: StageId;
  status: DocumentStatus;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
  // In a real implementation this would be a URL or blob reference
  fileDataBase64?: string;
}

// ── Quality Control ──────────────────────────────────────────

export interface QualityChecklist {
  id: string; // QC-XXX
  patientId: string;
  reviewedBy: string;
  status: QCStatus;
  reviewDate?: string;
  checklistItems: Record<string, boolean>;
  clinicalOutcomeSummary?: string;
  patientNPS?: number; // 0-10
  patientRatings: Record<string, number>; // domain -> rating (1-5)
  additionalNotes?: string;
  pracharakaNotified?: boolean;
  commissionProcessed?: boolean;
  documentId?: string;
}

// ── Feedback ─────────────────────────────────────────────────

export interface FeedbackRecord {
  id: string; // FB-XXX
  patientId: string;
  submittedAt: string;
  overallRating: number; // 1-5
  npsScore: number; // 0-10
  wouldRecommend: boolean;
  ratings: {
    preArrivalCommunication: number;
    centreHygiene: number;
    therapistSkill: number;
    foodQuality: number;
    doctorAttention: number;
    valueForMoney: number;
  };
  testimonial?: string;
  privateNotes?: string;
  consentToPublish?: boolean;
}

// ── Workflow Stage Status ─────────────────────────────────────

export interface WorkflowStageStatus {
  patientId: string;
  stageId: StageId;
  status: "not_started" | "in_progress" | "completed" | "blocked" | "skipped";
  startedAt?: string;
  completedAt?: string;
  blockedReason?: string;
}

// ── Communication Log ─────────────────────────────────────────

export interface CommunicationLog {
  id: string; // COMM-XXX
  patientId?: string;
  pracharakaId?: string;
  timestamp: string;
  channel: CommunicationChannel;
  direction: "outbound" | "inbound";
  subject: string;
  summary: string;
  handledBy?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

// ── Operational Alert ─────────────────────────────────────────

export interface OperationalAlert {
  id: string;
  type: AlertType;
  message: string;
  patientId?: string;
  pracharakaId?: string;
  stageId?: StageId;
  priority: AlertPriority;
  createdAt: string;
  resolvedAt?: string;
  isResolved?: boolean;
}

// ── App State Root ────────────────────────────────────────────

export interface AppState {
  pracharakas: Pracharaka[];
  patients: Patient[];
  wishList: WishList[];
  astroEligibility: AstroEligibility[];
  screeningRecords: ScreeningRecord[];
  treatmentPlans: TreatmentPlan[];
  consultationRecords: ConsultationRecord[];
  reservationRecords: ReservationRecord[];
  portalAccess: PortalAccess[];
  travelPaymentRecords: TravelPaymentRecord[];
  admissionRecords: AdmissionRecord[];
  documents: PatientDocument[];
  qualityChecklists: QualityChecklist[];
  feedbackRecords: FeedbackRecord[];
  communicationLogs: CommunicationLog[];
  operationalAlerts: OperationalAlert[];
  // ── Phase 2 ──────────────────────────────────────────────
  workflowRecords: import("@/lib/types/workflow").PatientWorkflowRecord[];
  actionLogs: import("@/lib/types/workflow").ActionLogEntry[];
  // ── Phase 3 ──────────────────────────────────────────────
  pracharakaProfiles: import("@/lib/types/pracharaka").PracharakaProfile[];
  pracharakaTrainingRecords: import("@/lib/types/pracharaka").PracharakaTrainingRecord[];
  // ── Phase 4 ──────────────────────────────────────────────
  wishListV2Entries: import("@/lib/types/wishlist").WishListV2Entry[];
  // ── Phase 5 ──────────────────────────────────────────────
  astroEligibilityV2Entries: import("@/lib/types/astroV2").AstroEligibilityV2[];
  // ── Phase 6 ──────────────────────────────────────────────
  screeningV2Records: import("@/lib/types/screeningV2").ScreeningV2Record[];
  // ── Phase 7 ──────────────────────────────────────────────
  treatmentPlanV2Records:   import("@/lib/types/treatmentV2").TreatmentPlanV2[];
  pkConsultationV2Records:  import("@/lib/types/treatmentV2").PKConsultationV2[];
  // ── Phase 8 ──────────────────────────────────────────────
  reservationV2Records:     import("@/lib/types/reservationV2").ReservationV2Record[];
  portalOnboardingV2Records: import("@/lib/types/reservationV2").PortalOnboardingV2Record[];
  // ── Phase 9 ──────────────────────────────────────────────
  travelPrepRecords:        import("@/lib/types/travelAdmissionV2").TravelPreparationRecord[];
  paymentRecords:           import("@/lib/types/travelAdmissionV2").PaymentRecord[];
  arrivalAdmissionRecords:  import("@/lib/types/travelAdmissionV2").ArrivalAdmissionRecord[];
  patientDocuments:         import("@/lib/types/travelAdmissionV2").PatientDocumentsRecord[];
  lastUpdated: string;
}

