import type { Metadata } from "next";
import { PatientListPage } from "./PatientListPage";

export const metadata: Metadata = { title: "All Patients" };
export default function Page() { return <PatientListPage />; }
