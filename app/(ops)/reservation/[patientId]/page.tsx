import type { Metadata } from "next";
import { ReservationDetailPage } from "./ReservationDetailPage";

export const metadata: Metadata = { title: "Reservation Detail | Ayusurance Ops" };
export default function Page() { return <ReservationDetailPage />; }
