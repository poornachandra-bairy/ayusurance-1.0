"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AppState } from "@/lib/types";
import type {
  PatientWorkflowRecord,
  ActionLogEntry,
  WorkflowStageId,
  StageRecord,
  StageStatus,
} from "@/lib/types/workflow";
import {
  WORKFLOW_STAGE_IDS,
  PHASE1_TO_WORKFLOW_STAGE,
} from "@/lib/types/workflow";
import type {
  PracharakaProfile,
  PracharakaTrainingRecord,
} from "@/lib/types/pracharaka";
import {
  ALL_TRAINING_MODULE_IDS,
  ALL_MILESTONE_IDS,
} from "@/lib/types/pracharaka";
import {
  loadState,
  saveState,
  resetToSeedData as storageReset,
} from "@/lib/storage/adapter";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { Pracharaka } from "@/lib/types";

import seedRecords from "@/data/seed-records.json";
import seedRecordsV2 from "@/data/seed-records-v2.json";

// ─────────────────────────────────────────────────────────────
// Phase 2 — Workflow seed builders
// ─────────────────────────────────────────────────────────────

function buildDefaultStages(
  upToIndex: number,
  currentStatus: StageStatus = "in_progress"
): Record<WorkflowStageId, StageRecord> {
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const entries = WORKFLOW_STAGE_IDS.map((id, idx) => {
    let status: StageStatus;
    if (idx < upToIndex) status = "completed";
    else if (idx === upToIndex) status = currentStatus;
    else status = "not_started";

    const rec: StageRecord = {
      stageId: id,
      status,
      startedAt: status !== "not_started" ? daysAgo((upToIndex - idx + 1) * 7) : undefined,
      completedAt: status === "completed" ? daysAgo((upToIndex - idx) * 7 - 3) : undefined,
    };
    return [id, rec] as [WorkflowStageId, StageRecord];
  });
  return Object.fromEntries(entries) as Record<WorkflowStageId, StageRecord>;
}

