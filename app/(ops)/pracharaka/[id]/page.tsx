import type { Metadata } from "next";
import { PracharakaProfilePage } from "./PracharakaProfilePage";

export const metadata: Metadata = {
  title: "Pracharaka Profile | Ayusurance Ops",
};

export default function Page() {
  return <PracharakaProfilePage />;
}
