import { AppShell } from "@/components/app-shell";

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell maxWidth="max-w-4xl">{children}</AppShell>;
}
