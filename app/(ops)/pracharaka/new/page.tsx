import type { Metadata } from "next";
import { PracharakaOnboardingForm } from "./PracharakaOnboardingForm";

export const metadata: Metadata = {
  title: "Register New Pracharaka | Ayusurance Ops",
};

export default function Page() {
  return <PracharakaOnboardingForm />;
}
