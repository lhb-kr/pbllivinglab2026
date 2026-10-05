import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = { title: "관리자 · 조치원 구름 설문", robots: { index: false } };

export default function AdminPage() {
  return <AdminDashboard />;
}
