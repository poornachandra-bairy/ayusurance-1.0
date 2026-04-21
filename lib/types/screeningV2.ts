// ============================================================
// Phase 6 — Medical Screening V2 Types
// ============================================================

export type ScreeningV2Status =
  | "awaiting_pre_screening"
  | "pre_screening_complete"
  | "consultation_scheduled"
  | "initial_consultation_done"
  | "follow_up_pending"
  | "follow_up_done"
  | "approved"
  | "on_hold";

export type ScheduleBucket = "india_europe" | "usa_australia";

export type ScreeningDecision = "pending" | "approved" | "on_hold";

export interface ScreeningDocumentEntry {
  id: string;
  type: "medical_records" | "consent_form" | "disclaimer";
  fileName: string;
  uploadedAt: string; // ISO
  notes?: string;
}

export interface ScreeningParticipant {
  role: "patient" | "screening_vaidya" | "pracharaka";
  name?: string;
  confirmed: boolean;
}

export interface ScreeningSession {
  sessionType: "initial" | "followup";
  scheduleBucket?: ScheduleBucket;
  scheduledDate?: string; // YYYY-MM-DD
  conductedAt?: string;   // ISO
  durationMinutes: 30;
  participants: ScreeningParticipant[];
  recordingDone: boolean;
  recordingSharedWithPatient: boolean;
  recordingStoredInPortal: boolean;
  notes?: string;
}

export interface VaidyaTrainingRecord {
  live_training_sessions: boolean;
  recorded_modules: boolean;
  case_studies: boolean;
  protocol_training: boolean;
  consultation_framework: boolean;
  completedDates: Record<string, string>; // moduleId -> ISO date
}

export interface ScreeningV2Record {
  id: string; // SCR2-XXX
  patientId: string;
  astroRecordId: string; // AEV2-XXX

  status: ScreeningV2Status;

  // Pre-screening
  healthQuestionnaireCompleted: boolean;
  healthQuestionnaire: Record<string, string>; // fieldId -> value
  documents: ScreeningDocumentEntry[];

  // Consultation
  consultationFeePaidUSD: number; // 100
  consultationFeePaid: boolean;
  initialConsultation?: ScreeningSession;
  followUpConsultation?: ScreeningSession;

  // Screening Vaidya Training
  screeningVaidyaId?: string;
  vaidyaTraining?: VaidyaTrainingRecord;

  // Decision
  decision: ScreeningDecision;
  decisionNotes?: string;
  decisionDate?: string; // ISO

  createdAt: string;
  updatedAt: string;
}
