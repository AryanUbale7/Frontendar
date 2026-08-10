export const GUIDELINES_CONFIG = {
  brandName: "Frontend Arena",
  tagline: "Design. Build. Dominate.",
  founder: "Aryan Ubale",
  lastUpdated: "August 10, 2026",
  officialEmail: "support@frontendarena.online",
  websiteUrl: "https://www.frontendarena.online",
};

export interface GuidelineSection {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  content: Array<{
    type: "paragraph" | "list" | "subheading" | "contact_info" | "highlight_banner";
    text?: string;
    items?: string[];
  }>;
}

export const GUIDELINES_SECTIONS: GuidelineSection[] = [
  {
    id: "our-community",
    number: 1,
    title: "1. Our Community",
    shortTitle: "Our Community",
    content: [
      {
        type: "paragraph",
        text: "Frontend Arena is built around a simple principle:",
      },
      {
        type: "highlight_banner",
        text: "Design. Build. Dominate. — Together.",
      },
      {
        type: "paragraph",
        text: "We want to create a community where students, developers, designers, mentors, judges, and technology enthusiasts can learn, compete, collaborate, and grow in a respectful environment.",
      },
    ],
  },
  {
    id: "treat-everyone-with-respect",
    number: 2,
    title: "2. Treat Everyone With Respect",
    shortTitle: "Respect",
    content: [
      {
        type: "paragraph",
        text: "Everyone in the Frontend Arena community should be treated with professionalism and respect.",
      },
      {
        type: "paragraph",
        text: "Do not engage in:",
      },
      {
        type: "list",
        items: [
          "Harassment",
          "Bullying",
          "Threats",
          "Personal attacks",
          "Hate speech",
          "Discriminatory behavior",
          "Intimidation",
          "Unwanted sexual or inappropriate conduct",
        ],
      },
      {
        type: "paragraph",
        text: "Differences in skill level, experience, background, opinions, or technical approach should never be used as a reason to disrespect another participant.",
      },
    ],
  },
  {
    id: "keep-competitions-fair",
    number: 3,
    title: "3. Keep Competitions Fair",
    shortTitle: "Fair Play",
    content: [
      {
        type: "paragraph",
        text: "During hackathons and competitions, participants are expected to compete honestly.",
      },
      {
        type: "paragraph",
        text: "Prohibited behavior may include:",
      },
      {
        type: "list",
        items: [
          "Plagiarism",
          "Copying another participant's submission",
          "Falsifying project information",
          "Manipulating votes or rankings",
          "Creating fake registrations",
          "Using unauthorized accounts",
          "Attempting to influence judges improperly",
          "Sharing restricted competition materials",
          "Exploiting technical vulnerabilities to gain an unfair advantage",
        ],
      },
      {
        type: "paragraph",
        text: "Event-specific rules may impose additional restrictions.",
      },
    ],
  },
  {
    id: "responsible-use-of-ai",
    number: 4,
    title: "4. Responsible Use of AI",
    shortTitle: "AI Policy",
    content: [
      {
        type: "paragraph",
        text: "AI tools may be permitted in some Frontend Arena events and restricted in others.",
      },
      {
        type: "paragraph",
        text: "Participants must follow the specific AI policy communicated for the relevant event.",
      },
      {
        type: "paragraph",
        text: "Where disclosure is required, participants should honestly disclose significant AI assistance.",
      },
      {
        type: "paragraph",
        text: "Using AI does not remove the participant's responsibility for:",
      },
      {
        type: "list",
        items: [
          "The originality of the submission",
          "Understanding their implementation",
          "Accuracy of claims",
          "Compliance with event rules",
          "Respecting third-party rights",
        ],
      },
    ],
  },
  {
    id: "respect-intellectual-property",
    number: 5,
    title: "5. Respect Intellectual Property",
    shortTitle: "Intellectual Property",
    content: [
      {
        type: "paragraph",
        text: "Do not knowingly use copyrighted, trademarked, confidential, or proprietary material without appropriate permission.",
      },
      {
        type: "paragraph",
        text: "Participants should properly attribute third-party resources when required.",
      },
      {
        type: "paragraph",
        text: "Do not present another person's work as your own.",
      },
    ],
  },
  {
    id: "communication-standards",
    number: 6,
    title: "6. Communication Standards",
    shortTitle: "Communication",
    content: [
      {
        type: "paragraph",
        text: "Our WhatsApp groups, Discord/community channels, social media interactions, emails, and other communication spaces should remain useful and professional.",
      },
      {
        type: "paragraph",
        text: "Avoid:",
      },
      {
        type: "list",
        items: [
          "Spam",
          "Repeated promotional messages",
          "Unrelated advertisements",
          "Fake announcements",
          "Misleading information",
          "Abusive language",
          "Excessive tagging or mentions",
        ],
      },
      {
        type: "paragraph",
        text: "Organizers may moderate communication channels to maintain a productive environment.",
      },
    ],
  },
  {
    id: "judges-and-mentors",
    number: 7,
    title: "7. Judges & Mentors",
    shortTitle: "Judges & Mentors",
    content: [
      {
        type: "paragraph",
        text: "Judges and mentors should be treated with professionalism.",
      },
      {
        type: "paragraph",
        text: "Participants must not:",
      },
      {
        type: "list",
        items: [
          "Pressure judges to change scores",
          "Attempt to influence evaluation unfairly",
          "Harass judges or mentors",
          "Misrepresent evaluation decisions",
          "Contact judges for inappropriate competitive advantages",
        ],
      },
      {
        type: "paragraph",
        text: "Feedback and disagreements should be communicated respectfully.",
      },
    ],
  },
  {
    id: "privacy-and-personal-information",
    number: 8,
    title: "8. Privacy & Personal Information",
    shortTitle: "Privacy Info",
    content: [
      {
        type: "paragraph",
        text: "Do not publicly share another participant's private information without appropriate permission.",
      },
      {
        type: "paragraph",
        text: "This includes:",
      },
      {
        type: "list",
        items: [
          "Phone numbers",
          "Private email addresses",
          "Personal documents",
          "Private conversations",
          "Sensitive personal information",
        ],
      },
      {
        type: "paragraph",
        text: "If you believe someone's personal information has been shared improperly, report it to the Frontend Arena team.",
      },
    ],
  },
  {
    id: "promotions-and-self-promotion",
    number: 9,
    title: "9. Promotions & Self-Promotion",
    shortTitle: "Promotions",
    content: [
      {
        type: "paragraph",
        text: "Self-promotion may be allowed in designated channels or activities.",
      },
      {
        type: "paragraph",
        text: "However, avoid unsolicited mass promotion, spam, misleading claims, or promotion that disrupts community activities.",
      },
    ],
  },
  {
    id: "reporting-problems",
    number: 10,
    title: "10. Reporting Problems",
    shortTitle: "Reporting",
    content: [
      {
        type: "paragraph",
        text: "If you encounter harassment, cheating, abuse, inappropriate content, or other serious violations, report it to the Frontend Arena team.",
      },
      {
        type: "paragraph",
        text: "When reporting, provide enough information for us to understand the situation, such as:",
      },
      {
        type: "list",
        items: [
          "What happened",
          "When it happened",
          "Relevant event/channel",
          "Screenshots or supporting evidence, where appropriate",
        ],
      },
      {
        type: "paragraph",
        text: "Please do not publicly expose someone's private information while making a report.",
      },
    ],
  },
  {
    id: "enforcement",
    number: 11,
    title: "11. Enforcement",
    shortTitle: "Enforcement",
    content: [
      {
        type: "paragraph",
        text: "Depending on the situation and applicable rules, violations may result in:",
      },
      {
        type: "list",
        items: [
          "Warning",
          "Content removal",
          "Temporary restriction",
          "Removal from a communication channel",
          "Disqualification from an event",
          "Revocation of awards or recognition",
          "Suspension from Frontend Arena activities",
          "Further action where appropriate or legally required",
        ],
      },
      {
        type: "paragraph",
        text: "The response may depend on the seriousness and circumstances of the violation.",
      },
    ],
  },
  {
    id: "good-community-behavior",
    number: 12,
    title: "12. Good Community Behavior",
    shortTitle: "Good Practice",
    content: [
      {
        type: "paragraph",
        text: "We encourage everyone to:",
      },
      {
        type: "list",
        items: [
          "Help fellow participants learn.",
          "Give constructive feedback.",
          "Celebrate others' achievements.",
          "Share knowledge responsibly.",
          "Ask questions without hesitation.",
          "Give credit to original creators.",
          "Respect judges, mentors, organizers, and volunteers.",
          "Build projects that create positive impact.",
        ],
      },
      {
        type: "highlight_banner",
        text: "Build with integrity. Compete with respect. Grow together.",
      },
      {
        type: "contact_info",
      },
    ],
  },
];
