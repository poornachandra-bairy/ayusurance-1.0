// Storage domain keys — one key per domain slice
// These are the localStorage keys used by the persistence adapter.

export const STORAGE_KEYS = {
  PRACHARAKAS: "pk_ops__pracharakas",
  PATIENTS: "pk_ops__patients",
  WISH_LIST: "pk_ops__wish_list",
  ASTRO_ELIGIBILITY: "pk_ops__astro_eligibility",
  SCREENING_RECORDS: "pk_ops__screening_records",
  TREATMENT_PLANS: "pk_ops__treatment_plans",
  CONSULTATION_RECORDS: "pk_ops__consultation_records",
  RESERVATION_RECORDS: "pk_ops__reservation_records",
  PORTAL_ACCESS: "pk_ops__portal_access",
  TRAVEL_PAYMENT_RECORDS: "pk_ops__travel_payment_records",
  ADMISSION_RECORDS: "pk_ops__admission_records",
  DOCUMENTS: "pk_ops__documents",
  QUALITY_CHECKLISTS: "pk_ops__quality_checklists",
  FEEDBACK_RECORDS: "pk_ops__feedback_records",
  COMMUNICATION_LOGS: "pk_ops__communication_logs",
  OPERATIONAL_ALERTS: "pk_ops__operational_alerts",
  // ── Phase 2 additions ─────────────────────────────────────
  WORKFLOW_RECORDS: "pk_ops__workflow_records",
  ACTION_LOGS:      "pk_ops__action_logs",
  // ── Phase 3 additions ─────────────────────────────────────
  PRACHARAKA_PROFILES:        "pk_ops__pracharaka_profiles",
  PRACHARAKA_TRAINING_RECORDS:"pk_ops__pracharaka_training_records",
  // ── Phase 4 additions ─────────────────────────────────────
  WISHLIST_V2_ENTRIES:        "pk_ops__wishlist_v2_entries",
  // ── Phase 5 additions ─────────────────────────────────────
  ASTRO_ELIGIBILITY_V2:       "pk_ops__astro_eligibility_v2",
  // ── Phase 6 additions ─────────────────────────────────────
  SCREENING_V2_RECORDS:       "pk_ops__screening_v2_records",
  // ── Phase 7 additions ─────────────────────────────────────
  TREATMENT_PLAN_V2:          "pk_ops__treatment_plan_v2",
  PK_CONSULTATION_V2:         "pk_ops__pk_consultation_v2",
  // ── Phase 8 additions ─────────────────────────────────────
  RESERVATION_V2_RECORDS:     "pk_ops__reservation_v2_records",
  PORTAL_ONBOARDING_V2:       "pk_ops__portal_onboarding_v2",
  // ── Phase 9 additions ─────────────────────────────────────
  TRAVEL_PREP_RECORDS:        "pk_ops__travel_prep_records",
  PAYMENT_RECORDS:            "pk_ops__payment_records",
  ARRIVAL_ADMISSION_RECORDS:  "pk_ops__arrival_admission_records",
  PATIENT_DOCUMENTS:          "pk_ops__patient_documents",
  LAST_UPDATED: "pk_ops__last_updated",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** All domain keys as an array, useful for bulk operations. */
export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);
