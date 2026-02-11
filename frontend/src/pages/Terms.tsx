import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Terms of Service</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: January 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Radah Works ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Radah Works is a platform that helps founders and businesses build AI-powered teams by connecting 
              them with vetted professionals. We provide team configuration tools, professional matching services, 
              and team management features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Professional Applications</h2>
            <p className="text-muted-foreground">
              Professionals applying to join our network agree to provide truthful information about their 
              qualifications, experience, and availability. We reserve the right to reject or remove any 
              professional from our platform at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payments and Refunds</h2>
            <p className="text-muted-foreground mb-4">
              Team purchases are processed securely through Stripe. By making a purchase, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Pay all applicable fees for your selected team configuration</li>
              <li>Provide accurate payment information</li>
              <li>Authorize us to charge your payment method</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Refund requests are evaluated on a case-by-case basis. Contact us within 7 days of purchase 
              if you are unsatisfied with our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are owned by Radah Works and 
              are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Radah Works shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" and "as available" without warranties of any kind. We do not 
              guarantee that the Service will be uninterrupted, secure, or error-free. Professional matching 
              is based on AI recommendations and is not guaranteed to meet all your specific requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or through the Service. Continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@radahworks.com" className="text-primary hover:underline">
                legal@radahworks.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Terms;
