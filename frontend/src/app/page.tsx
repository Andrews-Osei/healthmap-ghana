import Navbar          from "@/components/Navbar";
import Footer          from "@/components/Footer";
import Hero            from "@/components/Hero";
import StatsCards      from "@/components/StatsCards";
import FeatureGrid     from "@/components/FeatureGrid";
import HowItWorks      from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import WhyItMatters    from "@/components/WhyItMatters";
import CTA             from "@/components/CTA";

export default function HomePage() {
  return (
    <>
      <Navbar/>
      <main>
        <Hero/>
        <StatsCards/>
        <FeatureGrid/>
        <HowItWorks/>
        <DashboardPreview/>
        <WhyItMatters/>
        <CTA/>
      </main>
      <Footer/>
    </>
  );
}
