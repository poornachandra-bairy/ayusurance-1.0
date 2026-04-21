import type { Metadata } from "next";
import { WishListPage } from "./WishListPage";

export const metadata: Metadata = {
  title: "Patient Wish Lists | Ayusurance Ops",
};

export default function Page() {
  return <WishListPage />;
}
