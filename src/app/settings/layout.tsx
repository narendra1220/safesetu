import { AppShell } from "@/components/app-shell";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell maxWidth="max-w-2xl">{children}</AppShell>;
}
