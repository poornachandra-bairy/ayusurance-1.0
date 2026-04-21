/**
 * localStorage-based persistence adapter.
 *
 * All functions are safe to call in SSR (server) contexts — they check for
 * `window` before accessing localStorage. All reads return `null` on the
 * server or when the key is absent.
 */

import type { AppState } from "@/lib/types";
import { ALL_STORAGE_KEYS, STORAGE_KEYS, type StorageKey } from "./keys";

// ── Primitives ────────────────────────────────────────────────

const isBrowser = typeof window !== "undefined";

/**
 * Load a stored value by key. Returns `null` if absent or not in browser.
 */
export function loadState<T = unknown>(key: StorageKey): T | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[pk-storage] Failed to read key "${key}"`, );
    return null;
  }
}

/**
 * Persist a value under the given key.
 */
export function saveState<T>(key: StorageKey, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[pk-storage] Failed to write key "${key}"`, err);
  }
}

/**
 * Remove a stored key.
 */
export function clearState(key: StorageKey): void {
  if (!isBrowser) return;
  localStorage.removeItem(key);
}

/**
 * Remove ALL application storage keys, leaving other app keys untouched.
 */
export function clearAllState(): void {
  if (!isBrowser) return;
  ALL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
}

// ── Bulk operations ───────────────────────────────────────────

/**
 * Export all stored app state as a single JSON string.
 * Returns a map of storageKey → parsed value.
 */
export function exportStateAsJson(): string {
  if (!isBrowser) return "{}";
  const snapshot: Record<string, unknown> = {};
  ALL_STORAGE_KEYS.forEach((k) => {
    const raw = localStorage.getItem(k);
    if (raw !== null) {
      try {
        snapshot[k] = JSON.parse(raw);
      } catch {
        snapshot[k] = raw;
      }
    }
  });
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Import a previously exported JSON snapshot back into localStorage.
 * Only keys that match known STORAGE_KEYS are written.
 */
export function importStateFromJson(jsonString: string): { success: boolean; error?: string } {
  if (!isBrowser) return { success: false, error: "Not in browser context" };
  try {
    const data = JSON.parse(jsonString) as Record<string, unknown>;
    const knownKeys = new Set<string>(ALL_STORAGE_KEYS);
    let imported = 0;
    for (const [k, v] of Object.entries(data)) {
      if (knownKeys.has(k)) {
        localStorage.setItem(k, JSON.stringify(v));
        imported++;
      }
    }
    return { success: true, error: imported === 0 ? "No recognised keys found in JSON" : undefined };
  } catch (err) {
    return { success: false, error: `Invalid JSON: ${String(err)}` };
  }
}

/**
 * Reset all runtime data back to seed defaults.
 * Accepts the seed data object (loaded from JSON files at build time).
 */
export function resetToSeedData(seedData: Partial<AppState>): void {
  if (!isBrowser) return;
  clearAllState();
  if (seedData.pracharakas)    saveState(STORAGE_KEYS.PRACHARAKAS,          seedData.pracharakas);
  if (seedData.patients)       saveState(STORAGE_KEYS.PATIENTS,             seedData.patients);
  if (seedData.wishList)       saveState(STORAGE_KEYS.WISH_LIST,            seedData.wishList);
  if (seedData.astroEligibility) saveState(STORAGE_KEYS.ASTRO_ELIGIBILITY,  seedData.astroEligibility);
  if (seedData.screeningRecords) saveState(STORAGE_KEYS.SCREENING_RECORDS,  seedData.screeningRecords);
  if (seedData.treatmentPlans) saveState(STORAGE_KEYS.TREATMENT_PLANS,      seedData.treatmentPlans);
  if (seedData.consultationRecords) saveState(STORAGE_KEYS.CONSULTATION_RECORDS, seedData.consultationRecords);
  if (seedData.reservationRecords)  saveState(STORAGE_KEYS.RESERVATION_RECORDS,  seedData.reservationRecords);
  if (seedData.portalAccess)   saveState(STORAGE_KEYS.PORTAL_ACCESS,        seedData.portalAccess);
  if (seedData.travelPaymentRecords) saveState(STORAGE_KEYS.TRAVEL_PAYMENT_RECORDS, seedData.travelPaymentRecords);
  if (seedData.admissionRecords)    saveState(STORAGE_KEYS.ADMISSION_RECORDS,      seedData.admissionRecords);
  if (seedData.documents)      saveState(STORAGE_KEYS.DOCUMENTS,            seedData.documents);
  if (seedData.qualityChecklists)   saveState(STORAGE_KEYS.QUALITY_CHECKLISTS,     seedData.qualityChecklists);
  if (seedData.feedbackRecords)     saveState(STORAGE_KEYS.FEEDBACK_RECORDS,       seedData.feedbackRecords);
  if (seedData.communicationLogs)   saveState(STORAGE_KEYS.COMMUNICATION_LOGS,     seedData.communicationLogs);
  if (seedData.operationalAlerts)   saveState(STORAGE_KEYS.OPERATIONAL_ALERTS,     seedData.operationalAlerts);

  if (seedData.wishListV2Entries) saveState(STORAGE_KEYS.WISHLIST_V2_ENTRIES, seedData.wishListV2Entries);
  if (seedData.astroEligibilityV2Entries) saveState(STORAGE_KEYS.ASTRO_ELIGIBILITY_V2, seedData.astroEligibilityV2Entries);
  if (seedData.screeningV2Records) saveState(STORAGE_KEYS.SCREENING_V2_RECORDS, seedData.screeningV2Records);
  if (seedData.treatmentPlanV2Records) saveState(STORAGE_KEYS.TREATMENT_PLAN_V2, seedData.treatmentPlanV2Records);
  if (seedData.pkConsultationV2Records) saveState(STORAGE_KEYS.PK_CONSULTATION_V2, seedData.pkConsultationV2Records);
  if (seedData.reservationV2Records) saveState(STORAGE_KEYS.RESERVATION_V2_RECORDS, seedData.reservationV2Records);
  if (seedData.portalOnboardingV2Records) saveState(STORAGE_KEYS.PORTAL_ONBOARDING_V2, seedData.portalOnboardingV2Records);
  if (seedData.travelPrepRecords) saveState(STORAGE_KEYS.TRAVEL_PREP_RECORDS, seedData.travelPrepRecords);
  if (seedData.paymentRecords) saveState(STORAGE_KEYS.PAYMENT_RECORDS, seedData.paymentRecords);
  if (seedData.arrivalAdmissionRecords) saveState(STORAGE_KEYS.ARRIVAL_ADMISSION_RECORDS, seedData.arrivalAdmissionRecords);

  saveState(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
}

/**
 * Inspect current storage: returns a summary of all keys with byte sizes.
 */
export function inspectStorage(): { key: string; bytes: number; hasData: boolean }[] {
  if (!isBrowser) return [];
  return ALL_STORAGE_KEYS.map((k) => {
    const raw = localStorage.getItem(k);
    return {
      key: k,
      bytes: raw ? new Blob([raw]).size : 0,
      hasData: raw !== null,
    };
  });
}
