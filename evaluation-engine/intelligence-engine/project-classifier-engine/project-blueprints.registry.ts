import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";
import { ProjectType } from "./project-type.interface";

export const PROJECT_BLUEPRINTS: Record<ProjectType, KnowledgeBlueprint> = {
  "Todo App": {
    problemStatement: {
      title: "Task Management / Todo Application",
      description: "Interactive Todo and Task tracking web application with task status, filtering, and local state persistence.",
      difficulty: "Beginner",
    },
    requiredFeatures: [
      {
        id: "todo_crud",
        name: "Task CRUD Operations",
        description: "Create, view, edit, toggle status, and delete tasks.",
        mandatory: true,
        weight: 35,
        keywords: ["task", "todo", "create", "delete", "toggle", "add task", "edit task"],
        expectedComponents: ["TodoList", "TodoItem", "AddTodo", "TaskForm", "TaskItem"],
        expectedUIElements: ["input", "button", "checkbox", "list"],
        subFeatures: [
          { name: "Create Task", weight: 10, aliases: ["add task", "new todo", "create todo"], expectedComponents: ["AddTodo", "TaskForm"] },
          { name: "Toggle Task Status", weight: 10, aliases: ["complete task", "toggle todo", "checkbox"], expectedComponents: ["TodoItem", "TaskItem"] },
          { name: "Delete Task", weight: 8, aliases: ["remove task", "delete todo"], expectedComponents: ["TodoItem"] },
          { name: "Edit Task", weight: 7, aliases: ["update task", "edit todo"], expectedComponents: ["TaskForm", "EditTodo"] },
        ],
      },
      {
        id: "todo_filtering",
        name: "Filtering & Sorting",
        description: "Filter tasks by status (All, Active, Completed) and search/sort.",
        mandatory: true,
        weight: 30,
        keywords: ["filter", "active", "completed", "all", "sort", "search"],
        expectedComponents: ["TodoFilter", "FilterBar", "TaskStatusFilter"],
        subFeatures: [
          { name: "Status Filter (All/Active/Completed)", weight: 15, aliases: ["filter active", "filter completed"] },
          { name: "Search & Clear Completed", weight: 15, aliases: ["clear completed", "search todo"] },
        ],
      },
      {
        id: "todo_persistence",
        name: "State Persistence",
        description: "Persist task state using localStorage, IndexedDB, or backend API.",
        mandatory: true,
        weight: 35,
        keywords: ["localstorage", "persist", "save", "indexeddb", "state"],
        subFeatures: [
          { name: "Storage Integration", weight: 35, aliases: ["localstorage.setitem", "localstorage.getitem", "state persistence"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Vue", "Next.js", "Angular", "HTML"], required: ["HTML", "JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Feature Completeness", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Responsiveness", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Landing Page": {
    problemStatement: {
      title: "Product Landing Page",
      description: "Modern product landing page showcasing features, testimonials, pricing, and hero section.",
      difficulty: "Beginner",
    },
    requiredFeatures: [
      {
        id: "landing_hero",
        name: "Hero Section & Value Proposition",
        description: "High impact hero banner with main headline, subtitle, and primary call-to-action.",
        mandatory: true,
        weight: 35,
        keywords: ["hero", "banner", "headline", "cta", "get started", "learn more"],
        expectedComponents: ["Hero", "Banner", "HeaderHero"],
        subFeatures: [
          { name: "Hero Headline & Subtitle", weight: 20, aliases: ["hero title", "value prop"] },
          { name: "Primary Call To Action (CTA)", weight: 15, aliases: ["cta button", "get started"] },
        ],
      },
      {
        id: "landing_features",
        name: "Feature Showcase & Testimonials",
        description: "Grid or list detailing key product features, benefits, and user testimonials.",
        mandatory: true,
        weight: 35,
        keywords: ["features", "benefits", "testimonials", "reviews", "pricing"],
        expectedComponents: ["FeatureGrid", "FeatureCard", "Testimonials", "PricingSection"],
        subFeatures: [
          { name: "Feature Highlights Grid", weight: 20, aliases: ["features grid", "feature item"] },
          { name: "Customer Testimonials", weight: 15, aliases: ["reviews", "social proof"] },
        ],
      },
      {
        id: "landing_lead_form",
        name: "Lead Capture / Contact & Footer",
        description: "Newsletter subscription form or contact form and footer navigation links.",
        mandatory: true,
        weight: 30,
        keywords: ["subscribe", "newsletter", "contact", "footer", "form"],
        expectedComponents: ["ContactForm", "Newsletter", "Footer"],
        subFeatures: [
          { name: "Newsletter / Contact Form", weight: 15, aliases: ["email input", "subscribe form"] },
          { name: "Footer & Legal Links", weight: 15, aliases: ["footer nav", "copyright"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Vue", "Next.js", "TailwindCSS", "HTML"], required: ["HTML", "CSS"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "UI/UX & Design Excellence", weight: 50, maxMarks: 50, passingMarks: 30 },
        { name: "Responsive Layout & Accessibility", weight: 30, maxMarks: 30, passingMarks: 18 },
        { name: "Feature Completeness & Forms", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Dashboard": {
    problemStatement: {
      title: "Interactive Analytics Dashboard",
      description: "Data visualization dashboard with charts, KPI summary cards, and data filter controls.",
      difficulty: "Intermediate",
    },
    requiredFeatures: [
      {
        id: "dash_kpi",
        name: "KPI Metrics & Summary Cards",
        description: "Display top metrics (Revenue, Active Users, Conversion Rate) in responsive card layouts.",
        mandatory: true,
        weight: 30,
        keywords: ["kpi", "metrics", "stats", "cards", "summary", "total revenue"],
        expectedComponents: ["StatCard", "KPICard", "MetricCard", "SummaryCard"],
        subFeatures: [
          { name: "Metric Cards Grid", weight: 15, aliases: ["stat cards", "kpis"] },
          { name: "Percentage Trend Badges", weight: 15, aliases: ["growth rate", "trend badge"] },
        ],
      },
      {
        id: "dash_charts",
        name: "Interactive Charts & Visualizations",
        description: "Render line charts, bar graphs, or pie charts using visualization libraries.",
        mandatory: true,
        weight: 40,
        keywords: ["chart", "graph", "recharts", "chart.js", "apexcharts", "linechart", "barchart"],
        expectedComponents: ["RevenueChart", "AnalyticsChart", "BarChartComponent", "LineChartComponent"],
        expectedPackages: ["recharts", "chart.js", "apexcharts", "d3"],
        subFeatures: [
          { name: "Time-series / Revenue Chart", weight: 20, aliases: ["line chart", "area chart"] },
          { name: "Breakdown / Category Chart", weight: 20, aliases: ["bar chart", "pie chart", "doughnut"] },
        ],
      },
      {
        id: "dash_filters",
        name: "Data Table & Filter Controls",
        description: "Filterable data table with date range picker, search, and pagination.",
        mandatory: true,
        weight: 30,
        keywords: ["table", "filter", "date picker", "search", "pagination", "export"],
        expectedComponents: ["DataTable", "FilterBar", "DatePicker", "Pagination"],
        subFeatures: [
          { name: "Recent Transactions Table", weight: 15, aliases: ["data table", "records list"] },
          { name: "Date Range & Category Filter", weight: 15, aliases: ["date filter", "status selector"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "TailwindCSS"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Data Visualization & Feature Depth", weight: 40, maxMarks: 40, passingMarks: 22 },
        { name: "UI/UX & Dashboard Layout", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Quality & State Management", weight: 25, maxMarks: 25, passingMarks: 13 },
      ],
    },
  },

  "Admin Panel": {
    problemStatement: {
      title: "Admin Panel & User Management System",
      description: "Administrative control panel with user management, permissions, audit logs, and settings.",
      difficulty: "Intermediate",
    },
    requiredFeatures: [
      {
        id: "admin_user_mgmt",
        name: "User & Role Management",
        description: "Admin table to list, create, edit, block, or assign roles to users.",
        mandatory: true,
        weight: 40,
        keywords: ["user management", "roles", "permissions", "admin table", "edit user"],
        expectedComponents: ["UserTable", "RoleSelector", "EditUserModal", "PermissionMatrix"],
        subFeatures: [
          { name: "User Listing & Search", weight: 20, aliases: ["user table", "users list"] },
          { name: "Role & Status Assignment", weight: 20, aliases: ["assign role", "admin actions"] },
        ],
      },
      {
        id: "admin_sidebar_nav",
        name: "Sidebar Navigation & Layout",
        description: "Collapsible sidebar layout with active tab indicators and header user profile menu.",
        mandatory: true,
        weight: 30,
        keywords: ["sidebar", "admin layout", "navigation", "topbar", "settings"],
        expectedComponents: ["AdminSidebar", "AdminHeader", "NavLinks"],
        subFeatures: [
          { name: "Collapsible Sidebar", weight: 15, aliases: ["sidebar toggle", "nav menu"] },
          { name: "Header Profile & Quick Actions", weight: 15, aliases: ["admin header", "profile menu"] },
        ],
      },
      {
        id: "admin_system_logs",
        name: "System Settings & Activity Audit Logs",
        description: "System configuration panels and activity log history.",
        mandatory: false,
        weight: 30,
        keywords: ["audit logs", "activity", "system settings", "configuration", "logs"],
        expectedComponents: ["AuditLogTable", "SystemSettingsForm"],
        subFeatures: [
          { name: "System Settings Form", weight: 15, aliases: ["general settings", "config panel"] },
          { name: "Activity Log History", weight: 15, aliases: ["audit trail", "event logs"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Feature Completeness & Role Management", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "Admin UI/UX & Layout", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Code Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "E-Commerce": {
    problemStatement: {
      title: "E-Commerce Shopping Platform",
      description: "Full e-commerce platform with product catalog, shopping cart, filtering, and checkout workflow.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "ecom_catalog",
        name: "Product Catalog & Filtering",
        description: "Product grid with category filters, price range sliders, search, and sorting.",
        mandatory: true,
        weight: 30,
        keywords: ["product", "catalog", "grid", "filter", "category", "price range"],
        expectedComponents: ["ProductGrid", "ProductCard", "CategoryFilter", "SearchBar"],
        subFeatures: [
          { name: "Product Cards & Ratings", weight: 15, aliases: ["product item", "price tag"] },
          { name: "Category & Price Filtering", weight: 15, aliases: ["filter sidebar", "price slider"] },
        ],
      },
      {
        id: "ecom_cart",
        name: "Shopping Cart & Quantity Management",
        description: "Slide-over cart or cart page with quantity adjustment, item removal, and subtotal calculation.",
        mandatory: true,
        weight: 35,
        keywords: ["cart", "shopping cart", "quantity", "subtotal", "add to cart", "remove item"],
        expectedComponents: ["CartDrawer", "CartPage", "CartItem", "QuantitySelector"],
        subFeatures: [
          { name: "Add / Remove Cart Items", weight: 20, aliases: ["add to cart", "cart item"] },
          { name: "Subtotal & Tax Calculation", weight: 15, aliases: ["cart total", "order summary"] },
        ],
      },
      {
        id: "ecom_checkout",
        name: "Checkout & Order Confirmation",
        description: "Multi-step checkout form with shipping info, payment options, and order summary.",
        mandatory: true,
        weight: 35,
        keywords: ["checkout", "payment", "shipping", "order summary", "stripe", "confirmation"],
        expectedComponents: ["CheckoutForm", "PaymentStep", "OrderConfirmation"],
        expectedPackages: ["stripe", "@stripe/stripe-js"],
        subFeatures: [
          { name: "Shipping & Payment Details Form", weight: 20, aliases: ["shipping form", "payment input"] },
          { name: "Order Summary & Confirmation", weight: 15, aliases: ["order complete", "receipt"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "E-Commerce Functionality & Workflow", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Product Experience", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Code Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Chat App": {
    problemStatement: {
      title: "Real-Time Chat & Messaging Application",
      description: "Chat application featuring message threads, real-time message sending, channels, and online status.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "chat_messaging",
        name: "Message Stream & Input",
        description: "Scrollable message thread displaying message bubbles, timestamps, sender details, and chat input.",
        mandatory: true,
        weight: 40,
        keywords: ["message", "chat", "send message", "input", "chat bubble", "timestamp"],
        expectedComponents: ["ChatWindow", "MessageList", "MessageItem", "MessageInput"],
        expectedPackages: ["socket.io-client", "firebase", "supabase"],
        subFeatures: [
          { name: "Message Feed & Scroll", weight: 20, aliases: ["messages list", "chat thread"] },
          { name: "Message Input & Submit", weight: 20, aliases: ["send button", "input bar"] },
        ],
      },
      {
        id: "chat_channels",
        name: "Channels / Direct Message Contacts",
        description: "Sidebar listing available chat rooms, public channels, and active user contacts.",
        mandatory: true,
        weight: 35,
        keywords: ["channels", "rooms", "contacts", "users list", "sidebar"],
        expectedComponents: ["ChannelList", "ContactList", "ChatSidebar"],
        subFeatures: [
          { name: "Channel / Contact List Sidebar", weight: 20, aliases: ["rooms list", "user items"] },
          { name: "Unread Message Count Badges", weight: 15, aliases: ["unread badge", "notification count"] },
        ],
      },
      {
        id: "chat_status",
        name: "User Profiles & Online Indicators",
        description: "User avatar icons, online status indicators (green dot), and current user info.",
        mandatory: true,
        weight: 25,
        keywords: ["online status", "avatar", "user profile", "active now"],
        expectedComponents: ["UserAvatar", "StatusIndicator"],
        subFeatures: [
          { name: "Online Status Indicators", weight: 25, aliases: ["presence badge", "active indicator"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Messaging Functionality & Real-time UX", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI Layout & Chat Aesthetics", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Code Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Hospital": {
    problemStatement: {
      title: "Hospital & Patient Management Portal",
      description: "Healthcare platform for patient record tracking, doctor directory, and appointment scheduling.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "hosp_patients",
        name: "Patient Records & Management",
        description: "Patient list table, medical history modal, diagnosis notes, and patient search.",
        mandatory: true,
        weight: 35,
        keywords: ["patient", "medical record", "diagnosis", "health", "doctor"],
        expectedComponents: ["PatientTable", "PatientCard", "MedicalHistory", "PatientModal"],
        subFeatures: [
          { name: "Patient Table & Records", weight: 20, aliases: ["patient list", "medical history"] },
          { name: "Diagnosis & Notes Input", weight: 15, aliases: ["doctor notes", "prescription details"] },
        ],
      },
      {
        id: "hosp_appointments",
        name: "Doctor Appointments & Calendar",
        description: "Appointment booking interface, doctor selection, time slot pickers, and status tracking.",
        mandatory: true,
        weight: 35,
        keywords: ["appointment", "schedule", "doctor", "time slot", "calendar", "book"],
        expectedComponents: ["AppointmentScheduler", "DoctorCard", "TimeSlotPicker"],
        subFeatures: [
          { name: "Doctor Selection & Slot Booking", weight: 20, aliases: ["select doctor", "book appointment"] },
          { name: "Appointment Status Calendar", weight: 15, aliases: ["schedule view", "upcoming visits"] },
        ],
      },
      {
        id: "hosp_department",
        name: "Department Directory & Emergency Contact",
        description: "Hospital department cards (ICU, Cardiology, Pediatrics) and emergency hotlines.",
        mandatory: true,
        weight: 30,
        keywords: ["department", "emergency", "cardiology", "pediatrics", "doctor directory"],
        expectedComponents: ["DepartmentGrid", "DoctorDirectory", "EmergencyContactBar"],
        subFeatures: [
          { name: "Department Grid & Doctor Directory", weight: 30, aliases: ["departments list", "specialists"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Healthcare Workflow & Patient Management", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Accessibility", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Data Handling", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Education": {
    problemStatement: {
      title: "LMS / Education Learning Platform",
      description: "Learning platform featuring course catalogs, lesson video players, progress tracking, and quizzes.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "edu_catalog",
        name: "Course Catalog & Module Cards",
        description: "Course listing grid with course details, instructor info, category tags, and search.",
        mandatory: true,
        weight: 35,
        keywords: ["course", "lesson", "education", "learning", "instructor", "modules"],
        expectedComponents: ["CourseGrid", "CourseCard", "LessonList", "ModuleTree"],
        subFeatures: [
          { name: "Course Grid & Metadata", weight: 20, aliases: ["courses list", "course card"] },
          { name: "Module / Lesson Outline", weight: 15, aliases: ["syllabus", "lesson list"] },
        ],
      },
      {
        id: "edu_player",
        name: "Lesson Player & Progress Bar",
        description: "Video/article lesson viewer with progress bar tracking completed lessons.",
        mandatory: true,
        weight: 35,
        keywords: ["video player", "lesson viewer", "progress bar", "complete lesson"],
        expectedComponents: ["LessonViewer", "VideoPlayer", "ProgressBar"],
        subFeatures: [
          { name: "Lesson Content & Video Viewer", weight: 20, aliases: ["video container", "lesson text"] },
          { name: "Course Completion Progress", weight: 15, aliases: ["progress indicator", "% complete"] },
        ],
      },
      {
        id: "edu_quiz",
        name: "Quizzes & Assessments",
        description: "Multiple choice quiz component with immediate feedback and score reporting.",
        mandatory: false,
        weight: 30,
        keywords: ["quiz", "assessment", "question", "score", "submit quiz"],
        expectedComponents: ["QuizComponent", "QuestionCard", "ScoreReport"],
        subFeatures: [
          { name: "Multiple Choice Quiz Interface", weight: 30, aliases: ["quiz form", "submit answers"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Learning Platform Workflow & Features", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Student Experience", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "SaaS": {
    problemStatement: {
      title: "SaaS Software Platform",
      description: "Full-stack SaaS application with authentication, subscription tiers, settings, and workspace features.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "saas_pricing_auth",
        name: "Authentication & Subscription Tiers",
        description: "User authentication, protected workspace routes, and tier selection (Free, Pro, Enterprise).",
        mandatory: true,
        weight: 35,
        keywords: ["pricing", "subscription", "auth", "login", "signup", "pro plan", "stripe"],
        expectedComponents: ["PricingTable", "LoginForm", "SignupForm", "SubscriptionCard"],
        subFeatures: [
          { name: "Authentication / Protected App Routes", weight: 20, aliases: ["auth guard", "login modal"] },
          { name: "Tiered Pricing Selector", weight: 15, aliases: ["pricing grid", "select plan"] },
        ],
      },
      {
        id: "saas_workspace",
        name: "App Workspace & Feature Engine",
        description: "Main interactive application dashboard/workspace where users execute SaaS workflows.",
        mandatory: true,
        weight: 40,
        keywords: ["workspace", "dashboard", "projects", "tools", "generator", "editor"],
        expectedComponents: ["WorkspaceLayout", "ToolDashboard", "ProjectGrid"],
        subFeatures: [
          { name: "Interactive Tool / Workspace", weight: 40, aliases: ["main app", "dashboard view"] },
        ],
      },
      {
        id: "saas_settings",
        name: "User Settings & Billing Management",
        description: "Account profile settings, team member management, and billing details.",
        mandatory: true,
        weight: 25,
        keywords: ["account settings", "billing", "team", "api keys", "profile"],
        expectedComponents: ["AccountSettings", "BillingSection", "TeamManagement"],
        subFeatures: [
          { name: "Account Profile & Team Settings", weight: 25, aliases: ["profile form", "team list"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "SaaS Application Features & Workflow", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Product Design", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Security Practices", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "CRM": {
    problemStatement: {
      title: "CRM Customer Relationship Platform",
      description: "CRM system featuring contact records, sales pipeline kanban board, deal tracking, and activity history.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "crm_contacts",
        name: "Contact & Lead Management",
        description: "Table/grid of customer contacts, status tags (Lead, Qualified, Closed), and search.",
        mandatory: true,
        weight: 35,
        keywords: ["contact", "lead", "customer", "company", "email", "phone"],
        expectedComponents: ["ContactTable", "LeadCard", "ContactDetailsModal"],
        subFeatures: [
          { name: "Contact Directory Table", weight: 20, aliases: ["leads list", "contacts grid"] },
          { name: "Lead Status Badges", weight: 15, aliases: ["lead status", "qualification tag"] },
        ],
      },
      {
        id: "crm_pipeline",
        name: "Sales Pipeline & Kanban Board",
        description: "Kanban deal pipeline showing stages (Lead, Proposal, Negotiation, Closed Won).",
        mandatory: true,
        weight: 40,
        keywords: ["pipeline", "kanban", "deal", "stage", "closed won", "proposal"],
        expectedComponents: ["KanbanBoard", "DealColumn", "DealCard"],
        subFeatures: [
          { name: "Kanban Stage Columns", weight: 20, aliases: ["deal stages", "pipeline columns"] },
          { name: "Deal Cards & Value Totals", weight: 20, aliases: ["deal card", "column summary"] },
        ],
      },
      {
        id: "crm_activity",
        name: "Activity History & Task Reminders",
        description: "Timeline of client interactions, call notes, and follow-up task reminders.",
        mandatory: true,
        weight: 25,
        keywords: ["activity", "timeline", "notes", "calls", "tasks", "reminders"],
        expectedComponents: ["ActivityTimeline", "NotesForm"],
        subFeatures: [
          { name: "Client Interaction Timeline", weight: 25, aliases: ["activity feed", "call log"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "CRM Functionality & Pipeline Depth", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Kanban Usability", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Data Handling", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Finance": {
    problemStatement: {
      title: "FinTech & Financial Management Portal",
      description: "Financial tracking portal featuring account balances, transaction history, budget charts, and money transfers.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "fin_summary",
        name: "Account Balance & Income Summary",
        description: "Cards showing total balance, monthly income, expense totals, and bank card preview.",
        mandatory: true,
        weight: 35,
        keywords: ["balance", "income", "expenses", "financial", "card", "account"],
        expectedComponents: ["AccountSummary", "BalanceCard", "BankCardPreview"],
        subFeatures: [
          { name: "Total Balance & Cashflow Cards", weight: 20, aliases: ["balance widget", "cashflow"] },
          { name: "Digital Bank Card Widget", weight: 15, aliases: ["card item", "card number"] },
        ],
      },
      {
        id: "fin_transactions",
        name: "Transaction History & Categories",
        description: "Searchable transaction table with category badges, merchant icons, and amount indicators (+/-).",
        mandatory: true,
        weight: 35,
        keywords: ["transaction", "payment", "history", "merchant", "transfer", "category"],
        expectedComponents: ["TransactionTable", "TransactionRow", "CategoryBadge"],
        subFeatures: [
          { name: "Transaction Feed & Amounts", weight: 20, aliases: ["transactions list", "payment records"] },
          { name: "Category Filtering & Search", weight: 15, aliases: ["filter transactions", "merchant search"] },
        ],
      },
      {
        id: "fin_budgeting",
        name: "Budgeting & Expense Breakdown Charts",
        description: "Charts showing monthly spending distribution by category (Food, Utilities, Travel).",
        mandatory: true,
        weight: 30,
        keywords: ["budget", "spending", "expense chart", "pie chart", "breakdown"],
        expectedComponents: ["ExpenseChart", "BudgetProgress"],
        subFeatures: [
          { name: "Spending Distribution Chart", weight: 30, aliases: ["budget chart", "spending breakdown"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Financial Tracking & Calculations", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Financial Aesthetics", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Data Security", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Analytics": {
    problemStatement: {
      title: "Real-Time Data & Web Analytics Engine",
      description: "Web analytics platform displaying real-time traffic streams, country maps, conversion funnels, and metrics.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "analytics_stream",
        name: "Real-Time Traffic & Visitor Stream",
        description: "Live visitor count gauge, current active pages list, and real-time event log.",
        mandatory: true,
        weight: 35,
        keywords: ["analytics", "visitors", "traffic", "real-time", "active users", "views"],
        expectedComponents: ["RealtimeGauge", "VisitorStream", "LiveEventFeed"],
        subFeatures: [
          { name: "Live Active Visitors Counter", weight: 20, aliases: ["live counter", "active now"] },
          { name: "Top Active Pages Stream", weight: 15, aliases: ["pages list", "referrers"] },
        ],
      },
      {
        id: "analytics_charts",
        name: "Traffic & Funnel Visualizations",
        description: "Interactive time series traffic graphs, bounce rate trends, and conversion funnels.",
        mandatory: true,
        weight: 40,
        keywords: ["traffic graph", "bounce rate", "funnel", "conversion", "chart"],
        expectedComponents: ["TrafficChart", "ConversionFunnel", "BounceRateWidget"],
        expectedPackages: ["recharts", "chart.js", "d3"],
        subFeatures: [
          { name: "Page View & Visitor Line Chart", weight: 20, aliases: ["traffic line chart", "views graph"] },
          { name: "Conversion Funnel Chart", weight: 20, aliases: ["funnel widget", "conversion steps"] },
        ],
      },
      {
        id: "analytics_geo",
        name: "Geographic & Device Breakdown",
        description: "Breakdown of visitors by country, browser (Chrome, Safari), and device type.",
        mandatory: true,
        weight: 25,
        keywords: ["country", "device", "browser", "geo", "location"],
        expectedComponents: ["GeoBreakdown", "DeviceDistribution"],
        subFeatures: [
          { name: "Country & Device Distribution Cards", weight: 25, aliases: ["geo table", "device chart"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Analytics Visualizations & Data Processing", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI Layout & Chart Polish", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Architecture & Code Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Blog": {
    problemStatement: {
      title: "Content Blog & Publishing Platform",
      description: "Blog platform featuring post listings, article reader, category tags, author cards, and search.",
      difficulty: "Beginner",
    },
    requiredFeatures: [
      {
        id: "blog_feed",
        name: "Article Feed & Featured Post",
        description: "Hero featured post card followed by grid of recent articles with thumbnail, date, and read time.",
        mandatory: true,
        weight: 40,
        keywords: ["blog", "post", "article", "featured", "read time", "author"],
        expectedComponents: ["PostCard", "FeaturedPost", "PostGrid"],
        subFeatures: [
          { name: "Featured Hero Post", weight: 20, aliases: ["featured article", "banner post"] },
          { name: "Article Grid & Thumbnails", weight: 20, aliases: ["posts list", "article cards"] },
        ],
      },
      {
        id: "blog_reader",
        name: "Article Reading Page & Content Renderer",
        description: "Formatted article reader page with typography, code blocks, images, and author bio.",
        mandatory: true,
        weight: 35,
        keywords: ["read article", "post detail", "markdown", "typography", "author bio"],
        expectedComponents: ["PostReader", "ArticleBody", "AuthorCard"],
        subFeatures: [
          { name: "Article Body & Typography", weight: 20, aliases: ["article content", "markdown reader"] },
          { name: "Author Bio & Publication Date", weight: 15, aliases: ["author info", "reading time"] },
        ],
      },
      {
        id: "blog_categories",
        name: "Category Filter & Search",
        description: "Tag cloud or category pills to filter articles by topic.",
        mandatory: true,
        weight: 25,
        keywords: ["category", "tags", "filter", "search blog", "topics"],
        expectedComponents: ["CategoryPills", "BlogSearch"],
        subFeatures: [
          { name: "Category Filter & Tag Cloud", weight: 25, aliases: ["tags list", "topic filter"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "HTML"], required: ["HTML", "JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Content Presentation & Features", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "Typography & Layout Excellence", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Quality & Responsiveness", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Documentation Site": {
    problemStatement: {
      title: "Technical Documentation Portal",
      description: "Documentation portal featuring multi-level sidebar navigation, search bar, syntax highlighted code blocks, and markdown/MDX rendering.",
      difficulty: "Intermediate",
    },
    requiredFeatures: [
      {
        id: "docs_nav",
        name: "Sidebar Navigation Tree",
        description: "Collapsible documentation tree with active section indicators and category headers.",
        mandatory: true,
        weight: 35,
        keywords: ["docs", "sidebar", "tree", "navigation", "sections", "getting started"],
        expectedComponents: ["DocsSidebar", "NavTree", "DocsHeader"],
        subFeatures: [
          { name: "Hierarchical Sidebar Tree", weight: 20, aliases: ["docs nav", "section tree"] },
          { name: "Active Page Highlighter", weight: 15, aliases: ["current section", "active link"] },
        ],
      },
      {
        id: "docs_content",
        name: "Markdown / MDX Content Reader",
        description: "Clean technical content body with code snippet highlighting and copy buttons.",
        mandatory: true,
        weight: 40,
        keywords: ["markdown", "mdx", "code block", "copy code", "syntax highlighting"],
        expectedComponents: ["DocsContent", "CodeBlock", "CopyButton"],
        expectedPackages: ["@mdx-js/react", "prismjs", "shiki"],
        subFeatures: [
          { name: "Content Renderer & Code Snippets", weight: 25, aliases: ["code container", "docs body"] },
          { name: "Copy Code Snippet Button", weight: 15, aliases: ["copy button", "clipboard"] },
        ],
      },
      {
        id: "docs_search",
        name: "Documentation Search & TOC",
        description: "On-page Table of Contents (TOC) and doc search input.",
        mandatory: true,
        weight: 25,
        keywords: ["toc", "table of contents", "search docs", "algolia"],
        expectedComponents: ["TableOfContents", "DocSearch"],
        subFeatures: [
          { name: "Table of Contents & Quick Search", weight: 25, aliases: ["on this page", "doc search"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "HTML"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Documentation Structure & Usability", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "Navigation & Typography Excellence", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Quality & Responsiveness", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Developer Portfolio": {
    problemStatement: {
      title: "Developer Portfolio & Showcase",
      description: "Personal developer portfolio highlighting bio, technical skill badges, project gallery, experience timeline, and contact section.",
      difficulty: "Beginner",
    },
    requiredFeatures: [
      {
        id: "port_hero",
        name: "Bio & Introduction Hero",
        description: "Personal greeting, job title (e.g., Full Stack Engineer), bio summary, and resume download link.",
        mandatory: true,
        weight: 35,
        keywords: ["portfolio", "developer", "hero", "about me", "resume", "bio"],
        expectedComponents: ["PortfolioHero", "AboutMe", "BioSection"],
        subFeatures: [
          { name: "Developer Greeting & Bio", weight: 20, aliases: ["hero section", "about text"] },
          { name: "Resume Download / CTA", weight: 15, aliases: ["download cv", "contact me cta"] },
        ],
      },
      {
        id: "port_projects",
        name: "Project Gallery & Tech Skills",
        description: "Interactive project cards with screenshots, live demo links, GitHub links, and skill badges.",
        mandatory: true,
        weight: 40,
        keywords: ["projects", "work", "skills", "tech stack", "live demo", "github link"],
        expectedComponents: ["ProjectGrid", "ProjectCard", "SkillBadges"],
        subFeatures: [
          { name: "Project Cards & External Links", weight: 25, aliases: ["projects showcase", "work samples"] },
          { name: "Tech Stack Skill Badges", weight: 15, aliases: ["skills grid", "tech icons"] },
        ],
      },
      {
        id: "port_contact",
        name: "Experience Timeline & Contact Form",
        description: "Work history timeline and functional contact form with social media profile links.",
        mandatory: true,
        weight: 25,
        keywords: ["experience", "timeline", "contact", "social links", "linkedin", "github"],
        expectedComponents: ["ExperienceTimeline", "ContactForm", "SocialLinks"],
        subFeatures: [
          { name: "Experience / Career Timeline", weight: 15, aliases: ["work history", "timeline item"] },
          { name: "Contact Form & Social Media Links", weight: 10, aliases: ["contact form", "social icons"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "HTML", "TailwindCSS"], required: ["HTML", "CSS"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Portfolio Presentation & Projects Showcase", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Modern Aesthetics", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Portfolio": {
    problemStatement: {
      title: "Personal / Agency Portfolio",
      description: "Creative portfolio showcase featuring work gallery, client testimonials, and contact form.",
      difficulty: "Beginner",
    },
    requiredFeatures: [
      {
        id: "gen_port_hero",
        name: "Hero Section & Value Tagline",
        description: "High impact hero section with introduction headline and portfolio statement.",
        mandatory: true,
        weight: 35,
        keywords: ["portfolio", "hero", "showcase", "intro", "work"],
        expectedComponents: ["Hero", "IntroSection"],
        subFeatures: [
          { name: "Hero Introduction Headline", weight: 35, aliases: ["hero title", "intro text"] },
        ],
      },
      {
        id: "gen_port_gallery",
        name: "Work Gallery & Filter",
        description: "Gallery layout of work samples with category filtering.",
        mandatory: true,
        weight: 40,
        keywords: ["gallery", "portfolio grid", "work items", "filter"],
        expectedComponents: ["WorkGallery", "PortfolioGrid"],
        subFeatures: [
          { name: "Work Gallery Grid", weight: 40, aliases: ["portfolio cards", "gallery items"] },
        ],
      },
      {
        id: "gen_port_contact",
        name: "Contact Section",
        description: "Contact form or email inquiry link.",
        mandatory: true,
        weight: 25,
        keywords: ["contact", "email", "get in touch"],
        expectedComponents: ["ContactSection", "ContactForm"],
        subFeatures: [
          { name: "Contact Form", weight: 25, aliases: ["contact input", "inquiry form"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "HTML"], required: ["HTML", "CSS"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Visual Aesthetics & Design", weight: 50, maxMarks: 50, passingMarks: 30 },
        { name: "Work Presentation & UX", weight: 30, maxMarks: 30, passingMarks: 18 },
        { name: "Code Structure", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "Clone Project": {
    problemStatement: {
      title: "Full Brand / Web App Clone Project",
      description: "Replica of an existing popular platform (e.g. Netflix, Spotify, Twitter/X, Airbnb, YouTube clone) matching target layout and core functionality.",
      difficulty: "Advanced",
    },
    requiredFeatures: [
      {
        id: "clone_layout",
        name: "Target Brand Navigation & Header Layout",
        description: "Header navigation, logo positioning, side menu, and branding styled after the cloned platform.",
        mandatory: true,
        weight: 35,
        keywords: ["clone", "replica", "brand navbar", "target logo", "header"],
        expectedComponents: ["BrandNavbar", "CloneHeader", "TargetSidebar"],
        subFeatures: [
          { name: "Brand Header & Logo replica", weight: 20, aliases: ["brand nav", "header clone"] },
          { name: "Main Brand Layout Grid", weight: 15, aliases: ["clone container", "brand layout"] },
        ],
      },
      {
        id: "clone_core_feed",
        name: "Core Brand Interactive Feed / Content Grid",
        description: "Replica of primary feed (e.g. video list for YouTube, movie row for Netflix, post feed for Twitter).",
        mandatory: true,
        weight: 40,
        keywords: ["feed", "movie row", "video list", "tweets", "posts", "cards"],
        expectedComponents: ["MovieRow", "VideoGrid", "TweetFeed", "ContentGrid"],
        subFeatures: [
          { name: "Interactive Media / Feed Grid", weight: 25, aliases: ["cards grid", "feed items"] },
          { name: "Item Detail Modal / Player", weight: 15, aliases: ["preview modal", "detail drawer"] },
        ],
      },
      {
        id: "clone_interactivity",
        name: "Simulated Interactivity & Search",
        description: "Search bar, like/bookmark buttons, and interactive state management matching target platform.",
        mandatory: true,
        weight: 25,
        keywords: ["like button", "search input", "favorite", "bookmark", "interactive"],
        expectedComponents: ["SearchBar", "LikeButton", "ActionToolbar"],
        subFeatures: [
          { name: "Target Interactivity Controls", weight: 25, aliases: ["action bar", "interactive buttons"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "TailwindCSS"], required: ["JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Clone Fidelity & Feature Completeness", weight: 45, maxMarks: 45, passingMarks: 25 },
        { name: "UI/UX & Brand Aesthetics", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Quality", weight: 20, maxMarks: 20, passingMarks: 10 },
      ],
    },
  },

  "General Web App": {
    problemStatement: {
      title: "General Frontend Web Application",
      description: "Standard web application evaluated against standard frontend quality, feature completeness, and architectural best practices.",
      difficulty: "Intermediate",
    },
    requiredFeatures: [
      {
        id: "gen_core_app",
        name: "Core Application Functionality",
        description: "Primary user workflow, interactive UI elements, and state management.",
        mandatory: true,
        weight: 50,
        keywords: ["app", "main", "feature", "state", "interactive"],
        subFeatures: [
          { name: "Primary Component Workflow", weight: 30, aliases: ["main feature", "app container"] },
          { name: "Interactive UI Elements", weight: 20, aliases: ["form inputs", "buttons"] },
        ],
      },
      {
        id: "gen_ui_layout",
        name: "UI Layout & Navigation",
        description: "Header navigation, responsive layout, and clean visual styling.",
        mandatory: true,
        weight: 50,
        keywords: ["layout", "navbar", "header", "footer", "responsive"],
        subFeatures: [
          { name: "Responsive Page Layout", weight: 30, aliases: ["grid", "flex layout"] },
          { name: "Navigation Header", weight: 20, aliases: ["navbar", "nav header"] },
        ],
      },
    ],
    techStackRules: { allowed: ["React", "Next.js", "Vue", "Angular", "HTML"], required: ["HTML", "JavaScript"], restricted: [] },
    scoringSystem: {
      categories: [
        { name: "Feature Completeness & Functionality", weight: 40, maxMarks: 40, passingMarks: 20 },
        { name: "UI/UX & Responsiveness", weight: 35, maxMarks: 35, passingMarks: 20 },
        { name: "Code Architecture & Quality", weight: 25, maxMarks: 25, passingMarks: 12 },
      ],
    },
  },
};
