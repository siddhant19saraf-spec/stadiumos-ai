"use client";

import { Shell } from "@/components/layout/shell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Shell>{children}</Shell>;
}
