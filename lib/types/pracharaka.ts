// ============================================================
// Phase 3 — Pracharaka Program Types
// ============================================================

export type PracharakaEligibilityCategoryId =
  | "yoga_teacher"
  | "ayurveda_beneficiary"
  | "wellness_coach"
  | "health_influencer"
  | "ayurveda_enthusiast"
  | "panchakarma_alumni"
  | "ayurveda_practitioner_non_clinical"
  | "ayurveda_practitioner_clinical";

export const PRACHARAKA_ELIGIBILITY_CATEGORY_LABELS: Record<PracharakaEligibilityCategoryId, string> = {
  yoga_teacher:                     "Yoga Teacher",
  ayurveda_beneficiary:             "Ayurveda Beneficiary",
  wellness_coach:                   "Wellness Coach",
  health_influencer:                "Health Influencer",
  ayurveda_enthusiast:              "Ayurveda Enthusiast",
  panchakarma_alumni:               "Panchakarma Alumni",
  ayurveda_practitioner_non_clinical: "Ayurveda Practitioner (Non-Clinical)",
  ayurveda_practitioner_clinical:   "Ayurveda Practitioner (Clinical)",
};

// ── Certification statuses ────────────────────────────────────

export type PracharakaCertificationStatus =
  | "not_enrolled"
  | "enrolled"
  | "in_training"
  | "assessment_pending"
  | "certified"
  | "lapsed";

export type AyusuranceRegistrationStatus = "not_registered" | "registered";

// ── Per-Pracharaka profile (Phase 3 extension) ────────────────
// Stored separately from the Phase 1 Pracharaka base record to
// avoid breaking existing types and state.

export interface PracharakaProfile {
  id: string;                                   // PPR-XXX
  pracharakaId: string;                         // PR-XXX (FK to Pracharaka)
  eligibilityCategory: PracharakaEligibilityCategoryId;
  certificationStatus: PracharakaCertificationStatus;
  certificationNumber?: string;
  certificationDate?: string;                   // ISO date
  certificationExpiryDate?: string;             // ISO date
  ayusuranceRegistrationStatus: AyusuranceRegistrationStatus;
  ayusuranceRegisteredAt?: string;              // ISO date
  communicationGroupAdded: boolean;
  communicationGroupAddedAt?: string;           // ISO date
  referralFormatsProvided: boolean;
  referralFormatsProvidedAt?: string;           // ISO date
  responsibilitiesAcknowledged: boolean;
  responsibilitiesAcknowledgedAt?: string;      // ISO date
  onboardingMilestones: Record<string, boolean>; // milestoneId → completed
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Per-Pracharaka training progress ─────────────────────────

export interface PracharakaTrainingRecord {
  id: string;                                       // PTR-XXX
  pracharakaId: string;
  moduleCompletions: Record<string, boolean>;        // moduleId → completed
  moduleCompletionDates: Record<string, string>;     // moduleId → ISO datetime
  assessmentPassed?: boolean;
  assessmentDate?: string;
  assessmentNotes?: string;
  updatedAt: string;
}

// ── All module IDs in order ────────────────────────────────────
// Keep in sync with pracharaka-training-modules.json

export const ALL_TRAINING_MODULE_IDS = [
  "live_sessions",
  "recorded_modules",
  "patient_orientation_training",
  "eligibility_awareness",
  "communication_training",
  "referral_ethics",
  "text_manuals",
  "orientation_videos",
  "referral_checklists",
  "patient_comm_formats",
  "referral_templates",
  "shiva_ayurveda_course",
] as const;

export type TrainingModuleId = typeof ALL_TRAINING_MODULE_IDS[number];

// ── All milestone IDs in order ────────────────────────────────
// Keep in sync with pracharaka-onboarding-milestones.json

export const ALL_MILESTONE_IDS = [
  "application_received",
  "eligibility_verified",
  "certification_fee_paid",
  "training_commenced",
  "live_sessions_attended",
  "recorded_modules_completed",
  "assessment_passed",
  "certification_issued",
  "pracharaka_id_assigned",
  "ayusurance_registered",
  "referral_formats_provided",
  "communication_group_added",
] as const;

export type OnboardingMilestoneId = typeof ALL_MILESTONE_IDS[number];
