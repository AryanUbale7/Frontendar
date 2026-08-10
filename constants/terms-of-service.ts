export const TERMS_CONFIG = {
  brandName: "Frontend Arena",
  tagline: "Design. Build. Dominate.",
  founder: "Aryan Ubale",
  lastUpdated: "August 10, 2026",
  officialEmail: "aryanubale318@gmail.com",
  websiteUrl: "https://www.frontendarena.online",
};

export interface TermsSection {
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

export const TERMS_SECTIONS: TermsSection[] = [
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
        text: 'These Terms of Service ("Terms") govern your access to and use of Frontend Arena\'s website, hackathons, competitions, challenges, events, community activities, and related services.',
      },
      {
        type: "paragraph",
        text: "By accessing or using Frontend Arena, you agree to these Terms. If you do not agree with any part of these Terms, please do not use our services.",
      },
    ],
  },
  {
    id: "about-frontend-arena",
    number: 2,
    title: "2. About Frontend Arena",
    shortTitle: "About Us",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena is a technology community and event platform focused on providing opportunities for students, developers, designers, and technology enthusiasts to participate in hackathons, challenges, competitions, learning activities, and community initiatives.",
      },
    ],
  },
  {
    id: "eligibility",
    number: 3,
    title: "3. Eligibility",
    shortTitle: "Eligibility",
    content: [
      {
        type: "paragraph",
        text: "Participants must provide accurate information when registering for an event or service.",
      },
      {
        type: "paragraph",
        text: "Certain events may have additional eligibility requirements such as:",
      },
      {
        type: "list",
        items: [
          "Age requirements",
          "Student status",
          "College/university affiliation",
          "Team-size requirements",
          "Technical requirements",
          "Event-specific eligibility criteria",
        ],
      },
      {
        type: "paragraph",
        text: "Participants are responsible for ensuring that they meet the requirements of the event in which they participate.",
      },
    ],
  },
  {
    id: "event-registration",
    number: 4,
    title: "4. Event Registration",
    shortTitle: "Event Registration",
    content: [
      {
        type: "paragraph",
        text: "By registering for an event, you agree to:",
      },
      {
        type: "list",
        items: [
          "Provide accurate and complete information.",
          "Keep your registration information updated where necessary.",
          "Follow the rules and deadlines of the event.",
          "Participate using only permitted methods and resources.",
          "Respect organizers, judges, mentors, and other participants.",
        ],
      },
      {
        type: "paragraph",
        text: "Frontend Arena reserves the right to reject or cancel registrations that contain misleading, fraudulent, or otherwise inappropriate information.",
      },
    ],
  },
  {
    id: "hackathon-submissions",
    number: 5,
    title: "5. Hackathon Submissions",
    shortTitle: "Submissions",
    content: [
      {
        type: "paragraph",
        text: "Participants are responsible for the projects and content they submit.",
      },
      {
        type: "paragraph",
        text: "Submissions must:",
      },
      {
        type: "list",
        items: [
          "Be substantially created by the participating individual or team.",
          "Follow the specific rules of the relevant event.",
          "Respect third-party intellectual property rights.",
          "Not contain unlawful, harmful, fraudulent, or malicious content.",
        ],
      },
      {
        type: "paragraph",
        text: "Unless an event specifically states otherwise, submitting a project does not automatically transfer ownership of the participant's intellectual property to Frontend Arena.",
      },
    ],
  },
  {
    id: "judging-and-results",
    number: 6,
    title: "6. Judging & Results",
    shortTitle: "Judging & Results",
    content: [
      {
        type: "paragraph",
        text: "Hackathon submissions may be evaluated according to criteria communicated for the respective event.",
      },
      {
        type: "paragraph",
        text: "Judging decisions are made by the designated judges or evaluation panel.",
      },
      {
        type: "paragraph",
        text: "Participants acknowledge that:",
      },
      {
        type: "list",
        items: [
          "Judging criteria may vary between events.",
          "Results are based on the applicable evaluation process.",
          "Organizers may take reasonable administrative decisions regarding disqualification or eligibility.",
          "Decisions communicated as final for an event may not be subject to further appeal unless the event rules provide otherwise.",
        ],
      },
    ],
  },
  {
    id: "certificates-badges-and-awards",
    number: 7,
    title: "7. Certificates, Badges & Awards",
    shortTitle: "Certificates & Awards",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena may issue certificates, digital badges, prizes, rewards, or other recognition based on event participation or performance.",
      },
      {
        type: "paragraph",
        text: "Recognition may be subject to verification of eligibility and compliance with event rules.",
      },
      {
        type: "paragraph",
        text: "Frontend Arena may revoke recognition if it is later determined that it was obtained through cheating, fraud, misrepresentation, plagiarism, or violation of event rules.",
      },
    ],
  },
  {
    id: "third-party-partners",
    number: 8,
    title: "8. Third-Party Partners",
    shortTitle: "Third-Party Partners",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena may collaborate with sponsors, organizations, educational institutions, platforms, and other partners.",
      },
      {
        type: "paragraph",
        text: "Third-party services, benefits, offers, discounts, internships, or rewards may be subject to the respective third party's terms and conditions.",
      },
      {
        type: "paragraph",
        text: "Frontend Arena does not necessarily control third-party services and cannot guarantee their availability or continued operation.",
      },
    ],
  },
  {
    id: "user-conduct",
    number: 9,
    title: "9. User Conduct",
    shortTitle: "User Conduct",
    content: [
      {
        type: "paragraph",
        text: "You agree not to:",
      },
      {
        type: "list",
        items: [
          "Harass, threaten, or abuse other users.",
          "Impersonate another person or organization.",
          "Submit fraudulent information.",
          "Manipulate registrations, votes, rankings, or results.",
          "Attempt to interfere with the operation of the platform.",
          "Upload malicious software or harmful code.",
          "Misuse communication channels.",
          "Violate applicable laws or third-party rights.",
        ],
      },
    ],
  },
  {
    id: "intellectual-property",
    number: 10,
    title: "10. Intellectual Property",
    shortTitle: "Intellectual Property",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena's branding, logos, website design, original content, graphics, and other materials are owned by or used with permission by Frontend Arena unless otherwise stated.",
      },
      {
        type: "paragraph",
        text: "You may not reproduce, modify, distribute, or commercially exploit Frontend Arena's protected materials without appropriate permission.",
      },
    ],
  },
  {
    id: "user-generated-content",
    number: 11,
    title: "11. User-Generated Content",
    shortTitle: "User Content",
    content: [
      {
        type: "paragraph",
        text: "Participants may submit projects, photographs, feedback, testimonials, links, or other content.",
      },
      {
        type: "paragraph",
        text: "You remain responsible for content you submit and must have the necessary rights or permissions to submit it.",
      },
      {
        type: "paragraph",
        text: "By voluntarily providing content for an explicitly stated promotional or event-related purpose, you grant Frontend Arena the permissions reasonably necessary for that stated purpose, subject to any applicable consent requirements.",
      },
    ],
  },
  {
    id: "website-availability",
    number: 12,
    title: "12. Website Availability",
    shortTitle: "Availability",
    content: [
      {
        type: "paragraph",
        text: "We aim to keep Frontend Arena available and functional, but we do not guarantee uninterrupted or error-free access.",
      },
      {
        type: "paragraph",
        text: "The website or particular services may occasionally be unavailable because of maintenance, technical issues, updates, security incidents, or circumstances outside our reasonable control.",
      },
    ],
  },
  {
    id: "limitation-of-liability",
    number: 13,
    title: "13. Limitation of Liability",
    shortTitle: "Limitation of Liability",
    content: [
      {
        type: "paragraph",
        text: "To the extent permitted by applicable law, Frontend Arena will not be responsible for indirect or consequential losses arising from the use of our website, events, or third-party services.",
      },
      {
        type: "paragraph",
        text: "Nothing in these Terms is intended to exclude or limit liability that cannot legally be excluded or limited.",
      },
    ],
  },
  {
    id: "changes-to-these-terms",
    number: 14,
    title: "14. Changes to These Terms",
    shortTitle: "Changes to Terms",
    content: [
      {
        type: "paragraph",
        text: "We may update these Terms from time to time.",
      },
      {
        type: "paragraph",
        text: 'Updated Terms will be published on this page with a revised "Last Updated" date.',
      },
      {
        type: "paragraph",
        text: "Your continued use of Frontend Arena after an update may constitute acceptance of the revised Terms, to the extent permitted by applicable law.",
      },
    ],
  },
  {
    id: "termination-and-suspension",
    number: 15,
    title: "15. Termination & Suspension",
    shortTitle: "Termination",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena may restrict or suspend access to an event, community activity, or platform feature when reasonably necessary due to:",
      },
      {
        type: "list",
        items: [
          "Rule violations",
          "Fraud or abuse",
          "Security concerns",
          "Misuse of the platform",
          "Unlawful activity",
          "Conduct that materially harms other participants or the community",
        ],
      },
    ],
  },
  {
    id: "contact",
    number: 16,
    title: "16. Contact",
    shortTitle: "Contact Us",
    content: [
      {
        type: "paragraph",
        text: "For questions regarding these Terms:",
      },
      {
        type: "contact_info",
      },
    ],
  },
];
