import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import BlobBackground from "../components/ui/BlobBackground";
import {
  FiArrowRight, FiShield, FiUsers, FiBell,
  FiTrendingUp, FiCreditCard, FiStar,
} from "react-icons/fi";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: FiCreditCard, title: "Instant Payments",    desc: "Pay via UPI, cards, or net banking through Razorpay in seconds.",       color: "from-brand-500 to-purple-600" },
  { icon: FiTrendingUp, title: "Live Tracking",        desc: "Real-time payment status for every member — no spreadsheets.",          color: "from-emerald-500 to-teal-500" },
  { icon: FiBell,       title: "Smart Reminders",      desc: "AI-powered reminders sent before due dates so no one misses a turn.",   color: "from-saffron-500 to-pink-500" },
  { icon: FiShield,     title: "Bank-Grade Security",  desc: "JWT auth, bcrypt, HMAC-SHA256 payment verification, rate limiting.",    color: "from-sky-500 to-cyan-500" },
  { icon: FiUsers,      title: "Group Management",     desc: "Create groups, invite via link or email, manage payout order easily.",  color: "from-violet-500 to-purple-600" },
  { icon: FiStar,       title: "Fair Payout System",   desc: "Random or manual payout order — transparent and dispute-free.",        color: "from-amber-500 to-orange-500" },
];

const STEPS = [
  { n: "01", title: "Create a Group",    desc: "Set amount, members, duration. Share the invite link.",       color: "bg-brand-600" },
  { n: "02", title: "Members Join",      desc: "Friends join via link or email — no app download needed.",    color: "bg-purple-600" },
  { n: "03", title: "Contribute Monthly",desc: "Everyone pays their share via Razorpay each month.",          color: "bg-saffron-500" },
  { n: "04", title: "Receive Payout",    desc: "One member gets the full pool each month. Everyone wins.",    color: "bg-emerald-600" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma",  role: "Small Business Owner", text: "SaveSangam helped our family group save ₹1.2L together. No more WhatsApp confusion!", avatar: "PS" },
  { name: "Rahul Desai",   role: "Software Engineer",    text: "The reminders and payment tracking are a game changer. Our office Bhishi runs itself.", avatar: "RD" },
  { name: "Sunita Patil",  role: "Teacher",              text: "Simple, clean, and trustworthy. I love seeing the payout schedule and payment status.", avatar: "SP" },
];

/* ── Animated headline words ─────────────────────────────────────────────── */
const words = ["Save", "Together.", "Grow", "Together."];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a14] overflow-x-hidden">
      <BlobBackground />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#0a0a14]/80 backdrop-blur-xl border-b border-gray-100/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-md shadow-brand-200">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="font-black text-lg text-gray-900 dark:text-white">SaveSangam</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            {["Features", "How it works", "Testimonials"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="hover:text-brand-600 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 transition-colors px-3 py-2">Login</Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6">
        <motion.div style={{ y: heroY }} className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300
              text-xs font-semibold px-4 py-2 rounded-full border border-brand-100 dark:border-brand-800 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />
            Trusted by 10,000+ groups across India
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6">
            {words.map((word, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className={`inline-block mr-3 ${i % 2 === 1 ? "gradient-text" : "text-gray-900 dark:text-white"}`}>
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            The modern way to run your Bhishi group. Collect contributions, track payments, and manage payouts — all in one beautiful app.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
              Start for Free <FiArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
              Login to Dashboard
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {["₹50Cr+ pooled", "10K+ groups", "99.9% uptime", "Razorpay secured"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{s}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero mockup card */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
          className="max-w-2xl mx-auto mt-16">
          <div className="glass p-6 sm:p-8 relative">
            {/* Floating badge */}
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 glass px-4 py-2.5 hidden sm:flex items-center gap-2 shadow-xl">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-xs text-gray-400">This month's payout</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Rahul D. — ₹50,000</p>
              </div>
            </motion.div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Active Group</p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">Family Bhishi 2025</p>
              </div>
              <span className="chip-active">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[["Monthly Pool", "₹50,000"], ["Members", "10/10"], ["Month", "4 of 10"]].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className="text-base font-black text-gray-900 dark:text-white">{v}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[["Priya S.", true], ["Rahul D.", true], ["Sunita P.", false], ["Amit K.", true]].map(([name, paid]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                  </div>
                  <span className={paid ? "chip-paid" : "chip-pending"}>{paid ? "✓ Paid" : "Pending"}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">Everything your group needs</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">Built for Indian families, friends, and colleagues who trust each other with their savings.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(0,0,0,0.1)" }}
                className="glass p-7 group cursor-default">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50/80 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">How SaveSangam works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-brand-200 via-purple-200 to-emerald-200 dark:from-brand-800 dark:via-purple-800 dark:to-emerald-800" />
            {STEPS.map(({ n, title, desc, color }, i) => (
              <motion.div key={n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 ${color} rounded-3xl flex items-center justify-center text-white font-black text-2xl mb-5 shadow-xl relative z-10`}>
                  {n}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">Loved by thousands</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text, avatar }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass p-7">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-brand-600 via-purple-600 to-saffron-500 rounded-4xl p-12 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to start your Bhishi group?</h2>
              <p className="text-brand-100 mb-8 max-w-xl mx-auto">Join thousands of Indians saving smarter together. Free to start.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-600 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-colors shadow-xl text-base">
                  Create Free Account <FiArrowRight size={16} />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors text-base">
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800/60 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="font-black text-gray-900 dark:text-white">SaveSangam</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 SaveSangam. Built with ❤️ for India.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hover:text-brand-600 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
