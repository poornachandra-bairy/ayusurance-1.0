"use client";

import { useAppContext, type AppAction } from "./AppContext";
import type { AppState } from "@/lib/types";
import type {
  WorkflowStageId,
  StageStatus,
  ActionLogEntry,
  PatientWorkflowRecord,
} from "@/lib/types/workflow";
import type {
  PracharakaProfile,
  PracharakaTrainingRecord,
  PracharakaEligibilityCategoryId,
  PracharakaCertificationStatus,
} from "@/lib/types/pracharaka";
import { ALL_TRAINING_MODULE_IDS } from "@/lib/types/pracharaka";
import { nowISO } from "@/lib/utils/date";
import type { Pracharaka } from "@/lib/types";

export function useAppStore() {
  const { state, dispatch, resetToSeed } = useAppContext();

  // ── Phase 1 selectors ──────────────────────────────────────
  const patientById = (id: string) => state.patients.find((p) => p.id === id);
  const pracharakaById = (id: string) => state.pracharakas.find((p) => p.id === id);
  const patientsByStage = (stageId: AppState["patients"][number]["currentStage"]) =>
    state.patients.filter((p) => p.currentStage === stageId);
  const alertsByPriority = (priority: AppState["operationalAlerts"][number]["priority"]) =>
    state.operationalAlerts.filter((a) => a.priority === priority && !a.isResolved);

  // ── Phase 2 selectors ──────────────────────────────────────
  const workflowRecordByPatientId = (patientId: string): PatientWorkflowRecord | undefined =>
    state.workflowRecords.find((wr) => wr.patientId === patientId);

  const actionLogsByPatientId = (patientId: string): ActionLogEntry[] =>
    state.actionLogs.filter((log) => log.patientId === patientId);

  const patientsByWorkflowStage = (stageId: WorkflowStageId) =>
    state.workflowRecords
      .filter((wr) => wr.currentWorkflowStageId === stageId)
      .map((wr) => state.patients.find((p) => p.id === wr.patientId))
      .filter(Boolean);

  const stageBottlenecks = () => {
    const counts = new Map<WorkflowStageId, { count: number; awaitingCount: number }>();
    for (const wr of state.workflowRecords) {
      const prev = counts.get(wr.currentWorkflowStageId) ?? { count: 0, awaitingCount: 0 };
      const rec = wr.stages[wr.currentWorkflowStageId];
      counts.set(wr.currentWorkflowStageId, {
        count: prev.count + 1,
        awaitingCount:
          prev.awaitingCount +
          (rec?.status === "awaiting_input" || rec?.status === "on_hold" || rec?.status === "requires_review" ? 1 : 0),
      });
    }
    return Array.from(counts.entries())
      .map(([stageId, v]) => ({ stageId, ...v }))
      .sort((a, b) => b.count - a.count);
  };

  // ── Phase 3 selectors ──────────────────────────────────────
  const pracharakaProfileById = (pracharakaId: string): PracharakaProfile | undefined =>
    state.pracharakaProfiles.find((p) => p.pracharakaId === pracharakaId);

  const pracharakaTrainingById = (pracharakaId: string): PracharakaTrainingRecord | undefined =>
    state.pracharakaTrainingRecords.find((r) => r.pracharakaId === pracharakaId);

  const trainingCompletionCount = (pracharakaId: string): { completed: number; total: number } => {
    const record = pracharakaTrainingById(pracharakaId);
    if (!record) return { completed: 0, total: ALL_TRAINING_MODULE_IDS.length };
    const completed = Object.values(record.moduleCompletions).filter(Boolean).length;
    return { completed, total: ALL_TRAINING_MODULE_IDS.length };
  };

  const onboardingCompletionCount = (pracharakaId: string): { completed: number; total: number } => {
    const profile = pracharakaProfileById(pracharakaId);
    if (!profile) return { completed: 0, total: 12 };
    const completed = Object.values(profile.onboardingMilestones).filter(Boolean).length;
    return { completed, total: 12 };
  };

  const patientsByPracharaka = (pracharakaId: string) =>
    state.patients.filter((p) => p.pracharakaId === pracharakaId);

  // ── Phase 4 selectors ──────────────────────────────────────
  const wishListV2ById = (id: string) => state.wishListV2Entries.find((wl) => wl.id === id);

  // ── Phase 1 generic dispatcher ─────────────────────────────
  function set<K extends AppAction["type"]>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any
  ) {
    // @ts-expect-error dynamic dispatch
    dispatch({ type, payload });
  }

  // ── Phase 2 dispatchers ────────────────────────────────────
  function updateStageStatus(
    patientId: string,
    stageId: WorkflowStageId,
    status: StageStatus,
    options?: { notes?: string; blockerDescription?: string; assignedTo?: string }
  ) {
    dispatch({ type: "UPDATE_STAGE_STATUS", payload: { patientId, stageId, status, ...options } });
  }

  function addActionLogEntry(
    patientId: string,
    stageId: WorkflowStageId | undefined,
    role: string,
    noteType: ActionLogEntry["noteType"],
    message: string,
    createdBy?: string
  ) {
    dispatch({
      type: "ADD_ACTION_LOG_ENTRY",
      payload: {
        id: `LOG-${Date.now()}`,
        patientId,
        workflowStageId: stageId,
        timestamp: nowISO(),
        role,
        noteType,
        message,
        createdBy,
      },
    });
  }

  // ── Phase 3 dispatchers ────────────────────────────────────
  function addFullPracharaka(
    pracharaka: Omit<Pracharaka, "id">,
    profileData: Omit<PracharakaProfile, "id" | "pracharakaId" | "createdAt" | "updatedAt">
  ) {
    dispatch({ type: "ADD_FULL_PRACHARAKA", payload: { pracharaka, profile: profileData } });
  }

  function updatePracharakaProfile(pracharakaId: string, updates: Partial<PracharakaProfile>) {
    dispatch({ type: "UPDATE_PRACHARAKA_PROFILE", payload: { pracharakaId, updates } });
  }

  function toggleTrainingModule(pracharakaId: string, moduleId: string, completed: boolean) {
    dispatch({ type: "TOGGLE_TRAINING_MODULE", payload: { pracharakaId, moduleId, completed } });
  }

  function toggleOnboardingMilestone(pracharakaId: string, milestoneId: string, completed: boolean) {
    dispatch({ type: "TOGGLE_ONBOARDING_MILESTONE", payload: { pracharakaId, milestoneId, completed } });
  }

  function setAssessmentResult(
    pracharakaId: string,
    passed: boolean,
    date: string,
    notes?: string
  ) {
    dispatch({ type: "SET_ASSESSMENT_RESULT", payload: { pracharakaId, passed, date, notes } });
  }

  // ── Phase 4 dispatchers ────────────────────────────────────
  function saveWishListDraft(entry: import("@/lib/types/wishlist").WishListV2Entry) {
    dispatch({ type: "SAVE_WISHLIST_DRAFT", payload: entry });
  }
  function submitWishList(id: string) {
    dispatch({ type: "SUBMIT_WISHLIST", payload: id });
  }
  function verifyWishList(id: string) {
    dispatch({ type: "VERIFY_WISHLIST", payload: id });
  }
  function forwardWishList(id: string) {
    dispatch({ type: "FORWARD_WISHLIST", payload: id });
  }

  // ── Phase 5 dispatchers ────────────────────────────────────
  function updateAstroEvaluation(id: string, updates: Partial<import("@/lib/types/astroV2").AstroEligibilityV2>) {
    dispatch({ type: "UPDATE_ASTRO_EVALUATION", payload: { id, updates } });
  }
  function submitAstroDecision(id: string, decision: import("@/lib/types/astroV2").AstroDecision) {
    dispatch({ type: "SUBMIT_ASTRO_DECISION", payload: { id, decision } });
  }
  function logAstroCommunication(id: string, channel: import("@/lib/types/astroV2").AstroCommunicationChannel, notes?: string) {
    dispatch({ type: "LOG_ASTRO_COMMUNICATION", payload: { id, channel, notes } });
  }

  // ── Return ─────────────────────────────────────────────────
  return {
    // ── Phase 1 slices
    pracharakas:              state.pracharakas,
    patients:                 state.patients,
    wishList:                 state.wishList,
    astroEligibility:         state.astroEligibility,
    screeningRecords:         state.screeningRecords,
    treatmentPlans:           state.treatmentPlans,
    consultationRecords:      state.consultationRecords,
    reservationRecords:       state.reservationRecords,
    portalAccess:             state.portalAccess,
    travelPaymentRecords:     state.travelPaymentRecords,
    admissionRecords:         state.admissionRecords,
    documents:                state.documents,
    qualityChecklists:        state.qualityChecklists,
    feedbackRecords:          state.feedbackRecords,
    communicationLogs:        state.communicationLogs,
    operationalAlerts:        state.operationalAlerts,
    lastUpdated:              state.lastUpdated,

    // ── Phase 2 slices
    workflowRecords:          state.workflowRecords,
    actionLogs:               state.actionLogs,

    // ── Phase 3 slices
    pracharakaProfiles:            state.pracharakaProfiles,
    pracharakaTrainingRecords:     state.pracharakaTrainingRecords,

    // ── Phase 4 slices
    wishListV2Entries:             state.wishListV2Entries,

    // ── Phase 5 slices
    astroEligibilityV2Entries:     state.astroEligibilityV2Entries,

    // ── Phase 1 selectors
    patientById,
    pracharakaById,
    patientsByStage,
    alertsByPriority,

    // ── Phase 2 selectors
    workflowRecordByPatientId,
    actionLogsByPatientId,
    patientsByWorkflowStage,
    stageBottlenecks,

    // ── Phase 3 selectors
    pracharakaProfileById,
    pracharakaTrainingById,
    trainingCompletionCount,
    onboardingCompletionCount,
    patientsByPracharaka,

    // ── Phase 4 selectors
    wishListV2ById,

    // ── Phase 5 selectors
    astroEligibilityV2ByPatientId: (patientId: string) => state.astroEligibilityV2Entries.find((a) => a.patientId === patientId),
    pendingAstroEvaluations: () => state.astroEligibilityV2Entries.filter((a) => a.status !== "evaluation_completed"),

    // ── Phase 1 dispatchers
    setPracharakas:          (v: AppState["pracharakas"])           => set("SET_PRACHARAKAS",          v),
    setPatients:             (v: AppState["patients"])              => set("SET_PATIENTS",             v),
    setWishList:             (v: AppState["wishList"])              => set("SET_WISH_LIST",            v),
    setAstroEligibility:     (v: AppState["astroEligibility"])      => set("SET_ASTRO_ELIGIBILITY",    v),
    setScreeningRecords:     (v: AppState["screeningRecords"])      => set("SET_SCREENING_RECORDS",    v),
    setTreatmentPlans:       (v: AppState["treatmentPlans"])        => set("SET_TREATMENT_PLANS",      v),
    setConsultationRecords:  (v: AppState["consultationRecords"])   => set("SET_CONSULTATION_RECORDS", v),
    setReservationRecords:   (v: AppState["reservationRecords"])    => set("SET_RESERVATION_RECORDS",  v),
    setPortalAccess:         (v: AppState["portalAccess"])          => set("SET_PORTAL_ACCESS",        v),
    setTravelPaymentRecords: (v: AppState["travelPaymentRecords"])  => set("SET_TRAVEL_PAYMENT_RECORDS", v),
    setAdmissionRecords:     (v: AppState["admissionRecords"])      => set("SET_ADMISSION_RECORDS",    v),
    setDocuments:            (v: AppState["documents"])             => set("SET_DOCUMENTS",            v),
    setQualityChecklists:    (v: AppState["qualityChecklists"])     => set("SET_QUALITY_CHECKLISTS",   v),
    setFeedbackRecords:      (v: AppState["feedbackRecords"])       => set("SET_FEEDBACK_RECORDS",     v),
    setCommunicationLogs:    (v: AppState["communicationLogs"])     => set("SET_COMMUNICATION_LOGS",   v),
    setOperationalAlerts:    (v: AppState["operationalAlerts"])     => set("SET_OPERATIONAL_ALERTS",   v),

    // ── Phase 2 dispatchers
    setWorkflowRecords:     (v: AppState["workflowRecords"])  => set("SET_WORKFLOW_RECORDS", v),
    setActionLogs:          (v: AppState["actionLogs"])        => set("SET_ACTION_LOGS",      v),
    updateStageStatus,
    addActionLogEntry,

    // ── Phase 3 dispatchers
    addFullPracharaka,
    updatePracharakaProfile,
    toggleTrainingModule,
    toggleOnboardingMilestone,
    setAssessmentResult,
    setPracharakaProfiles:            (v: AppState["pracharakaProfiles"])        => set("SET_PRACHARAKA_PROFILES",          v),
    setPracharakaTrainingRecords:     (v: AppState["pracharakaTrainingRecords"]) => set("SET_PRACHARAKA_TRAINING_RECORDS",  v),

    // ── Phase 4 dispatchers
    saveWishListDraft,
    submitWishList,
    verifyWishList,
    forwardWishList,
    setWishListV2Entries: (v: AppState["wishListV2Entries"]) => set("SET_WISHLIST_V2_ENTRIES", v),

    // ── Phase 5 dispatchers
    updateAstroEvaluation,
    submitAstroDecision,
    logAstroCommunication,
    setAstroEligibilityV2Entries: (v: AppState["astroEligibilityV2Entries"]) => set("SET_ASTRO_ELIGIBILITY_V2", v),

    // ── Phase 6 slices
    screeningV2Records: state.screeningV2Records,

    // ── Phase 6 selectors
    screeningV2ByPatientId: (patientId: string) => state.screeningV2Records.find((s) => s.patientId === patientId),
    screeningV2ById:        (id: string)        => state.screeningV2Records.find((s) => s.id === id),

    // ── Phase 6 dispatchers
    initiateScreening:          (patientId: string, astroRecordId: string) =>
      dispatch({ type: "INITIATE_SCREENING", payload: { patientId, astroRecordId } }),
    updateScreeningV2:          (id: string, updates: Partial<import("@/lib/types/screeningV2").ScreeningV2Record>) =>
      dispatch({ type: "UPDATE_SCREENING_V2", payload: { id, updates } }),
    addScreeningDocument:       (id: string, doc: import("@/lib/types/screeningV2").ScreeningDocumentEntry) =>
      dispatch({ type: "ADD_SCREENING_DOCUMENT", payload: { id, doc } }),
    submitScreeningDecision:    (id: string, decision: import("@/lib/types/screeningV2").ScreeningDecision, notes?: string) =>
      dispatch({ type: "SUBMIT_SCREENING_DECISION", payload: { id, decision, notes } }),
    setScreeningV2Records:      (v: AppState["screeningV2Records"]) => set("SET_SCREENING_V2_RECORDS", v),

    // ── Phase 7 slices
    treatmentPlanV2Records:     state.treatmentPlanV2Records,
    pkConsultationV2Records:    state.pkConsultationV2Records,

    // ── Phase 7 selectors
    treatmentPlanV2ByPatientId:     (patientId: string) => state.treatmentPlanV2Records.find((t) => t.patientId === patientId),
    pkConsultationV2ByPatientId:    (patientId: string) => state.pkConsultationV2Records.find((c) => c.patientId === patientId),

    // ── Phase 7 dispatchers
    initiateTreatmentPlan:      (patientId: string, screeningRecordId: string) =>
      dispatch({ type: "INITIATE_TREATMENT_PLAN", payload: { patientId, screeningRecordId } }),
    updateTreatmentPlanV2:      (id: string, updates: Partial<import("@/lib/types/treatmentV2").TreatmentPlanV2>) =>
      dispatch({ type: "UPDATE_TREATMENT_PLAN_V2", payload: { id, updates } }),
    approveTreatmentPlan:       (id: string) =>
      dispatch({ type: "APPROVE_TREATMENT_PLAN", payload: { id } }),
    initiatePKConsultation:     (patientId: string, treatmentPlanId: string) =>
      dispatch({ type: "INITIATE_PK_CONSULTATION", payload: { patientId, treatmentPlanId } }),
    updatePKConsultationV2:     (id: string, updates: Partial<import("@/lib/types/treatmentV2").PKConsultationV2>) =>
      dispatch({ type: "UPDATE_PK_CONSULTATION_V2", payload: { id, updates } }),
    completePKConsultation:     (id: string, notes?: string) =>
      dispatch({ type: "COMPLETE_PK_CONSULTATION", payload: { id, notes } }),
    setTreatmentPlanV2Records:  (v: AppState["treatmentPlanV2Records"]) => set("SET_TREATMENT_PLAN_V2_RECORDS", v),
    setPKConsultationV2Records: (v: AppState["pkConsultationV2Records"]) => set("SET_PK_CONSULTATION_V2_RECORDS", v),

    // ── Phase 8 slices
    reservationV2Records:       state.reservationV2Records,
    portalOnboardingV2Records:  state.portalOnboardingV2Records,

    // ── Phase 8 selectors
    reservationV2ByPatientId:       (patientId: string) => state.reservationV2Records.find((r) => r.patientId === patientId),
    portalOnboardingV2ByPatientId:  (patientId: string) => state.portalOnboardingV2Records.find((p) => p.patientId === patientId),

    // ── Phase 8 dispatchers
    initiateReservation:        (patientId: string, pkConsultationId: string, isInternational: boolean) =>
      dispatch({ type: "INITIATE_RESERVATION", payload: { patientId, pkConsultationId, isInternational } }),
    updateReservationV2:        (id: string, updates: Partial<import("@/lib/types/reservationV2").ReservationV2Record>) =>
      dispatch({ type: "UPDATE_RESERVATION_V2", payload: { id, updates } }),
    confirmReservationPayment:  (id: string, paymentMode: import("@/lib/types/reservationV2").PaymentMode, reference?: string) =>
      dispatch({ type: "CONFIRM_RESERVATION_PAYMENT", payload: { id, paymentMode, reference } }),
    dispatchEkitItem:           (id: string, itemId: string) =>
      dispatch({ type: "DISPATCH_EKIT_ITEM", payload: { id, itemId } }),
    initiatePortalOnboarding:   (patientId: string, reservationId: string) =>
      dispatch({ type: "INITIATE_PORTAL_ONBOARDING", payload: { patientId, reservationId } }),
    updatePortalOnboardingV2:   (id: string, updates: Partial<import("@/lib/types/reservationV2").PortalOnboardingV2Record>) =>
      dispatch({ type: "UPDATE_PORTAL_ONBOARDING_V2", payload: { id, updates } }),
    completePortalOnboarding:   (id: string) =>
      dispatch({ type: "COMPLETE_PORTAL_ONBOARDING", payload: { id } }),
    setReservationV2Records:    (v: AppState["reservationV2Records"]) => set("SET_RESERVATION_V2_RECORDS", v),
    setPortalOnboardingV2:      (v: AppState["portalOnboardingV2Records"]) => set("SET_PORTAL_ONBOARDING_V2", v),

    // ── Phase 10: QC + Feedback
    qcByPatientId:              (patientId: string) => state.qualityChecklists.find((q) => q.patientId === patientId),
    initiateQCRecord:           (patientId: string) =>
      dispatch({ type: "INITIATE_QC_RECORD", payload: { patientId } }),
    toggleQCItem:               (patientId: string, stageId: string, itemId: string) =>
      dispatch({ type: "TOGGLE_QC_ITEM", payload: { patientId, stageId, itemId } }),
    updateQCRecord:             (patientId: string, updates: Partial<import("@/lib/types/index").QualityChecklist>) =>
      dispatch({ type: "UPDATE_QC_RECORD", payload: { patientId, updates } }),
    submitFeedback:             (payload: Omit<import("@/lib/types/index").FeedbackRecord, "id" | "submittedAt">) =>
      dispatch({ type: "SUBMIT_FEEDBACK", payload }),
    feedbackByPatientId:        (patientId: string) => state.feedbackRecords.find((f) => f.patientId === patientId),
    addAuditNote:               (patientId: string, note: string, author?: string) =>
      dispatch({ type: "ADD_AUDIT_NOTE", payload: { patientId, note, author } }),

    // ── Phase 9 slices
    travelPrepRecords:          state.travelPrepRecords,
    paymentRecords:             state.paymentRecords,
    arrivalAdmissionRecords:    state.arrivalAdmissionRecords,
    patientDocuments:           state.patientDocuments,

    // ── Phase 9 selectors
    travelPrepByPatientId:          (pid: string) => state.travelPrepRecords.find((t) => t.patientId === pid),
    paymentRecordByPatientId:       (pid: string) => state.paymentRecords.find((p) => p.patientId === pid),
    arrivalAdmissionByPatientId:    (pid: string) => state.arrivalAdmissionRecords.find((a) => a.patientId === pid),
    patientDocumentsByPatientId:    (pid: string) => state.patientDocuments.find((d) => d.patientId === pid),

    // ── Phase 9 dispatchers
    initiateTravelPrep:         (patientId: string, portalOnboardingId: string, isInternational: boolean) =>
      dispatch({ type: "INITIATE_TRAVEL_PREP", payload: { patientId, portalOnboardingId, isInternational } }),
    updateTravelPrep:           (id: string, updates: Partial<import("@/lib/types/travelAdmissionV2").TravelPreparationRecord>) =>
      dispatch({ type: "UPDATE_TRAVEL_PREP", payload: { id, updates } }),
    toggleTravelTask:           (id: string, taskId: string) =>
      dispatch({ type: "TOGGLE_TRAVEL_TASK", payload: { id, taskId } }),
    completeTravelPrep:         (id: string) =>
      dispatch({ type: "COMPLETE_TRAVEL_PREP", payload: { id } }),
    initiatePaymentRecord:      (patientId: string, travelPrepId: string) =>
      dispatch({ type: "INITIATE_PAYMENT_RECORD", payload: { patientId, travelPrepId } }),
    updatePaymentRecord:        (id: string, updates: Partial<import("@/lib/types/travelAdmissionV2").PaymentRecord>) =>
      dispatch({ type: "UPDATE_PAYMENT_RECORD", payload: { id, updates } }),
    confirmAdvancePayment:      (id: string, mode: import("@/lib/types/travelAdmissionV2").PaymentMode, reference?: string, amount?: number) =>
      dispatch({ type: "CONFIRM_ADVANCE_PAYMENT", payload: { id, mode, reference, amount } }),
    confirmFinalPayment:        (id: string, mode: import("@/lib/types/travelAdmissionV2").PaymentMode, reference?: string, amount?: number) =>
      dispatch({ type: "CONFIRM_FINAL_PAYMENT", payload: { id, mode, reference, amount } }),
    initiateArrivalAdmission:   (patientId: string, paymentRecordId: string) =>
      dispatch({ type: "INITIATE_ARRIVAL_ADMISSION", payload: { patientId, paymentRecordId } }),
    updateArrivalAdmission:     (id: string, updates: Partial<import("@/lib/types/travelAdmissionV2").ArrivalAdmissionRecord>) =>
      dispatch({ type: "UPDATE_ARRIVAL_ADMISSION", payload: { id, updates } }),
    toggleAdmissionItem:        (id: string, itemId: string) =>
      dispatch({ type: "TOGGLE_ADMISSION_ITEM", payload: { id, itemId } }),
    admitPatient:               (id: string) =>
      dispatch({ type: "ADMIT_PATIENT", payload: { id } }),
    initiatePatientDocuments:   (patientId: string, isInternational: boolean) =>
      dispatch({ type: "INITIATE_PATIENT_DOCUMENTS", payload: { patientId, isInternational } }),
    updateDocumentStatus:       (id: string, docId: string, update: Partial<import("@/lib/types/travelAdmissionV2").RequiredDocumentRecord>) =>
      dispatch({ type: "UPDATE_DOCUMENT_STATUS", payload: { id, docId, update } }),

    // ── Lifecycle
    dispatch,
    resetToSeed,
  };
}
