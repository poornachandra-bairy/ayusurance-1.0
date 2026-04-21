import type { Metadata } from "next";
import { WishListDetailPage } from "./WishListDetailPage";

export const metadata: Metadata = {
  title: "Wish List Detail | Ayusurance Ops",
};

export default function Page() {
  return <WishListDetailPage />;
}
