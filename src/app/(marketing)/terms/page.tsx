import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="21 November 2026"
      intro={`These terms govern your use of ${SITE.name}. By creating an account or publishing an invitation you agree to them.`}
      sections={[
        {
          title: "The service",
          body: [
            `${SITE.name} lets you create, publish and share animated wedding invitation websites from our designs. All designs are free while the service is in beta. If paid designs are introduced later, invitations you have already published will keep working.`,
          ],
        },
        {
          title: "Your account",
          body: [
            "You must be at least 18 years old. Keep access to your email or Google account secure — it is how you sign in.",
            "You are responsible for activity on your account.",
          ],
        },
        {
          title: "Your content",
          body: [
            "You keep ownership of everything you upload. You give us a licence to store, process and display it only to provide the service.",
            "Only upload photos, videos and music you have the right to use, and only add guests' details with their reasonable expectation.",
            "Do not use the service for anything unlawful, hateful, misleading or unrelated to celebrating an event. We may disable invitations that break these rules.",
          ],
        },
        {
          title: "Our designs",
          body: [
            "Designs, illustrations, animations and code remain ours. You may use them for your invitations on this service but not copy or resell them.",
          ],
        },
        {
          title: "Availability",
          body: [
            'We work hard to keep invitations fast and available, but the service is provided "as is" without guarantees of uninterrupted availability. Please keep a copy of any important details.',
          ],
        },
        {
          title: "Liability",
          body: [
            "To the extent permitted by law, we are not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the 12 months before the claim (currently nil during beta).",
          ],
        },
        {
          title: "Changes and contact",
          body: [
            "We may update these terms; we will notify you of material changes by email. These terms are governed by the laws of India.",
            `Questions? Write to ${SITE.email}.`,
          ],
        },
      ]}
    />
  );
}
