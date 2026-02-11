import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import HowItWorks from "@/components/landing/HowItWorks";
import ValueProposition from "@/components/landing/ValueProposition";
import FreeAssessment from "@/components/landing/FreeAssessment";
import Testimonials from "@/components/landing/Testimonials";
import ComparisonTable from "@/components/landing/ComparisonTable";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import UrgencySection from "@/components/landing/UrgencySection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <ValueProposition />
        <FreeAssessment />
        <Testimonials />
        <ComparisonTable />
        <Pricing />
        <FAQ />
        <UrgencySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
