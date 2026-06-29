import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Book, Sparkles, TrendingUp, Clock, Eye, Tag, ChevronLeft, ChevronDown, Award } from "lucide-react";
import SEO from "../components/SEO";
import { getVerifiedImageUrl } from "../utils/imageHelper";
import LazyImage from "../components/LazyImage";

interface Symbol {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDesc: string;
  imageUrl?: string;
  searchCount: number;
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#05281d] border border-emerald-900/30 rounded-2xl overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 text-right font-bold text-lg text-emerald-100 hover:bg-[#062f22] transition-colors"
      >
        <span>{question}</span>
        <div className={`w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-800/40 text-amber-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border-t border-emerald-900/20" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="p-5 text-emerald-100/70 leading-relaxed text-base whitespace-pre-line bg-[#042016]/40">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [categories, setCategories] = useState<{name: string, icon: string}[]>([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySymbol, setDailySymbol] = useState<Symbol | null>(null);

  useEffect(() => {
    fetch("/api/symbols?limit=12")
      .then(res => res.json())
      .then(data => {
        setSymbols(data);
        if (data && data.length > 0) {
          // Stable date-based selection
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const index = dayOfYear % data.length;
          setDailySymbol(data[index]);
        }
      })
      .catch(console.error);

    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/symbols?search=${encodeURIComponent(search)}&limit=5`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim() !== "") {
      window.location.href = `/symbols?search=${encodeURIComponent(search)}`;
    }
  };

  // Popular Quick Symbols mapping to the design screenshot
  const popularQuickSymbols = [
    { name: "الحية", icon: "🐍", slug: "snake" },
    { name: "الأسنان", icon: "🦷", slug: "teeth" },
    { name: "الماء", icon: "💧", slug: "sea" }, // maps to sea
    { name: "المطر", icon: "🌧️", slug: "rain" },
    { name: "الزواج", icon: "💍", slug: "marriage" },
  ];

  return (
    <div className="space-y-16">
      <SEO 
        title="الرئيسية" 
        description="موقع آية لتفسير الأحلام والرؤى بالطريقة الإسلامية الشرعية استناداً إلى كبار المفسرين (ابن سيرين، النابلسي، وابن شاهين)." 
      />
      
      {/* Hero Search Section - High-Fidelity to Left Screenshot */}
      <div className="bg-gradient-to-b from-[#052b1e] via-[#042117] to-[#02130e] rounded-3xl p-8 md:p-14 text-white text-center shadow-2xl relative border border-emerald-950">
        {/* Starry Night Sky effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none rounded-3xl"></div>
        {/* Mosque Silhouette Backdrop */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-bottom opacity-[0.05] mix-blend-luminosity pointer-events-none rounded-b-3xl"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center items-center gap-3">
            <span className="text-3xl text-amber-400">🌙</span>
            <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">الموسوعة الإسلامية الشرعية</span>
            <span className="text-3xl text-amber-400">⭐</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-tight bg-gradient-to-b from-white via-[#e2f0ea] to-[#a7d4bf] bg-clip-text text-transparent">
            آية لتفسير الأحلام
          </h1>
          
          <p className="text-emerald-300 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-medium">
            موسوعة تفسير الأحلام والرؤى الشاملة وفق تفاسير الأئمة الأجلاء ابن سيرين والنابلسي وابن شاهين، بأسلوب موثوق ومبسط.
          </p>
 
          {/* Custom Modern Search Bar */}
          <div className="relative max-w-2xl mx-auto text-slate-800 text-right group mt-8">
            <input
              type="text"
              placeholder="ابحث عن حلم أو رمز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full pl-4 pr-16 py-5 rounded-2xl shadow-2xl text-lg md:text-xl outline-none transition-all border border-emerald-800/40 bg-[#041a13]/85 text-emerald-100 placeholder-emerald-600/70 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
            />
            <button 
              onClick={() => {
                if (search.trim() !== "") {
                  window.location.href = `/symbols?search=${encodeURIComponent(search)}`;
                }
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 p-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border border-amber-300/30"
            >
              <Search className="w-6 h-6 stroke-[2.5]" />
            </button>
 
            {/* Search Suggestions Dropdown */}
            {search.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#041d15] rounded-2xl shadow-2xl overflow-hidden z-50 border border-emerald-800 divide-y divide-emerald-900/40">
                {suggestions.length > 0 ? (
                  suggestions.map(s => (
                    <Link 
                      key={s.id} 
                      to={`/symbol/${s.slug}`}
                      className="flex items-center justify-between px-6 py-4.5 hover:bg-[#052b1e]/60 transition-colors group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800/40 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                          <Book className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="font-bold text-lg text-emerald-100 group-hover/item:text-amber-300">{s.name}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">{s.category}</span>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center text-emerald-500">
                    <Search className="w-10 h-10 mx-auto mb-3 text-emerald-700/60" />
                    <p className="font-bold text-lg text-emerald-200">لم يتم العثور على نتائج لـ "{search}"</p>
                    <p className="text-xs text-emerald-500 mt-1.5">اضغط على زر البحث أو مفتاح Enter للاستعراض الشامل في جميع التفسيرات</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Quick Symbols Section (رموز شائعة الآن) - High Fidelity */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-300 flex items-center justify-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            رموز شائعة الآن
          </h2>
          <p className="text-xs text-emerald-500 mt-1 font-medium">الرموز الأكثر قراءة وبحثاً في الساعات الأخيرة</p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-3xl mx-auto">
          {popularQuickSymbols.map((item, idx) => (
            <Link 
              key={idx} 
              to={`/symbol/${item.slug}`} 
              className="flex items-center gap-3.5 bg-[#042117]/60 border border-emerald-900/30 rounded-2xl px-5 py-3 hover:border-amber-400 hover:bg-[#052b1e] hover:-translate-y-0.5 transition-all duration-300 group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-emerald-100 group-hover:text-amber-300 transition-colors text-sm md:text-base">{item.name}</p>
                <p className="text-[10px] text-emerald-500 font-semibold font-mono">#بحث_شائع</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Grid: Body + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-16">
          
          {/* Daily Interpretation Featured Module */}
          {dailySymbol && (
            <section className="space-y-6">
              <div className="border-b border-emerald-950 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#ebf5f1] flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#103024] to-[#041a13] rounded-xl border border-emerald-800/40 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  رمز اليوم المميز
                </h2>
              </div>
              
              <Link 
                to={`/symbol/${dailySymbol.slug}`}
                className="group block bg-gradient-to-b md:bg-gradient-to-l from-[#042016] via-[#041e14] to-[#02130d] border border-emerald-950 rounded-2xl overflow-hidden hover:border-amber-400/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)] transition-all duration-300 relative shadow-lg"
              >
                {/* Visual grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                  {/* Text Content */}
                  <div className="p-6 md:p-8 col-span-3 flex flex-col justify-between space-y-6 text-right order-2 md:order-1">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-xs font-bold text-amber-400 tracking-wide">تفسير وحكمة اليوم</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold font-serif text-white group-hover:text-amber-300 transition-colors">
                        تفسير رؤية {dailySymbol.name} في المنام
                      </h3>
                      <p className="text-sm text-emerald-100/70 leading-relaxed font-sans line-clamp-3 md:line-clamp-4">
                        {dailySymbol.shortDesc}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors pt-2">
                      <span>عرض التفسير الشرعي الكامل لهذا الرمز</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div className="col-span-2 h-48 md:h-full min-h-[180px] md:min-h-[250px] overflow-hidden relative order-1 md:order-2">
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#041e14] via-transparent to-transparent z-10"></div>
                    <LazyImage 
                      src={getVerifiedImageUrl(dailySymbol.name || dailySymbol.slug)}
                      alt={`صورة تعبيرية لتفسير حلم ورؤية ${dailySymbol.name} في المنام`}
                      className="group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className="text-[10px] font-bold text-amber-400 bg-emerald-950/90 backdrop-blur-sm border border-emerald-800/40 px-2.5 py-1 rounded-md shadow-sm">
                        {dailySymbol.category}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Most Searched Symbols Grid (أكثر رموز الأحلام بحثاً) */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#ebf5f1] flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl border border-emerald-800/50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                أكثر رموز الأحلام بحثاً
              </h2>
              <Link to="/symbols" className="text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group">
                عرض الكل
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-60 bg-[#041d15] rounded-2xl animate-pulse border border-emerald-950"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {symbols.slice(0, 6).map(sym => (
                  <Link 
                    key={sym.id} 
                    to={`/symbol/${sym.slug}`} 
                    className="group bg-[#041f15] border border-emerald-950 rounded-2xl overflow-hidden hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col h-full relative"
                  >
                    <div className="absolute top-3 left-3 bg-emerald-950/90 backdrop-blur-sm text-[11px] font-bold px-2.5 py-1 rounded-lg text-amber-400 border border-emerald-800/50 shadow-sm z-10 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      {sym.searchCount} بحث
                    </div>
                    
                    <div className="w-full aspect-video sm:aspect-square shrink-0 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#041f15] via-[#041f15]/20 to-transparent z-10"></div>
                      <LazyImage 
                        src={getVerifiedImageUrl(sym.name || sym.slug)} 
                        alt={`صورة توضيحية لتفسير رمز ${sym.name} في المنام بالتفصيل الشرعي`} 
                        className="group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute bottom-4 right-4 left-4 z-20">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">{sym.category}</span>
                        <h3 className="font-bold text-2xl text-white mt-1.5 font-serif group-hover:text-amber-300 transition-colors drop-shadow-md">{sym.name}</h3>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col justify-between flex-grow">
                      <p className="text-sm text-emerald-100/60 leading-relaxed line-clamp-2">{sym.shortDesc}</p>
                      <div className="mt-4 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-xs text-emerald-500 font-bold">
                        <span>قراءة التفسير</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* AdSense Middle Placeholder */}
          <div className="w-full bg-[#042217]/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[90px] border border-emerald-800/30 border-dashed text-emerald-500/50">
            <span className="text-xs font-bold uppercase tracking-wider mb-0.5">مساحة إعلانية (AdSense In-Article)</span>
            <span className="text-[9px] font-mono opacity-50">AD_UNIT_MID_CONTENT</span>
          </div>

          {/* Latest Interpretations (أحدث التفسيرات) */}
          <section className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#ebf5f1] flex items-center gap-3 border-b border-emerald-950 pb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl border border-emerald-800/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              أحدث التفسيرات المضافة
            </h2>
            
            <div className="space-y-5">
              {symbols.slice(4, 8).map((sym, idx) => (
                <Link 
                  key={sym.id + '-latest'} 
                  to={`/symbol/${sym.slug}`} 
                  className="group bg-[#041f15] border border-emerald-950/60 rounded-2xl p-4.5 flex flex-col sm:flex-row gap-5 hover:border-amber-400/40 hover:bg-[#052b1f] shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-emerald-950 shrink-0 relative border border-emerald-900/20">
                    <LazyImage 
                      src={getVerifiedImageUrl(sym.name || sym.slug)} 
                      alt={`صورة حية لرمز الأحلام ${sym.name} وفق كبار علماء التفسير`} 
                      className="group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold bg-emerald-950/90 text-amber-300 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                        {sym.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between py-1 flex-grow">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">منذ {idx + 2} ساعات</span>
                      </div>
                      <h3 className="font-bold text-2xl text-emerald-100 font-serif mb-2 group-hover:text-amber-300 transition-colors">{sym.name}</h3>
                      <p className="text-sm text-emerald-100/60 line-clamp-2 leading-relaxed">{sym.shortDesc}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500 group-hover:text-amber-400 transition-colors mt-4">
                      <span>عرض كامل دلالات حلم {sym.name}</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center pt-4">
              <Link 
                to="/symbols" 
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5 active:scale-95 transition-all group border border-emerald-600/30"
              >
                تصفح جميع الرموز والموسوعات
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          {/* Common Questions Section (أسئلة شائعة) */}
          <section className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#ebf5f1] flex items-center gap-3 border-b border-emerald-950 pb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl border border-emerald-800/50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              أسئلة شائعة حول الرؤى والأحلام
            </h2>
            
            <div className="space-y-4">
              <FAQItem 
                question="ما الفرق بين الرؤيا من الله والحلم من الشيطان؟" 
                answer="الرؤيا الصالحة تكون من الله تعالى وتتميز بالوضوح والاتساق وتبشر بالخير أو تنذر من شر بصدق، وعادةً ما يشعر الرائي بالراحة عند الاستيقاظ. أما الحلم أو أضغاث الأحلام فتكون من وسوسة الشيطان أو حديث النفس وتتميز بالتشويش وعدم الترابط، ويستيقظ الرائي منها قلقاً ومضطرباً." 
              />
              <FAQItem 
                question="هل يجوز تفسير الحلم بالاعتماد على التفسير العشوائي؟" 
                answer="لا يجوز ذلك، بل يجب الرجوع لأهل العلم والاختصاص أو كتب التفسير المعتمدة لكبار الأئمة مثل ابن سيرين والنابلسي. تفسير الأحلام علم مبني على القواعد الشرعية والرموز والقرائن المستمدة من القرآن الكريم والسنة النبوية، وليس مجرد تكهنات عشوائية." 
              />
              <FAQItem 
                question="متى يتحقق الحلم بعد رؤيته؟" 
                answer="ليس هناك وقت محدد وثابت لتحقق الرؤيا، فبعض الرؤى قد تتحقق في غضون أيام، والبعض الآخر قد يتأخر لسنوات طويلة كما حدث في رؤيا نبي الله يوسف عليه السلام والتي تأخر تحققها عقوداً. الأمر كله بيد الله وعلمه." 
              />
            </div>
          </section>

        </div>

        {/* Sidebar Space */}
        <aside className="space-y-8">
          
          {/* Categories Sidebar (التصنيفات) */}
          <div className="bg-[#041d15] rounded-2xl p-6 border border-emerald-950 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/10 rounded-full blur-3xl -z-10"></div>
            <h3 className="font-bold text-lg text-amber-300 mb-6 flex items-center gap-2 font-serif border-b border-emerald-900/40 pb-3">
              <Tag className="w-5 h-5" />
              تصنيفات الأحلام والرؤى
            </h3>
            <div className="flex flex-col gap-2">
              {categories.map((cat, i) => (
                <Link 
                  key={i} 
                  to={`/symbols?category=${cat.name}`}
                  className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-[#052b1f] text-emerald-100 transition-all border border-transparent hover:border-emerald-900/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform bg-[#03150f] w-9 h-9 rounded-lg flex items-center justify-center border border-emerald-900/30">{cat.icon}</span>
                    <span className="font-bold text-sm md:text-base group-hover:text-amber-300 transition-colors">{cat.name}</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* AdSense Sidebar Placeholder */}
          <div className="bg-[#042217]/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] border border-emerald-800/30 border-dashed text-emerald-500/40 sticky top-24">
            <span className="text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية</span>
            <span className="text-[10px] text-emerald-600/50">AD_UNIT_SIDEBAR_STICKY</span>
          </div>

        </aside>

      </div>
    </div>
  );
}
