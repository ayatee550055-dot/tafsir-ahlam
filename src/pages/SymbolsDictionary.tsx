import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Search, Book, Tag, TrendingUp, Filter, ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

function normalizeArabic(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/[\u064B-\u065F]/g, "") // Remove Arabic diacritics (harakat)
    .replace(/[أإآ]/g, "ا")           // Normalize Alef
    .replace(/ة/g, "ه")               // Normalize Taa Marbouta
    .replace(/ى/g, "ي")               // Normalize Al-Ya
    .trim()
    .toLowerCase();

  // Strip common "ال" definite article if it's longer than 3 characters
  if (clean.startsWith("ال") && clean.length > 3) {
    clean = clean.substring(2);
  }
  return clean;
}

export default function SymbolsDictionary() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";
  const initialCategory = queryParams.get("category") || "الكل";

  const [symbols, setSymbols] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(24);
  }, [search, selectedCategory]);

  // Auto-complete suggestion state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const container = document.getElementById("search-container");
      if (container && !container.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Suggestions Fetcher
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    setSuggestionsLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/symbols?search=${encodeURIComponent(search)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSuggestions(data);
          }
        })
        .catch(console.error)
        .finally(() => setSuggestionsLoading(false));
    }, 250); // fast debounce for autocomplete response

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Sync URL changes to state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search") || "";
    const categoryParam = params.get("category") || "الكل";
    setSearch(searchParam);
    setSelectedCategory(categoryParam);
  }, [location.search]);

  // Debounce search state and fetch symbols from API
  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
      const categoryParam = selectedCategory && selectedCategory !== "الكل" ? `category=${encodeURIComponent(selectedCategory)}` : "";
      const limitParam = "limit=2000";
      const queryStr = [searchParam, categoryParam, limitParam].filter(Boolean).join("&");
      
      fetch(`/api/symbols${queryStr ? "?" + queryStr : ""}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSymbols(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 400 : 0); // small debounce to keep feel premium and responsive

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory]);

  const categories = [
    "الكل", "الحيوانات", "الطبيعة", "الطيور", "الحشرات", 
    "الزواج والعلاقات", "الحمل والأطفال", "المال والذهب", 
    "السفر", "العمل والوظائف", "الطعام والشراب", "البيت والأثاث", "الموت والمرض"
  ];

  const filteredSymbols = symbols.filter(sym => {
    // Redundant filter for safety if backend returned all symbols
    if (selectedCategory && selectedCategory !== "الكل" && sym.category !== selectedCategory) {
      return false;
    }
    if (!search.trim()) return true;
    
    const query = normalizeArabic(search);
    const normName = normalizeArabic(sym.name || "");
    const normDesc = normalizeArabic(sym.shortDesc || "");
    const normCategory = normalizeArabic(sym.category || "");
    
    return normName.includes(query) || normDesc.includes(query) || normCategory.includes(query);
  }).sort((a, b) => {
    if (!search.trim()) return 0;
    const query = normalizeArabic(search);
    const normA = normalizeArabic(a.name || "");
    const normB = normalizeArabic(b.name || "");

    const exactA = normA === query ? 1 : 0;
    const exactB = normB === query ? 1 : 0;
    if (exactA !== exactB) return exactB - exactA;

    const startsA = normA.startsWith(query) ? 1 : 0;
    const startsB = normB.startsWith(query) ? 1 : 0;
    if (startsA !== startsB) return startsB - startsA;

    return 0;
  });

  return (
    <div className="space-y-8">
      <SEO 
        title="قاموس رموز الأحلام" 
        description="تصفح قاموس رموز الأحلام ومعانيها الشاملة في الإسلام لابن سيرين والنابلسي" 
      />
      
      <div className="bg-[#041d15] rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-900/10 rounded-full blur-3xl -z-10"></div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 flex items-center gap-3 font-serif border-b border-emerald-900/40 pb-4">
          <div className="p-3 bg-emerald-950 text-amber-300 rounded-xl border border-emerald-800/40">
            <Book className="w-8 h-8" />
          </div>
          معجم وقاموس الرموز الشامل
        </h1>
        
        {/* Search input styled modern dark green - STICKY SEARCH BAR */}
        <div className="sticky top-[72px] -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-[#041d15] z-30 border-b border-emerald-950/40 mb-8">
          <div className="relative" id="search-container">
            <input
              type="text"
              placeholder="ابحث عن رمز (مثال: بحر، أسد، نار...)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-4 pr-14 py-4.5 rounded-2xl border border-emerald-800/40 bg-[#031811] text-emerald-100 placeholder-emerald-600/60 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all text-lg"
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
            
            {/* Real-time Suggestions Dropdown */}
            {showSuggestions && search.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#03150f] border border-emerald-800/60 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-emerald-950/60 text-right">
                {suggestionsLoading ? (
                  <div className="p-4 text-center text-sm text-emerald-500 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-900 border-t-amber-400 rounded-full animate-spin"></div>
                    <span>جاري البحث عن اقتراحات...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold text-emerald-600 uppercase tracking-wider bg-[#02100b]/80">
                      رموز مقترحة من الموسوعة:
                    </div>
                    {suggestions.map((sym) => (
                      <Link
                        key={sym.id}
                        to={`/symbol/${sym.slug || sym.id}`}
                        onClick={() => {
                          setSearch(sym.name);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center justify-between p-4 hover:bg-[#052c1f] transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-900/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <Book className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-100 group-hover:text-amber-300 transition-colors block text-base">
                              {sym.name}
                            </span>
                            <span className="text-xs text-emerald-100/50 line-clamp-1 block mt-0.5">
                              {sym.shortDesc}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-amber-400/10 border border-amber-400/20 text-amber-300 px-2.5 py-1 rounded-md">
                          {sym.category}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-emerald-600">
                    لا توجد اقتراحات مطابقة. سيتم توليد تفسير فوري للرمز عند الضغط على بحث.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories / Tags with sleek horizontal scroll */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm ml-2">
            <Filter className="w-4.5 h-4.5" />
            <span>تصفية حسب القسم:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === cat 
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 shadow-md border border-amber-300/20" 
                    : "bg-[#03150f] text-emerald-100/70 border border-emerald-900/40 hover:text-amber-300 hover:bg-emerald-950"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-emerald-500 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-emerald-900 border-t-amber-400 rounded-full animate-spin"></div>
            <p className="text-lg font-bold text-emerald-200">جاري تحميل الرموز والبحث الشامل...</p>
          </div>
        ) : filteredSymbols.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSymbols.slice(0, visibleCount).map((sym, index) => (
                <React.Fragment key={sym.id}>
                  <Link 
                    to={`/symbol/${sym.slug || sym.id}`} 
                    className="bg-[#042016]/40 border border-emerald-950 rounded-2xl p-6 hover:border-amber-400/40 hover:bg-[#052c1f] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] shadow-md transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col h-full group text-right relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-emerald-950/20 to-transparent rounded-full z-0 group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Book className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="font-bold text-xl md:text-2xl text-emerald-100 font-serif group-hover:text-amber-300 transition-colors">
                          {sym.name}
                        </h3>
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold bg-amber-400/10 border border-amber-400/20 text-amber-300 px-3 py-1.5 rounded-lg w-fit mb-3.5 relative z-10 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {sym.category}
                    </span>
                    
                    <p className="text-emerald-100/60 line-clamp-3 leading-relaxed flex-grow text-sm md:text-base relative z-10 font-sans">
                      {sym.shortDesc}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-emerald-900/30 flex items-center justify-end text-emerald-400 font-bold group-hover:text-amber-300 transition-all relative z-10 gap-1.5 text-sm">
                      اقرأ التفسير الشامل
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  {/* Insert an AdSense placeholder every 6 items */}
                  {(index + 1) % 6 === 0 && (
                    <div className="sm:col-span-2 lg:col-span-3 bg-[#042217]/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px] border border-emerald-800/30 border-dashed text-emerald-500/40">
                      <span className="text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية (AdSense In-feed)</span>
                      <span className="text-[10px] text-emerald-600/50">AD_UNIT_DICTIONARY_FEED_{index + 1}</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {filteredSymbols.length > visibleCount && (
              <div className="text-center py-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-amber-500/10 flex items-center gap-2 mx-auto cursor-pointer text-lg border border-amber-300/20"
                >
                  <span>مشاهدة المزيد من الرموز والكلمات</span>
                  <span className="bg-emerald-950/20 px-2 py-0.5 rounded-lg text-sm">
                    (+{filteredSymbols.length - visibleCount} رمز متوفر)
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#03150f] rounded-2xl border border-emerald-950">
            <Search className="w-16 h-16 text-emerald-800 mx-auto mb-4" />
            <p className="text-xl text-emerald-200 font-bold">لا توجد رموز مطابقة لبحثك في الموسوعة.</p>
            <p className="text-emerald-500 text-sm mt-1.5">جرب استخدام كلمات أبسط مثل "مطر" بدلاً من "الأمطار الغزيرة"، أو تصفح الأقسام مباشرة.</p>
          </div>
        )}
      </div>
    </div>
  );
}
