import type { Metadata } from "next";
import { PatientDetailPage } from "./PatientDetailPage";

export const metadata: Metadata = { title: "Patient Workflow" };
export default function Page() { return <PatientDetailPage />; }
