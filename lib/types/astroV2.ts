// ============================================================
// Phase 5 — Astrochart Eligibility V2 Types
// ============================================================

export type AstroStatus = "pending_preparation" | "analysis_in_progress" | "evaluation_completed";
export type AstroDecision = "pending" | "requires_review" | "eligible" | "not_immediately_eligible";
export type AstroCommunicationChannel = "patient_whatsapp" | "patient_email" | "pracharaka_notification" | "team_update";

export interface AstroCommunicationLog {
  id: string; // ACOM-XXX
  channel: AstroCommunicationChannel;
  sentAt: string; // ISO String
  notes?: string;
}

export interface AstroEligibilityV2 {
  id: string; // AEV2-XXX
  patientId: string;
  wishListId: string; // The origin Wish List V2 ID (WLV2-XXX)
  
  // Status & Timing
  status: AstroStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  evaluationCompletedAt?: string; // ISO

  // Evaluation Metrics
  healthCycleAnalysis?: string;
  suitabilityPeriodStart?: string; // YYYY-MM-DD
  suitabilityPeriodEnd?: string;   // YYYY-MM-DD
  
  // Decision
  decision: AstroDecision;
  
  // Conditional Deferred Fields (If decision === "not_immediately_eligible")
  advisoryNote?: string;
  preparatoryHealthPlan?: string;
  consultingVaidyaId?: string;
  reconsiderationDate?: string; // YYYY-MM-DD

  // Operational Communications
  communications: AstroCommunicationLog[];
}
