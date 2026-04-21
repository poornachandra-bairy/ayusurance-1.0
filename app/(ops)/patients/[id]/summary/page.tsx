import type { Metadata } from "next";
import { PatientSummaryPage } from "./PatientSummaryPage";
export const metadata: Metadata = { title: "Patient Summary | Ayusurance Ops" };
export default function Page() { return <PatientSummaryPage />; }
