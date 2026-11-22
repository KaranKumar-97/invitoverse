import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { contactPhrase, SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 November 2026"
      intro={`${SITE.name} helps couples create invitation websites. This policy explains what we collect, why, and the choices you have. We collect as little as we can.`}
      sections={[
        {
          title: "What we collect",
          body: [
            "Account: your name and email address, and your Google profile picture if you sign in with Google.",
            "Invitation content: the names, events, venues, photos, videos, music and messages you add to your invitations.",
            "Guest list: names, greetings, notes and optional phone numbers you enter for your guests. You decide what to add; guests never enter data themselves.",
            "Usage: whether an invitation link was opened and how many times, and basic technical logs (IP address, browser) kept for security and abuse prevention.",
            "Anonymous visit statistics (pages viewed, referring site, country, device type) through Vercel Web Analytics. It uses no cookies, and private parts of links, such as a guest's personal link, are removed before anything is sent.",
          ],
        },
        {
          title: "How we use it",
          body: [
            "To provide the service: building, hosting and showing your invitations, sending sign-in links, and showing you who has opened their invite.",
            "To keep the service safe: rate limiting, preventing abuse, and fixing errors.",
            "We do not sell your data, show ads, or use advertising trackers on invitation pages.",
          ],
        },
        {
          title: "Who can see what",
          body: [
            "Published invitations are visible to anyone with the link and are hidden from search engines.",
            "A guest's personal link shows only what you chose for that guest. It never includes your guest list, other guests' names, phone numbers or private notes.",
            "Drafts are visible only to you while signed in.",
          ],
        },
        {
          title: "Your guests' data",
          body: [
            "For your guest list you act as the data fiduciary and we process that data on your behalf, under India's Digital Personal Data Protection Act, 2023. Please only add guests you are inviting, and only the details you need.",
            "You can export your guest list as CSV or delete guests at any time.",
          ],
        },
        {
          title: "Service providers",
          body: [
            "We use trusted providers to run the service: hosting (Vercel), database (Neon), media storage (Cloudinary), email delivery (Resend) and Google sign-in. They process data only to provide their service to us.",
          ],
        },
        {
          title: "Retention and deletion",
          body: [
            "You can unpublish, archive or delete an invitation at any time. Deleted invitations, their guest lists and media are permanently purged after 30 days.",
            `To delete your account or request a copy of your data, ${contactPhrase("email")}.`,
          ],
        },
        {
          title: "Contact",
          body: [`Questions about privacy? Please ${contactPhrase()}.`],
        },
      ]}
    />
  );
}
