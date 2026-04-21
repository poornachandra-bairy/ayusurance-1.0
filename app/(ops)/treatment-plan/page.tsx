import type { Metadata } from "next";
import { TreatmentPlanQueuePage } from "./TreatmentPlanQueuePage";

export const metadata: Metadata = { title: "Treatment Planning | Ayusurance Ops" };
export default function Page() { return <TreatmentPlanQueuePage />; }
