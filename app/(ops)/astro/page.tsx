import type { Metadata } from "next";
import { AstroQueuePage } from "./AstroQueuePage";

export const metadata: Metadata = {
  title: "Astrochart Eligibility Queue | Ayusurance Ops",
};

export default function Page() {
  return <AstroQueuePage />;
}
