import type { Metadata } from "next";
import { ReservationQueuePage } from "./ReservationQueuePage";

export const metadata: Metadata = { title: "Reservation & Orientation | Ayusurance Ops" };
export default function Page() { return <ReservationQueuePage />; }
