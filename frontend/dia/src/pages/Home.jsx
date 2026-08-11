import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-200">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
          <div className="flex items-center space-x-3 cursor-pointer z-10">
            <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#logo-grad)"/>
              <path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fillOpacity="0.15"/>
              <circle cx="15" cy="16" r="3.5" fill="white"/>
              <defs>
                <linearGradient id="logo-grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold tracking-tight text-slate-900">DIA</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#security" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Security</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center space-x-4 z-10">
            <button className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-2">Sign In</button>
            <Link 
              to="/builder"
              onClick={() => localStorage.removeItem('dia_saved_layout')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex justify-center items-center flex-col px-6 text-center">
        {/* Abstract Background Meshes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-200/50 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">Zero Data Retention Architecture</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 max-w-4xl leading-[1.1] animate-fade-in-up" style={{animationDelay: '100ms'}}>
          The Dashboard Builder for <br className="hidden md:block" /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Enterprise Privacy.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium animate-fade-in-up" style={{animationDelay: '200ms'}}>
          Design stunning, highly-interactive analytics dashboards in minutes. Your client's data never leaves their browser. Full GDPR & ZDR compliance built-in.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style={{animationDelay: '300ms'}}>
          <Link 
            to="/builder"
            onClick={() => localStorage.removeItem('dia_saved_layout')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1"
          >
            Launch Builder UI
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">Precision Engineered Analytics.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Everything you need to visualize complex data, wrapped in an impossibly clean, interactive UI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-wand-magic-sparkles text-xl text-indigo-600"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Drag & Drop Canvas</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Build layouts instantly with our intelligent grid system. Auto-snapping, dynamic resizing, and real-time previews.</p>
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
            </div>

            {/* Feature 2 (Security / ZDR) */}
            <div id="security" className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative md:col-span-2 scroll-mt-24">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fa-solid fa-shield-halved text-xl text-emerald-600"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Data Retention (ZDR)</h3>
              <p className="text-slate-600 leading-relaxed font-medium max-w-xl">We strictly store only metadata and column headers. All mathematical aggregations and data processing happen purely in the client's browser using advanced WASM architecture. 100% GDPR compliant.</p>
              <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500 overflow-hidden relative md:col-span-3 lg:col-span-3">
               <div className="flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <i className="fa-solid fa-chart-line text-xl text-purple-600"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Stunning Chart Library</h3>
                  <p className="text-slate-600 leading-relaxed font-medium max-w-xl">Access over 15 highly interactive chart types out of the box. From standard Line and Bar charts to advanced Radar, Funnel, and dynamic Speedometers—all featuring glassmorphic hover effects.</p>
                 </div>
                 <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
                        <h4 className="text-5xl font-black text-slate-800 tracking-tighter">$2.4M</h4>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                        <i className="fa-solid fa-arrow-trend-up text-emerald-500 text-2xl"></i>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 relative border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">Simple, Transparent Pricing.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Start building for free, upgrade when you need enterprise features.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 font-medium text-sm mb-6">Perfect for solo developers and small projects.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">$0</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> 5 Dashboards</li>
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> Basic Chart Library</li>
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> Local Storage Save</li>
              </ul>
              <button className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors">Start Free</button>
            </div>

            {/* Professional (Highlighted) */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-indigo-500 shadow-2xl shadow-indigo-500/20 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
              <div className="absolute top-6 right-6 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-slate-400 font-medium text-sm mb-6">For agencies and growing businesses.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-slate-400 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-300 font-medium"><i className="fa-solid fa-check text-indigo-400 mr-3"></i> Unlimited Dashboards</li>
                <li className="flex items-center text-slate-300 font-medium"><i className="fa-solid fa-check text-indigo-400 mr-3"></i> Advanced Charts (Radar, Funnel)</li>
                <li className="flex items-center text-slate-300 font-medium"><i className="fa-solid fa-check text-indigo-400 mr-3"></i> Cloud Sync & Export</li>
                <li className="flex items-center text-slate-300 font-medium"><i className="fa-solid fa-check text-indigo-400 mr-3"></i> ZDR Architecture</li>
              </ul>
              <button className="w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30">Get Professional</button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 font-medium text-sm mb-6">For large scale compliance and custom needs.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> Dedicated Support</li>
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> Custom Chart Types</li>
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> On-Premise Deployment</li>
                <li className="flex items-center text-slate-600 font-medium"><i className="fa-solid fa-check text-indigo-500 mr-3"></i> White Labeling</li>
              </ul>
              <button className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#footer-grad)"/>
                <path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fillOpacity="0.15"/>
                <circle cx="15" cy="16" r="3.5" fill="white"/>
                <defs>
                  <linearGradient id="footer-grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="1" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg font-bold text-white tracking-tight">DIA</span>
            </div>
            <p className="text-sm max-w-sm">The most advanced Zero Data Retention dashboard builder on the market. Build secure, interactive analytics in minutes.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
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
          &copy; {new Date().getFullYear()} Data Insights Application. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
