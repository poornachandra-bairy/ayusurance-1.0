import type { Metadata } from "next";
import { ScreeningQueuePage } from "./ScreeningQueuePage";

export const metadata: Metadata = {
  title: "Medical Screening | Ayusurance Ops",
};

export default function Page() {
  return <ScreeningQueuePage />;
}