function buildSeedWorkflowRecords(): PatientWorkflowRecord[] {
  const now = new Date().toISOString();
  return (
    seedRecords.patients as Array<{ id: string; currentStage: string; createdAt: string }>
  ).map((p, i) => {
    const phase1Stage = p.currentStage as keyof typeof PHASE1_TO_WORKFLOW_STAGE;
    const currentWfStage: WorkflowStageId =
      PHASE1_TO_WORKFLOW_STAGE[phase1Stage] ?? "patient_wish_list";
    const currentIdx = WORKFLOW_STAGE_IDS.indexOf(currentWfStage);
    const isCompleted = phase1Stage === "quality-control";

    const stages = buildDefaultStages(
      isCompleted ? WORKFLOW_STAGE_IDS.length - 1 : currentIdx,
      isCompleted ? "completed" : "in_progress"
    );

    if (i === 1) {
      stages["astrochart_eligibility"].status = "awaiting_input";
      stages["astrochart_eligibility"].blockerDescription =
        "Awaiting patient birth time details from Pracharaka";
      stages["patient_wish_list"].status = "completed";
      stages["patient_wish_list"].completedAt = new Date(
        Date.now() - 20 * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    return {
      id: `WFR-00${i + 1}`,
      patientId: p.id,
      currentWorkflowStageId: currentWfStage,
      stages,
      createdAt: p.createdAt,
      updatedAt: now,
    } satisfies PatientWorkflowRecord;
  });
}

function buildSeedActionLogs(): ActionLogEntry[] {
  const now = new Date();
  const dAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: "LOG-001", patientId: "PAT-001", workflowStageId: "treatment_planning",
      timestamp: dAgo(2), role: "Ayurveda Doctor", noteType: "clinical",
      message: "Treatment plan drafted. Virechana and Basti included based on screening findings. Awaiting coordinator review before presenting to patient.",
      createdBy: "Dr. Rao",
    },
    {
      id: "LOG-002", patientId: "PAT-002", workflowStageId: "astrochart_eligibility",
      timestamp: dAgo(5), role: "Coordinator", noteType: "blocker",
      message: "Patient birth time is unknown — Pracharaka (PR-003) contacted via WhatsApp to obtain exact birth details from patient.",
      createdBy: "Admin",
    },
    {
      id: "LOG-003", patientId: "PAT-003", workflowStageId: "arrival_admission",
      timestamp: dAgo(1), role: "Coordinator", noteType: "update",
      message: "Patient Priya Balakrishnan arrived at centre at 14:30 IST. Room 12 allocated. Poorvakarma commenced. Initial assessment by Dr. Nair completed.",
      createdBy: "Admin",
    },
    {
      id: "LOG-004", patientId: "PAT-004", workflowStageId: "panchakarma_treatment",
      timestamp: dAgo(3), role: "Ayurveda Doctor", noteType: "clinical",
      message: "Arjun Verma completed 21-day programme. Significant improvement in mobility and pain-free days recorded. Discharge summary prepared.",
      createdBy: "Dr. Nair",
    },
    {
      id: "LOG-005", patientId: "PAT-001", workflowStageId: "screening_consultation",
      timestamp: dAgo(45), role: "Ayurveda Doctor", noteType: "clinical",
      message: "Screening completed. Medical clearance granted with dietary modifications for Type 2 Diabetes. No contraindications to Panchakarma identified.",
      createdBy: "Dr. Rao",
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Phase 3 — Pracharaka seed builders
// ─────────────────────────────────────────────────────────────

const ALL_MODULES_FALSE = Object.fromEntries(
  ALL_TRAINING_MODULE_IDS.map((id) => [id, false])
) as Record<string, boolean>;

const ALL_MODULES_TRUE = Object.fromEntries(
  ALL_TRAINING_MODULE_IDS.map((id) => [id, true])
) as Record<string, boolean>;

const ALL_MILESTONES_TRUE = Object.fromEntries(
  ALL_MILESTONE_IDS.map((id) => [id, true])
) as Record<string, boolean>;

function buildSeedPracharakaProfiles(): PracharakaProfile[] {
  const now = new Date().toISOString();
  return [
    {
      id: "PPR-001",
      pracharakaId: "PR-001",
      eligibilityCategory: "panchakarma_alumni",
      certificationStatus: "certified",
      certificationNumber: "SHIVA-PR-2025-001",
      certificationDate: "2025-03-10",
      certificationExpiryDate: "2026-03-10",
      ayusuranceRegistrationStatus: "registered",
      ayusuranceRegisteredAt: "2025-01-15",
      communicationGroupAdded: true,
      communicationGroupAddedAt: "2025-01-15",
      referralFormatsProvided: true,
      referralFormatsProvidedAt: "2025-01-15",
      responsibilitiesAcknowledged: true,
      responsibilitiesAcknowledgedAt: "2025-01-15",
      onboardingMilestones: { ...ALL_MILESTONES_TRUE },
      notes:
        "Panchakarma alumni with strong referral track record. 4 successful patient referrals to date.",
      createdAt: "2025-01-15T00:00:00.000Z",
      updatedAt: now,
    },
    {
      id: "PPR-002",
      pracharakaId: "PR-002",
      eligibilityCategory: "yoga_teacher",
      certificationStatus: "in_training",
      certificationNumber: undefined,
      certificationDate: undefined,
      certificationExpiryDate: undefined,
      ayusuranceRegistrationStatus: "registered",
      ayusuranceRegisteredAt: "2025-03-02",
      communicationGroupAdded: true,
      communicationGroupAddedAt: "2025-03-05",
      referralFormatsProvided: true,
      referralFormatsProvidedAt: "2025-03-05",
      responsibilitiesAcknowledged: true,
      responsibilitiesAcknowledgedAt: "2025-03-02",
      onboardingMilestones: {
        application_received: true,
        eligibility_verified: true,
        certification_fee_paid: true,
        training_commenced: true,
        live_sessions_attended: false,
        recorded_modules_completed: false,
        assessment_passed: false,
        certification_issued: false,
        pracharaka_id_assigned: true,
        ayusurance_registered: true,
        referral_formats_provided: true,
        communication_group_added: true,
      },
      notes: "Yoga teacher from Pune with an established studio. Actively in training.",
      createdAt: "2025-03-02T00:00:00.000Z",
      updatedAt: now,
    },
    {
      id: "PPR-003",
      pracharakaId: "PR-003",
      eligibilityCategory: "ayurveda_enthusiast",
      certificationStatus: "enrolled",
      certificationNumber: undefined,
      certificationDate: undefined,
      certificationExpiryDate: undefined,
      ayusuranceRegistrationStatus: "not_registered",
      ayusuranceRegisteredAt: undefined,
      communicationGroupAdded: false,
      communicationGroupAddedAt: undefined,
      referralFormatsProvided: false,
      referralFormatsProvidedAt: undefined,
      responsibilitiesAcknowledged: false,
      responsibilitiesAcknowledgedAt: undefined,
      onboardingMilestones: {
        application_received: true,
        eligibility_verified: true,
        certification_fee_paid: true,
        training_commenced: false,
        live_sessions_attended: false,
        recorded_modules_completed: false,
        assessment_passed: false,
        certification_issued: false,
        pracharaka_id_assigned: true,
        ayusurance_registered: false,
        referral_formats_provided: false,
        communication_group_added: false,
      },
      notes:
        "NRI based in Dubai. Pracharaka agreement not yet signed. Follow-up with coordinator required.",
      createdAt: "2025-06-10T00:00:00.000Z",
      updatedAt: now,
    },
  ];
}

function buildSeedTrainingRecords(): PracharakaTrainingRecord[] {
  const now = new Date().toISOString();
  const allDates = Object.fromEntries(
    ALL_TRAINING_MODULE_IDS.map((id) => [id, "2025-02-28T00:00:00.000Z"])
  ) as Record<string, string>;

  const pr002Completions: Record<string, boolean> = {
    live_sessions: false,
    recorded_modules: true,
    patient_orientation_training: true,
    eligibility_awareness: true,
    communication_training: false,
    referral_ethics: false,
    text_manuals: true,
    orientation_videos: true,
    referral_checklists: false,
    patient_comm_formats: false,
    referral_templates: false,
    shiva_ayurveda_course: false,
  };
  const pr002Dates: Record<string, string> = {
    recorded_modules: "2025-03-20T00:00:00.000Z",
    patient_orientation_training: "2025-03-22T00:00:00.000Z",
    eligibility_awareness: "2025-03-25T00:00:00.000Z",
    text_manuals: "2025-03-15T00:00:00.000Z",
    orientation_videos: "2025-03-18T00:00:00.000Z",
  };

  const pr003Completions: Record<string, boolean> = {
    ...ALL_MODULES_FALSE,
    text_manuals: true,
    orientation_videos: true,
  };

  return [
    {
      id: "PTR-001",
      pracharakaId: "PR-001",
      moduleCompletions: { ...ALL_MODULES_TRUE },
      moduleCompletionDates: allDates,
      assessmentPassed: true,
      assessmentDate: "2025-02-28",
      assessmentNotes: "Passed with distinction. Strong understanding of eligibility criteria.",
      updatedAt: now,
    },
    {
      id: "PTR-002",
      pracharakaId: "PR-002",
      moduleCompletions: pr002Completions,
      moduleCompletionDates: pr002Dates,
      assessmentPassed: false,
      assessmentDate: undefined,
      assessmentNotes: undefined,
      updatedAt: now,
    },
    {
      id: "PTR-003",
      pracharakaId: "PR-003",
      moduleCompletions: pr003Completions,
      moduleCompletionDates: {},
      assessmentPassed: false,
      assessmentDate: undefined,
      assessmentNotes: undefined,
      updatedAt: now,
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  return {
    pracharakas:              loadState(STORAGE_KEYS.PRACHARAKAS)                 ?? seedRecords.pracharakas,
    patients:                 loadState(STORAGE_KEYS.PATIENTS)                    ?? seedRecords.patients,
    wishList:                 loadState(STORAGE_KEYS.WISH_LIST)                   ?? seedRecords.wishListEntries,
    astroEligibility:         loadState(STORAGE_KEYS.ASTRO_ELIGIBILITY)           ?? [],
    screeningRecords:         loadState(STORAGE_KEYS.SCREENING_RECORDS)           ?? seedRecords.screeningRecords,
    treatmentPlans:           loadState(STORAGE_KEYS.TREATMENT_PLANS)             ?? [],
    consultationRecords:      loadState(STORAGE_KEYS.CONSULTATION_RECORDS)        ?? [],
    reservationRecords:       loadState(STORAGE_KEYS.RESERVATION_RECORDS)         ?? [],
    portalAccess:             loadState(STORAGE_KEYS.PORTAL_ACCESS)               ?? [],
    travelPaymentRecords:     loadState(STORAGE_KEYS.TRAVEL_PAYMENT_RECORDS)      ?? [],
    admissionRecords:         loadState(STORAGE_KEYS.ADMISSION_RECORDS)           ?? [],
    documents:                loadState(STORAGE_KEYS.DOCUMENTS)                   ?? [],
    qualityChecklists:        loadState(STORAGE_KEYS.QUALITY_CHECKLISTS)          ?? seedRecordsV2.qualityChecklists,
    feedbackRecords:          loadState(STORAGE_KEYS.FEEDBACK_RECORDS)            ?? [],
    communicationLogs:        loadState(STORAGE_KEYS.COMMUNICATION_LOGS)          ?? [],
    operationalAlerts:        loadState(STORAGE_KEYS.OPERATIONAL_ALERTS)          ?? seedRecords.operationalAlerts,
    workflowRecords:          loadState(STORAGE_KEYS.WORKFLOW_RECORDS)            ?? buildSeedWorkflowRecords(),
    actionLogs:               loadState(STORAGE_KEYS.ACTION_LOGS)                 ?? buildSeedActionLogs(),
    pracharakaProfiles:       loadState(STORAGE_KEYS.PRACHARAKA_PROFILES)         ?? buildSeedPracharakaProfiles(),
    pracharakaTrainingRecords:loadState(STORAGE_KEYS.PRACHARAKA_TRAINING_RECORDS) ?? buildSeedTrainingRecords(),
    wishListV2Entries:        loadState(STORAGE_KEYS.WISHLIST_V2_ENTRIES)         ?? seedRecordsV2.wishListV2Entries,
    astroEligibilityV2Entries:loadState(STORAGE_KEYS.ASTRO_ELIGIBILITY_V2)        ?? seedRecordsV2.astroEligibilityV2Entries,
    screeningV2Records:       loadState(STORAGE_KEYS.SCREENING_V2_RECORDS)        ?? seedRecordsV2.screeningV2Records,
    treatmentPlanV2Records:   loadState(STORAGE_KEYS.TREATMENT_PLAN_V2)           ?? seedRecordsV2.treatmentPlanV2Records,
    pkConsultationV2Records:  loadState(STORAGE_KEYS.PK_CONSULTATION_V2)          ?? seedRecordsV2.pkConsultationV2Records,
    reservationV2Records:     loadState(STORAGE_KEYS.RESERVATION_V2_RECORDS)      ?? seedRecordsV2.reservationV2Records,
    portalOnboardingV2Records:loadState(STORAGE_KEYS.PORTAL_ONBOARDING_V2)          ?? seedRecordsV2.portalOnboardingV2Records,
    travelPrepRecords:        loadState(STORAGE_KEYS.TRAVEL_PREP_RECORDS)         ?? seedRecordsV2.travelPrepRecords,
    paymentRecords:           loadState(STORAGE_KEYS.PAYMENT_RECORDS)             ?? seedRecordsV2.paymentRecords,
    arrivalAdmissionRecords:  loadState(STORAGE_KEYS.ARRIVAL_ADMISSION_RECORDS)   ?? seedRecordsV2.arrivalAdmissionRecords,
    patientDocuments:         loadState(STORAGE_KEYS.PATIENT_DOCUMENTS)           ?? [],
    lastUpdated:              loadState(STORAGE_KEYS.LAST_UPDATED)                ?? new Date().toISOString(),
  } as AppState;
}

// ─────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────

export type AppAction =
  // Phase 1
  | { type: "SET_PRACHARAKAS";            payload: AppState["pracharakas"] }
  | { type: "SET_PATIENTS";               payload: AppState["patients"] }
  | { type: "SET_WISH_LIST";              payload: AppState["wishList"] }
  | { type: "SET_ASTRO_ELIGIBILITY";      payload: AppState["astroEligibility"] }
  | { type: "SET_SCREENING_RECORDS";      payload: AppState["screeningRecords"] }
  | { type: "SET_TREATMENT_PLANS";        payload: AppState["treatmentPlans"] }
  | { type: "SET_CONSULTATION_RECORDS";   payload: AppState["consultationRecords"] }
  | { type: "SET_RESERVATION_RECORDS";    payload: AppState["reservationRecords"] }
  | { type: "SET_PORTAL_ACCESS";          payload: AppState["portalAccess"] }
  | { type: "SET_TRAVEL_PAYMENT_RECORDS"; payload: AppState["travelPaymentRecords"] }
  | { type: "SET_ADMISSION_RECORDS";      payload: AppState["admissionRecords"] }
  | { type: "SET_DOCUMENTS";              payload: AppState["documents"] }
  | { type: "SET_QUALITY_CHECKLISTS";     payload: AppState["qualityChecklists"] }
  | { type: "SET_FEEDBACK_RECORDS";       payload: AppState["feedbackRecords"] }
  | { type: "SET_COMMUNICATION_LOGS";     payload: AppState["communicationLogs"] }
  | { type: "SET_OPERATIONAL_ALERTS";     payload: AppState["operationalAlerts"] }
  // Phase 2
  | { type: "SET_WORKFLOW_RECORDS";       payload: AppState["workflowRecords"] }
  | { type: "SET_ACTION_LOGS";            payload: AppState["actionLogs"] }
  | {
      type: "UPDATE_STAGE_STATUS";
      payload: {
        patientId: string;
        stageId: WorkflowStageId;
        status: StageStatus;
        notes?: string;
        blockerDescription?: string;
        assignedTo?: string;
      };
    }
  | { type: "ADD_ACTION_LOG_ENTRY"; payload: ActionLogEntry }
  // Phase 3
  | { type: "SET_PRACHARAKA_PROFILES";          payload: AppState["pracharakaProfiles"] }
  | { type: "SET_PRACHARAKA_TRAINING_RECORDS";  payload: AppState["pracharakaTrainingRecords"] }
  | {
      type: "ADD_FULL_PRACHARAKA";
      payload: {
        pracharaka: Omit<Pracharaka, "id">;
        profile: Omit<PracharakaProfile, "id" | "pracharakaId" | "createdAt" | "updatedAt">;
      };
    }
  | {
      type: "UPDATE_PRACHARAKA_PROFILE";
      payload: { pracharakaId: string; updates: Partial<PracharakaProfile> };
    }
  | {
      type: "TOGGLE_TRAINING_MODULE";
      payload: { pracharakaId: string; moduleId: string; completed: boolean };
    }
  | {
      type: "TOGGLE_ONBOARDING_MILESTONE";
      payload: { pracharakaId: string; milestoneId: string; completed: boolean };
    }
  | {
      type: "SET_ASSESSMENT_RESULT";
      payload: { pracharakaId: string; passed: boolean; date: string; notes?: string };
    }
  // Phase 4
  | { type: "SET_WISHLIST_V2_ENTRIES"; payload: AppState["wishListV2Entries"] }
  | { type: "SAVE_WISHLIST_DRAFT"; payload: import("@/lib/types/wishlist").WishListV2Entry }
  | { type: "SUBMIT_WISHLIST"; payload: string } // WishList ID
  | { type: "VERIFY_WISHLIST"; payload: string } // WishList ID
  | { type: "FORWARD_WISHLIST"; payload: string } // WishList ID
  // Phase 5
  | { type: "SET_ASTRO_ELIGIBILITY_V2"; payload: AppState["astroEligibilityV2Entries"] }
  | {
      type: "UPDATE_ASTRO_EVALUATION";
      payload: { id: string; updates: Partial<import("@/lib/types/astroV2").AstroEligibilityV2> };
    }
  | {
      type: "SUBMIT_ASTRO_DECISION";
      payload: { id: string; decision: import("@/lib/types/astroV2").AstroDecision };
    }
  | {
      type: "LOG_ASTRO_COMMUNICATION";
      payload: { id: string; channel: import("@/lib/types/astroV2").AstroCommunicationChannel; notes?: string };
    }
  // Phase 6
  | { type: "SET_SCREENING_V2_RECORDS"; payload: AppState["screeningV2Records"] }
  | { type: "INITIATE_SCREENING"; payload: { patientId: string; astroRecordId: string } }
  | {
      type: "UPDATE_SCREENING_V2";
      payload: { id: string; updates: Partial<import("@/lib/types/screeningV2").ScreeningV2Record> };
    }
  | {
      type: "SUBMIT_SCREENING_DECISION";
      payload: { id: string; decision: import("@/lib/types/screeningV2").ScreeningDecision; notes?: string };
    }
  | {
      type: "ADD_SCREENING_DOCUMENT";
      payload: { id: string; doc: import("@/lib/types/screeningV2").ScreeningDocumentEntry };
    }
  // Phase 7
  | { type: "SET_TREATMENT_PLAN_V2_RECORDS"; payload: AppState["treatmentPlanV2Records"] }
  | { type: "INITIATE_TREATMENT_PLAN"; payload: { patientId: string; screeningRecordId: string } }
  | {
      type: "UPDATE_TREATMENT_PLAN_V2";
      payload: { id: string; updates: Partial<import("@/lib/types/treatmentV2").TreatmentPlanV2> };
    }
  | { type: "APPROVE_TREATMENT_PLAN"; payload: { id: string } }
  | { type: "SET_PK_CONSULTATION_V2_RECORDS"; payload: AppState["pkConsultationV2Records"] }
  | { type: "INITIATE_PK_CONSULTATION"; payload: { patientId: string; treatmentPlanId: string } }
  | {
      type: "UPDATE_PK_CONSULTATION_V2";
      payload: { id: string; updates: Partial<import("@/lib/types/treatmentV2").PKConsultationV2> };
    }
  | { type: "COMPLETE_PK_CONSULTATION"; payload: { id: string; notes?: string } }
  // Phase 8 — Reservation
  | { type: "SET_RESERVATION_V2_RECORDS"; payload: AppState["reservationV2Records"] }
  | { type: "INITIATE_RESERVATION"; payload: { patientId: string; pkConsultationId: string; isInternational: boolean } }
  | { type: "UPDATE_RESERVATION_V2"; payload: { id: string; updates: Partial<import("@/lib/types/reservationV2").ReservationV2Record> } }
  | { type: "CONFIRM_RESERVATION_PAYMENT"; payload: { id: string; paymentMode: import("@/lib/types/reservationV2").PaymentMode; reference?: string } }
  | { type: "DISPATCH_EKIT_ITEM"; payload: { id: string; itemId: string } }
  // Phase 8 — Portal Onboarding
  | { type: "SET_PORTAL_ONBOARDING_V2"; payload: AppState["portalOnboardingV2Records"] }
  | { type: "INITIATE_PORTAL_ONBOARDING"; payload: { patientId: string; reservationId: string } }
  | { type: "UPDATE_PORTAL_ONBOARDING_V2"; payload: { id: string; updates: Partial<import("@/lib/types/reservationV2").PortalOnboardingV2Record> } }
  | { type: "COMPLETE_PORTAL_ONBOARDING"; payload: { id: string } }
  // Phase 9 — Travel Preparation
  | { type: "INITIATE_TRAVEL_PREP"; payload: { patientId: string; portalOnboardingId: string; isInternational: boolean } }
  | { type: "UPDATE_TRAVEL_PREP"; payload: { id: string; updates: Partial<import("@/lib/types/travelAdmissionV2").TravelPreparationRecord> } }
  | { type: "TOGGLE_TRAVEL_TASK"; payload: { id: string; taskId: string } }
  | { type: "COMPLETE_TRAVEL_PREP"; payload: { id: string } }
  // Phase 9 — Payment
  | { type: "INITIATE_PAYMENT_RECORD"; payload: { patientId: string; travelPrepId: string } }
  | { type: "UPDATE_PAYMENT_RECORD"; payload: { id: string; updates: Partial<import("@/lib/types/travelAdmissionV2").PaymentRecord> } }
  | { type: "CONFIRM_ADVANCE_PAYMENT"; payload: { id: string; mode: import("@/lib/types/travelAdmissionV2").PaymentMode; reference?: string; amount?: number } }
  | { type: "CONFIRM_FINAL_PAYMENT"; payload: { id: string; mode: import("@/lib/types/travelAdmissionV2").PaymentMode; reference?: string; amount?: number } }
  // Phase 9 — Arrival & Admission
  | { type: "INITIATE_ARRIVAL_ADMISSION"; payload: { patientId: string; paymentRecordId: string } }
  | { type: "UPDATE_ARRIVAL_ADMISSION"; payload: { id: string; updates: Partial<import("@/lib/types/travelAdmissionV2").ArrivalAdmissionRecord> } }
  | { type: "TOGGLE_ADMISSION_ITEM"; payload: { id: string; itemId: string } }
  | { type: "ADMIT_PATIENT"; payload: { id: string } }
  // Phase 9 — Documents
  | { type: "INITIATE_PATIENT_DOCUMENTS"; payload: { patientId: string; isInternational: boolean } }
  | { type: "UPDATE_DOCUMENT_STATUS"; payload: { id: string; docId: string; update: Partial<import("@/lib/types/travelAdmissionV2").RequiredDocumentRecord> } }
  // Phase 10 — Quality Control
  | { type: "INITIATE_QC_RECORD"; payload: { patientId: string } }
  | { type: "TOGGLE_QC_ITEM"; payload: { patientId: string; stageId: string; itemId: string } }
  | { type: "UPDATE_QC_RECORD"; payload: { patientId: string; updates: Partial<import("@/lib/types/index").QualityChecklist> } }
  // Phase 10 — Feedback
  | { type: "SUBMIT_FEEDBACK"; payload: Omit<import("@/lib/types/index").FeedbackRecord, "id" | "submittedAt"> }
  // Phase 10 — Audit note
  | { type: "ADD_AUDIT_NOTE"; payload: { patientId: string; note: string; author?: string } }
  // Lifecycle
  | { type: "RESET_TO_SEED" }
  | { type: "IMPORT_STATE"; payload: Partial<AppState> };

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

function generatePracharakaId(existing: Pracharaka[]): string {
  const maxNum = Math.max(
    0,
    ...existing.map((p) => {
      const m = p.id.match(/PR-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
  );
  return `PR-${String(maxNum + 1).padStart(3, "0")}`;
}

function appReducer(state: AppState, action: AppAction): AppState {
  const ts = new Date().toISOString();
  switch (action.type) {
    // ── Phase 1 ──────────────────────────────────────────────
    case "SET_PRACHARAKAS":          return { ...state, pracharakas: action.payload, lastUpdated: ts };
    case "SET_PATIENTS":             return { ...state, patients: action.payload, lastUpdated: ts };
    case "SET_WISH_LIST":            return { ...state, wishList: action.payload, lastUpdated: ts };
    case "SET_ASTRO_ELIGIBILITY":    return { ...state, astroEligibility: action.payload, lastUpdated: ts };
    case "SET_SCREENING_RECORDS":    return { ...state, screeningRecords: action.payload, lastUpdated: ts };
    case "SET_TREATMENT_PLANS":      return { ...state, treatmentPlans: action.payload, lastUpdated: ts };
    case "SET_CONSULTATION_RECORDS": return { ...state, consultationRecords: action.payload, lastUpdated: ts };
    case "SET_RESERVATION_RECORDS":  return { ...state, reservationRecords: action.payload, lastUpdated: ts };
    case "SET_PORTAL_ACCESS":        return { ...state, portalAccess: action.payload, lastUpdated: ts };
    case "SET_TRAVEL_PAYMENT_RECORDS": return { ...state, travelPaymentRecords: action.payload, lastUpdated: ts };
    case "SET_ADMISSION_RECORDS":    return { ...state, admissionRecords: action.payload, lastUpdated: ts };
    case "SET_DOCUMENTS":            return { ...state, documents: action.payload, lastUpdated: ts };
    case "SET_QUALITY_CHECKLISTS":   return { ...state, qualityChecklists: action.payload, lastUpdated: ts };
    case "SET_FEEDBACK_RECORDS":     return { ...state, feedbackRecords: action.payload, lastUpdated: ts };
    case "SET_COMMUNICATION_LOGS":   return { ...state, communicationLogs: action.payload, lastUpdated: ts };
    case "SET_OPERATIONAL_ALERTS":   return { ...state, operationalAlerts: action.payload, lastUpdated: ts };

    // ── Phase 2 ──────────────────────────────────────────────
    case "SET_WORKFLOW_RECORDS":     return { ...state, workflowRecords: action.payload, lastUpdated: ts };
    case "SET_ACTION_LOGS":          return { ...state, actionLogs: action.payload, lastUpdated: ts };
    case "ADD_ACTION_LOG_ENTRY":     return { ...state, actionLogs: [action.payload, ...state.actionLogs], lastUpdated: ts };

    case "UPDATE_STAGE_STATUS": {
      const { patientId, stageId, status, notes, blockerDescription, assignedTo } = action.payload;
      const updatedRecords = state.workflowRecords.map((wr) => {
        if (wr.patientId !== patientId) return wr;
        const prev = wr.stages[stageId];
        const updatedStage: StageRecord = {
          ...prev,
          status,
          notes: notes ?? prev.notes,
          blockerDescription:
            blockerDescription ??
            (status !== "on_hold" && status !== "awaiting_input" ? undefined : prev.blockerDescription),
          assignedTo: assignedTo ?? prev.assignedTo,
          startedAt: prev.startedAt ?? (status !== "not_started" ? ts : undefined),
          completedAt: status === "completed" ? ts : prev.completedAt,
        };
        const currentIdx = WORKFLOW_STAGE_IDS.indexOf(wr.currentWorkflowStageId);
        const thisIdx = WORKFLOW_STAGE_IDS.indexOf(stageId);
        const nextStageId: WorkflowStageId =
          status === "completed" && thisIdx >= currentIdx && thisIdx < WORKFLOW_STAGE_IDS.length - 1
            ? WORKFLOW_STAGE_IDS[thisIdx + 1]
            : wr.currentWorkflowStageId;
        return { ...wr, stages: { ...wr.stages, [stageId]: updatedStage }, currentWorkflowStageId: nextStageId, updatedAt: ts };
      });
      return { ...state, workflowRecords: updatedRecords, lastUpdated: ts };
    }

    // ── Phase 3 ──────────────────────────────────────────────
    case "SET_PRACHARAKA_PROFILES":
      return { ...state, pracharakaProfiles: action.payload, lastUpdated: ts };

    case "SET_PRACHARAKA_TRAINING_RECORDS":
      return { ...state, pracharakaTrainingRecords: action.payload, lastUpdated: ts };

    case "ADD_FULL_PRACHARAKA": {
      const { pracharaka: pracharakaData, profile: profileData } = action.payload;
      const newId = generatePracharakaId(state.pracharakas);
      const pprIndex = state.pracharakaProfiles.length + 1;
      const ptrIndex = state.pracharakaTrainingRecords.length + 1;

      const newPracharaka: Pracharaka = {
        id: newId,
        name: pracharakaData.name,
        phone: pracharakaData.phone,
        email: pracharakaData.email,
        city: pracharakaData.city,
        state: pracharakaData.state,
        country: pracharakaData.country,
        joinedDate: ts.split("T")[0],
        status: "pending_verification",
        totalReferrals: 0,
        agreementSigned: false,
        notes: pracharakaData.notes,
      };

      const newProfile: PracharakaProfile = {
        id: `PPR-${String(pprIndex).padStart(3, "0")}`,
        pracharakaId: newId,
        ...profileData,
        createdAt: ts,
        updatedAt: ts,
      };

      const newTrainingRecord: PracharakaTrainingRecord = {
        id: `PTR-${String(ptrIndex).padStart(3, "0")}`,
        pracharakaId: newId,
        moduleCompletions: Object.fromEntries(ALL_TRAINING_MODULE_IDS.map((id) => [id, false])),
        moduleCompletionDates: {},
        assessmentPassed: false,
        updatedAt: ts,
      };

      return {
        ...state,
        pracharakas: [...state.pracharakas, newPracharaka],
        pracharakaProfiles: [...state.pracharakaProfiles, newProfile],
        pracharakaTrainingRecords: [...state.pracharakaTrainingRecords, newTrainingRecord],
        lastUpdated: ts,
      };
    }

    case "UPDATE_PRACHARAKA_PROFILE": {
      const { pracharakaId, updates } = action.payload;
      return {
        ...state,
        pracharakaProfiles: state.pracharakaProfiles.map((p) =>
          p.pracharakaId === pracharakaId ? { ...p, ...updates, updatedAt: ts } : p
        ),
        lastUpdated: ts,
      };
    }

    case "TOGGLE_TRAINING_MODULE": {
      const { pracharakaId, moduleId, completed } = action.payload;
      return {
        ...state,
        pracharakaTrainingRecords: state.pracharakaTrainingRecords.map((r) => {
          if (r.pracharakaId !== pracharakaId) return r;
          const dates = completed
            ? { ...r.moduleCompletionDates, [moduleId]: ts }
            : Object.fromEntries(
                Object.entries(r.moduleCompletionDates).filter(([k]) => k !== moduleId)
              );
          return {
            ...r,
            moduleCompletions: { ...r.moduleCompletions, [moduleId]: completed },
            moduleCompletionDates: dates,
            updatedAt: ts,
          };
        }),
        lastUpdated: ts,
      };
    }

    case "TOGGLE_ONBOARDING_MILESTONE": {
      const { pracharakaId, milestoneId, completed } = action.payload;
      return {
        ...state,
        pracharakaProfiles: state.pracharakaProfiles.map((p) => {
          if (p.pracharakaId !== pracharakaId) return p;
          return {
            ...p,
            onboardingMilestones: { ...p.onboardingMilestones, [milestoneId]: completed },
            updatedAt: ts,
          };
        }),
        lastUpdated: ts,
      };
    }

    case "SET_ASSESSMENT_RESULT": {
      const { pracharakaId, passed, date, notes } = action.payload;
      return {
        ...state,
        pracharakaTrainingRecords: state.pracharakaTrainingRecords.map((r) =>
          r.pracharakaId === pracharakaId
            ? { ...r, assessmentPassed: passed, assessmentDate: date, assessmentNotes: notes, updatedAt: ts }
            : r
        ),
        lastUpdated: ts,
      };
    }

    // ── Phase 4 ──────────────────────────────────────────────
    case "SET_WISHLIST_V2_ENTRIES":
      return { ...state, wishListV2Entries: action.payload, lastUpdated: ts };

    case "SAVE_WISHLIST_DRAFT": {
      const entry = action.payload;
      const exists = state.wishListV2Entries.some((e) => e.id === entry.id);
      return {
        ...state,
        wishListV2Entries: exists
          ? state.wishListV2Entries.map((e) => (e.id === entry.id ? { ...entry, updatedAt: ts } : e))
          : [...state.wishListV2Entries, { ...entry, createdAt: ts, updatedAt: ts }],
        lastUpdated: ts,
      };
    }

    case "SUBMIT_WISHLIST": {
      const wishListId = action.payload;
      const wlIndex = state.wishListV2Entries.findIndex((e) => e.id === wishListId);
      if (wlIndex === -1) return state;

      const wl = state.wishListV2Entries[wlIndex];

      // 1. Mark wish list submitted
      const newPatientId = `PAT-${String(state.patients.length + 1).padStart(3, "0")}`;
      const updatedWl = { ...wl, status: "submitted" as const, submittedAt: ts, patientId: newPatientId, updatedAt: ts };

      // 2. Create Patient
      const ageStr = wl.data.dateOfBirth
        ? String(new Date().getFullYear() - new Date(wl.data.dateOfBirth).getFullYear())
        : "0";
      const newPatient = {
        id: newPatientId,
        name: wl.data.fullName,
        age: parseInt(ageStr, 10),
        dateOfBirth: wl.data.dateOfBirth,
        gender: wl.data.gender as import("@/lib/types").PatientGender,
        phone: wl.data.whatsappNumber,
        email: wl.data.email,
        city: wl.data.placeOfResidence.split(",")[0]?.trim() || "",
        state: wl.data.placeOfResidence.split(",")[1]?.trim() || "",
        country: wl.data.placeOfResidence.split(",")[2]?.trim() || "",
        pracharakaId: wl.pracharakaId,
        currentStage: "astro-eligibility" as import("@/lib/types").StageId,
        createdAt: ts,
        updatedAt: ts,
        chiefComplaint: wl.data.healthConcerns,
      };

      // 3. Create WorkflowRecord
      const newWfId = `WFR-${String(state.workflowRecords.length + 1).padStart(3, "0")}`;
      const newWfRecord: import("@/lib/types/workflow").PatientWorkflowRecord = {
        id: newWfId,
        patientId: newPatientId,
        currentWorkflowStageId: "astrochart_eligibility",
        stages: {
          ...Object.fromEntries(
            WORKFLOW_STAGE_IDS.map((id) => [
              id,
              { stageId: id, status: "not_started" },
            ])
          ),
          patient_wish_list: { stageId: "patient_wish_list", status: "completed", startedAt: wl.createdAt, completedAt: ts },
          astrochart_eligibility: { stageId: "astrochart_eligibility", status: "in_progress", startedAt: ts },
        } as Record<import("@/lib/types/workflow").WorkflowStageId, import("@/lib/types/workflow").StageRecord>,
        createdAt: ts,
        updatedAt: ts,
      };

      return {
        ...state,
        wishListV2Entries: state.wishListV2Entries.map((e) => (e.id === wishListId ? updatedWl : e)),
        patients: [...state.patients, newPatient],
        workflowRecords: [...state.workflowRecords, newWfRecord],
        lastUpdated: ts,
      };
    }

    case "VERIFY_WISHLIST":
      return {
        ...state,
        wishListV2Entries: state.wishListV2Entries.map((e) =>
          e.id === action.payload ? { ...e, status: "verified", verifiedAt: ts, updatedAt: ts } : e
        ),
        lastUpdated: ts,
      };

    case "FORWARD_WISHLIST": {
      const wishListId = action.payload;
      const wl = state.wishListV2Entries.find((e) => e.id === wishListId);
      if (!wl || !wl.patientId) return state; // Needs to be submitted first

      const newAstroId = `AEV2-${String(state.astroEligibilityV2Entries.length + 1).padStart(3, "0")}`;
      const newAstroRecord: import("@/lib/types/astroV2").AstroEligibilityV2 = {
        id: newAstroId,
        patientId: wl.patientId,
        wishListId: wl.id,
        status: "pending_preparation",
        decision: "pending",
        communications: [],
        createdAt: ts,
        updatedAt: ts,
      };

      return {
        ...state,
        wishListV2Entries: state.wishListV2Entries.map((e) =>
          e.id === wishListId ? { ...e, status: "forwarded", forwardedAt: ts, updatedAt: ts } : e
        ),
        astroEligibilityV2Entries: [...state.astroEligibilityV2Entries, newAstroRecord],
        lastUpdated: ts,
      };
    }

    // ── Phase 5 ──────────────────────────────────────────────
    case "SET_ASTRO_ELIGIBILITY_V2":
      return { ...state, astroEligibilityV2Entries: action.payload, lastUpdated: ts };

    case "UPDATE_ASTRO_EVALUATION": {
      const { id, updates } = action.payload;
      return {
        ...state,
        astroEligibilityV2Entries: state.astroEligibilityV2Entries.map((a) =>
          a.id === id ? { ...a, ...updates, updatedAt: ts } : a
        ),
        lastUpdated: ts,
      };
    }

    case "SUBMIT_ASTRO_DECISION": {
      const { id, decision } = action.payload;
      const aIndex = state.astroEligibilityV2Entries.findIndex((a) => a.id === id);
      if (aIndex === -1) return state;

      const astro = state.astroEligibilityV2Entries[aIndex];
      const updatedAstro = {
        ...astro,
        decision,
        status: "evaluation_completed" as const,
        evaluationCompletedAt: ts,
        updatedAt: ts,
      };

      // Update Workflow status based on decision
      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== astro.patientId) return wf;
        const currentStage = wf.stages["astrochart_eligibility"];
        
        const newWf = { ...wf };
        newWf.stages = {
          ...wf.stages,
          astrochart_eligibility: {
            ...currentStage,
            status: "completed",
            completedAt: ts,
            notes: `Decision: ${decision}`,
          },
        };

        if (decision === "eligible") {
          newWf.currentWorkflowStageId = "screening_consultation";
          newWf.stages["screening_consultation"] = { ...wf.stages["screening_consultation"], status: "in_progress", startedAt: ts };
        } else if (decision === "not_immediately_eligible") {
          // Patient flow is logically on_hold but the stage is completed.
          // Workflow requires it to halt in Astro until manual intervention or a new process occurs.
          newWf.currentWorkflowStageId = "astrochart_eligibility"; // keep workflow parked here
          newWf.stages["astrochart_eligibility"].status = "on_hold";
          newWf.stages["astrochart_eligibility"].blockerDescription = "Patient deferred. Awaiting next transit window.";
        }
        newWf.updatedAt = ts;
        return newWf;
      });

      return {
        ...state,
        astroEligibilityV2Entries: state.astroEligibilityV2Entries.map((a) =>
          a.id === id ? updatedAstro : a
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    case "LOG_ASTRO_COMMUNICATION": {
      const { id, channel, notes } = action.payload;
      return {
        ...state,
        astroEligibilityV2Entries: state.astroEligibilityV2Entries.map((a) => {
          if (a.id !== id) return a;
          const commIndex = (a.communications || []).length + 1;
          const newDoc: import("@/lib/types/astroV2").AstroCommunicationLog = {
            id: `${id}-COM-${String(commIndex).padStart(2, "0")}`,
            channel,
            notes,
            sentAt: ts,
          };
          return {
            ...a,
            communications: [...(a.communications || []), newDoc],
            updatedAt: ts,
          };
        }),
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 6 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SET_SCREENING_V2_RECORDS":
      return { ...state, screeningV2Records: action.payload, lastUpdated: ts };

    case "INITIATE_SCREENING": {
      const { patientId, astroRecordId } = action.payload;
      // Idempotent — if already exists don't duplicate
      const exists = state.screeningV2Records.some((s) => s.patientId === patientId);
      if (exists) return state;

      const newId = `SCR2-${String(state.screeningV2Records.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/screeningV2").ScreeningV2Record = {
        id: newId,
        patientId,
        astroRecordId,
        status: "awaiting_pre_screening",
        healthQuestionnaireCompleted: false,
        healthQuestionnaire: {},
        documents: [],
        consultationFeePaidUSD: 100,
        consultationFeePaid: false,
        decision: "pending",
        createdAt: ts,
        updatedAt: ts,
      };
      return {
        ...state,
        screeningV2Records: [...state.screeningV2Records, newRecord],
        lastUpdated: ts,
      };
    }

    case "UPDATE_SCREENING_V2": {
      const { id, updates } = action.payload;
      return {
        ...state,
        screeningV2Records: state.screeningV2Records.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: ts } : s
        ),
        lastUpdated: ts,
      };
    }

    case "ADD_SCREENING_DOCUMENT": {
      const { id, doc } = action.payload;
      return {
        ...state,
        screeningV2Records: state.screeningV2Records.map((s) => {
          if (s.id !== id) return s;
          // Replace if same type already exists, otherwise append
          const filtered = s.documents.filter((d) => d.type !== doc.type);
          return { ...s, documents: [...filtered, doc], updatedAt: ts };
        }),
        lastUpdated: ts,
      };
    }

    case "SUBMIT_SCREENING_DECISION": {
      const { id, decision, notes } = action.payload;
      const scr = state.screeningV2Records.find((s) => s.id === id);
      if (!scr) return state;

      // Update screening record
      const updatedScr = {
        ...scr,
        decision,
        status: (decision === "approved" ? "approved" : "on_hold") as import("@/lib/types/screeningV2").ScreeningV2Status,
        decisionNotes: notes,
        decisionDate: ts,
        updatedAt: ts,
      };

      // Update workflow if approved → advance to treatment_planning
      const updatedWf = decision === "approved"
        ? state.workflowRecords.map((wf) => {
            if (wf.patientId !== scr.patientId) return wf;
            return {
              ...wf,
              currentWorkflowStageId: "treatment_planning" as import("@/lib/types/workflow").WorkflowStageId,
              stages: {
                ...wf.stages,
                screening_consultation: { ...wf.stages["screening_consultation"], status: "completed", completedAt: ts, notes: "Screening approved." },
                treatment_planning: { stageId: "treatment_planning", status: "in_progress", startedAt: ts },
              },
              updatedAt: ts,
            };
          })
        : state.workflowRecords;

      return {
        ...state,
        screeningV2Records: state.screeningV2Records.map((s) => (s.id === id ? updatedScr : s)),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 7: Treatment Plan \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SET_TREATMENT_PLAN_V2_RECORDS":
      return { ...state, treatmentPlanV2Records: action.payload, lastUpdated: ts };

    case "INITIATE_TREATMENT_PLAN": {
      const { patientId, screeningRecordId } = action.payload;
      if (state.treatmentPlanV2Records.some((t) => t.patientId === patientId)) return state;
      const newId = `TPV2-${String(state.treatmentPlanV2Records.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/treatmentV2").TreatmentPlanV2 = {
        id: newId,
        patientId,
        screeningRecordId,
        status: "draft",
        protocol: {},
        scheduleShares: [
          { target: "aco",            shared: false },
          { target: "therapy_team",   shared: false },
          { target: "patient_portal", shared: false },
        ],
        medicineCategories: [
          { categoryId: "amapachana", medicines: [], pharmacyForwarded: false, shippingRequired: false, shippingForwarded: false },
          { categoryId: "pre_pk",     medicines: [], pharmacyForwarded: false, shippingRequired: false, shippingForwarded: false },
          { categoryId: "during_pk",  medicines: [], pharmacyForwarded: false, shippingRequired: false, shippingForwarded: false },
          { categoryId: "post_pk",    medicines: [], pharmacyForwarded: false, shippingRequired: false, shippingForwarded: false },
        ],
        createdAt: ts,
        updatedAt: ts,
      };
      return { ...state, treatmentPlanV2Records: [...state.treatmentPlanV2Records, newRecord], lastUpdated: ts };
    }

    case "UPDATE_TREATMENT_PLAN_V2": {
      const { id, updates } = action.payload;
      return {
        ...state,
        treatmentPlanV2Records: state.treatmentPlanV2Records.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: ts } : t
        ),
        lastUpdated: ts,
      };
    }

    case "APPROVE_TREATMENT_PLAN": {
      const { id } = action.payload;
      const plan = state.treatmentPlanV2Records.find((t) => t.id === id);
      if (!plan) return state;

      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== plan.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "pk_consultation" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            treatment_planning: { ...wf.stages["treatment_planning"], status: "completed", completedAt: ts },
            pk_consultation: { stageId: "pk_consultation", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });

      return {
        ...state,
        treatmentPlanV2Records: state.treatmentPlanV2Records.map((t) =>
          t.id === id ? { ...t, status: "approved", updatedAt: ts } : t
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 7: PK Consultation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SET_PK_CONSULTATION_V2_RECORDS":
      return { ...state, pkConsultationV2Records: action.payload, lastUpdated: ts };

    case "INITIATE_PK_CONSULTATION": {
      const { patientId, treatmentPlanId } = action.payload;
      if (state.pkConsultationV2Records.some((c) => c.patientId === patientId)) return state;
      const newId = `PKC2-${String(state.pkConsultationV2Records.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/treatmentV2").PKConsultationV2 = {
        id: newId,
        patientId,
        treatmentPlanId,
        status: "pending",
        feePaidUSD: 100,
        feePaid: false,
        checklistItems: {},
        orientationVideosSent: false,
        orientationVideosDone: false,
        amapachana: {},
        createdAt: ts,
        updatedAt: ts,
      };
      return { ...state, pkConsultationV2Records: [...state.pkConsultationV2Records, newRecord], lastUpdated: ts };
    }

    case "UPDATE_PK_CONSULTATION_V2": {
      const { id, updates } = action.payload;
      return {
        ...state,
        pkConsultationV2Records: state.pkConsultationV2Records.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: ts } : c
        ),
        lastUpdated: ts,
      };
    }

    case "COMPLETE_PK_CONSULTATION": {
      const { id, notes } = action.payload;
      const consult = state.pkConsultationV2Records.find((c) => c.id === id);
      if (!consult) return state;

      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== consult.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "reservation_fee" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            pk_consultation: { ...wf.stages["pk_consultation"], status: "completed", completedAt: ts },
            reservation_fee: { stageId: "reservation_fee", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });

      return {
        ...state,
        pkConsultationV2Records: state.pkConsultationV2Records.map((c) =>
          c.id === id ? { ...c, status: "completed", conductedAt: ts, consultationNotes: notes ?? c.consultationNotes, updatedAt: ts } : c
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 8: Reservation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SET_RESERVATION_V2_RECORDS":
      return { ...state, reservationV2Records: action.payload, lastUpdated: ts };

    case "INITIATE_RESERVATION": {
      const { patientId, pkConsultationId, isInternational } = action.payload;
      if (state.reservationV2Records.some((r) => r.patientId === patientId)) return state;

      // Build e-Kit items list — FORM C and visa_guidance only for international patients
      const ekitItems = (require("@/data/ekit-contents.json").items as Array<{ id: string; internationalOnly: boolean }>)
        .filter((item) => !item.internationalOnly || isInternational)
        .map((item) => ({ itemId: item.id, dispatched: false }));

      const newId = `RES2-${String(state.reservationV2Records.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/reservationV2").ReservationV2Record = {
        id: newId,
        patientId,
        pkConsultationId,
        status: "pending_payment",
        feeAmountUSD: 300,
        feePaid: false,
        isInternationalPatient: isInternational,
        ekitItems,
        createdAt: ts,
        updatedAt: ts,
      };
      return { ...state, reservationV2Records: [...state.reservationV2Records, newRecord], lastUpdated: ts };
    }

    case "UPDATE_RESERVATION_V2": {
      return {
        ...state,
        reservationV2Records: state.reservationV2Records.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates, updatedAt: ts } : r
        ),
        lastUpdated: ts,
      };
    }

    case "CONFIRM_RESERVATION_PAYMENT": {
      const { id, paymentMode, reference } = action.payload;
      const res = state.reservationV2Records.find((r) => r.id === id);
      if (!res) return state;

      // Advance workflow: reservation_fee → patient_portal_access
      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== res.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "patient_portal_access" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            reservation_fee: { ...wf.stages["reservation_fee"], status: "completed", completedAt: ts },
            patient_portal_access: { stageId: "patient_portal_access", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });

      return {
        ...state,
        reservationV2Records: state.reservationV2Records.map((r) =>
          r.id === id ? { ...r, feePaid: true, feePaidAt: ts, status: "payment_received", paymentMode, paymentReference: reference, updatedAt: ts } : r
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    case "DISPATCH_EKIT_ITEM": {
      const { id, itemId } = action.payload;
      return {
        ...state,
        reservationV2Records: state.reservationV2Records.map((r) => {
          if (r.id !== id) return r;
          let updatedItems = (r.ekitItems || []).map((item) =>
            item.itemId === itemId ? { ...item, dispatched: true, dispatchedAt: ts } : item
          );
          if (!updatedItems.some(i => i.itemId === itemId)) {
            updatedItems.push({ itemId, dispatched: true, dispatchedAt: ts });
          }
          const allDispatched = updatedItems.every((i) => i.dispatched);
          return { ...r, ekitItems: updatedItems, status: allDispatched ? ("ekit_dispatched" as const) : r.status, updatedAt: ts };
        }),
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 8: Portal Onboarding \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SET_PORTAL_ONBOARDING_V2":
      return { ...state, portalOnboardingV2Records: action.payload, lastUpdated: ts };

    case "INITIATE_PORTAL_ONBOARDING": {
      const { patientId, reservationId } = action.payload;
      if (state.portalOnboardingV2Records.some((p) => p.patientId === patientId)) return state;
      const newId = `POB2-${String(state.portalOnboardingV2Records.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/reservationV2").PortalOnboardingV2Record = {
        id: newId,
        patientId,
        reservationId,
        status: "not_started",
        portalItems: {},
        whatsappGroupCreated: false,
        whatsappMembers: (require("@/data/whatsapp-group-config.json").members as Array<{ id: string }>)
          .map((m) => ({ memberId: m.id, added: false })),
        createdAt: ts,
        updatedAt: ts,
      };
      return { ...state, portalOnboardingV2Records: [...state.portalOnboardingV2Records, newRecord], lastUpdated: ts };
    }

    case "UPDATE_PORTAL_ONBOARDING_V2": {
      return {
        ...state,
        portalOnboardingV2Records: state.portalOnboardingV2Records.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates, updatedAt: ts } : p
        ),
        lastUpdated: ts,
      };
    }

    case "COMPLETE_PORTAL_ONBOARDING": {
      const { id } = action.payload;
      const pob = state.portalOnboardingV2Records.find((p) => p.id === id);
      if (!pob) return state;

      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== pob.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "travel_preparation" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            patient_portal_access: { ...wf.stages["patient_portal_access"], status: "completed", completedAt: ts },
            travel_preparation: { stageId: "travel_preparation", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });

      return {
        ...state,
        portalOnboardingV2Records: state.portalOnboardingV2Records.map((p) =>
          p.id === id ? { ...p, status: "completed", updatedAt: ts } : p
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 9: Travel Preparation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "INITIATE_TRAVEL_PREP": {
      const { patientId, portalOnboardingId, isInternational } = action.payload;
      if (state.travelPrepRecords.some((t) => t.patientId === patientId)) return state;
      const travelTasks = (require("@/data/travel-tasks.json").tasks as Array<{ id: string }>)
        .map((t) => ({ taskId: t.id, done: false }));
      const newId = `TRV-${String(state.travelPrepRecords.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        travelPrepRecords: [...state.travelPrepRecords, {
          id: newId, patientId, portalOnboardingId,
          tasks: travelTasks, isComplete: false, createdAt: ts, updatedAt: ts,
        }],
        lastUpdated: ts,
      };
    }

    case "UPDATE_TRAVEL_PREP": {
      return {
        ...state,
        travelPrepRecords: state.travelPrepRecords.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates, updatedAt: ts } : t
        ),
        lastUpdated: ts,
      };
    }

    case "TOGGLE_TRAVEL_TASK": {
      const { id, taskId } = action.payload;
      return {
        ...state,
        travelPrepRecords: state.travelPrepRecords.map((t) => {
          if (t.id !== id) return t;
          const tasks = t.tasks.map((task) =>
            task.taskId === taskId ? { ...task, done: !task.done, doneAt: !task.done ? ts : undefined } : task
          );
          return { ...t, tasks, updatedAt: ts };
        }),
        lastUpdated: ts,
      };
    }

    case "COMPLETE_TRAVEL_PREP": {
      const { id } = action.payload;
      const trv = state.travelPrepRecords.find((t) => t.id === id);
      if (!trv) return state;
      // Advance workflow: travel_preparation → advance_payment
      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== trv.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "advance_payment" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            travel_preparation: { ...wf.stages["travel_preparation"], status: "completed", completedAt: ts },
            advance_payment: { stageId: "advance_payment", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });
      return {
        ...state,
        travelPrepRecords: state.travelPrepRecords.map((t) => t.id === id ? { ...t, isComplete: true, updatedAt: ts } : t),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 9: Payment \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "INITIATE_PAYMENT_RECORD": {
      const { patientId, travelPrepId } = action.payload;
      if (state.paymentRecords.some((p) => p.patientId === patientId)) return state;
      const newId = `PAY-${String(state.paymentRecords.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        paymentRecords: [...state.paymentRecords, {
          id: newId, patientId, travelPrepId,
          advanceAmountTBF: true, advancePaid: false,
          finalPaid: false, status: "not_paid", createdAt: ts, updatedAt: ts,
        }],
        lastUpdated: ts,
      };
    }

    case "UPDATE_PAYMENT_RECORD": {
      return {
        ...state,
        paymentRecords: state.paymentRecords.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates, updatedAt: ts } : p
        ),
        lastUpdated: ts,
      };
    }

    case "CONFIRM_ADVANCE_PAYMENT": {
      const { id, mode, reference, amount } = action.payload;
      return {
        ...state,
        paymentRecords: state.paymentRecords.map((p) =>
          p.id !== id ? p : {
            ...p, advancePaid: true, advancePaidAt: ts, advanceMode: mode,
            advanceReference: reference, advanceAmountUSD: amount, advanceAmountTBF: false,
            status: p.finalPaid ? ("paid" as const) : ("partial" as const), updatedAt: ts,
          }
        ),
        lastUpdated: ts,
      };
    }

    case "CONFIRM_FINAL_PAYMENT": {
      const { id, mode, reference, amount } = action.payload;
      return {
        ...state,
        paymentRecords: state.paymentRecords.map((p) =>
          p.id !== id ? p : {
            ...p, finalPaid: true, finalPaidAt: ts, finalMode: mode,
            finalReference: reference, finalAmountUSD: amount,
            status: "paid" as const, updatedAt: ts,
          }
        ),
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 9: Arrival & Admission \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "INITIATE_ARRIVAL_ADMISSION": {
      const { patientId, paymentRecordId } = action.payload;
      if (state.arrivalAdmissionRecords.some((a) => a.patientId === patientId)) return state;
      const admissionItems = (require("@/data/admission-checklist.json").items as Array<{ id: string }>)
        .map((item) => ({ itemId: item.id, done: false }));
      const newId = `ADM-${String(state.arrivalAdmissionRecords.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        arrivalAdmissionRecords: [...state.arrivalAdmissionRecords, {
          id: newId, patientId, paymentRecordId,
          admissionChecklist: admissionItems, isAdmitted: false, createdAt: ts, updatedAt: ts,
        }],
        lastUpdated: ts,
      };
    }

    case "UPDATE_ARRIVAL_ADMISSION": {
      return {
        ...state,
        arrivalAdmissionRecords: state.arrivalAdmissionRecords.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates, updatedAt: ts } : a
        ),
        lastUpdated: ts,
      };
    }

    case "TOGGLE_ADMISSION_ITEM": {
      const { id, itemId } = action.payload;
      return {
        ...state,
        arrivalAdmissionRecords: state.arrivalAdmissionRecords.map((a) => {
          if (a.id !== id) return a;
          const admissionChecklist = a.admissionChecklist.map((item) =>
            item.itemId === itemId ? { ...item, done: !item.done, doneAt: !item.done ? ts : undefined } : item
          );
          return { ...a, admissionChecklist, updatedAt: ts };
        }),
        lastUpdated: ts,
      };
    }

    case "ADMIT_PATIENT": {
      const { id } = action.payload;
      const adm = state.arrivalAdmissionRecords.find((a) => a.id === id);
      if (!adm) return state;
      // Advance workflow: arrival_admission → treatment (or next available post-admission stage)
      const updatedWf = state.workflowRecords.map((wf) => {
        if (wf.patientId !== adm.patientId) return wf;
        return {
          ...wf,
          currentWorkflowStageId: "panchakarma_treatment" as import("@/lib/types/workflow").WorkflowStageId,
          stages: {
            ...wf.stages,
            arrival_admission: { ...wf.stages["arrival_admission"], status: "completed", completedAt: ts },
            panchakarma_treatment: { stageId: "panchakarma_treatment", status: "in_progress", startedAt: ts },
          },
          updatedAt: ts,
        };
      });
      return {
        ...state,
        arrivalAdmissionRecords: state.arrivalAdmissionRecords.map((a) =>
          a.id === id ? { ...a, isAdmitted: true, admittedAt: ts, updatedAt: ts } : a
        ),
        workflowRecords: updatedWf,
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 9: Documents \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "INITIATE_PATIENT_DOCUMENTS": {
      const { patientId, isInternational } = action.payload;
      if (state.patientDocuments.some((d) => d.patientId === patientId)) return state;
      const docs = (require("@/data/required-documents.json").documents as Array<{ id: string; requiredForInternational: boolean; requiredForDomestic: boolean }>)
        .filter((d) => isInternational ? d.requiredForInternational : d.requiredForDomestic)
        .map((d) => ({ docId: d.id, status: "not_submitted" as const }));
      const newId = `DOC-${String(state.patientDocuments.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        patientDocuments: [...state.patientDocuments, {
          id: newId, patientId, isInternational, documents: docs, createdAt: ts, updatedAt: ts,
        }],
        lastUpdated: ts,
      };
    }

    case "UPDATE_DOCUMENT_STATUS": {
      const { id, docId, update } = action.payload;
      return {
        ...state,
        patientDocuments: state.patientDocuments.map((pd) => {
          if (pd.id !== id) return pd;
          const documents = pd.documents.map((d) => d.docId === docId ? { ...d, ...update } : d);
          return { ...pd, documents, updatedAt: ts };
        }),
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 10: Quality Control \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "INITIATE_QC_RECORD": {
      const { patientId } = action.payload;
      if (state.qualityChecklists.some((q) => q.patientId === patientId)) return state;
      const qcDefs = require("@/data/qc-stage-definitions.json").qcStages as Array<{ id: string; items: Array<{ id: string }> }>;
      const checklistItems: Record<string, boolean> = {};
      qcDefs.forEach((stage) => stage.items.forEach((item) => { checklistItems[`${stage.id}::${item.id}`] = false; }));
      const newId = `QC-${String(state.qualityChecklists.length + 1).padStart(3, "0")}`;
      const newRecord: import("@/lib/types/index").QualityChecklist = {
        id: newId, patientId, reviewedBy: "", status: "pending" as any,
        checklistItems, patientRatings: {},
      };
      return { ...state, qualityChecklists: [...state.qualityChecklists, newRecord], lastUpdated: ts };
    }

    case "TOGGLE_QC_ITEM": {
      const { patientId, stageId, itemId } = action.payload;
      const key = `${stageId}::${itemId}`;
      return {
        ...state,
        qualityChecklists: state.qualityChecklists.map((q) => {
          if (q.patientId !== patientId) return q;
          return { ...q, checklistItems: { ...q.checklistItems, [key]: !q.checklistItems[key] } };
        }),
        lastUpdated: ts,
      };
    }

    case "UPDATE_QC_RECORD": {
      const { patientId, updates } = action.payload;
      return {
        ...state,
        qualityChecklists: state.qualityChecklists.map((q) =>
          q.patientId === patientId ? { ...q, ...updates } : q
        ),
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 10: Feedback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "SUBMIT_FEEDBACK": {
      const newId = `FB-${String(state.feedbackRecords.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        feedbackRecords: [...state.feedbackRecords, { ...action.payload, id: newId, submittedAt: ts }],
        lastUpdated: ts,
      };
    }

    // \u2500\u2500 Phase 10: Audit Note \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case "ADD_AUDIT_NOTE": {
      const { patientId, note, author } = action.payload;
      const newLogId = `AL-AUDIT-${Date.now()}`;
      const auditEntry: import("@/lib/types/workflow").ActionLogEntry = {
        id: newLogId, patientId, timestamp: ts, type: "note",
        stageId: undefined as any,
        actor: author ?? "Ops Team",
        summary: note,
        isAudit: true as any,
      };
      return {
        ...state,
        actionLogs: [auditEntry, ...state.actionLogs],
        lastUpdated: ts,
      };
    }

    case "RESET_TO_SEED":
      return buildInitialState();

    case "IMPORT_STATE":
      return { ...state, ...action.payload, lastUpdated: ts };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  resetToSeed: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState);

  useEffect(() => {
    saveState(STORAGE_KEYS.PRACHARAKAS,                state.pracharakas);
    saveState(STORAGE_KEYS.PATIENTS,                   state.patients);
    saveState(STORAGE_KEYS.WISH_LIST,                  state.wishList);
    saveState(STORAGE_KEYS.ASTRO_ELIGIBILITY,          state.astroEligibility);
    saveState(STORAGE_KEYS.SCREENING_RECORDS,          state.screeningRecords);
    saveState(STORAGE_KEYS.TREATMENT_PLANS,            state.treatmentPlans);
    saveState(STORAGE_KEYS.CONSULTATION_RECORDS,       state.consultationRecords);
    saveState(STORAGE_KEYS.RESERVATION_RECORDS,        state.reservationRecords);
    saveState(STORAGE_KEYS.PORTAL_ACCESS,              state.portalAccess);
    saveState(STORAGE_KEYS.TRAVEL_PAYMENT_RECORDS,     state.travelPaymentRecords);
    saveState(STORAGE_KEYS.ADMISSION_RECORDS,          state.admissionRecords);
    saveState(STORAGE_KEYS.DOCUMENTS,                  state.documents);
    saveState(STORAGE_KEYS.QUALITY_CHECKLISTS,         state.qualityChecklists);
    saveState(STORAGE_KEYS.FEEDBACK_RECORDS,           state.feedbackRecords);
    saveState(STORAGE_KEYS.COMMUNICATION_LOGS,         state.communicationLogs);
    saveState(STORAGE_KEYS.OPERATIONAL_ALERTS,         state.operationalAlerts);
    saveState(STORAGE_KEYS.WORKFLOW_RECORDS,           state.workflowRecords);
    saveState(STORAGE_KEYS.ACTION_LOGS,                state.actionLogs);
    saveState(STORAGE_KEYS.PRACHARAKA_PROFILES,        state.pracharakaProfiles);
    saveState(STORAGE_KEYS.PRACHARAKA_TRAINING_RECORDS,state.pracharakaTrainingRecords);
    saveState(STORAGE_KEYS.WISHLIST_V2_ENTRIES,        state.wishListV2Entries);
    saveState(STORAGE_KEYS.ASTRO_ELIGIBILITY_V2,       state.astroEligibilityV2Entries);
    saveState(STORAGE_KEYS.SCREENING_V2_RECORDS,       state.screeningV2Records);
    saveState(STORAGE_KEYS.TREATMENT_PLAN_V2,          state.treatmentPlanV2Records);
    saveState(STORAGE_KEYS.PK_CONSULTATION_V2,         state.pkConsultationV2Records);
    saveState(STORAGE_KEYS.RESERVATION_V2_RECORDS,     state.reservationV2Records);
    saveState(STORAGE_KEYS.PORTAL_ONBOARDING_V2,       state.portalOnboardingV2Records);
    saveState(STORAGE_KEYS.TRAVEL_PREP_RECORDS,        state.travelPrepRecords);
    saveState(STORAGE_KEYS.PAYMENT_RECORDS,            state.paymentRecords);
    saveState(STORAGE_KEYS.ARRIVAL_ADMISSION_RECORDS,  state.arrivalAdmissionRecords);
    saveState(STORAGE_KEYS.PATIENT_DOCUMENTS,          state.patientDocuments);
    saveState(STORAGE_KEYS.LAST_UPDATED,               state.lastUpdated);
  }, [state]);

  const resetToSeed = useCallback(() => {
    storageReset({
      pracharakas:       seedRecords.pracharakas       as AppState["pracharakas"],
      patients:          seedRecords.patients           as AppState["patients"],
      wishList:          seedRecords.wishListEntries    as AppState["wishList"],
      screeningRecords:  seedRecords.screeningRecords   as AppState["screeningRecords"],
      operationalAlerts: seedRecords.operationalAlerts  as AppState["operationalAlerts"],
      wishListV2Entries: seedRecordsV2.wishListV2Entries as AppState["wishListV2Entries"],
      astroEligibilityV2Entries: seedRecordsV2.astroEligibilityV2Entries as AppState["astroEligibilityV2Entries"],
      screeningV2Records: seedRecordsV2.screeningV2Records as unknown as AppState["screeningV2Records"],
      treatmentPlanV2Records: seedRecordsV2.treatmentPlanV2Records as unknown as AppState["treatmentPlanV2Records"],
      pkConsultationV2Records: seedRecordsV2.pkConsultationV2Records as unknown as AppState["pkConsultationV2Records"],
      reservationV2Records: seedRecordsV2.reservationV2Records as unknown as AppState["reservationV2Records"],
      portalOnboardingV2Records: seedRecordsV2.portalOnboardingV2Records as unknown as AppState["portalOnboardingV2Records"],
      travelPrepRecords: seedRecordsV2.travelPrepRecords as unknown as AppState["travelPrepRecords"],
      paymentRecords: seedRecordsV2.paymentRecords as unknown as AppState["paymentRecords"],
      arrivalAdmissionRecords: seedRecordsV2.arrivalAdmissionRecords as unknown as AppState["arrivalAdmissionRecords"],
      qualityChecklists: seedRecordsV2.qualityChecklists as unknown as AppState["qualityChecklists"],
    });
    dispatch({ type: "RESET_TO_SEED" });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, resetToSeed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within <AppProvider>");
  return ctx;
}
