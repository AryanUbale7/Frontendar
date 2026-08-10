export const LANDING_NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#who-we-are" },
  { label: "What We Organize", href: "#what-we-organize" },
  { label: "Why Join", href: "#why-join" },
  { label: "Hackathons", href: "#featured-hackathons" },
  { label: "Community", href: "#community-impact" },
];

export const COMMUNITY_STATS = [
  { value: "500+", label: "Community Members", description: "Active global builders" },
  { value: "100+", label: "Projects Submitted", description: "Production codebases built" },
  { value: "20+", label: "Hackathons Conducted", description: "Official Frontend Arena events" },
  { value: "10+", label: "Partner Colleges", description: "Academic institution partners" },
];

export const WHAT_WE_ORGANIZE = [
  {
    id: "org-1",
    title: "Frontend Hackathons",
    description: "High-velocity UI/UX and web application sprints focused on modern React, Next.js, and web performance.",
    iconName: "Code2",
    tag: "Signature Event",
  },
  {
    id: "org-2",
    title: "AI Build Challenges",
    description: "Harness LLMs, AI agents, and intelligent APIs to build next-generation smart applications.",
    iconName: "Sparkles",
    tag: "AI & Agents",
  },
  {
    id: "org-3",
    title: "UI/UX Competitions",
    description: "Craft pixel-perfect interfaces, modern design systems, and responsive user experiences.",
    iconName: "Layout",
    tag: "Design & UX",
  },
  {
    id: "org-4",
    title: "Web Development Challenges",
    description: "Full-stack build competitions testing database architecture, API design, and cloud deployments.",
    iconName: "Globe",
    tag: "Full-Stack",
  },
  {
    id: "org-5",
    title: "Innovation Challenges",
    description: "Solve complex real-world technical problems and compete for major cash prizes and industry bounties.",
    iconName: "Lightbulb",
    tag: "Innovation",
  },
  {
    id: "org-6",
    title: "Community Events",
    description: "Pair programming streams, live technical workshops, project roast sessions, and developer meetups.",
    iconName: "Users",
    tag: "Community",
  },
];

export const WHY_JOIN_BENEFITS = [
  {
    id: "b1",
    title: "Real World Experience",
    description: "Build software against real project briefs and production engineering standards.",
    iconName: "Briefcase",
  },
  {
    id: "b2",
    title: "Industry Ready Projects",
    description: "Create high-quality codebases that demonstrate your technical ability to top recruiters.",
    iconName: "FolderGit2",
  },
  {
    id: "b3",
    title: "Verifiable Certificates",
    description: "Earn cryptographic digital certificates and skill badges to showcase on LinkedIn & resume.",
    iconName: "Award",
  },
  {
    id: "b4",
    title: "Cash Prizes & Bounties",
    description: "Win substantial cash prize pools, sponsor bounties, and developer grants for winning projects.",
    iconName: "Trophy",
  },
  {
    id: "b5",
    title: "Global Networking",
    description: "Connect with thousands of ambitious developers, mentors, designers, and tech founders.",
    iconName: "Network",
  },
  {
    id: "b6",
    title: "Community Support",
    description: "Access 24/7 Discord support, peer code reviews, and mentorship throughout every hackathon.",
    iconName: "HeartHandshake",
  },
  {
    id: "b7",
    title: "Portfolio Building",
    description: "Turn hackathon ideas into live deployed SaaS products that stand out in job applications.",
    iconName: "Layers",
  },
  {
    id: "b8",
    title: "Industry Recognition",
    description: "Get featured on Frontend Arena leaderboards, social channels, and partner spotlights.",
    iconName: "Star",
  },
];

