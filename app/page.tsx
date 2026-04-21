import { redirect } from "next/navigation";

/**
 * Root route — redirect to the operations dashboard.
 */
export default function RootPage() {
  redirect("/dashboard");
}
