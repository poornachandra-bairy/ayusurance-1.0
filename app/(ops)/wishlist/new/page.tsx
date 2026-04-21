import type { Metadata } from "next";
import { WishListForm } from "./WishListForm";

export const metadata: Metadata = {
  title: "New Wish List | Ayusurance Ops",
};

export default function Page() {
  return <WishListForm />;
}