export const SIX_STEP_TIMELINE = [
  {
    id: "s1",
    title: "1. Register",
    timestamp: "Step 01",
    description: "Sign up for an upcoming Frontend Arena hackathon, form or join a squad, and choose your track.",
    status: "completed" as const,
    user: { name: "Developer Account" },
  },
  {
    id: "s2",
    title: "2. Build Your Project",
    timestamp: "Step 02",
    description: "Build your project using modern tools during the official hacking window with live mentor support.",
    status: "completed" as const,
    user: { name: "Hacking Sprint" },
  },
  {
    id: "s3",
    title: "3. Submit Your Project",
    timestamp: "Step 03",
    description: "Link your GitHub repository, submit a video demo walkthrough, and publish before the deadline.",
    status: "current" as const,
    user: { name: "Project Lock" },
  },
  {
    id: "s4",
    title: "4. Project Evaluation",
    timestamp: "Step 04",
    description: "Projects are audited across code quality, architecture, UI polish, and optional Virtual Judge test runs.",
    status: "upcoming" as const,
    user: { name: "Judging Panel" },
  },
  {
    id: "s5",
    title: "5. Leaderboard",
    timestamp: "Step 05",
    description: "Live standings update transparently with detailed score breakdowns and feedback notes.",
    status: "upcoming" as const,
  },
  {
    id: "s6",
    title: "6. Winner Announcement",
    timestamp: "Step 06",
    description: "Winners are announced live, cash prizes are released, and digital certificates are issued.",
    status: "upcoming" as const,
  },
];

export const OUR_PLATFORM_CAPABILITIES = [
  {
    id: "p1",
    title: "Participant Dashboard",
    description: "Track your active hackathons, squad members, deadlines, and project submission status in one place.",
    iconName: "LayoutDashboard",
  },
  {
    id: "p2",
    title: "Project Submission",
    description: "Seamless repository linking, automatic README parsing, video embeds, and live preview links.",
    iconName: "GitPullRequest",
  },
  {
    id: "p3",
    title: "Virtual Judge",
    description: "Automated test suite execution and AST code analysis to provide objective metric feedback.",
    iconName: "Code2",
    isVirtualJudge: true,
  },
  {
    id: "p4",
    title: "Verifiable Certificates",
    description: "Cryptographic digital certificates and achievement badges for all participants and winners.",
    iconName: "Award",
  },
  {
    id: "p5",
    title: "Real-Time Leaderboards",
    description: "Live websocket rankings updating transparently as project evaluations complete.",
    iconName: "BarChart3",
  },
  {
    id: "p6",
    title: "Project Reports",
    description: "Detailed scorecards breaking down code maintainability, security, UI polish, and judges' feedback.",
    iconName: "FileSpreadsheet",
  },
  {
    id: "p7",
    title: "Community Announcements",
    description: "Real-time stream of countdowns, workshop schedules, bounty alerts, and winner reveals.",
    iconName: "Bell",
  },
  {
    id: "p8",
    title: "Progress Tracking",
    description: "Monitor your personal hackathon history, commit velocity, skill level, and global community rank.",
    iconName: "TrendingUp",
  },
];

