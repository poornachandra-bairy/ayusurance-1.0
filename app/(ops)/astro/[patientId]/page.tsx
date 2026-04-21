import type { Metadata } from "next";
import { AstroEvaluationPage } from "./AstroEvaluationPage";

export const metadata: Metadata = {
  title: "Astrochart Evaluation | Ayusurance Ops",
};

export default function Page() {
  return <AstroEvaluationPage />;
}
