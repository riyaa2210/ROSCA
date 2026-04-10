import { Link } from "react-router-dom";

const features = [
  {
    icon: "💸",
    title: "Instant Payments",
    desc: "Pay your monthly contribution in seconds with Razorpay — UPI, cards, net banking all supported.",
  },
  {
    icon: "📊",
    title: "Live Tracking",
    desc: "See who has paid, who hasn't, and the total pool amount in real time — no spreadsheets needed.",
  },
  {
    icon: "🔔",
    title: "Smart Reminders",
    desc: "Automatic email reminders go out before the due date so no one misses their turn.",
  },
  {
    icon: "🔒",
    title: "Bank-Grade Security",
    desc: "JWT auth, encrypted passwords, rate limiting and HTTPS keep your money and data safe.",
  },
  {
    icon: "👥",
    title: "Group Management",
    desc: "Create a group, invite friends via link or email, and manage everything from one dashboard.",
  },
  {
    icon: "🏆",
    title: "Fair Payout System",
    desc: "Random or manual payout order — every member gets their turn, tracked transparently.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create a Group",
    desc: "Set the monthly amount, number of members, and duration. Share the invite link.",
  },
  {
    num: "02",
    title: "Members Join",
    desc: "Friends and family join via your invite link or email. No app download needed.",
  },
  {
    num: "03",
    title: "Contribute Monthly",
    desc: "Everyone pays their share each month through our secure Razorpay integration.",
  },
  {
    num: "04",
    title: "Receive Your Payout",
    desc: "Each month one member receives the full pool. Everyone wins — one at a time.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Small Business Owner",
    avatar: "PS",
    text: "Bhishi helped our family group save ₹1.2L together. No more WhatsApp confusion — everything is tracked automatically!",
  },
  {
    name: "Rahul Desai",
    role: "Software Engineer",
    avatar: "RD",
    text: "The reminders and payment tracking are a game changer. Our office Bhishi group runs itself now.",
  },
  {
    name: "Sunita Patil",
    role: "Teacher",
    avatar: "SP",
    text: "Simple, clean, and trustworthy. I love that I can see the payout schedule and everyone's payment status.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Bhishi
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors px-4 py-2">
              Login
            </Link>
            <Link to="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity shadow-md shadow-indigo-200 dark:shadow-none">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-200 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -top-20 -right-40 w-[500px] h-[500px] bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-100 dark:border-indigo-800">
            🚀 Trusted by 10,000+ groups across India
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
            Save Together,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Grow Together
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The modern way to run your Bhishi group. Collect contributions, track payments, and manage payouts — all in one beautiful app.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-indigo-300/40 dark:shadow-indigo-900/40 text-base"
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-semibold px-8 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md transition-all text-base"
            >
              Login to Dashboard
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
            {["₹50Cr+ pooled", "10K+ groups", "99.9% uptime", "Razorpay secured"].map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Hero card mockup */}
        <div className="relative max-w-3xl mx-auto mt-16">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-indigo-100 dark:shadow-indigo-900/20 border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Group</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">Family Bhishi 2025</p>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Monthly Pool", value: "₹50,000" },
                { label: "Members", value: "10/10" },
                { label: "Month", value: "4 of 10" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              {[
                { name: "Priya S.", paid: true },
                { name: "Rahul D.", paid: true },
                { name: "Sunita P.", paid: false },
                { name: "Amit K.", paid: true },
              ].map(({ name, paid }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {paid ? "✓ Paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 px-4 py-3 hidden sm:flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-xs text-gray-400">This month's payout</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Rahul D. — ₹50,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Everything your group needs
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
              Built for Indian families, friends, and colleagues who trust each other with their savings.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Process</span>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              How Bhishi works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
              Get your group up and running in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800" />
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg relative z-10 ${
                  i === 0 ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/40" :
                  i === 1 ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200 dark:shadow-purple-900/40" :
                  i === 2 ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-200 dark:shadow-pink-900/40" :
                  "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200 dark:shadow-orange-900/40"
                }`}>
                  {num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              Loved by thousands
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, avatar, text }) => (
              <div key={name} className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 transition-all duration-300">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to start your Bhishi group?
              </h2>
              <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
                Join thousands of Indians who are saving smarter together. Free to start, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl text-base"
                >
                  Create Free Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors text-base"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Bhishi
            </span>
          </div>
          <p className="text-sm text-gray-400">© 2025 Bhishi App. Built with ❤️ for India.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