export const FEATURED_HACKATHONS = [
  {
    id: "h1",
    title: "Frontend Wars 2026",
    subtitle: "Official Flagship Web Sprint",
    prize: "$25,000 Cash Pool",
    date: "Aug 15 - Aug 20",
    status: "Registration Open",
    statusVariant: "success" as const,
    tags: ["React 19", "Next.js", "Tailwind CSS"],
    bannerGradient: "from-[#FF006E] to-[#FFD60A]",
  },
  {
    id: "h2",
    title: "UI/UX Championship",
    subtitle: "Design Systems & Interfaces",
    prize: "$10,000 Cash Pool",
    date: "Sep 01 - Sep 05",
    status: "Registration Open",
    statusVariant: "accent" as const,
    tags: ["Figma", "Design Tokens", "Micro-Interactions"],
    bannerGradient: "from-[#FFD60A] via-[#FF8A00] to-[#FF006E]",
  },
  {
    id: "h3",
    title: "Build With AI Challenge",
    subtitle: "LLMs, Agents & Smart Apps",
    prize: "$50,000 Cash Pool",
    date: "Sep 15 - Sep 22",
    status: "Featured Event",
    statusVariant: "primary" as const,
    tags: ["AI Agents", "LangChain", "Python"],
    bannerGradient: "from-[#FF006E] to-[#8B5CF6]",
  },
  {
    id: "h4",
    title: "Innovation Sprint '26",
    subtitle: "Full-Stack Web Innovation",
    prize: "$35,000 Cash Pool",
    date: "Oct 05 - Oct 10",
    status: "Live Now",
    statusVariant: "success" as const,
    tags: ["TypeScript", "GraphQL", "PostgreSQL"],
    bannerGradient: "from-[#F59E0B] to-[#FF006E]",
  },
  {
    id: "h5",
    title: "Future Developer Summit",
    subtitle: "Student & Open Source Sprint",
    prize: "$20,000 Cash Pool",
    date: "Nov 01 - Nov 05",
    status: "Upcoming",
    statusVariant: "secondary" as const,
    tags: ["Open Source", "Rust", "WebAssembly"],
    bannerGradient: "from-[#FF006E] to-[#FFD60A]",
  },
];

export const DEVELOPER_TESTIMONIALS = [
  {
    id: "t1",
    quote:
      "Frontend Arena is hands down the best developer platform I've used. Competing in Frontend Wars helped me build a project that landed me my first Senior Frontend role.",
    author: "Marcus Vance",
    role: "Full-Stack Engineer",
    org: "Winner, Frontend Wars '25",
    avatar: "MV",
    type: "Winner",
  },
  {
    id: "t2",
    quote:
      "The community support and live leaderboards during the hackathon kept our team motivated 24/7. Having objective feedback on our code quality was invaluable.",
    author: "Aarav Sharma",
    role: "Computer Science Student",
    org: "IIT Delhi",
    avatar: "AS",
    type: "Student",
  },
  {
    id: "t3",
    quote:
      "Frontend Arena doesn't feel like a generic hackathon site. It's a genuine developer hub where serious builders come to ship production code and win real prizes.",
    author: "Jessica Lin",
    role: "Product Designer & Builder",
    org: "Design Systems Guild",
    avatar: "JL",
    type: "Developer",
  },
];

export const DEVELOPER_FAQS = [
  {
    question: "Who organizes the hackathons on Frontend Arena?",
    answer:
      "Frontend Arena is the official organizer of every hackathon, coding challenge, and design competition on this platform. We partner with top tech companies and academic institutions to sponsor cash prize pools and career opportunities.",
  },
  {
    question: "Who can participate in Frontend Arena hackathons?",
    answer:
      "Frontend Arena is open to students, self-taught developers, full-stack engineers, UI/UX designers, and tech enthusiasts worldwide of all skill levels.",
  },
  {
    question: "Is there any cost to join Frontend Arena or enter hackathons?",
    answer:
      "No. Frontend Arena is 100% free for developers and students. All hackathons, workshops, community access, and verifiable certificates are completely free.",
  },
  {
    question: "How are projects evaluated and judged?",
    answer:
      "Projects are evaluated by a panel of senior engineers and product leaders on code quality, architecture, UI polish, and problem-solving impact. The optional Virtual Judge assists by running automated unit test suites and AST code scans.",
  },
];

export const FOOTER_SECTIONS = {
  quickLinks: [
    { label: "Hackathons", href: "#featured-hackathons" },
    { label: "About Us", href: "#who-we-are" },
    { label: "Community", href: "#community-impact" },
    { label: "Blogs", href: "#" },
    { label: "FAQs", href: "#faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/FrontendArenaOfficial", icon: "Github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/frontend-arena7/", icon: "Linkedin" },
    { label: "Instagram", href: "https://www.instagram.com/frontend_arena?igsh=M3FpcTZoNmd6cmx4", icon: "Instagram" },
    { label: "Discord", href: "https://discord.gg", icon: "MessageSquare" },
  ],
};
