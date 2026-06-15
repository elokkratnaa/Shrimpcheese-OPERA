import AppShell from "@/app/components/shared/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-canvas text-body"><AppShell>{children}</AppShell></div>;
}
