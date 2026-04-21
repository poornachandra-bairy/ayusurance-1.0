import type { Metadata } from "next";
import { ScreeningDetailPage } from "./ScreeningDetailPage";

export const metadata: Metadata = {
  title: "Screening Detail | Ayusurance Ops",
};

export default function Page() {
  return <ScreeningDetailPage />;
}
