import type { Metadata } from "next";
import { PatientPortalPage } from "./PatientPortalPage";

export const metadata: Metadata = { title: "Patient Portal Onboarding | Ayusurance Ops" };
export default function Page() { return <PatientPortalPage />; }
