import DashboardClient from "./DashboardClient";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Dashboard — HealthMap Ghana",
  description: "Interactive Ghana healthcare-access dashboard.",
};

export default function DashboardPage() {
  return (
    <>
      <Navbar/>
      <DashboardClient/>
    </>
  );
}
