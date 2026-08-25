import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DiaLogo } from '../components/Brand/Logo';
import { DEMO_MODE } from '../utils/demo';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLayout, setHasLayout] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Check auth and layout status
    setIsLoggedIn(DEMO_MODE || !!localStorage.getItem('dia_token'));
    setHasLayout(!!localStorage.getItem('dia_saved_layout'));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#c7d7ee]">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
          <div className="flex items-center space-x-3 cursor-pointer z-10">
            <DiaLogo size={36} />
          </div>

          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-[#274F91] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-[#274F91] transition-colors">How it works</a>
            <a href="#security" className="text-sm font-semibold text-slate-600 hover:text-[#274F91] transition-colors">Security</a>
          </div>

          <div className="flex items-center space-x-4 z-10">
            {isLoggedIn ? (
              <Link
                to={hasLayout ? "/view" : "/builder"}
                className="btn-brand text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#274F91]/25 hover:-translate-y-0.5"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-slate-600 hover:text-[#274F91] transition-colors px-2">Sign In</Link>
                <Link
                  to="/auth"
                  className="btn-brand text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#274F91]/25 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex justify-center items-center flex-col px-6 text-center">
        {/* Abstract Background Meshes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#274F91]/15 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-[#4A7BC8]/15 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>

        <div className="inline-flex items-center space-x-2 bg-[#EDF1F8] border border-[#d7e2f2] rounded-full px-4 py-1.5 mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A7BC8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#274F91]"></span>
          </span>
          <span className="text-xs font-bold text-[#274F91] tracking-wide uppercase">Zero Data Retention Architecture</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
          The Dashboard Builder for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#274F91] to-[#4A7BC8]">Enterprise Privacy.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Design stunning, highly-interactive analytics dashboards in minutes. Your client's data never leaves their browser. Full GDPR & ZDR compliance built-in.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link
            to={isLoggedIn ? (hasLayout ? "/view" : "/builder") : "/auth"}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#274F91] hover:bg-[#1E3F74] text-white font-bold text-lg shadow-xl shadow-[#274F91]/30 transition-all hover:-translate-y-1"
          >
            {isLoggedIn ? "Go to Dashboard" : "Get Started"}
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-lg transition-all hover:-translate-y-1 shadow-sm"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4" style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>From Excel file to boardroom dashboard.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">DIA turns the spreadsheets you already have into interactive, shareable dashboards — without your data ever leaving your browser.</p>
          </div>

          {/* How it works */}
          <div id="how-it-works" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 scroll-mt-28">
            {[
              { n: '1', icon: 'fa-file-excel', title: 'Load your Excel or CSV', text: 'Drop one or more files. They are parsed locally in your browser — German number and date formats included.' },
              { n: '2', icon: 'fa-wand-magic-sparkles', title: 'Build your pages', text: 'Drag charts, KPIs and tables onto a snap grid. Configure each widget from your columns in seconds.' },
              { n: '3', icon: 'fa-share-nodes', title: 'Share it', text: 'Export the whole dashboard as an interactive offline HTML file or a PowerPoint report.' }
            ].map((step) => (
              <div key={step.n} className="flex items-start p-6 rounded-2xl border border-slate-200 bg-slate-50/60">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 text-white font-bold" style={{ backgroundColor: '#274F91' }}>{step.n}</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1"><i className={`fa-solid ${step.icon} mr-2 text-[#274F91]`}></i>{step.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ZDR (wide) */}
            <div id="security" className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative md:col-span-2 scroll-mt-24">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-shield-halved text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Data Retention</h3>
              <p className="text-slate-600 leading-relaxed font-medium max-w-xl">Your spreadsheet is parsed in your browser and its rows stay there. We store only sheet names, column headers and your dashboard layout — every calculation runs on your device. Designed for GDPR compliance.</p>
              <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-[#274F91]/10 rounded-full blur-3xl group-hover:bg-[#274F91]/20 transition-colors duration-500"></div>
            </div>

            {/* Builder */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-table-cells-large text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Drag &amp; Drop Builder</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Ten widget types — bar, line, pie, doughnut, radar, bubble, funnel, gauge, KPI cards and tables — on an auto-snapping grid. Duplicate a configured card with one click.</p>
            </div>

            {/* Multi-page */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-layer-group text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Page Dashboards</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Organise your report into named pages and combine several Excel files in one workspace — each page shows the data that belongs there.</p>
            </div>

            {/* Aggregations */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-calculator text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Aggregations</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Sum, average, count and distinct counts, ABC/Pareto segmentation, calendar-aware month sorting and currency-formatted KPIs — blank cells never distort a number.</p>
            </div>

            {/* Drill-down tables */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-folder-tree text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Drill-Down Tables</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Pivot-style hierarchies you define by picking columns in order — expandable groups, live search and totals that follow your filter.</p>
            </div>

            {/* Refresh */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative md:col-span-2">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-rotate text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Monthly Refresh in Seconds</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Next month, drop in the new file — every chart on every page recalculates automatically. Your layout does the work once.</p>
            </div>

            {/* Themes */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-[#EDF1F8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-palette text-xl text-[#274F91]"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Theme Palettes</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Seven curated palettes — including an IBCS-style report look — recolor every chart with one click, so dashboards match your corporate identity.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <DiaLogo size={30} dark />
            </div>
            <p className="text-sm max-w-sm">The most advanced Zero Data Retention dashboard builder on the market. Build secure, interactive analytics in minutes.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR Compliance</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          &copy; {new Date().getFullYear()} Data Into Action. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
