import type { Metadata } from "next";
import { DocumentsPage } from "./DocumentsPage";

export const metadata: Metadata = { title: "Documents" };
export default function Page() { return <DocumentsPage />; }
