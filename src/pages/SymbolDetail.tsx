import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Book, Share2, Tag, ChevronRight, ChevronLeft, Bookmark, 
  TrendingUp, Clock, ChevronDown, CheckCircle2, AlertTriangle, 
  HelpCircle, User, Users, Heart, Sparkles, Flame, Eye, Compass,
  MessageCircle, Send
} from "lucide-react";
import SEO from "../components/SEO";
import LazyImage from "../components/LazyImage";

interface FAQ {
  question: string;
  answer: string;
}

interface Variation {
  title: string;
  content: string;
}

interface Symbol {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDesc: string;
  imageUrl?: string;
  ibnSirin?: string;
  nabulsi?: string;
  ibnShaheen?: string;
  forSingle?: string;
  forMarried?: string;
  forPregnant?: string;
  forDivorced?: string;
  forSingleMan?: string;
  forMarriedMan?: string;
  goodOmens?: string;
  badOmens?: string;
  faqs?: FAQ[];
  variations?: Variation[];
  introduction?: string;
  relatedSymbolsText?: string;
  searchCount: number;
}

// Custom Premium Numbered Accordion Item - Exact Match to Right Screenshot
interface SequentialAccordionProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SequentialAccordion = ({ number, title, icon, isOpen, onToggle, children }: SequentialAccordionProps) => {
  return (
    <div className={`border border-emerald-900/30 rounded-2xl overflow-hidden bg-[#042117]/60 transition-all duration-300 shadow-md ${isOpen ? "ring-2 ring-amber-400/20 bg-[#052b1f]" : ""}`}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-[#052e20]/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Circular Sequential Number */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 transition-colors ${isOpen ? "bg-amber-400 border-amber-400 text-emerald-950" : "bg-emerald-950 border-emerald-800 text-amber-300"}`}>
            {number}
          </div>
          {/* Title and Icon */}
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-300 group-hover:text-amber-300">{icon}</span>
            <h3 className="font-bold text-lg md:text-xl text-[#ebf5f1] font-serif">{title}</h3>
          </div>
        </div>
        
        {/* Toggle Chevron */}
        <div className={`w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-400 bg-emerald-900/40" : ""}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Body */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border-t border-emerald-900/20" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="p-6 md:p-8 text-emerald-100/85 leading-relaxed text-base md:text-lg whitespace-pre-line bg-[#041a12]/40 font-serif">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SymbolImages {
  primary: string;
  secondary: string;
}

import { getVerifiedImageUrl } from "../utils/imageHelper";

interface SymbolImages {
  primary: string;
  secondary: string;
}

function getSymbolImages(symbol: any): SymbolImages {
  const starryFallback = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80";
  if (!symbol) {
    return {
      primary: starryFallback,
      secondary: starryFallback
    };
  }

  const name = symbol.name || "";
  const slug = symbol.slug || "";
  
  const hasCustomImage = symbol.imageUrl && 
                         symbol.imageUrl.trim() !== "" && 
                         symbol.imageUrl.startsWith("http") &&
                         !symbol.imageUrl.includes("photo-1564507592333");

  const primaryImg = hasCustomImage ? symbol.imageUrl : getVerifiedImageUrl(name || slug);

  return {
    primary: primaryImg || starryFallback,
    secondary: starryFallback
  };
}

export default function SymbolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [symbol, setSymbol] = useState<Symbol | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Symbol[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Track open accordion numbers
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({
    1: true, // Keep the first general meaning open by default
  });

  const toggleAccordion = (num: number) => {
    setOpenAccordions(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  useEffect(() => {
    if (!symbol) return;
    try {
      const saved = JSON.parse(localStorage.getItem("dream_favorites") || "[]");
      setIsFavorited(saved.some((f: any) => f.slug === symbol.slug));
    } catch (e) {
      console.error(e);
    }
  }, [symbol]);

  const toggleFavorite = () => {
    if (!symbol) return;
    try {
      const saved = JSON.parse(localStorage.getItem("dream_favorites") || "[]");
      let updated;
      if (isFavorited) {
        updated = saved.filter((f: any) => f.slug !== symbol.slug);
      } else {
        updated = [...saved, {
          id: symbol.id,
          slug: symbol.slug,
          name: symbol.name,
          category: symbol.category,
          shortDesc: symbol.shortDesc
        }];
      }
      localStorage.setItem("dream_favorites", JSON.stringify(updated));
      setIsFavorited(!isFavorited);
      
      // Broadcast update to layout header
      window.dispatchEvent(new Event("favorites_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyInterpretation = () => {
    if (!symbol) return;
    const textToCopy = `تفسير حلم ${symbol.name} - آية لتفسير الأحلام
    
${symbol.shortDesc}

أولاً: تفسير الإمام ابن سيرين:
${symbol.ibnSirin || "غير متوفر"}

ثانياً: تفسير الإمام النابلسي:
${symbol.nabulsi || "غير متوفر"}

ثالثاً: تفسير الإمام ابن شاهين:
${symbol.ibnShaheen || "غير متوفر"}

للمزيد من تفسيرات الرؤى والأحلام الشرعية زورا موقعنا:
${window.location.href}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/symbols/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        setSymbol(data);
        
        // Fetch related symbols in same category
        fetch(`/api/symbols?category=${data.category}`)
          .then(res => res.json())
          .then(relatedData => {
            setRelated(relatedData.filter((s: Symbol) => s.slug !== slug).slice(0, 4));
          })
          .catch(console.error);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
      
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 border-4 border-emerald-800 border-t-amber-400 rounded-full animate-spin"></div>
        <p className="text-emerald-400 font-bold">جاري تحميل التفسير الشامل والكامل...</p>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center bg-[#041d15] rounded-3xl border border-emerald-950 p-8 max-w-2xl mx-auto space-y-6">
        <div className="text-5xl">🌙</div>
        <h2 className="text-3xl font-bold text-amber-300 font-serif">الرمز غير موجود في الموسوعة</h2>
        <p className="text-emerald-100/70 max-w-md">عذراً، لم نتمكن من العثور على التفسير الذي تبحث عنه. قد يكون قيد المراجعة أو الكتابة من قبل شيوخنا الأفاضل.</p>
        <Link to="/" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
          العودة للرئيسية وتجربة بحث آخر
        </Link>
      </div>
    );
  }

  // Generate simulated read count and read time
  const views = symbol.searchCount ? symbol.searchCount * 12 : 32500;
  const readTime = Math.max(3, Math.ceil((symbol.shortDesc?.length || 500) / 150));
  const resolvedImages = getSymbolImages(symbol);

  // Generate highly attractive and dynamic SEO title & description
  const seoTitle = `تفسير حلم ${symbol.name} في المنام بالتفصيل | ابن سيرين والنابلسي`;
  const rawDesc = symbol.shortDesc || `اكتشف المعاني الروحية والشرعية لرؤية ${symbol.name} في المنام وفقاً لكبار أئمة التفسير بالتفصيل الكامل والواضح.`;
  const cleanDesc = rawDesc.replace(/\s+/g, " ").trim();
  const baseDescription = `ما تفسير حلم ${symbol.name} في المنام؟ تعرف على الدلالات الشرعية الدقيقة لرؤية ${symbol.name} للعزباء، المتزوجة، الحامل، والرجل بالتفصيل الواضح والشامل وفق كبار علماء التفسير. ${cleanDesc}`;
  const seoDescription = baseDescription.length > 160 ? `${baseDescription.substring(0, 157)}...` : baseDescription;

  return (
    <div className="space-y-8">
      <SEO 
        title={seoTitle} 
        description={seoDescription}
        image={resolvedImages.primary}
      />

      {/* Breadcrumb - Match exact top right path of right screenshot */}
      <nav className="flex text-emerald-500/70 text-sm font-bold bg-[#042016]/40 px-5 py-3 rounded-xl border border-emerald-950 max-w-fit">
        <ol className="flex items-center space-x-2 space-x-reverse">
          <li><Link to="/" className="hover:text-amber-300 transition-colors">الرئيسية</Link></li>
          <li><ChevronLeft className="w-4 h-4 mx-1 opacity-60" /></li>
          <li><Link to={`/symbols?category=${symbol.category}`} className="hover:text-amber-300 transition-colors">{symbol.category}</Link></li>
          <li><ChevronLeft className="w-4 h-4 mx-1 opacity-60" /></li>
          <li className="text-amber-300 font-serif">تفسير حلم {symbol.name}</li>
        </ol>
      </nav>

      {/* Hero Header Area - Mimics Right Screenshot layout with large visual overlay */}
      <div className="bg-gradient-to-b from-[#052b1e] to-[#03150f] rounded-3xl overflow-hidden border border-emerald-950 shadow-2xl relative">
        <div className="w-full h-[260px] md:h-[380px] relative grid grid-cols-2 gap-1 bg-emerald-950/20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#03150f] via-[#03150f]/60 to-transparent z-10 pointer-events-none"></div>
          {/* Image 1: Main Symbol Representation */}
          <div className="relative h-full w-full overflow-hidden">
            <LazyImage 
              src={resolvedImages.primary} 
              alt={`تفسير حلم ${symbol.name}`} 
              className="opacity-85 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          </div>
          {/* Image 2: Spiritual/Dreamy Backdrop Representation */}
          <div className="relative h-full w-full overflow-hidden">
            <LazyImage 
              src={resolvedImages.secondary} 
              alt={`تعبير حلم ${symbol.name}`} 
              className="opacity-85 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          </div>
        </div>

        {/* Title & Stats Overlay */}
        <div className="p-6 md:p-10 -mt-16 relative z-20 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              🔑 رمز مفسر
            </span>
            <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              📁 {symbol.category}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-white tracking-wide leading-tight drop-shadow-md">
            تفسير حلم {symbol.name} في المنام
          </h1>

          {/* Views & Reading Time Badges - Exact match to right screenshot */}
          <div className="flex items-center gap-5 text-emerald-400/80 text-xs md:text-sm font-bold pt-1.5 border-t border-emerald-900/30 max-w-md">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4.5 h-4.5 text-amber-400" />
              <span>{views.toLocaleString()} قراءة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-amber-400" />
              <span>{readTime} دقيقة قراءة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout containing the 14-Step Sequenced Accordions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Step-by-Step Accordions list */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* 1. معنى الحلم بشكل عام */}
          <SequentialAccordion 
            number={1} 
            title="معنى الحلم بشكل عام" 
            icon={<Compass className="w-5 h-5" />}
            isOpen={!!openAccordions[1]}
            onToggle={() => toggleAccordion(1)}
          >
            <div className="space-y-4">
              <p className="text-lg text-emerald-100 font-medium">
                {symbol.introduction || symbol.shortDesc}
              </p>
              <div className="bg-emerald-950/50 p-4.5 rounded-xl border border-emerald-900/40 text-sm text-emerald-400/90 italic flex items-start gap-2.5">
                <span className="text-xl">💡</span>
                <span>تعتبر هذه الرؤية من الرموز الأساسية التي تحمل تأويلات متعددة تعتمد على تفاصيل الرؤيا الدقيقة وحال صاحب الحلم وظروفه المعيشية والروحية.</span>
              </div>
            </div>
          </SequentialAccordion>

          {/* 2. تفسير ابن سيرين */}
          {symbol.ibnSirin && (
            <SequentialAccordion 
              number={2} 
              title="تفسير الإمام ابن سيرين" 
              icon={<Book className="w-5 h-5" />}
              isOpen={!!openAccordions[2]}
              onToggle={() => toggleAccordion(2)}
            >
              <div className="space-y-4">
                <p className="leading-loose">{symbol.ibnSirin}</p>
                <div className="border-t border-emerald-900/30 pt-4 text-xs text-amber-400/60 font-sans flex items-center justify-between">
                  <span>المصدر: منتخب الكلام في تفسير الأحلام لأبي بكر محمد بن سيرين البصري</span>
                  <span>رتبة الصحة: معتمد شرعاً</span>
                </div>
              </div>
            </SequentialAccordion>
          )}

          {/* 3. تفسير النابلسي */}
          {symbol.nabulsi && (
            <SequentialAccordion 
              number={3} 
              title="تفسير الإمام عبد الغني النابلسي" 
              icon={<Book className="w-5 h-5" />}
              isOpen={!!openAccordions[3]}
              onToggle={() => toggleAccordion(3)}
            >
              <div className="space-y-4">
                <p className="leading-loose">{symbol.nabulsi}</p>
                <div className="border-t border-emerald-900/30 pt-4 text-xs text-amber-400/60 font-sans flex items-center justify-between">
                  <span>المصدر: تعطير الأنام في تعبير المنام للإمام النابلسي</span>
                  <span>رتبة الصحة: معتمد شرعاً</span>
                </div>
              </div>
            </SequentialAccordion>
          )}

          {/* 4. تفسير ابن شاهين */}
          {symbol.ibnShaheen && (
            <SequentialAccordion 
              number={4} 
              title="تفسير الإمام ابن شاهين الظاهري" 
              icon={<Book className="w-5 h-5" />}
              isOpen={!!openAccordions[4]}
              onToggle={() => toggleAccordion(4)}
            >
              <div className="space-y-4">
                <p className="leading-loose">{symbol.ibnShaheen}</p>
                <div className="border-t border-emerald-900/30 pt-4 text-xs text-amber-400/60 font-sans flex items-center justify-between">
                  <span>المصدر: الإشارات في علم العبارات لابن شاهين</span>
                  <span>رتبة الصحة: معتمد شرعاً</span>
                </div>
              </div>
            </SequentialAccordion>
          )}

          {/* 5. تفسير للعزباء */}
          {symbol.forSingle && (
            <SequentialAccordion 
              number={5} 
              title="تفسير رؤية الرمز للعزباء" 
              icon={<Heart className="w-5 h-5 text-pink-400" />}
              isOpen={!!openAccordions[5]}
              onToggle={() => toggleAccordion(5)}
            >
              <p className="leading-loose">{symbol.forSingle}</p>
            </SequentialAccordion>
          )}

          {/* 6. تفسير للمتزوجة */}
          {symbol.forMarried && (
            <SequentialAccordion 
              number={6} 
              title="تفسير رؤية الرمز للمتزوجة" 
              icon={<Users className="w-5 h-5 text-purple-400" />}
              isOpen={!!openAccordions[6]}
              onToggle={() => toggleAccordion(6)}
            >
              <p className="leading-loose">{symbol.forMarried}</p>
            </SequentialAccordion>
          )}

          {/* 7. تفسير للحامل */}
          {symbol.forPregnant && (
            <SequentialAccordion 
              number={7} 
              title="تفسير رؤية الرمز للمرأة الحامل" 
              icon={<Sparkles className="w-5 h-5 text-blue-400" />}
              isOpen={!!openAccordions[7]}
              onToggle={() => toggleAccordion(7)}
            >
              <p className="leading-loose">{symbol.forPregnant}</p>
            </SequentialAccordion>
          )}

          {/* 8. تفسير للمطلقة */}
          {symbol.forDivorced && (
            <SequentialAccordion 
              number={8} 
              title="تفسير رؤية الرمز للمرأة المطلقة" 
              icon={<Heart className="w-5 h-5 text-amber-400" />}
              isOpen={!!openAccordions[8]}
              onToggle={() => toggleAccordion(8)}
            >
              <p className="leading-loose">{symbol.forDivorced}</p>
            </SequentialAccordion>
          )}

          {/* 9. تفسير للرجل */}
          {(symbol.forSingleMan || symbol.forMarriedMan) && (
            <SequentialAccordion 
              number={9} 
              title="تفسير رؤية الرمز للرجل (أعزب ومتزوج)" 
              icon={<User className="w-5 h-5 text-indigo-400" />}
              isOpen={!!openAccordions[9]}
              onToggle={() => toggleAccordion(9)}
            >
              <div className="space-y-6">
                {symbol.forSingleMan && (
                  <div>
                    <h4 className="font-bold text-amber-300 text-base mb-2">للأعزب:</h4>
                    <p className="leading-loose text-emerald-100/90">{symbol.forSingleMan}</p>
                  </div>
                )}
                {symbol.forMarriedMan && (
                  <div className="border-t border-emerald-900/30 pt-4">
                    <h4 className="font-bold text-amber-300 text-base mb-2">للمتزوج:</h4>
                    <p className="leading-loose text-emerald-100/90">{symbol.forMarriedMan}</p>
                  </div>
                )}
              </div>
            </SequentialAccordion>
          )}

          {/* 10. دلالات الخير في الحلم */}
          {symbol.goodOmens && (
            <SequentialAccordion 
              number={10} 
              title="دلالات الخير والبشارة في هذا الحلم" 
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              isOpen={!!openAccordions[10]}
              onToggle={() => toggleAccordion(10)}
            >
              <div className="bg-[#053120]/40 p-5 rounded-xl border border-emerald-800/20">
                <p className="leading-loose text-emerald-200">{symbol.goodOmens}</p>
              </div>
            </SequentialAccordion>
          )}

          {/* 11. دلالات التحذير في الحلم */}
          {symbol.badOmens && (
            <SequentialAccordion 
              number={11} 
              title="دلالات التحذير والشر في هذا الحلم" 
              icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
              isOpen={!!openAccordions[11]}
              onToggle={() => toggleAccordion(11)}
            >
              <div className="bg-red-950/20 p-5 rounded-xl border border-red-900/30">
                <p className="leading-loose text-red-200/90">{symbol.badOmens}</p>
              </div>
            </SequentialAccordion>
          )}

          {/* 12. الأسئلة الشائعة */}
          {symbol.faqs && symbol.faqs.length > 0 && (
            <SequentialAccordion 
              number={12} 
              title="الأسئلة الأكثر شيوعاً حول الرؤية" 
              icon={<HelpCircle className="w-5 h-5 text-amber-400" />}
              isOpen={!!openAccordions[12]}
              onToggle={() => toggleAccordion(12)}
            >
              <div className="space-y-6">
                {symbol.faqs.map((faq, i) => (
                  <div key={i} className="bg-[#031c13] p-5 rounded-xl border border-emerald-900/40">
                    <h4 className="font-bold text-[#ebf5f1] mb-2.5 flex items-start gap-2 text-base md:text-lg">
                      <span className="text-amber-400 font-extrabold shrink-0">س:</span>
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-emerald-100/70 leading-relaxed text-sm md:text-base border-t border-emerald-900/20 pt-2.5 mt-2 flex items-start gap-2">
                      <span className="text-emerald-500 font-extrabold shrink-0">ج:</span>
                      <span>{faq.answer}</span>
                    </p>
                  </div>
                ))}
              </div>
            </SequentialAccordion>
          )}

          {/* 13. رموز مرتبطة بالحلم */}
          {(symbol.variations && symbol.variations.length > 0) && (
            <SequentialAccordion 
              number={13} 
              title="أبرز الحالات والرموز المرتبطة" 
              icon={<TrendingUp className="w-5 h-5" />}
              isOpen={!!openAccordions[13]}
              onToggle={() => toggleAccordion(13)}
            >
              <div className="space-y-4">
                {symbol.variations.map((v, i) => (
                  <div key={i} className="bg-[#042016]/40 p-5 rounded-xl border border-emerald-900/30">
                    <h4 className="font-bold text-amber-300 text-base md:text-lg mb-2">{v.title}</h4>
                    <p className="text-emerald-100/80 leading-relaxed text-sm md:text-base">{v.content}</p>
                  </div>
                ))}
              </div>
            </SequentialAccordion>
          )}

          {/* 14. مواضيع ذات صلة */}
          {symbol.relatedSymbolsText && (
            <SequentialAccordion 
              number={14} 
              title="مواضيع ذات صلة وتوجيهات روحية" 
              icon={<Tag className="w-5 h-5" />}
              isOpen={!!openAccordions[14]}
              onToggle={() => toggleAccordion(14)}
            >
              <p className="leading-loose text-emerald-100/80">{symbol.relatedSymbolsText}</p>
            </SequentialAccordion>
          )}

          {/* Share Actions Panel */}
          <div className="bg-[#041d15] border border-emerald-950 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-md">
            <div className="space-y-1 text-center lg:text-right">
              <span className="font-bold text-emerald-200 text-sm md:text-base block">هل أفادك هذا التفسير الشامل؟</span>
              <span className="text-xs text-emerald-400/80 block">يمكنك نسخ نص التفسير بالكامل لمشاركته مع الأصدقاء، أو مشاركته مباشرةً عبر منصات التواصل الاجتماعي، أو حفظه في تفسيراتك المفضلة للرجوع إليه لاحقاً.</span>
            </div>
            
            <div className="flex flex-wrap gap-2.5 justify-center">
              {/* WhatsApp Share Button */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`تفسير حلم ورؤية "${symbol.name}" في المنام:\n\n${symbol.shortDesc}\n\nلقراءة التفسير الشرعي كاملاً ومفصلاً:\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl border border-emerald-800 bg-[#073323]/30 hover:bg-[#25d366]/10 text-[#25d366] hover:border-[#25d366]/40 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                title="مشاركة عبر واتساب"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                <span>واتساب</span>
              </a>

              {/* Telegram Share Button */}
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`تفسير حلم ورؤية "${symbol.name}" في المنام بالتفصيل الشرعي`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl border border-emerald-800 bg-[#073323]/30 hover:bg-[#0088cc]/10 text-[#0088cc] hover:border-[#0088cc]/40 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                title="مشاركة عبر تليجرام"
              >
                <Send className="w-4.5 h-4.5" />
                <span>تليجرام</span>
              </a>

              {/* Copy Full Interpretation Button */}
              <button 
                onClick={handleCopyInterpretation}
                className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-all flex items-center gap-2 active:scale-95 ${
                  copiedText 
                    ? "bg-amber-400 border-amber-400 text-emerald-950" 
                    : "bg-emerald-900/20 hover:bg-emerald-900/50 border-emerald-800 text-amber-300"
                }`}
              >
                <Book className="w-4.5 h-4.5" />
                {copiedText ? "تم نسخ التفسير!" : "نسخ التفسير كامل"}
              </button>

              {/* Copy Link Button */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-all flex items-center gap-2 active:scale-95 ${
                  copiedLink 
                    ? "bg-amber-400 border-amber-400 text-emerald-950" 
                    : "bg-emerald-900/20 hover:bg-emerald-900/50 border-emerald-800 text-amber-300"
                }`}
              >
                <Share2 className="w-4.5 h-4.5" />
                {copiedLink ? "تم نسخ الرابط!" : "نسخ رابط الصفحة"}
              </button>

              {/* Save to Favorites Button */}
              <button 
                onClick={toggleFavorite}
                className={`px-5 py-2.5 rounded-xl border font-bold text-sm transition-all flex items-center gap-2 active:scale-95 ${
                  isFavorited 
                    ? "bg-amber-400 border-amber-400 text-emerald-950" 
                    : "bg-emerald-900/20 hover:bg-emerald-900/50 border-emerald-800 text-amber-300"
                }`}
                title={isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isFavorited ? "fill-emerald-950" : ""}`} />
                {isFavorited ? "في المفضلة" : "حفظ في المفضلة"}
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar Panel containing Related/Interested Symbols */}
        <aside className="space-y-8">
          
          {/* AdSense Sidebar */}
          <div className="bg-[#042217]/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] border border-emerald-800/30 border-dashed text-emerald-500/40">
            <span className="text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية</span>
            <span className="text-[10px] text-emerald-600/50">AD_UNIT_SIDEBAR_DETAIL_TOP</span>
          </div>

          {/* Symbols You Might Like - "رموز قد تهمك" (Mimics Bottom Grid of Detail Page) */}
          {related.length > 0 && (
            <div className="bg-[#041d15] rounded-2xl p-6 border border-emerald-950 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/10 rounded-full blur-3xl -z-10"></div>
              <h3 className="font-bold text-lg text-amber-300 mb-6 flex items-center gap-2 font-serif border-b border-emerald-900/40 pb-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                رموز قد تهمك
              </h3>
              
              <div className="flex flex-col gap-4">
                {related.map(r => (
                  <Link 
                    key={r.id} 
                    to={`/symbol/${r.slug}`} 
                    className="group bg-[#042218]/50 border border-emerald-900/20 rounded-xl overflow-hidden hover:border-amber-400/40 transition-all flex h-20 shadow-sm"
                  >
                    {r.imageUrl ? (
                      <div className="w-20 h-full shrink-0 overflow-hidden relative">
                        <LazyImage 
                          src={r.imageUrl} 
                          alt={r.name} 
                          className="group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-full shrink-0 bg-emerald-950 flex items-center justify-center border-l border-emerald-900/20 text-emerald-800">
                        <Book className="w-6 h-6" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col justify-center overflow-hidden">
                      <h4 className="font-bold text-[#ebf5f1] text-sm md:text-base group-hover:text-amber-300 transition-colors truncate">تفسير حلم {r.name}</h4>
                      <p className="text-xs text-emerald-500 font-semibold truncate mt-0.5">{r.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AdSense Sticky Sidebar */}
          <div className="bg-[#042217]/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[500px] border border-emerald-800/30 border-dashed text-emerald-500/40 sticky top-24">
            <span className="text-xs font-bold uppercase tracking-wider mb-1">مساحة إعلانية</span>
            <span className="text-[10px] text-emerald-600/50">AD_UNIT_SIDEBAR_DETAIL_STICKY</span>
          </div>

        </aside>

      </div>
    </div>
  );
}
