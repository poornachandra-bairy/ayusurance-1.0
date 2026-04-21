import { redirect } from "next/navigation";
// Arrival & Admission is managed inside the Travel & Payment detail workspace (Admission tab).
export default function Page() { redirect("/travel-payment"); }
