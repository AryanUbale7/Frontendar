export const PRIVACY_CONFIG = {
  brandName: "Frontend Arena",
  tagline: "Design. Build. Dominate.",
  founder: "Aryan Ubale",
  lastUpdated: "August 10, 2026",
  officialEmail: "support@frontendarena.online",
  websiteUrl: "https://www.frontendarena.online",
};

export interface PrivacySection {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  content: Array<{
    type: "paragraph" | "list" | "subheading" | "contact_info";
    text?: string;
    items?: string[];
  }>;
}

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "introduction",
    number: 1,
    title: "1. Introduction",
    shortTitle: "Introduction",
    content: [
      {
        type: "paragraph",
        text: "Welcome to Frontend Arena.",
      },
      {
        type: "paragraph",
        text: "Frontend Arena is a community-driven platform focused on hackathons, coding challenges, technology events, learning opportunities, and developer activities.",
      },
      {
        type: "paragraph",
        text: "This Privacy Policy explains how we collect, use, store, and protect information when you visit or use our website, register for our events, participate in hackathons, or interact with our services.",
      },
      {
        type: "paragraph",
        text: "By using Frontend Arena, you acknowledge the practices described in this Privacy Policy.",
      },
    ],
  },
  {
    id: "information-we-collect",
    number: 2,
    title: "2. Information We Collect",
    shortTitle: "Information We Collect",
    content: [
      {
        type: "paragraph",
        text: "Depending on how you interact with Frontend Arena, we may collect information such as:",
      },
      {
        type: "list",
        items: [
          "Full name",
          "Email address",
          "Phone/WhatsApp number",
          "College/university name",
          "Course, branch, and graduation year",
          "Team/member information",
          "GitHub, LinkedIn, portfolio, or other profile links",
          "Profile photograph, where voluntarily submitted",
          "Hackathon submissions and project information",
          "Feedback and responses submitted through forms",
          "Event participation and achievement information",
          "Technical information such as browser type, device information, IP address, and basic website usage information where applicable",
        ],
      },
      {
        type: "paragraph",
        text: "We only seek information that is reasonably necessary for the relevant event, service, communication, or platform functionality.",
      },
    ],
  },
  {
    id: "how-we-use-your-information",
    number: 3,
    title: "3. How We Use Your Information",
    shortTitle: "How We Use Info",
    content: [
      {
        type: "paragraph",
        text: "We may use collected information to:",
      },
      {
        type: "list",
        items: [
          "Process hackathon and event registrations",
          "Manage participants and teams",
          "Communicate important event updates",
          "Conduct judging and evaluation",
          "Issue certificates, badges, and awards",
          "Share participant achievements and event results",
          "Feature finalists, winners, or participants on Frontend Arena's social media where appropriate and with the required permission",
          "Provide event-related benefits, rewards, or partner opportunities",
          "Collect feedback and improve future events",
          "Respond to queries and support requests",
          "Maintain the security and functionality of our platform",
          "Comply with applicable legal obligations",
        ],
      },
    ],
  },
  {
    id: "participant-photos",
    number: 4,
    title: "4. Participant Photos & Social Media Features",
    shortTitle: "Participant Photos",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena may invite participants to voluntarily submit professional photographs for event-related features, such as finalist announcements, winner posts, certificates, or social media recognition.",
      },
      {
        type: "paragraph",
        text: "Where a separate permission or consent is requested, submitting the photograph indicates your agreement to its use for the stated purpose.",
      },
      {
        type: "paragraph",
        text: "Participants may contact us regarding concerns about the use of their submitted photograph or other personal information.",
      },
    ],
  },
  {
    id: "information-sharing",
    number: 5,
    title: "5. Information Sharing",
    shortTitle: "Information Sharing",
    content: [
      {
        type: "paragraph",
        text: "We do not sell personal information to third parties.",
      },
      {
        type: "paragraph",
        text: "Information may be shared with:",
      },
      {
        type: "list",
        items: [
          "Event judges and mentors where required for evaluation",
          "Event partners or sponsors where necessary to provide announced participant benefits",
          "Service providers that help us operate our website, forms, communication, hosting, or event infrastructure",
          "Authorities or other parties where disclosure is required by applicable law",
        ],
      },
      {
        type: "paragraph",
        text: "We aim to share only information reasonably necessary for the relevant purpose.",
      },
    ],
  },
  {
    id: "third-party-services",
    number: 6,
    title: "6. Third-Party Services",
    shortTitle: "Third-Party Services",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena may use third-party services for functions such as:",
      },
      {
        type: "list",
        items: [
          "Event registration",
          "Forms and surveys",
          "Email communication",
          "Website hosting",
          "Analytics",
          "Social media",
          "Participant benefits and partner services",
        ],
      },
      {
        type: "paragraph",
        text: "These third-party services may have their own privacy policies and terms. We encourage users to review the relevant policies when interacting with those services.",
      },
    ],
  },
  {
    id: "data-security",
    number: 7,
    title: "7. Data Security",
    shortTitle: "Data Security",
    content: [
      {
        type: "paragraph",
        text: "We take reasonable technical and organizational measures to protect personal information against unauthorized access, misuse, loss, alteration, or disclosure.",
      },
      {
        type: "paragraph",
        text: "However, no online system can be guaranteed to be completely secure, and users should understand that transmission of information over the internet carries inherent risks.",
      },
    ],
  },
  {
    id: "data-retention",
    number: 8,
    title: "8. Data Retention",
    shortTitle: "Data Retention",
    content: [
      {
        type: "paragraph",
        text: "We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including event administration, certificates, records, legitimate operational requirements, dispute resolution, and applicable legal obligations.",
      },
      {
        type: "paragraph",
        text: "When information is no longer reasonably required, we may delete or anonymize it, subject to applicable requirements.",
      },
    ],
  },
  {
    id: "your-rights",
    number: 9,
    title: "9. Your Rights",
    shortTitle: "Your Rights",
    content: [
      {
        type: "paragraph",
        text: "Subject to applicable law, individuals may have rights relating to their personal data, including rights to:",
      },
      {
        type: "list",
        items: [
          "Obtain information about personal data being processed",
          "Request correction of inaccurate or incomplete information",
          "Request deletion of personal information where applicable",
          "Withdraw consent where processing is based on consent",
          "Raise concerns or grievances regarding processing of personal data",
        ],
      },
      {
        type: "paragraph",
        text: "Requests can be submitted using the contact details provided below.",
      },
      {
        type: "paragraph",
        text: "The DPDP framework provides rights concerning access, correction/erasure and grievance redressal, subject to its applicable provisions.",
      },
    ],
  },
  {
    id: "childrens-privacy",
    number: 10,
    title: "10. Children's Privacy",
    shortTitle: "Children's Privacy",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena is primarily intended for students, developers, and technology enthusiasts.",
      },
      {
        type: "paragraph",
        text: "If an activity involves individuals who may be children under applicable law, we will take appropriate measures required by applicable data-protection requirements.",
      },
      {
        type: "paragraph",
        text: "We do not knowingly request unnecessary personal information from children.",
      },
    ],
  },
  {
    id: "cookies-and-website-technologies",
    number: 11,
    title: "11. Cookies & Website Technologies",
    shortTitle: "Cookies",
    content: [
      {
        type: "paragraph",
        text: "Our website may use cookies or similar technologies to maintain functionality, understand website usage, improve performance, and provide a better user experience.",
      },
      {
        type: "paragraph",
        text: "You may be able to control cookies through your browser settings. Disabling certain cookies may affect some website functionality.",
      },
    ],
  },
  {
    id: "changes-to-this-privacy-policy",
    number: 12,
    title: "12. Changes to This Privacy Policy",
    shortTitle: "Changes",
    content: [
      {
        type: "paragraph",
        text: "We may update this Privacy Policy from time to time to reflect changes in our services, practices, technology, or applicable laws.",
      },
      {
        type: "paragraph",
        text: "Any updated version will be published on this page with a revised \"Last Updated\" date.",
      },
    ],
  },
  {
    id: "contact-us",
    number: 13,
    title: "13. Contact Us",
    shortTitle: "Contact Us",
    content: [
      {
        type: "paragraph",
        text: "If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, you can contact us at:",
      },
      {
        type: "contact_info",
      },
    ],
  },
];
