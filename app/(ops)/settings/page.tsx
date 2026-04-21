import type { Metadata } from "next";
import { SettingsPage } from "./SettingsPage";

export const metadata: Metadata = { title: "Settings & Data Manager" };
export default function Page() { return <SettingsPage />; }
