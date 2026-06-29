import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Home, Book, FileText, Info, Phone, Shield, Heart, Trash2, X, Search } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'قاموس الرموز', path: '/symbols', icon: <Book className="w-5 h-5" /> },
  ];

  const loadFavorites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("dream_favorites") || "[]");
      setFavorites(saved);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFavorites();
    const handleUpdated = () => {
      loadFavorites();
    };
    window.addEventListener("favorites_updated", handleUpdated);
    return () => {
      window.removeEventListener("favorites_updated", handleUpdated);
    };
  }, []);

  const removeFavorite = (slug: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem("dream_favorites") || "[]");
      const updated = saved.filter((f: any) => f.slug !== slug);
      localStorage.setItem("dream_favorites", JSON.stringify(updated));
      setFavorites(updated);
      // Fire event to update symbol detail page if active
      window.dispatchEvent(new Event("favorites_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#03150f] text-[#ebf5f1] font-sans relative overflow-x-hidden" dir="rtl">
      {/* Background Starry/Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l3 24 21-11-11 21 24 3-24 3 11 21-21-11-3 24-3-24-21 11 11-21-24-3 24-3-11-21 21 11z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}></div>
      
      {/* Header */}
      <header className="bg-[#042016]/90 border-b border-emerald-900/40 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:border-amber-400/50 transition-all duration-300">
              <Moon className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-serif bg-gradient-to-l from-amber-200 via-emerald-100 to-white bg-clip-text text-transparent tracking-wide">
                آية لتفسير الأحلام
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium hidden md:block">موسوعة تفسير الأحلام وفق المنهج الشرعي الإسلامي</p>
            </div>
          </Link>
          
          {/* Universal Header Search Bar (Fixed/Sticky in header) */}
          <div className="hidden md:flex items-center relative max-w-[200px] lg:max-w-xs w-full mx-4">
            <input
              type="text"
              placeholder="ابحث عن رمز..."
              className="w-full pl-3 pr-10 py-1.5 rounded-xl text-sm border border-emerald-800/40 bg-[#031811] text-emerald-100 placeholder-emerald-600/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all text-right"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                  window.location.href = `/symbols?search=${encodeURIComponent(e.currentTarget.value)}`;
                }
              }}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 text-sm md:text-base font-bold px-3 py-2 rounded-xl transition-all ${
                  location.pathname === link.path
                    ? 'text-amber-300 bg-emerald-950/60 border border-emerald-800/50 shadow-inner'
                    : 'text-emerald-100/80 hover:text-amber-300 hover:bg-emerald-950/30'
                }`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.name}</span>
              </Link>
            ))}

            {/* My Favorites Triger Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-sm md:text-base font-bold px-3 py-2 rounded-xl transition-all text-emerald-100/80 hover:text-amber-300 hover:bg-emerald-950/30 relative"
              title="تفسيراتي المفضلة"
            >
              <Heart className={`w-5 h-5 ${favorites.length > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
              <span className="hidden sm:inline">المفضلة</span>
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -left-1 bg-amber-400 text-emerald-950 text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#042016]">
                  {favorites.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Sliding Favorites Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute inset-y-0 left-0 max-w-md w-full bg-[#042016] border-r border-emerald-900/40 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-5 border-b border-emerald-950 flex items-center justify-between bg-[#02110c]">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-lg text-amber-300 font-serif">تفسيراتي المفضلة</h3>
                <span className="bg-emerald-950 text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-800">
                  {favorites.length}
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-emerald-950 text-emerald-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="text-5xl opacity-40">🌙</div>
                  <h4 className="font-bold text-emerald-300">قائمة المفضلة فارغة</h4>
                  <p className="text-xs text-emerald-100/60 max-w-xs leading-relaxed">
                    لم تقم بحفظ أي تفسير للأحلام بعد. لحفظ أي رمز، اضغط على زر "حفظ في المفضلة" داخل صفحة التفسير الشامل.
                  </p>
                </div>
              ) : (
                favorites.map((fav) => (
                  <div 
                    key={fav.slug} 
                    className="group bg-[#02110c]/80 border border-emerald-900/30 rounded-xl p-4 hover:border-amber-400/40 transition-all duration-200 flex items-start justify-between gap-3 relative shadow-sm"
                  >
                    <Link 
                      to={`/symbol/${fav.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex-1 text-right"
                    >
                      <h4 className="font-bold text-amber-300 group-hover:text-amber-200 transition-colors font-serif mb-1 text-base">
                        تفسير حلم {fav.name}
                      </h4>
                      <p className="text-xs text-emerald-100/70 line-clamp-2 leading-relaxed">
                        {fav.shortDesc}
                      </p>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-md font-medium">
                        {fav.category}
                      </span>
                    </Link>
                    
                    <button 
                      onClick={() => removeFavorite(fav.slug)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-emerald-500 hover:text-red-400 transition-colors shrink-0 self-center"
                      title="إزالة من المفضلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer info */}
            <div className="p-4 bg-[#02110c] border-t border-emerald-950 text-center">
              <p className="text-[10px] text-emerald-500/70">يتم حفظ هذه القائمة محلياً في متصفحك بشكل آمن.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Top AdSense Banner Placeholder */}
        <div className="w-full bg-[#042217]/50 rounded-2xl p-4 mb-8 flex flex-col items-center justify-center min-h-[90px] border border-emerald-800/30 border-dashed backdrop-blur-sm shadow-md">
          <span className="text-emerald-500/60 text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية (Google AdSense)</span>
          <span className="text-[10px] text-emerald-600/40 font-mono">AD_UNIT_LEADERBOARD_TOP</span>
        </div>

        {children}

        {/* Bottom AdSense Banner Placeholder */}
        <div className="w-full bg-[#042217]/50 rounded-2xl p-4 mt-12 flex flex-col items-center justify-center min-h-[90px] border border-emerald-800/30 border-dashed backdrop-blur-sm shadow-md">
          <span className="text-emerald-500/60 text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية (Google AdSense)</span>
          <span className="text-[10px] text-emerald-600/40 font-mono">AD_UNIT_LEADERBOARD_BOTTOM</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#02110c] border-t border-emerald-950 mt-20 relative overflow-hidden">
        {/* Islamic Dome pattern decoration in footer */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-950 rounded-xl flex items-center justify-center border border-emerald-800/40">
                  <Moon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="text-xl font-bold text-amber-300 font-serif">آية لتفسير الأحلام</h3>
              </div>
              <p className="text-emerald-100/60 text-sm leading-relaxed">
                موقع متكامل لتفسير الأحلام والرؤى بالطريقة الإسلامية الشرعية استناداً إلى كبار المفسرين الأجلاء مثل الإمام ابن سيرين والنابلسي وابن شاهين، بأسلوب عصري وموثوق.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-emerald-300 border-r-4 border-amber-400 pr-3 font-serif">روابط سريعة</h4>
              <ul className="space-y-3 pr-1">
                <li><Link to="/" className="text-sm text-emerald-100/70 hover:text-amber-300 transition-colors">الرئيسية</Link></li>
                <li><Link to="/symbols" className="text-sm text-emerald-100/70 hover:text-amber-300 transition-colors">قاموس الرموز الشامل</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-emerald-300 border-r-4 border-amber-400 pr-3 font-serif">الصفحات القانونية والمعلوماتية</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pr-1">
                <Link to="/privacy" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> الخصوصية</Link>
                <Link to="/terms" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-500" /> الاستخدام</Link>
                <Link to="/cookies" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> الكوكيز</Link>
                <Link to="/disclaimer" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-emerald-500" /> إخلاء المسؤولية</Link>
                <Link to="/about" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-emerald-500" /> من نحن</Link>
                <Link to="/contact" className="text-xs text-emerald-100/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> اتصل بنا</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-emerald-950/80 mt-12 pt-8 text-center text-emerald-500/60 text-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} آية لتفسير الأحلام</p>
            <p className="font-serif text-amber-400/60 font-medium">﴿ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ ﴾</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
