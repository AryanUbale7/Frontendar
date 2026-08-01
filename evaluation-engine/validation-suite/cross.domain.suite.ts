import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";
import { PROJECT_BLUEPRINTS } from "../intelligence-engine/project-classifier-engine/project-blueprints.registry";
import { ProjectType } from "../intelligence-engine/project-classifier-engine/project-type.interface";

export interface CrossDomainComparison {
  id: string;
  domain: string;
  quality: "good" | "fake";
  blueprintTitle: string;
  expectedMin: number;
  expectedMax: number;
  actualScore: number;
  status: string;
  inRange: boolean;
  featureCoveragePercent: number;
  rejectedClaims: number;
}

export interface CrossDomainReport {
  timestamp: string;
  totalFixtures: number;
  passedFixtures: number;
  accuracyPercent: number;
  goodFixturesPassed: number;
  fakeFixturesRejected: number;
  averageGoodScore: number;
  averageFakeScore: number;
  comparisons: CrossDomainComparison[];
}

interface CrossDomainFixture {
  id: string;
  domain: ProjectType;
  quality: "good" | "fake";
  expectedMin: number;
  expectedMax: number;
  setup: (dir: string) => void;
}

function write(dir: string, rel: string, content: string): void {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const FIXTURES: CrossDomainFixture[] = [
  // ---------------- TODO APP ----------------
  {
    id: "todo_good",
    domain: "Todo App",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "todo-app", dependencies: { react: "^18.0.0" } }));
      write(
        dir,
        "README.md",
        "# Task Manager\n\nFeatures:\n- Create tasks, toggle complete, delete, edit tasks\n- Filter by active/completed status\n- localStorage persistence"
      );
      write(dir, "src/AddTodo.jsx", "import { useState } from 'react'; export default function AddTodo({ onAdd }) { const [text, setText] = useState(''); return <input value={text} onChange={(e) => setText(e.target.value)} placeholder=\"Add task\" /><button onClick={() => onAdd(text)}>Add</button>; }");
      write(dir, "src/TodoList.jsx", "export default function TodoList({ todos }) { return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>; }");
      write(dir, "src/TodoItem.jsx", "export default function TodoItem({ todo, onToggle, onDelete }) { return <li><input type=\"checkbox\" checked={todo.done} onChange={() => onToggle(todo.id)} />{todo.text}<button onClick={() => onDelete(todo.id)}>Delete</button></li>; }");
      write(dir, "src/TodoFilter.jsx", "export default function TodoFilter({ active, setActive }) { return <div><button onClick={() => setActive('all')}>All</button><button onClick={() => setActive('active')}>Active</button><button onClick={() => setActive('completed')}>Completed</button></div>; }");
      write(dir, "src/App.jsx", "import { useState, useEffect } from 'react'; import AddTodo from './AddTodo'; import TodoList from './TodoList'; import TodoFilter from './TodoFilter'; export default function App() { const [todos, setTodos] = useState([]); useEffect(() => { localStorage.setItem('todos', JSON.stringify(todos)); }, [todos]); const add = (text) => setTodos([...todos, { id: Date.now(), text, done: false }]); return <div><AddTodo onAdd={add} /><TodoList todos={todos} /><TodoFilter /></div>; }");
    },
  },
  {
    id: "todo_fake",
    domain: "Todo App",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "todo-fake", dependencies: {} }));
      write(dir, "README.md", "# Task Manager\n\nFeatures:\n- Create tasks, toggle complete, delete tasks\n- Status filtering with localStorage persistence\n- Drag & drop reordering\n- Cloud sync via API");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },

  // ---------------- LANDING PAGE ----------------
  {
    id: "landing_good",
    domain: "Landing Page",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "landing-page", dependencies: { react: "^18.0.0" } }));
      write(dir, "README.md", "# Product Landing Page\n\n- Hero section with headline, subtitle and CTA button\n- Feature showcase grid with testimonials and pricing tiers\n- Newsletter subscription form and footer with legal links");
      write(dir, "src/Hero.jsx", "export default function Hero({ onStart }) { return <section className=\"hero\"><h1>Revolutionary Product</h1><p>Subtitle here</p><button onClick={onStart}>Get Started</button></section>; }");
      write(dir, "src/FeatureCard.jsx", "export default function FeatureCard({ title }) { return <div className=\"feature-card\">{title}</div>; }");
      write(dir, "src/FeatureGrid.jsx", "import FeatureCard from './FeatureCard'; export default function FeatureGrid() { return <div className=\"grid\"><FeatureCard title=\"Feature A\" /><FeatureCard title=\"Feature B\" /><FeatureCard title=\"Feature C\" /></div>; }");
      write(dir, "src/Testimonials.jsx", "export default function Testimonials() { return <div><blockquote>Great product!</blockquote><cite>Jane Doe</cite></div>; }");
      write(dir, "src/PricingSection.jsx", "export default function PricingSection() { return <div className=\"pricing\"><div className=\"plan\">Basic $9</div><div className=\"plan\">Pro $29</div></div>; }");
      write(dir, "src/Newsletter.jsx", "import { useState } from 'react'; export default function Newsletter({ onSubscribe }) { const [email, setEmail] = useState(''); return <form onSubmit={(e) => { e.preventDefault(); onSubscribe(email); }}><input type=\"email\" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=\"Email address\" /><button>Subscribe</button></form>; }");
      write(dir, "src/ContactForm.jsx", "import { useState } from 'react'; export default function ContactForm() { const [name, setName] = useState(''); const [message, setMessage] = useState(''); return <form><input value={name} onChange={(e) => setName(e.target.value)} placeholder=\"Name\" /><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder=\"Message\" /><button>Send</button></form>; }");
      write(dir, "src/Footer.jsx", "export default function Footer() { return <footer><nav><a href=\"#privacy\">Privacy</a><a href=\"#terms\">Terms</a></nav><p>Copyright 2026 Product Inc.</p></footer>; }");
      write(dir, "src/App.jsx", "import Hero from './Hero'; import FeatureGrid from './FeatureGrid'; import Testimonials from './Testimonials'; import PricingSection from './PricingSection'; import Newsletter from './Newsletter'; import ContactForm from './ContactForm'; import Footer from './Footer'; export default function App() { return <main><Hero onStart={() => alert('start')} /><FeatureGrid /><Testimonials /><PricingSection /><Newsletter onSubscribe={(e) => console.log(e)} /><ContactForm /><Footer /></main>; }");
    },
  },
  {
    id: "landing_fake",
    domain: "Landing Page",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "landing-fake", dependencies: {} }));
      write(dir, "README.md", "# Product Landing Page\n\nFeatures:\n- Hero with animated headline\n- Testimonials carousel and pricing tiers\n- Newsletter signup with CRM integration");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },

  // ---------------- E-COMMERCE ----------------
  {
    id: "commerce_good",
    domain: "E-Commerce",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "shop", dependencies: { react: "^18.0.0" } }));
      write(dir, "README.md", "# Shop\n\n- Product listing with category filter\n- Shopping cart with add/remove and quantities\n- Checkout flow with order summary");
      write(dir, "src/ProductCard.jsx", "export default function ProductCard({ product, onAdd }) { return <div className=\"product\"><h3>{product.name}</h3><p>${product.price}</p><span className=\"rating\">4.5 stars</span><button onClick={() => onAdd(product)}>Add to Cart</button></div>; }");
      write(dir, "src/ProductGrid.jsx", "import ProductCard from './ProductCard'; export default function ProductGrid({ products, onAdd }) { return <div className=\"grid\">{products.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}</div>; }");
      write(dir, "src/CategoryFilter.jsx", "export default function CategoryFilter({ categories, selected, onSelect }) { return <aside>{categories.map(c => <button key={c} className={selected === c ? 'active' : ''} onClick={() => onSelect(c)}>{c}</button>)}</aside>; }");
      write(dir, "src/SearchBar.jsx", "import { useState } from 'react'; export default function SearchBar({ onSearch }) { const [q, setQ] = useState(''); return <input type=\"search\" value={q} onChange={(e) => { setQ(e.target.value); onSearch(e.target.value); }} placeholder=\"Search products\" />; }");
      write(dir, "src/CartItem.jsx", "export default function CartItem({ item, onRemove }) { return <li className=\"cart-item\">{item.name} x{item.qty}<button onClick={() => onRemove(item.id)}>Remove</button></li>; }");
      write(dir, "src/QuantitySelector.jsx", "export default function QuantitySelector({ qty, onChange }) { return <div><button onClick={() => onChange(qty - 1)}>-</button><span>{qty}</span><button onClick={() => onChange(qty + 1)}>+</button></div>; }");
      write(dir, "src/Cart.jsx", "import CartItem from './CartItem'; import QuantitySelector from './QuantitySelector'; export default function Cart({ items, onRemove, onChangeQty }) { const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0); return <aside><h2>Cart</h2><ul>{items.map(i => <CartItem key={i.id} item={i} onRemove={onRemove} />)}</ul><p>Subtotal: ${subtotal}</p></aside>; }");
      write(dir, "src/CheckoutForm.jsx", "import { useState } from 'react'; export default function CheckoutForm({ onSubmit }) { const [address, setAddress] = useState(''); return <form onSubmit={(e) => { e.preventDefault(); onSubmit(address); }}><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder=\"Shipping address\" /><input placeholder=\"Payment details\" /><button>Place Order</button></form>; }");
      write(dir, "src/OrderConfirmation.jsx", "export default function OrderConfirmation({ order }) { return <div className=\"receipt\"><h2>Order Confirmed</h2><p>Order #{order.id}</p><p>Total: ${order.total}</p></div>; }");
      write(dir, "src/App.jsx", "import { useState } from 'react'; import ProductGrid from './ProductGrid'; import CategoryFilter from './CategoryFilter'; import SearchBar from './SearchBar'; import Cart from './Cart'; import CheckoutForm from './CheckoutForm'; import OrderConfirmation from './OrderConfirmation'; export default function App() { const products = [{ id: 1, name: 'Widget', price: 10, category: 'Gadgets' }]; const [items, setItems] = useState([]); const [placed, setPlaced] = useState(null); const add = (p) => setItems([...items, { ...p, qty: 1 }]); const changeQty = (id, qty) => setItems(items.map(i => i.id === id ? { ...i, qty } : i)); const place = () => setPlaced({ id: 42, total: items.reduce((s, i) => s + i.price * i.qty, 0) }); return <div><SearchBar onSearch={(q) => console.log(q)} /><CategoryFilter categories={['Gadgets', 'Gear']} selected=\"Gadgets\" onSelect={(c) => console.log(c)} /><ProductGrid products={products} onAdd={add} /><Cart items={items} onChangeQty={changeQty} /><CheckoutForm onSubmit={place} />{placed && <OrderConfirmation order={placed} />}</div>; }");
    },
  },
  {
    id: "commerce_fake",
    domain: "E-Commerce",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "shop-fake", dependencies: {} }));
      write(dir, "README.md", "# Shop\n\nFeatures:\n- Product catalog with search and filters\n- Cart with Stripe checkout integration\n- Order tracking and email receipts");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },

  // ---------------- CHAT APP ----------------
  {
    id: "chat_good",
    domain: "Chat App",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "chat", dependencies: { react: "^18.0.0", "socket.io-client": "^4.0.0" } }));
      write(dir, "README.md", "# Chat\n\n- Message thread with bubbles and timestamps\n- Channel sidebar with unread badges\n- Online status indicators");
      write(dir, "src/ChatWindow.jsx", "import MessageItem from './MessageItem'; export default function ChatWindow({ messages }) { return <div className=\"chat-window\">{messages.map(m => <MessageItem key={m.id} message={m} />)}</div>; }");
      write(dir, "src/MessageItem.jsx", "export default function MessageItem({ message }) { return <div className=\"bubble\"><span className=\"sender\">{message.sender}</span><p>{message.text}</p><time>{message.time}</time></div>; }");
      write(dir, "src/MessageInput.jsx", "import { useState } from 'react'; export default function MessageInput({ onSend }) { const [text, setText] = useState(''); return <div><input value={text} onChange={(e) => setText(e.target.value)} /><button onClick={() => onSend(text)}>Send</button></div>; }");
      write(dir, "src/ChannelList.jsx", "export default function ChannelList({ channels }) { return <aside>{channels.map(c => <div key={c.id} className=\"channel\">{c.name}<span className=\"badge\">2</span></div>)}</aside>; }");
      write(dir, "src/ContactList.jsx", "export default function ContactList({ contacts }) { return <ul className=\"contacts\">{contacts.map(u => <li key={u.id}>{u.name}</li>)}</ul>; }");
      write(dir, "src/UnreadBadge.jsx", "export default function UnreadBadge({ count }) { return count > 0 ? <span className=\"unread\">{count} new</span> : null; }");
      write(dir, "src/UserAvatar.jsx", "export default function UserAvatar({ user }) { return <img src={user.avatar} alt={user.name} className=\"avatar\" />; }");
      write(dir, "src/StatusIndicator.jsx", "export default function StatusIndicator({ online }) { return <span className={online ? 'dot-online' : 'dot-offline'}>{online ? 'Online' : 'Offline'}</span>; }");
      write(dir, "src/App.jsx", "import { useState } from 'react'; import ChatWindow from './ChatWindow'; import MessageInput from './MessageInput'; import ChannelList from './ChannelList'; import ContactList from './ContactList'; import UnreadBadge from './UnreadBadge'; import UserAvatar from './UserAvatar'; import StatusIndicator from './StatusIndicator'; export default function App() { const [messages, setMessages] = useState([]); const send = (text) => setMessages([...messages, { id: Date.now(), text, sender: 'Me', time: 'now' }]); return <div><ChannelList channels={[{ id: 1, name: 'general' }]} /><ContactList contacts={[{ id: 1, name: 'Alice' }]} /><UnreadBadge count={2} /><ChatWindow messages={messages} /><MessageInput onSend={send} /><UserAvatar user={{ name: 'Me', avatar: 'a.png' }} /><StatusIndicator online /></div>; }");
    },
  },
  {
    id: "chat_fake",
    domain: "Chat App",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "chat-fake", dependencies: {} }));
      write(dir, "README.md", "# Chat\n\nFeatures:\n- Real-time messaging with websockets\n- Channels, DMs, and unread badges\n- Typing indicators and read receipts");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },

  // ---------------- FINANCE ----------------
  {
    id: "finance_good",
    domain: "Finance",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "finance", dependencies: { react: "^18.0.0" } }));
      write(dir, "README.md", "# Finance Tracker\n\n- Balance cards, wallet overview and bank card preview\n- Transaction list with category filters\n- Spending breakdown charts and budget progress\n- Transfer between accounts");
      write(dir, "src/AccountSummary.jsx", "export default function AccountSummary({ balance, income, expenses }) { return <div className=\"summary\"><div className=\"card\">Balance ${balance}</div><div className=\"card\">Income ${income}</div><div className=\"card\">Expenses ${expenses}</div></div>; }");
      write(dir, "src/BalanceCard.jsx", "export default function BalanceCard({ balance }) { return <div className=\"card\"><h3>Balance</h3><p>{balance}</p></div>; }");
      write(dir, "src/BankCardPreview.jsx", "export default function BankCardPreview({ card }) { return <div className=\"bank-card\"><p>{card.number}</p><p>{card.holder}</p></div>; }");
      write(dir, "src/TransactionTable.jsx", "import TransactionRow from './TransactionRow'; export default function TransactionTable({ txs }) { return <table>{txs.map(t => <TransactionRow key={t.id} t={t} />)}</table>; }");
      write(dir, "src/TransactionRow.jsx", "export default function TransactionRow({ t }) { return <tr><td>{t.description}</td><td><CategoryBadge category={t.category} /></td><td>{t.amount > 0 ? '+' : ''}{t.amount}</td></tr>; }");
      write(dir, "src/CategoryBadge.jsx", "export default function CategoryBadge({ category }) { return <span className=\"badge\">{category}</span>; }");
      write(dir, "src/ExpenseChart.jsx", "export default function ExpenseChart({ data }) { return <div className=\"chart\">{data.map(d => <div key={d.category} className=\"bar\" style={{ height: d.value }} title={d.category}>{d.category}</div>)}</div>; }");
      write(dir, "src/BudgetProgress.jsx", "export default function BudgetProgress({ budget, spent }) { return <div><div className=\"progress\"><span style={{ width: `${(spent / budget) * 100}%` }} /></div><p>{spent} of {budget}</p></div>; }");
      write(dir, "src/Wallet.jsx", "export default function Wallet({ wallets }) { return <div>{wallets.map(w => <div key={w.id} className=\"wallet\">{w.name}: {w.amount}</div>)}</div>; }");
      write(dir, "src/TransferForm.jsx", "import { useState } from 'react'; export default function TransferForm({ onTransfer }) { const [amount, setAmount] = useState(''); return <form onSubmit={(e) => { e.preventDefault(); onTransfer(amount); }}><input type=\"number\" value={amount} onChange={(e) => setAmount(e.target.value)} /><button>Transfer</button></form>; }");
      write(dir, "src/App.jsx", "import { useState } from 'react'; import AccountSummary from './AccountSummary'; import BankCardPreview from './BankCardPreview'; import TransactionTable from './TransactionTable'; import ExpenseChart from './ExpenseChart'; import BudgetProgress from './BudgetProgress'; import TransferForm from './TransferForm'; export default function App() { const [txs, setTxs] = useState([{ id: 1, description: 'Salary', amount: 2000, category: 'Income' }]); const transfer = (amount) => setTxs([...txs, { id: Date.now(), description: 'Transfer', amount: -Number(amount), category: 'Transfer' }]); return <div><AccountSummary balance=\"5000\" income=\"2000\" expenses=\"800\" /><BankCardPreview card={{ number: '**** 4242', holder: 'ARYAN' }} /><TransactionTable txs={txs} /><ExpenseChart data={[{ category: 'Food', value: 300 }, { category: 'Travel', value: 200 }]} /><BudgetProgress budget={1000} spent={500} /><TransferForm onTransfer={transfer} /></div>; }");
    },
  },
  {
    id: "finance_fake",
    domain: "Finance",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "finance-fake", dependencies: {} }));
      write(dir, "README.md", "# Finance Tracker\n\nFeatures:\n- Real-time market data feeds\n- AI-powered spending insights\n- Plaid bank account integration");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },

  // ---------------- HOSPITAL ----------------
  {
    id: "hospital_good",
    domain: "Hospital",
    quality: "good",
    expectedMin: 70,
    expectedMax: 95,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "hospital", dependencies: { react: "^18.0.0" } }));
      write(dir, "README.md", "# Hospital Portal\n\n- Patient records table with search\n- Doctor directory and appointment booking\n- Department cards with emergency contacts");
      write(dir, "src/PatientTable.jsx", "export default function PatientTable({ patients }) { return <table>{patients.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.diagnosis}</td></tr>)}</table>; }");
      write(dir, "src/PatientCard.jsx", "export default function PatientCard({ patient }) { return <div className=\"patient-card\"><h4>{patient.name}</h4><p>{patient.diagnosis}</p></div>; }");
      write(dir, "src/MedicalHistory.jsx", "export default function MedicalHistory({ records }) { return <ul>{records.map(r => <li key={r.id}>{r.date}: {r.note}</li>)}</ul>; }");
      write(dir, "src/PatientModal.jsx", "import { useState } from 'react'; export default function PatientModal({ patient, onSave }) { const [notes, setNotes] = useState(''); return <dialog open><h3>{patient.name}</h3><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder=\"Doctor notes\" /><button onClick={() => onSave(notes)}>Save</button></dialog>; }");
      write(dir, "src/DoctorCard.jsx", "export default function DoctorCard({ doctor }) { return <div className=\"doctor\">{doctor.name} - {doctor.specialty}</div>; }");
      write(dir, "src/AppointmentScheduler.jsx", "import { useState } from 'react'; export default function AppointmentScheduler({ doctors, onBook }) { const [slot, setSlot] = useState(''); return <div><select onChange={(e) => setSlot(e.target.value)}>{doctors.map(d => <option key={d.id}>{d.name}</option>)}</select><button onClick={() => onBook(slot)}>Book Appointment</button></div>; }");
      write(dir, "src/TimeSlotPicker.jsx", "export default function TimeSlotPicker({ slots, selected, onSelect }) { return <div>{slots.map(s => <button key={s} className={selected === s ? 'active' : ''} onClick={() => onSelect(s)}>{s}</button>)}</div>; }");
      write(dir, "src/DepartmentGrid.jsx", "export default function DepartmentGrid() { return <div className=\"grid\"><div className=\"card\">Cardiology</div><div className=\"card\">Pediatrics</div><div className=\"card\">ICU</div></div>; }");
      write(dir, "src/DoctorDirectory.jsx", "export default function DoctorDirectory({ doctors }) { return <ul>{doctors.map(d => <li key={d.id}>{d.name} ({d.specialty})</li>)}</ul>; }");
      write(dir, "src/EmergencyContactBar.jsx", "export default function EmergencyContactBar() { return <div className=\"emergency\"><span>Emergency Hotline: 911</span><span>Ambulance: 108</span></div>; }");
      write(dir, "src/App.jsx", "import { useState } from 'react'; import PatientTable from './PatientTable'; import PatientCard from './PatientCard'; import MedicalHistory from './MedicalHistory'; import PatientModal from './PatientModal'; import DoctorCard from './DoctorCard'; import AppointmentScheduler from './AppointmentScheduler'; import TimeSlotPicker from './TimeSlotPicker'; import DepartmentGrid from './DepartmentGrid'; import DoctorDirectory from './DoctorDirectory'; import EmergencyContactBar from './EmergencyContactBar'; export default function App() { const patients = [{ id: 1, name: 'John', diagnosis: 'Flu' }]; const doctors = [{ id: 1, name: 'Dr Smith', specialty: 'Cardiology' }]; const [appointments, setAppointments] = useState([]); const book = (slot) => setAppointments([...appointments, { doctor: 'Dr Smith', slot }]); return <div><PatientTable patients={patients} /><PatientCard patient={patients[0]} /><MedicalHistory records={[{ id: 1, date: '2026-01-01', note: 'Checkup' }]} /><PatientModal patient={patients[0]} onSave={(n) => console.log(n)} /><DoctorCard doctor={doctors[0]} /><AppointmentScheduler doctors={doctors} onBook={book} /><TimeSlotPicker slots={['9:00', '10:00', '11:00']} selected=\"9:00\" onSelect={(s) => console.log(s)} /><DepartmentGrid /><DoctorDirectory doctors={doctors} /><EmergencyContactBar /></div>; }");
    },
  },
  {
    id: "hospital_fake",
    domain: "Hospital",
    quality: "fake",
    expectedMin: 0,
    expectedMax: 30,
    setup: (dir) => {
      write(dir, "package.json", JSON.stringify({ name: "hospital-fake", dependencies: {} }));
      write(dir, "README.md", "# Hospital Portal\n\nFeatures:\n- Patient records with medical history\n- Doctor appointment booking calendar\n- Emergency hotline and insurance integration");
      write(dir, "src/App.jsx", "export default function App() { return <div>Hello</div>; }");
    },
  },
];

