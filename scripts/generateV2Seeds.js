const fs = require('fs');

const ts = new Date().toISOString();
function dAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const v2 = {
  wishListV2Entries: [
    {
      id: "WLV2-001",
      pracharakaId: "PR-001",
      patientId: "PAT-001",
      data: { fullName: "Arvind Menon", dateOfBirth: "1973-01-01", gender: "Male", whatsappNumber: "+91-98400-55555", email: "arvind.menon@example.com", placeOfResidence: "Bangalore, Karnataka, India", healthConcerns: "Chronic back pain" },
      status: "forwarded",
      createdAt: dAgo(40),
      updatedAt: dAgo(39),
      submittedAt: dAgo(40),
      verifiedAt: dAgo(39),
    },
    {
      id: "WLV2-002",
      pracharakaId: "PR-003",
      patientId: "PAT-002",
      data: { fullName: "Sunita Sharma", dateOfBirth: "1980-01-01", gender: "Female", whatsappNumber: "+91-99887-76655", email: "sunita.s@ayusurance.in", placeOfResidence: "Abu Dhabi, UAE", healthConcerns: "Weight management" },
      status: "submitted",
      createdAt: dAgo(5),
      updatedAt: dAgo(5),
      submittedAt: dAgo(5)
    },
    {
      id: "WLV2-003",
      pracharakaId: "PR-002",
      patientId: "PAT-003",
      data: { fullName: "Priya Balakrishnan", dateOfBirth: "1987-01-01", gender: "Female", whatsappNumber: "+91-99002-77777", email: "priya.b@example.com", placeOfResidence: "Chennai, Tamil Nadu, India", healthConcerns: "PCOS" },
      status: "forwarded",
      createdAt: dAgo(90),
      updatedAt: dAgo(89),
      submittedAt: dAgo(90),
      verifiedAt: dAgo(89)
    },
    {
      id: "WLV2-004",
      pracharakaId: "PR-001",
      patientId: "PAT-004",
      data: { fullName: "Arjun Verma", dateOfBirth: "1964-01-01", gender: "Male", whatsappNumber: "+91-94470-88888", email: "arjun.v@ayusurance.in", placeOfResidence: "Thrissur, Kerala, India", healthConcerns: "Arthritis" },
      status: "forwarded",
      createdAt: dAgo(150),
      updatedAt: dAgo(149),
      submittedAt: dAgo(150),
      verifiedAt: dAgo(149)
    }
  ],
  astroEligibilityV2Entries: [
    {
      id: "AEV2-001", patientId: "PAT-001", wishListId: "WLV2-001", status: "evaluation_completed",
      healthCycleAnalysis: "Good period for Virechana", suitabilityPeriodStart: dAgo(-10), suitabilityPeriodEnd: dAgo(-40),
      decision: "eligible", createdAt: dAgo(39), updatedAt: dAgo(38)
    },
    {
      id: "AEV2-003", patientId: "PAT-003", wishListId: "WLV2-003", status: "evaluation_completed",
      healthCycleAnalysis: "Optimal for Basti", suitabilityPeriodStart: dAgo(20), suitabilityPeriodEnd: dAgo(-10),
      decision: "eligible", createdAt: dAgo(89), updatedAt: dAgo(88)
    },
    {
      id: "AEV2-004", patientId: "PAT-004", wishListId: "WLV2-004", status: "evaluation_completed",
      healthCycleAnalysis: "Good for joint therapies", suitabilityPeriodStart: dAgo(100), suitabilityPeriodEnd: dAgo(70),
      decision: "eligible", createdAt: dAgo(149), updatedAt: dAgo(148)
    }
  ],
  screeningV2Records: [
    {
      id: "SCRV2-001", patientId: "PAT-001", astroRecordId: "AEV2-001", status: "consultation_scheduled",
      questionnaireSubmitted: true, documentsUploaded: true, consentSigned: true, disclaimerSigned: true,
      consultationFeePaid: true, consultationDate: dAgo(-2), screeningVaidyaId: "Dr. Rao",
      documents: [], createdAt: dAgo(38), updatedAt: dAgo(36)
    },
    {
      id: "SCRV2-003", patientId: "PAT-003", astroRecordId: "AEV2-003", status: "cleared",
      questionnaireSubmitted: true, documentsUploaded: true, consentSigned: true, disclaimerSigned: true,
      consultationFeePaid: true, consultationDate: dAgo(85), screeningVaidyaId: "Dr. Rao", decision: "cleared",
      documents: [], createdAt: dAgo(88), updatedAt: dAgo(85)
    },
    {
      id: "SCRV2-004", patientId: "PAT-004", astroRecordId: "AEV2-004", status: "cleared",
      questionnaireSubmitted: true, documentsUploaded: true, consentSigned: true, disclaimerSigned: true,
      consultationFeePaid: true, consultationDate: dAgo(145), screeningVaidyaId: "Dr. Nair", decision: "cleared",
      documents: [], createdAt: dAgo(148), updatedAt: dAgo(145)
    }
  ],
  treatmentPlanV2Records: [
    {
      id: "TPV2-003", patientId: "PAT-003", screeningRecordId: "SCRV2-003", status: "approved",
      treatingVaidyaId: "Dr. Nair",
      protocol: { prakriti: "Pitta", vikruti: "Vata", diagnosis: "PCOS", mainPanchakarma: "Basti", durationDays: 21 },
      medicineList: [], createdAt: dAgo(85), updatedAt: dAgo(84)
    },
    {
      id: "TPV2-004", patientId: "PAT-004", screeningRecordId: "SCRV2-004", status: "approved",
      treatingVaidyaId: "Dr. Nair",
      protocol: { prakriti: "Vata", vikruti: "Vata Kapha", diagnosis: "Sandhigata Vata", mainPanchakarma: "Janu Basti", durationDays: 21 },
      medicineList: [], createdAt: dAgo(145), updatedAt: dAgo(144)
    }
  ],
  pkConsultationV2Records: [
    {
      id: "PKCV2-003", patientId: "PAT-003", treatmentPlanId: "TPV2-003", status: "completed",
      treatingVaidyaId: "Dr. Nair", feePaid: true, recordingUrl: "https://example.com/rec3",
      createdAt: dAgo(84), updatedAt: dAgo(83)
    },
    {
      id: "PKCV2-004", patientId: "PAT-004", treatmentPlanId: "TPV2-004", status: "completed",
      treatingVaidyaId: "Dr. Nair", feePaid: true, recordingUrl: "https://example.com/rec4",
      createdAt: dAgo(144), updatedAt: dAgo(143)
    }
  ],
  reservationV2Records: [
    {
      id: "RESV2-003", patientId: "PAT-003", pkConsultationId: "PKCV2-003", status: "ekit_dispatched",
      isInternationalPatient: false, feePaid: true,
      dispatchedItems: { welcomeLetter: true, formC: false, instructions: true, codeOfConduct: true, bankDetails: true, dosDonts: true, visaGuidance: false, emergencyContacts: true, packingChecklist: true, stayGuidelines: true, travelInstructions: true },
      createdAt: dAgo(83), updatedAt: dAgo(82)
    },
    {
      id: "RESV2-004", patientId: "PAT-004", pkConsultationId: "PKCV2-004", status: "ekit_dispatched",
      isInternationalPatient: false, feePaid: true,
      dispatchedItems: { welcomeLetter: true, formC: false, instructions: true, codeOfConduct: true, bankDetails: true, dosDonts: true, visaGuidance: false, emergencyContacts: true, packingChecklist: true, stayGuidelines: true, travelInstructions: true },
      createdAt: dAgo(143), updatedAt: dAgo(142)
    }
  ],
  portalOnboardingV2Records: [
    {
      id: "POB-003", patientId: "PAT-003", reservationId: "RESV2-003", status: "completed",
      credentialsSent: true, whatsappGroupCreated: true, orientationVideoWatched: true, documentsUploaded: true,
      createdAt: dAgo(82), updatedAt: dAgo(80)
    },
    {
      id: "POB-004", patientId: "PAT-004", reservationId: "RESV2-004", status: "completed",
      credentialsSent: true, whatsappGroupCreated: true, orientationVideoWatched: true, documentsUploaded: true,
      createdAt: dAgo(142), updatedAt: dAgo(140)
    }
  ],
  travelPrepRecords: [
    {
      id: "TRV-003", patientId: "PAT-003", portalOnboardingId: "POB-003", isInternational: false, status: "completed",
      arrivalDate: dAgo(5), completionItems: { flight: true, medicalInsurance: true, travelInsurance: true, pickup: true, emergency: true, consent: true, formc: false, visa: false },
      createdAt: dAgo(80), updatedAt: dAgo(6)
    },
    {
      id: "TRV-004", patientId: "PAT-004", portalOnboardingId: "POB-004", isInternational: false, status: "completed",
      arrivalDate: dAgo(40), completionItems: { flight: true, medicalInsurance: true, travelInsurance: true, pickup: true, emergency: true, consent: true, formc: false, visa: false },
      createdAt: dAgo(140), updatedAt: dAgo(41)
    }
  ],
  paymentRecords: [
    {
      id: "PAY-003", patientId: "PAT-003", travelPrepId: "TRV-003", status: "final_paid",
      advancePaid: true, advanceAmountTBF: 500, finalPaid: true, finalAmountTBF: 2000, finalPaidAt: dAgo(5),
      createdAt: dAgo(80), updatedAt: dAgo(5)
    },
    {
      id: "PAY-004", patientId: "PAT-004", travelPrepId: "TRV-004", status: "final_paid",
      advancePaid: true, advanceAmountTBF: 500, finalPaid: true, finalAmountTBF: 2000, finalPaidAt: dAgo(40),
      createdAt: dAgo(140), updatedAt: dAgo(40)
    }
  ],
  arrivalAdmissionRecords: [
    {
      id: "ADM-003", patientId: "PAT-003", paymentRecordId: "PAY-003", isAdmitted: true, status: "patient_enters_pk",
      completionItems: { received: true, checkinDocs: true, consent: true, roomAllocated: true, scheduleConfirmed: true },
      createdAt: dAgo(5), updatedAt: dAgo(5)
    },
    {
      id: "ADM-004", patientId: "PAT-004", paymentRecordId: "PAY-004", isAdmitted: true, status: "patient_enters_pk",
      completionItems: { received: true, checkinDocs: true, consent: true, roomAllocated: true, scheduleConfirmed: true },
      createdAt: dAgo(40), updatedAt: dAgo(40)
    }
  ],
  qualityChecklists: [
    {
      id: "QC-004", patientId: "PAT-004", checklistItems: { "qc_stage_1::chk_1": true, "qc_stage_2::chk_2": true },
      createdAt: dAgo(20), updatedAt: dAgo(20)
    }
  ]
};

fs.writeFileSync('data/seed-records-v2.json', JSON.stringify(v2, null, 2));
console.log('Seed records V2 generated!');
