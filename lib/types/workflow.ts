// ============================================================
// Phase 2 — Workflow Tracking Types
// Extends Phase 1 types without modifying them.
// ============================================================

// ── Stage IDs from the manual (12 stages) ────────────────────

export type WorkflowStageId =
  | "pracharaka_training"
  | "patient_wish_list"
  | "astrochart_eligibility"
  | "screening_consultation"
  | "treatment_planning"
  | "pk_consultation"
  | "reservation_fee"
  | "patient_portal_access"
  | "travel_preparation"
  | "advance_payment"
  | "arrival_admission"
  | "panchakarma_treatment";

export const WORKFLOW_STAGE_IDS: WorkflowStageId[] = [
  "pracharaka_training",
  "patient_wish_list",
  "astrochart_eligibility",
  "screening_consultation",
  "treatment_planning",
  "pk_consultation",
  "reservation_fee",
  "patient_portal_access",
  "travel_preparation",
  "advance_payment",
  "arrival_admission",
  "panchakarma_treatment",
];

// ── Stage statuses ────────────────────────────────────────────

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_input"
  | "completed"
  | "on_hold"
  | "not_eligible"
  | "requires_review";

// ── Action log note types ─────────────────────────────────────

export type ActionNoteType =
  | "update"
  | "blocker"
  | "document"
  | "communication"
  | "escalation"
  | "clinical";

// ── Per-stage record ──────────────────────────────────────────

export interface StageRecord {
  stageId: WorkflowStageId;
  status: StageStatus;
  startedAt?: string;         // ISO datetime
  completedAt?: string;       // ISO datetime
  assignedTo?: string;        // Role label or person name
  blockerDescription?: string;
  notes?: string;
  checklistProgress?: {
    completed: number;
    total: number;
  };
}

// ── Per-patient workflow record ───────────────────────────────

export interface PatientWorkflowRecord {
  id: string;                                // WFR-XXX
  patientId: string;
  currentWorkflowStageId: WorkflowStageId;
  stages: Record<WorkflowStageId, StageRecord>;
  createdAt: string;
  updatedAt: string;
}

// ── Action log entry ──────────────────────────────────────────

export interface ActionLogEntry {
  id: string;                               // LOG-XXX
  patientId: string;
  workflowStageId?: WorkflowStageId;
  timestamp: string;                        // ISO datetime
  role: string;
  noteType: ActionNoteType;
  message: string;
  createdBy?: string;
}

// ── Phase 1→Phase 2 stage mapping ────────────────────────────
// Maps Phase 1 Patient.currentStage to the corresponding Phase 2 WorkflowStageId.
// Used to seed initial workflow records from Phase 1 patient data.

import type { StageId } from "@/lib/types";

export const PHASE1_TO_WORKFLOW_STAGE: Record<StageId, WorkflowStageId> = {
  "pracharaka":        "pracharaka_training",
  "wish-list":         "patient_wish_list",
  "astro-eligibility": "astrochart_eligibility",
  "screening":         "screening_consultation",
  "treatment-plan":    "treatment_planning",
  "pk-consultation":   "pk_consultation",
  "reservation":       "reservation_fee",
  "patient-portal":    "patient_portal_access",
  "travel-payment":    "advance_payment",
  "admission":         "arrival_admission",
  "documents":         "arrival_admission",      // fallback — documents is cross-cutting
  "quality-control":   "panchakarma_treatment",
};