export class CrossDomainValidationSuite {
  private orchestrator = new FAIEOrchestrator();

  public async runCrossDomainValidation(): Promise<CrossDomainReport> {
    const comparisons: CrossDomainComparison[] = [];

    for (const fx of FIXTURES) {
      const dir = path.join(os.tmpdir(), `faie-cross-${fx.id}_${Date.now()}`);
      fs.mkdirSync(dir, { recursive: true });
      const blueprint: KnowledgeBlueprint = PROJECT_BLUEPRINTS[fx.domain];
      try {
        fx.setup(dir);
        const report = await this.orchestrator.evaluate(dir, `https://github.com/cross-domain/${fx.id}`, blueprint);
        const inRange = report.scoreSummary.finalScore >= fx.expectedMin && report.scoreSummary.finalScore <= fx.expectedMax;
        comparisons.push({
          id: fx.id,
          domain: fx.domain,
          quality: fx.quality,
          blueprintTitle: blueprint.problemStatement.title,
          expectedMin: fx.expectedMin,
          expectedMax: fx.expectedMax,
          actualScore: report.scoreSummary.finalScore,
          status: report.status,
          inRange,
          featureCoveragePercent: report.scoreSummary.featureCoveragePercent,
          rejectedClaims: report.rejectedClaims.length,
        });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }

    const passed = comparisons.filter((c) => c.inRange).length;
    const good = comparisons.filter((c) => c.quality === "good");
    const fake = comparisons.filter((c) => c.quality === "fake");

    return {
      timestamp: new Date().toISOString(),
      totalFixtures: comparisons.length,
      passedFixtures: passed,
      accuracyPercent: Math.round((passed / comparisons.length) * 100),
      goodFixturesPassed: good.filter((c) => c.inRange).length,
      fakeFixturesRejected: fake.filter((c) => c.inRange).length,
      averageGoodScore: Math.round(good.reduce((a, c) => a + c.actualScore, 0) / good.length),
      averageFakeScore: Math.round(fake.reduce((a, c) => a + c.actualScore, 0) / fake.length),
      comparisons,
    };
  }
}

async function main() {
  console.log("Running Cross-Domain Validation Fixtures...");
  const suite = new CrossDomainValidationSuite();
  const report = await suite.runCrossDomainValidation();
  console.log("=========================================================================");
  console.log("  CROSS-DOMAIN VALIDATION — FAIE v2 CALIBRATION FIXTURES (Phase 4)");
  console.log("=========================================================================");
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Fixtures: ${report.totalFixtures} | Passed: ${report.passedFixtures} (${report.accuracyPercent}%)`);
  console.log(`Good implementations in range: ${report.goodFixturesPassed}/${report.totalFixtures / 2}`);
  console.log(`Fake implementations rejected: ${report.fakeFixturesRejected}/${report.totalFixtures / 2}`);
  console.log(`Average Good score: ${report.averageGoodScore} | Average Fake score: ${report.averageFakeScore}`);
  console.log("-------------------------------------------------------------------------");
  console.log("Fixture                        | Quality | Expected   | Actual | Match");
  console.log("-------------------------------------------------------------------------");
  report.comparisons.forEach((c) => {
    console.log(`${c.id.padEnd(32)} | ${c.quality.padEnd(7)} | ${String(c.expectedMin).padStart(3)}-${String(c.expectedMax).padEnd(4)} | ${String(c.actualScore).padStart(5)} | ${c.inRange ? "PASS" : "FAIL"}  [${c.blueprintTitle}]`);
  });
  console.log("=========================================================================");
  if (report.accuracyPercent === 100) console.log("Cross-Domain Validation: SUCCESS (ALL PASS)");
  else console.log(`Cross-Domain Validation result: FAILURE (${report.passedFixtures}/${report.totalFixtures})`);
}

main().catch((err) => {
  console.error("Cross-domain suite error:", err);
});
