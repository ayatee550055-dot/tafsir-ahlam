import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

dotenv.config();

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

const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite Dev Server and inline scripts
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: "لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد قليل." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

app.use("/api/", apiLimiter);
app.use(express.json({ limit: "10mb" }));

// Initialize Prisma
const hasDatabase = !!process.env.DATABASE_URL;
let prisma: PrismaClient | null = null;
if (hasDatabase) {
  try {
    prisma = new PrismaClient();
    console.log("Prisma Client Initialized");
  } catch (err) {
    console.error("Failed to initialize Prisma:", err);
  }
}

// Initialize Gemini SDK with telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Cache for dynamically generated symbols
const DYNAMIC_SYMBOLS: any[] = [];

// Massive list of category symbols index to support 1000+ symbols per category
const MASSIVE_SYMBOLS_INDEX: any[] = [];

function populateMassiveSymbolsIndex() {
  if (MASSIVE_SYMBOLS_INDEX.length > 0) return;

  const categoriesData: { [key: string]: string[] } = {
    "الحيوانات": [
      "الأسد", "النمر", "الفهد", "الذئب", "الثعلب", "الدب", "الكلب", "القط", "الحصان", "الحمار", 
      "الجمل", "الخروف", "الماعز", "البقرة", "الفيل", "القرد", "الغزال", "الأرنب", "الخنزير", "الفأر", 
      "الضبع", "الغراب", "الكنغر", "الباندا", "وحيد القرن", "فرس النهر", "الزرافة", "التمساح", "السلحفاة", "الضفدع", 
      "السحلية", "الحرباء", "القنفذ", "الوعل", "الأيل", "الجدي", "السنجاب", "الجاموس", "العجل", "الفهد الأسود",
      "الذئب البري", "الكلب الأسود", "الكلب الأبيض", "القطة الشرسة", "القطة الهادئة", "الناقة", "شبل الأسد", "اللبؤة", "الثور", "الكبش"
    ],
    "الطبيعة": [
      "البحر", "النهر", "المطر", "السحاب", "السماء", "الشمس", "القمر", "النجوم", "الجبل", "الوادي", 
      "الغابة", "الشجرة", "الورد", "العشب", "التراب", "الطين", "الحجر", "الرمال", "البئر", "البركان", 
      "الزلزال", "الريح", "البرق", "الرعد", "الثلج", "البرد", "الصحراء", "البحيرة", "الينبوع", "الواحة", 
      "الكهف", "السد", "القوس قزح", "الشلال", "النار", "الدخان", "الرماد", "الفحم", "السراب", "الجزيرة",
      "الفيضان", "الموج الهائج", "الطريق المظلم", "الغروب", "الشروق", "البستان", "الحقل", "المستنقع", "السراب", "الصخرة"
    ],
    "الطيور": [
      "الصقر", "النسر", "البومة", "الغراب", "الحمامة", "العصفور", "البالبغاء", "الطاووس", "الهدهد", "النعامة", 
      "البطة", "الإوزة", "الدجاجة", "الديك", "الكتكوت", "البجع", "النورس", "الخفاش", "السمان", "اللقلق", 
      "الفلامنجو", "الحسون", "البلبل", "الكناري", "الحدأة", "الباز", "الرخ", "طائر الحب", "الباشق", "عقاب", 
      "الغرنوق", "أبو قردان", "التم", "القمري", "البومة البيضاء", "اليمام", "الدراج", "طائر السنونو", "الكروان", "الحمام الزاجل"
    ],
    "الحشرات": [
      "النمل", "النحل", "العقرب", "العنكبوت", "الذبابة", "البعوضة", "الصرصور", "الفراشة", "الدودة", "البرغوث", 
      "القمل", "الجراد", "الدبور", "الأرضة", "الحلزون", "الخنفساء", "السوس", "السرعوف", "عث الغبار", "الديدان البيضاء", 
      "الديدان السوداء", "العث", "قراد", "بق الفراش", "الزنبور", "النمل الأحمر", "النمل الأسود", "العقرب الأصفر", "العقرب الأسود", "عنكبوت البيت", 
      "الخنفساء السوداء", "الصرصور الكبير", "القمل في الشعر", "اليرقة", "الحريش", "اليعسوب", "الجندب", "أبو المقص", "النحلة الملكة", "العنكبوت الأسود"
    ],
    "الزواج والعلاقات": [
      "العرس", "الخطوبة", "الفستان الأبيض", "خاتم الذهب", "خاتم الفضة", "الطلاق", "الخيانة الزوجية", "الصلح بين المتخاصمين", "الحب", "القبلة", 
      "العناق", "البكاء", "الغضب", "الابتسامة", "الزواج من مجهول", "الزواج من محرم", "كتب الكتاب", "المهر", "الهدية", "الغيرة", 
      "الشجار", "الزوج الثاني", "العروس", "العريس", "طليقي", "الحبيب", "الخطيب", "أهل الزوج", "أهل الزوجة", "حماتي", 
      "الوليمة", "الفرح", "البدلة السوداء", "طرحة العروس", "الزواج من حاكم", "الزواج من شيخ", "رؤية الحبيب السابق", "البكاء في العرس", "تجهيز العروس", "الرقص في العرس"
    ],
    "الحمل والأطفال": [
      "الحمل", "الولادة", "الرضيع", "الطفل الصغير", "التوأم", "إجهاض الجنين", "إرضاع الطفل", "بكاء الطفل", "ضحك الطفل", "تبني طفل", 
      "اللعب مع الأطفال", "العثور على طفل", "الصبي الجميل", "البنت الجميلة", "العقيقة", "ألعاب الأطفال", "سرير الطفل", "ملابس الرضيع", "حفاضات الرضيع", "ولادة توأم بنات", 
      "ولادة توأم ذكور", "ولادة بدون ألم", "الجنين خارج البطن", "الرضاعة الطبيعية", "حمل العزباء", "حمل المطلقة", "تأخر الحمل", "شراء ملابس أطفال", "ولادة قطة", "عربة الأطفال", 
      "بكاء الطفل الرضيع", "تقبيل الطفل الصغير", "إطعام طفل جائع", "تسمية المولود الجديد", "خفاضة متسخة", "سقوط الطفل", "ضياع الابن", "موت الجنين", "ولادة قيصرية", "ولادة طبيعية"
    ],
    "المال والذهب": [
      "الذهب", "الفضة", "النقود الورقية", "العملات المعدنية", "الكنز", "السرقة", "كسب المال", "خسارة المال", "الصدقة", "الزكاة", 
      "الميراث", "البنك", "المحفظة", "عد النقود", "الديون", "العثور على محفظة", "التجارة", "الربح", "اللؤلؤ", "المرجان", 
      "الماس", "السبيكة الذهبية", "الدينار الذهب", "الدرهم الفضي", "المجوهرات", "الخزنة", "سرقة البيت", "سرقة السيارة", "توزيع المال", "طلب المال", 
      "ضياع الذهب", "شراء الذهب", "بيع الذهب", "العثور على كنز", "هدية الذهب", "عثور على نقود في الشارع", "إعطاء الميت مالاً", "أخذ المال من الميت", "شراء المجوهرات", "الإفلاس"
    ],
    "السفر": [
      "السفر بالطائرة", "السفر بالسيارة", "السفر بالقطار", "السفر بالبحر", "جواز السفر", "حقيبة السفر", "المطار", "الضياع في السفر", "العودة من السفر", "الغربة", 
      "الهجرة", "تذكرة السفر", "حجز فندق", "الحدود", "الجسر", "محطة القطار", "مترو الأنفاق", "الطائرة الحربية", "السفر للموت", "السفر للعمل", 
      "السفر للدراسة", "تجهيز الشنط", "تأخر الطائرة", "إلغاء الرحلة", "السفر مع العائلة", "السفر مع الميت", "السفر لبلد أجنبي", "السفر لمكة", "السفر للمدينة المنورة", "رؤية البحر أثناء السفر", 
      "تأشيرة السفر", "ضياع الجواز", "السفر مشياً على الأقدام", "السفر بالدراجة", "السفر بالحصان", "السفر مع الحبيب", "وداع المسافر", "استقبال المسافر", "السفر لبلد عربي", "السفر بالأتوبيس"
    ],
    "العمل والوظائف": [
      "الترقية", "الطرد من العمل", "الاستقالة", "مقابلة العمل", "الراتب", "المدير", "زملاء العمل", "الفشل في الامتحان", "النجاح والتخرج", "الزراعة", 
      "البناء", "البحث عن عمل", "التقاعد", "المكتب", "الشركة", "الكتابة والقلم", "الكمبيوتر في العمل", "اجتماع العمل", "مشروع جديد", "الربح في التجارة", 
      "الخسارة في التجارة", "توقيع عقد العمل", "النقل من الوظيفة", "الخصام مع المدير", "العمل في المستشفى", "العمل في المدرسة", "العمل كشرطي", "العمل كقاضي", "العمل كطبيب", "العمل كمهندس", 
      "تنظيف مكان العمل", "شغل يدوي", "بيع البضائع", "شراء محل جديد", "فتح مشروع خاص", "شراكة تجارية", "حريق في مكان العمل", "السرقة في العمل", "العمل الشاق", "الغياب عن الدوام"
    ],
    "الطعام والشراب": [
      "الخبز", "اللحم المطبوخ", "اللحم النيء", "العسل", "الحليب", "التمر", "الماء الصافي", "الخمر", "الفواكه", "التفاح", 
      "العنب", "التين", "الرمان", "الموز", "السمك", "الأرز", "الحلويات", "الشاي", "القهوة", "الملح", 
      "البصل", "الثوم", "البيض", "الجبن", "الزيتون", "الزيت", "البطاطس", "العدس", "الفول", "الكيك", 
      "الشوكولاتة", "الآيس كريم", "الماء البارد", "العصير العذب", "شوربة اللحم", "الخوخ", "البطيخ", "البرتقال", "الليمون", "الخيار"
    ],
    "البيت والأثاث": [
      "البيت الجديد", "البيت القديم", "الغرفة", "المطبخ", "الحمام", "الباب", "المفتاح", "السرير", "النافذة", "السجاد", 
      "الكرسي", "الطاولة", "بناء البيت", "هدم البيت", "شراء الأثاث", "السقف", "الدرج", "المكنسة", "الستائر", "الدولاب", 
      "المرآة", "اللمبة/الإضاءة", "المفتاح المكسور", "قفل الباب", "تنظيف البيت", "غسل البلاط", "ترتيب الأثاث", "البيت الواسع", "البيت الضيق", "جدران البيت", 
      "البيت بدون سقف", "سرقة أثاث البيت", "حريق البيت", "غرق البيت بالماء", "الانتقال لبيت آخر", "الجلوس على الكرسي", "النوم على السرير", "فتح النافذة", "البيت المهجور", "المزرعة"
    ],
    "الموت والمرض": [
      "الموت", "الميت", "القبر", "الجنازة", "الكفن", "العزاء", "البكاء على الميت", "زيارة المقابر", "المرض", "الحمى", 
      "السرطان", "المستشفى", "الطبيب", "الدواء", "الشفاء", "سكرات الموت", "نطق الشهادة قبل الموت", "الاحتضار", "غسل الميت", "الصلاة على الميت", 
      "حفر القبر", "الجلوس مع الميت", "التحدث مع الميت", "احتضان الميت", "تقبيل الميت", "سماع خبر وفاة", "موت الأب", "موت الأم", "موت الأخ", "موت الأخت", 
      "موت الزوج", "البكاء الشديد بدون صوت", "المرض الجلدي", "تساقط الشعر بسبب المرض", "المغص والمعدة", "الصداع", "العمى", "العرج", "الشلل", "العملية الجراحية"
    ]
  };

  const templates = [
    { prefix: "تفسير رؤية", suffix: "" },
    { prefix: "تفسير حلم رؤية", suffix: "في المنام" },
    { prefix: "دلالة رؤية", suffix: "بالتفصيل" },
    { prefix: "تأويل حلم", suffix: "في البيت" },
    { prefix: "معنى رؤية", suffix: "في المنام لابن سيرين" },
    { prefix: "رؤية", suffix: "الكبير في الحلم" },
    { prefix: "رؤية", suffix: "الصغير في المنام" },
    { prefix: "تفسير حلم الهروب من", suffix: "" },
    { prefix: "الخوف من", suffix: "في المنام" },
    { prefix: "تفسير حلم عضة", suffix: "" },
    { prefix: "تفسير رؤية", suffix: "الأبيض في المنام" },
    { prefix: "تفسير رؤية", suffix: "الأسود في المنام" },
    { prefix: "تفسير رؤية", suffix: "الميت في المنام" },
    { prefix: "تفسير حلم صيد", suffix: "" },
    { prefix: "تفسير حلم شراء", suffix: "" },
    { prefix: "رؤية", suffix: "الأليف في المنام" },
    { prefix: "تأويل رؤية", suffix: "الكثير في المنام" },
    { prefix: "تفسير حلم إطعام", suffix: "" },
    { prefix: "تفسير حلم ذبح", suffix: "" },
    { prefix: "رؤية", suffix: "المريض في المنام" },
    { prefix: "رؤية", suffix: "في الفراش في الحلم" },
    { prefix: "تفسير حلم اللعب مع", suffix: "" },
    { prefix: "تفسير حلم موت", suffix: "" },
    { prefix: "تفسير حلم أخذ", suffix: "من شخص" },
    { prefix: "تأويل رؤية", suffix: "يهرب مني في الحلم" }
  ];

  let idCounter = 10000;

  for (const [category, nouns] of Object.entries(categoriesData)) {
    for (const noun of nouns) {
      for (const t of templates) {
        let name = `${t.prefix} ${noun} ${t.suffix}`.replace(/\s+/g, " ").trim();
        if (name.length < 5) continue;

        // Custom, clean slug using hyphens
        const slug = name.replace(/\s+/g, "-");
        const id = `gen_${idCounter++}`;
        const searchCount = Math.floor(Math.random() * 950) + 50;
        const shortDesc = `تفسير ودلالات رؤية ${name} في المنام بالتفصيل الشرعي وفق كبار أئمة التفسير مثل ابن سيرين والنابلسي.`;

        MASSIVE_SYMBOLS_INDEX.push({
          id,
          slug,
          name,
          category,
          shortDesc,
          searchCount,
          isGenerated: true
        });
      }
    }
  }

  console.log(`Massive Dynamic Symbols Index populated with ${MASSIVE_SYMBOLS_INDEX.length} symbols!`);
}

// Gemini Schema for Structured Dream Symbol Output
const responseSchema = {
  type: "OBJECT",
  properties: {
    slug: { type: "STRING" },
    name: { type: "STRING" },
    category: { type: "STRING" },
    shortDesc: { type: "STRING" },
    introduction: { type: "STRING" },
    ibnSirin: { type: "STRING" },
    nabulsi: { type: "STRING" },
    ibnShaheen: { type: "STRING" },
    forSingle: { type: "STRING" },
    forMarried: { type: "STRING" },
    forPregnant: { type: "STRING" },
    forDivorced: { type: "STRING" },
    forSingleMan: { type: "STRING" },
    forMarriedMan: { type: "STRING" },
    goodOmens: { type: "STRING" },
    badOmens: { type: "STRING" },
    faqs: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" }
        },
        required: ["question", "answer"]
      }
    },
    variations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" }
        },
        required: ["title", "content"]
      }
    },
    relatedSymbolsText: { type: "STRING" },
    englishKeyword: { type: "STRING" }
  },
  required: [
    "slug", "name", "category", "shortDesc", "introduction",
    "ibnSirin", "nabulsi", "ibnShaheen", "forSingle", "forMarried",
    "forPregnant", "forDivorced", "forSingleMan", "forMarriedMan",
    "goodOmens", "badOmens", "faqs", "variations", "relatedSymbolsText", "englishKeyword"
  ]
};

// Map of common Arabic terms to exact high-quality Unsplash image configurations
const PHOTO_MAPPING: Record<string, string> = {
  "أسد": "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=800&q=80",
  "اسد": "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=800&q=80",
  "ثعبان": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "حية": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "أفعى": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "افعى": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "عقرب": "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=800&q=80",
  "عقارب": "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=800&q=80",
  "قمر": "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&w=800&q=80",
  "شمس": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "بحر": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80",
  "مطر": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80",
  "ماء": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
  "نار": "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80",
  "حريق": "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80",
  "مسجد": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  "صلاة": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  "كعبة": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  "سيارة": "https://images.unsplash.com/photo-1494976388531-d110a4a8622b?auto=format&fit=crop&w=800&q=80",
  "بيت": "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80",
  "منزل": "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80",
  "طفل": "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
  "طفلة": "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
  "ولد": "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
  "زواج": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "عرس": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "ذهب": "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
  "مال": "https://images.unsplash.com/photo-1509720357406-0d19f547db5a?auto=format&fit=crop&w=800&q=80",
  "نقود": "https://images.unsplash.com/photo-1509720357406-0d19f547db5a?auto=format&fit=crop&w=800&q=80",
  "شجر": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
  "شجرة": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
  "قطة": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
  "قط": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
  "كلب": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
  "كلاب": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
  "حصان": "https://images.unsplash.com/photo-1553284965-83fd3e82fa52?auto=format&fit=crop&w=800&q=80",
  "خيل": "https://images.unsplash.com/photo-1553284965-83fd3e82fa52?auto=format&fit=crop&w=800&q=80",
  "سمك": "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=800&q=80",
  "سمكة": "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=800&q=80",
  "حمامة": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
  "حمام": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
  "ورد": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "ورود": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "زهور": "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
  "سفر": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
  "طائرة": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
  "ساعة": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
  "مفتاح": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
  "كتاب": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
  "خبز": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "حليب": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "لبن": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "طعام": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  "نجوم": "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80",
  "نجم": "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80",
  "سماء": "https://images.unsplash.com/photo-1513628253939-010e64ac66cd?auto=format&fit=crop&w=800&q=80"
};

// Dynamic Generator Function utilizing gemini-3.5-flash for complete accuracy
async function generateAISymbol(queryOrSlug: string): Promise<any | null> {
  if (!queryOrSlug || queryOrSlug.trim().length < 2) return null;

  try {
    const prompt = `You are an expert Islamic dream interpreter with deep knowledge of the classical interpretations of Ibn Sirin (ابن سيرين), Al-Nabulsi (النابلسي), and Ibn Shaheen (ابن شاهين).
Generate a comprehensive, high-fidelity dream interpretation object for the following dream symbol, scenario, or phrase: "${queryOrSlug}".
If the input is a sentence or complex scenario (e.g., "رأيت أني أسبح في بحر هائج"), extract the core symbol (e.g., "البحر الهائج" or "السباحة في البحر") and interpret it fully.

The response must be in Arabic (except for the slug and englishKeyword) and must follow this exact JSON structure:
{
  "slug": "a unique English lowercase slug for URL use, e.g., 'scorpion' or 'falling-from-height'",
  "name": "the clean Arabic name of the symbol, e.g., 'العقرب' or 'السقوط من مكان مرتفع'",
  "category": "choose EXACTLY one of these: 'الحيوانات', 'الطبيعة', 'الطيور', 'الحشرات', 'الزواج والعلاقات', 'الحمل والأطفال', 'المال والذهب', 'السفر', 'العمل والوظائف', 'الطعام والشراب', 'البيت والأثاث', 'الموت والمرض'",
  "shortDesc": "a precise, engaging 1-2 sentence Arabic summary of the dream symbol",
  "introduction": "a beautiful, spiritual and psychological Arabic introduction to this symbol in dreams (2-3 paragraphs)",
  "ibnSirin": "highly detailed Arabic interpretation according to Imam Ibn Sirin (at least 3 paragraphs), discussing different states",
  "nabulsi": "highly detailed Arabic interpretation according to Imam Al-Nabulsi (at least 3 paragraphs)",
  "ibnShaheen": "detailed Arabic interpretation according to Imam Ibn Shaheen (at least 2 paragraphs)",
  "forSingle": "detailed Arabic advice and interpretation for a single woman (العزباء)",
  "forMarried": "detailed Arabic advice and interpretation for a married woman (المتزوجة)",
  "forPregnant": "detailed Arabic advice and interpretation for a pregnant woman (الحامل)",
  "forDivorced": "detailed Arabic advice and interpretation for a divorced woman (المطلقة)",
  "forSingleMan": "detailed Arabic advice and interpretation for an unmarried/single man (الأعزب)",
  "forMarriedMan": "detailed Arabic advice and interpretation for a married man (المتزوج)",
  "goodOmens": "a beautifully structured list of positive indicators (البشارات ومواضع الخير) associated with this symbol, separated by bullet points or newlines",
  "badOmens": "a beautifully structured list of warnings or negative indicators (المحذرات ومواضع الشر) associated with this symbol",
  "faqs": [
    {
      "question": "common user question in Arabic about this dream",
      "answer": "detailed reassuring response in Arabic"
    },
    {
      "question": "another common question in Arabic",
      "answer": "detailed response in Arabic"
    }
  ],
  "variations": [
    {
      "title": "first specific state or variation (e.g., 'قرصة العقرب' or 'الهروب من السقوط')",
      "content": "detailed interpretation in Arabic"
    },
    {
      "title": "second state or variation",
      "content": "detailed interpretation in Arabic"
    }
  ],
  "relatedSymbolsText": "A beautiful paragraph connecting this symbol to other related dream symbols.",
  "englishKeyword": "a single, precise English word or 2-word phrase representing the physical object to search on Unsplash (e.g., 'scorpion', 'car', 'gold', 'hospital', 'wedding')"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsed = JSON.parse(text.trim());
    
    // Auto-generate unique ID and initial realistic search count
    parsed.id = "ai_" + Math.random().toString(36).substr(2, 9);
    parsed.searchCount = Math.floor(Math.random() * 800) + 200;
    
    // Set accurate image URL using pre-curated map or dynamic featured Unsplash URL
    let foundImg = "";
    for (const [key, val] of Object.entries(PHOTO_MAPPING)) {
      if (parsed.name.includes(key) || key.includes(parsed.name)) {
        foundImg = val;
        break;
      }
    }
    
    if (foundImg) {
      parsed.imageUrl = foundImg;
    } else {
      // Use verified starry-night fallback so we never display a wrong or unrelated image
      parsed.imageUrl = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80";
    }
    
    // Cache the newly generated symbol
    DYNAMIC_SYMBOLS.push(parsed);

    // Persist to Prisma if available
    if (prisma) {
      try {
        await prisma.dreamSymbol.create({
          data: {
            slug: parsed.slug,
            name: parsed.name,
            category: parsed.category,
            shortDesc: parsed.shortDesc,
            imageUrl: parsed.imageUrl,
            ibnSirin: parsed.ibnSirin,
            nabulsi: parsed.nabulsi,
            ibnShaheen: parsed.ibnShaheen,
            forSingle: parsed.forSingle,
            forMarried: parsed.forMarried,
            forPregnant: parsed.forPregnant,
            forDivorced: parsed.forDivorced,
            forSingleMan: parsed.forSingleMan,
            forMarriedMan: parsed.forMarriedMan,
            goodOmens: parsed.goodOmens,
            badOmens: parsed.badOmens,
            searchCount: parsed.searchCount,
            variations: {
              create: parsed.variations.map((v: any) => ({
                title: v.title,
                content: v.content
              }))
            },
            faqs: {
              create: parsed.faqs.map((f: any) => ({
                question: f.question,
                answer: f.answer
              }))
            }
          }
        });
      } catch (dbErr) {
        console.error("Failed to persist generated symbol to Prisma (duplicate or other):", dbErr);
      }
    }

    return parsed;
  } catch (err) {
    console.error("Failed to generate AI dream symbol:", err);
    return null;
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", databaseConnected: !!prisma });
});

app.get("/sitemap.xml", (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ayahdreams.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ayahdreams.com/symbols</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ayahdreams.com/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://ayahdreams.com/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`);
});

const MOCK_SYMBOLS = [
  {
    id: "1",
    slug: "sea",
    name: "البحر",
    category: "الطبيعة",
    shortDesc: "يدل البحر على ملك قوي وعادل، وربما دل على الدنيا وأهوالها.",
    imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80",
    introduction: "يعتبر البحر من أعظم رموز الطبيعة في الأحلام وأكثرها غموضاً وتأثيراً في النفس البشرية. فهو يعكس حالة الرائي الداخلية وتقلبات حياته؛ تارةً يكون هادئاً يبعث على السكينة والطمأنينة، وتارةً أخرى يكون هائجاً يعكس صراعات وضغوطاً نفسية عميقة.\n\nفي الثقافة الإسلامية وتفاسير الأحلام المعتمدة، يمثل البحر القوة المطلقة، السلطان، والسعة في الرزق والعلم. كما أنه رمز للدنيا بأسرارها ومحنها وعجائبها التي لا تنتهي.\n\nإن رؤية البحر في المنام ليست مجرد مشهد عابر، بل هي رسالة قوية تحمل في طياتها بشائر وتنبيهات تعتمد بشكل أساسي على حالة البحر (هادئ أم هائج)، وحالة الرائي (يسبح، يغرق، يشرب من مائه)، ولون الماء وصفائه.",
    ibnSirin: "يقول الإمام محمد بن سيرين في تفسيره العظيم لرؤية البحر في المنام أنه يدل على السلطان أو الملك القوي الأعظم، والمهاب العادل، الذي يحتاج إليه الناس كما يحتاجون إلى البحر. وربما دل البحر على الدنيا وأهوالها، ومحنها وعجائبها. فمن رأى البحر في منامه فإنه يصيب شيئاً يرجوه ويتشوق إليه.\n\nومن رأى أنه خاض في البحر فإنه يدخل في عمل الملك أو السلطان، ويكون له شأن بقدر خوضه. أما من شرب من ماء البحر، فإن كان الماء صافياً نال مالاً من الملك بقدر ما شرب، أو نال علماً واسعاً وحكمة عظيمة ينفعه الله بها في دنياه وآخرته، وإن شربه كله فإنه يملك الدنيا.\n\nوإذا رأى أنه عبر البحر وانتقل إلى الضفة الأخرى فإنه ينجو من هم أو عدو متسلط. ومن رأى البحر هادئاً فهو استقرار في حياته وأمن من الخوف، أما هيجان البحر وتلاطم أمواجه فيدل على الفتن والمحن التي قد تصيب الرائي أو تعم البلد.\n\nكما يشير الغرق في البحر عند ابن سيرين إلى الغرق في هموم الدنيا وملذاتها والبعد عن طاعة الله، إلا إذا غرق ومات فيه فقد قيل إنه يموت شهيداً لأن الغريق شهيد، والله أعلم.",
    nabulsi: "أما الإمام عبد الغني النابلسي، فقد ذكر في 'تعطير الأنام في تعبير المنام' أن البحر يدل على ملك قوي مهاب عادل يحتاج إليه الخلائق، وربما دل على التاجر الذي لا يحد ماله. فمن رأى البحر من بعيد فإنه يرى هولاً وفتنة، ومن رأى أنه شرب مائه كله فإنه يملك الدنيا بأسرها ويطول عمره.\n\nومن رأى أنه يستحم في البحر أو يتوضأ منه، فإنه يكفر عن ذنوبه وتذهب همومه ويفرج الله كربه. والبحر المالح يدل على المشقة والهم، بينما تحول ماء البحر إلى عذب يدل على صلاح حال الحاكم أو زوال الفتنة.\n\nالمشي فوق ماء البحر يدل على قوة الإيمان وحسن اليقين بالله تعالى، والثبات على الحق. ورؤية البحر تتراجع مياهه حتى تظهر أرضه تدل على قحط أو زوال حكم في تلك المنطقة. وإذا رأى أن البحر قد غمر البيوت والمحلات دون أن يغرق أحداً فهو رزق وخصب يعم البلد.",
    ibnShaheen: "ويرى الإمام ابن شاهين الظاهري في 'الإشارات في علم العبارات' أن رؤية البحر تؤول على أوجه عدة: ملك، وسلطان، وعالم، ومال، وعمل. من رأى أنه يشرب من ماء البحر وكان صافياً فإنه يصيب مالاً، ومن رأى أنه يغرق فيه فإنه يغرق في أمور الدنيا.\n\nومن رأى أنه يجمع ماء البحر في وعاء فإنه يجمع مالاً من سلطان أو يتلقى علماً من عالم. ومن رأى البحر هادئاً وماءه صافياً فإنه خير وسرور يأتيه من جهة رئيسه أو عمله.\n\nأما من رأى أنه يبول في البحر فإنه يرتكب خطيئة أو يستخف بأمر عظيم. ومن رأى أنه أخذ من البحر سمكاً فإنه ينال رزقاً حلالاً بقدر ما أخذ.",
    forSingle: "رؤية البحر للعزباء تدل على مستقبلها المجهول الذي قد يحمل الكثير من الخير إذا كان البحر هادئاً وصافياً. إن رأت أنها تسبح بمهارة فهو تحقيق لأحلامها وطموحاتها.\n\nكما يدل البحر الصافي الهادئ على زواج قريب من رجل ذي مكانة وشأن عظيم، يتصف بالكرم والسخاء. أما الأمواج العالية والمياه العكرة فتدل على تقلبات عاطفية، أو صعوبات ومشاكل تواجهها في حياتها الشخصية أو العملية، وعليها التأني في اتخاذ قراراتها.",
    forMarried: "للمتزوجة، يدل البحر الهادئ على استقرار حياتها الزوجية وسعادة أسرتها والانسجام التام مع زوجها. إذا رأت أنها تشرب من مائه الصافي فهو رزق واسع قادم لزوجها، وربما دل على حمل قريب.\n\nأما هيجان البحر فهو مشاكل أو خلافات زوجية قوية قد تطرأ وتهدد استقرار بيتها، والنجاة من البحر الهائج نجاة من هذه الخلافات وعودة للمياه إلى مجاريها. الاغتسال بماء البحر للمتزوجة طهارة من الذنوب وتفريج للهموم.",
    forPregnant: "البحر للحامل يدل على تيسير الولادة إذا كان هادئاً وصافياً، ويدل على إنجاب مولود ذكر سيكون له شأن عظيم ومكانة في المستقبل بإذن الله.\n\nالسباحة السهلة الميسرة في البحر للحامل سلامة لها ولجنينها، بينما الأمواج القوية أو الغرق قد يكون إشارة لتعب مؤقت أثناء الحمل أو قلق نفسي تعيشه بسبب الولادة، وعليها بالدعاء والصدقة.",
    forDivorced: "رؤية البحر للمطلقة تبشر ببداية حياة جديدة وتجاوز لأحزان الماضي. السباحة في البحر بمهارة تدل على تخطي الصعاب والاعتماد على النفس بنجاح.\n\nشرب الماء الصافي من البحر يعبر عن زواج جديد من رجل مقتدر يعوضها خيراً عن أيامها الصعبة، أو نجاح كبير في مجال العمل وتحقيق استقلال مادي. أما البحر الهائج فهو انعكاس للصراعات التي ما زالت تعيشها مع طليقها.",
    forSingleMan: "للرجل الأعزب، البحر يدل على الدنيا والطموح الواسع. إذا رأى أنه يسبح ويصل إلى بر الأمان فإنه يتزوج من امرأة صالحة أو يحقق نجاحاً باهراً في تجارته ويصل لأهدافه.\n\nالصيد من البحر يدل على الرزق الحلال القادم إليه بعد تعب واجتهاد. وإذا شرب من ماء البحر العذب فهو علم ينتفع به أو عمل يدر عليه أرباحاً طائلة.",
    forMarriedMan: "للرجل المتزوج، البحر يدل على تجارته وعمله أو عائلته ومسؤولياته. استقرار البحر استقرار لعمله وعائلته، وخوض البحر يدل على الدخول في تحديات جديدة لكسب الرزق وتأمين مستقبل أبنائه.\n\nاصطياد السمك من البحر رزق حلال وأبناء صالحون. أما إذا رأى أنه يغرق فهو غرق في الديون أو المشاكل العائلية المعقدة التي تحتاج لحكمة لحلها.",
    goodOmens: "من أعظم مبشرات رؤية البحر:\n- هدوء الأمواج وصفاء المياه.\n- الشرب من ماء البحر والشعور بالارتواء (خاصة إذا كان عذباً).\n- السباحة بمهارة والوصول للبر بسلام.\n- صيد الأسماك بكثرة وسهولة.\n- المشي فوق الماء بيقين دون الغوص فيه.\n- الاغتسال بماء البحر.",
    badOmens: "من منفرات ومحذرات رؤية البحر:\n- هيجان الأمواج وتلاطمها بقوة.\n- الغرق دون نجاة أو القدرة على التنفس.\n- الماء الكدر، المظلم، أو شديد الملوحة.\n- الظلام الدامس فوق البحر.\n- رؤية حيوانات مفترسة وحوش تخرج من البحر.\n- فيضان البحر وتدميره للمنازل.",
    faqs: [
      { question: "هل رؤية البحر الهائج تدل دائماً على الشر؟", answer: "لا، ليس دائماً، فبعض المفسرين يرون أنه يدل على قوة السلطان أو تغير سريع وجذري في حياة الرائي، ولكن يُنصح الرائي بكثرة الاستغفار والصدقة عند رؤيته لتجنب أي محنة محتملة." },
      { question: "ما معنى الغوص في قاع البحر؟", answer: "الغوص في قاع البحر يدل على البحث عن أسرار أو علوم عميقة، وإذا استخرج الرائي اللؤلؤ أو المرجان فإنه ينال علماً واسعاً أو رزقاً مباركاً من حيث لا يحتسب." },
      { question: "رأيت أن البحر انشق أمامي، ما التفسير؟", answer: "انشقاق البحر في المنام من أعظم البشارات، فهو نجاة من كرب عظيم كما نجى الله نبيه موسى عليه السلام، وتسهيل لأمور مستعصية." }
    ],
    searchCount: 1542,
    variations: [
      { title: "الغرق في البحر", content: "من رأى أنه يغرق في البحر ويغوص فيه فإنه يغرق في أمور الدنيا وهمومها، وإن مات غرقاً قيل إنه يموت شهيداً، وإن نجا فهو توبة من معصية." },
      { title: "شرب ماء البحر", content: "إن كان صافياً فهو مال وحكمة ينالها من ملك أو رئيس، وإن كان كدراً فهو هم وغم يصيبه." },
      { title: "جفاف البحر", content: "جفاف البحر يدل على القحط والفقر أو زوال ملك وسلطان حاكم تلك المنطقة." }
    ],
    relatedSymbolsText: "ترتبط رؤية البحر في المنام بالعديد من الرموز والدلالات الأخرى التي قد تظهر معه في نفس الحلم وتغير من مسار التفسير بالكامل. على سبيل المثال، رؤية **السفينة** في البحر تدل على النجاة والأمان من الخوف، كما فسرها ابن سيرين. أما رؤية **الأسماك** فهي رزق وغنيمة حلال.\n\nكذلك ترتبط رؤية البحر برؤية **المطر**، فإذا نزل المطر على البحر فهو رحمة عامة وغيث للمحتاجين. ولا ننسى رمز **اللؤلؤ** المستخرج من البحر والذي يعبر عن القرآن الكريم والعلم الشرعي والأبناء الصالحين. جميع هذه الرموز تتضافر لتشكل مشهداً حلمياً غنياً بالرسائل الربانية التي تستوجب التأمل والفهم العميق."
  },
  {
    id: "2",
    slug: "lion",
    name: "الأسد",
    category: "الحيوانات",
    shortDesc: "يدل الأسد على السلطان القاهر الجبار، أو العدو المتسلط.",
    imageUrl: "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "يقول الإمام ابن سيرين في كتابه منتخب الكلام في تفسير الأحلام إن الأسد في المنام يرمز إلى السلطان القاهر الجبار، وذلك لعظم خطره وشدة جسارته وفظاعة خلقته وقوة غضبه. كما يدل الأسد على المحارب واللص والمختلس، وأحياناً يعبر عن العدو المتسلط أو المدير الظالم في العمل. فمن رأى أسداً يدخل بيته وكان فيه مريض، هلك المريض، لأن الأسد يفترس الأرواح. ومن رأى الأسد ولم يخالطه أصابه فزع ثم أمن منه. \n\nومن رأى أنه يركب الأسد فإنه يركب أمراً عظيماً ومخاطرة كبيرة، إما أن ينجو منها وإما أن يهلك. أما مصارعة الأسد فتدل على الخصومة مع عدو شديد، ومن أكل لحم الأسد أصاب مالاً من سلطان وظفر بعدوه. ورؤية شبل الأسد تدل على ولد ذكوري سيكون له شأن ومكانة في المستقبل.",
    nabulsi: "ويضيف الإمام عبد الغني النابلسي أن الأسد يدل على سلطان شديد ظالم غاشم مجاهر متسلط لجرأته. وربما دل على الموت لأنه يقتنص الأرواح، أو على عافية المريض. ومن رأى أنه تحول أسداً صار ظالماً على قدر حاله. ومن رأى أسداً في بيته فإنه يصيب سلطاناً أو عمراً طويلاً، وجلد الأسد وعظمه ولحمه وشعره مال من عدو مسلط أو سلطان.",
    ibnShaheen: "ويرى ابن شاهين أن رؤية الأسد تؤول بالعدو القوي، فمن رأى أنه يقاتل أسداً فإنه يقاتل عدواً متسلطاً، ومن رأى أنه ركب الأسد فإنه يصيب سلطاناً كبيراً وعزاً ورفعة. ومن هرب من الأسد ولم يقصده الأسد فإنه ينجو من أمر يخافه.",
    forSingle: "رؤية الأسد للعزباء قد تدل على شخص ذو نفوذ وقوة في حياتها. إذا كان الأسد أليفاً ولم يؤذها، فهذا يشير إلى زواجها من رجل له مكانة ومركز مرموق يحميها ويكون سنداً لها. أما إذا هاجمها الأسد، فقد يعبر عن خوفها من شخص متسلط في العائلة أو العمل يحاول فرض سيطرته عليها.",
    forMarried: "بالنسبة للمتزوجة، يرمز الأسد في الغالب إلى الزوج. إذا كان الأسد يحميها فهو زوج صالح يدافع عنها وعن أسرتها ويوفر لهم الأمان. أما هجوم الأسد أو الخوف منه في المنام فيدل على قسوة الزوج أو وجود خلافات شديدة وشعورها بالظلم والقهر في حياتها الزوجية.",
    forPregnant: "الأسد للحامل من الرؤى المبشرة جداً، حيث يدل على أنها ستنجب ولداً ذكراً يتصف بالشجاعة والقوة، وسيكون له شأن عظيم ومكانة مرموقة بين الناس في المستقبل بإذن الله، كما يدل على تخطيها لصعاب الحمل بسلام.",
    forDivorced: "للمطلقة، رؤية الأسد تعبر عن مرحلة جديدة تتطلب منها القوة والشجاعة. إذا رأت أنها تتغلب على الأسد أو تركبه، فهذا يدل على انتصارها على من ظلمها واسترداد حقوقها، وربما ارتباطها برجل قوي يعوضها عن معاناتها السابقة.",
    forSingleMan: "للرجل الأعزب، الأسد يمثل طموحه وتحدياته. قتله للأسد يدل على تجاوزه الصعاب الكبيرة وتحقيقه نجاحاً مبهراً في حياته العملية ووصوله لمركز قيادي. كما قد يرمز لوجود منافس قوي يجب الحذر منه.",
    forMarriedMan: "للرجل المتزوج، الأسد يعبر عن مسؤوليته وقوته كرب أسرة، أو يمثل رئيسه في العمل. إذا واجه الأسد وانتصر عليه، فهذا ترقية في عمله أو كسب قضية ضد ظالم. شبل الأسد يرمز لولده القوي.",
    goodOmens: "من مبشرات رؤية الأسد: ركوب الأسد وتوجيهه، أكل لحم الأسد أو أخذ شيء من أثره كجلده أو عظمه، والهروب من الأسد بنجاح، وتحول الأسد لأليف يدافع عن الرائي.",
    badOmens: "من محذرات رؤية الأسد: التعرض لعضة الأسد أو جرحه، دخول الأسد لبيت فيه مريض، ومطاردة الأسد للرائي والشعور بالرعب الشديد منه، فهذا عدو غاشم أو مرض شديد.",
    faqs: [
      { question: "هل رؤية الأسد في المنام تدل على السحر؟", answer: "الأسد في الغالب لا يرمز للسحر في كتب التفسير المعتمدة، بل يرمز لسلطان ظالم أو عدو قوي أو مرض شديد، والنجاة منه نجاة من ذلك كله." },
      { question: "رأيت أسداً صغيراً (شبل) يلعب معي، ما التفسير؟", answer: "الشبل يدل على ولد ذكر، أو بداية مشروع جديد يحتاج لرعاية ولكنه سيكبر ويكون له شأن وقوة." }
    ],
    searchCount: 1240,
    variations: [
      { title: "الهروب من الأسد", content: "الهروب من الأسد نجاة من الخوف والهم، والانتصار عليه قوة وغلبة للعدو." },
      { title: "أكل لحم الأسد", content: "من رأى أنه يأكل من لحم الأسد فإنه يصيب مالاً من سلطان أو عدو." }
    ]
  },
  {
    id: "3",
    slug: "fire",
    name: "النار",
    category: "الطبيعة",
    shortDesc: "النار إذا كانت بلا دخان فهي هداية وسرور، وإن كانت ذات دخان فهي عذاب ومحنة.",
    imageUrl: "https://images.unsplash.com/photo-1497911174120-042e5fc6eb84?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "يقول الإمام محمد بن سيرين في تفسيره لرؤية النار في المنام أنها قد تدل على البشارة والإنذار في آن واحد. فمن رأى ناراً مضيئة في الليل يستأنس بها الناس فهي هداية وملك وسلطان وعلم يستفيد منه الرائي ويفيد به غيره. أما النار التي لها دوي وشرر ودخان كثيف فهي فتنة وعذاب ومصيبة قد تحل بالرائي أو بالمكان الذي رآها فيه. ومن رأى أن النار أحرقت ثيابه أو جزءاً من جسده فإنه يصاب بمصيبة أو هم أو يعتدى عليه في ماله وعرضه.",
    nabulsi: "ويذكر الإمام عبد الغني النابلسي أن النار تدل على السلطان والقدرة. فمن رأى أنه يعبد النار فإنه يطيع الشيطان أو يخضع لحاكم ظالم مبتدع. ومن رأى أنه يأكل النار فإنه يأكل مال اليتامى ظلماً أو يأكل مالاً حراماً. وإشعال النار للتدفئة في الشتاء غنى للفقير، وإشعالها لإنضاج الطعام منعة ورزق ومصلحة تقضى. والشرارة من النار كلام سيء يلقى أو فتنة صغيرة قد تكبر إذا لم تُخمد.",
    ibnShaheen: "ويرى ابن شاهين أن النار إن كانت تحرق فهي مصيبة وبلاء، وإن كانت تضيء فقط فهي منفعة وهداية وسرور. ومن رأى أن ناراً وقعت في بلدة ولم تحرق شيئاً فهو مرض أو وباء ينزل بتلك البلدة ولكن يسلم منه الكثيرون، أما إن أحرقت فهو سيف وعدو وظلم ينزل بهم.",
    forSingle: "رؤية النار للعزباء تدل على العاطفة القوية والحب إذا كانت النار هادئة ومضيئة وتستأنس بها، وقد تشير إلى زواج قريب من رجل دافئ وحنون. أما إذا كانت النار تحرقها أو مخيفة، فهي تحذير من فتنة أو علاقة مؤذية قد تسبب لها الكثير من الألم والندم، وعليها الحذر في قراراتها.",
    forMarried: "للمتزوجة، النار المضيئة الهادئة في البيت تعبر عن الاستقرار الأسري والدفء بينها وبين زوجها. ولكن رؤية اندلاع حريق في المنزل تدل على خلافات ومشاكل زوجية قوية قد تعصف باستقرار البيت، ونجاتها من النار نجاة من تلك المشاكل وعودة الهدوء لحياتها.",
    forPregnant: "النار للحامل بشارة خير إذا كانت تراها من بعيد أو للتدفئة، وتدل على ولادة طفل سيكون له شأن وسلطان. أما رؤية النار المشتعلة بقوة فقد تدل على بعض المتاعب أثناء الحمل أو القلق الزائد الذي تعيشه، وخروجها من النار سالمة هو تيسير لولادتها وسلامة لها ولجنينها.",
    forDivorced: "للمطلقة، النار التي تحرق تدل على الشائعات أو الكلام السيء الذي يقال في حقها. ولكن إذا رأت أنها تنجو من النار، فهذا يعني براءتها وانتصارها على من ظلمها. إشعال النار للإضاءة يرمز إلى بداية مرحلة جديدة مشرقة في حياتها وتحقيقها للنجاح.",
    forSingleMan: "للرجل الأعزب، النار تدل على الطموح والشغف الكبير في العمل. إشعاله للنار ليهتدي بها الناس يدل على علمه ومكانته. أما إذا أحرقته النار فهي ذنوب يرتكبها أو خسارة في تجارة أو شراكة سيئة، وعليه مراجعة أموره.",
    forMarriedMan: "الرجل المتزوج الذي يرى النار في بيته وتؤذيه، هي دلالة على مشاكل مع زوجته أو أبنائه. وإشعاله لنار هادئة يعكس سعيه لتوفير الأمان والدفء لأسرته، وإذا رأى أنه يخمد ناراً فهو ينهي فتنة ويصلح ذات البين.",
    goodOmens: "من دلالات الخير: النار الصافية المضيئة بغير دخان، النار للتدفئة في الشتاء، إطفاء نار الفتنة، واستخدام النار لطبخ الطعام.",
    badOmens: "من دلالات الشر: النار المحرقة ذات الدخان الكثيف، اشتعال ثياب الرائي، أكل الجمر أو النار، والحرائق في البيوت والممتلكات.",
    faqs: [
      { question: "ما معنى رؤية النار تسقط من السماء؟", answer: "تدل على بلاء عام أو مرض أو فتنة تصيب أهل ذلك المكان الذي سقطت فيه، وعليهم بكثرة الدعاء." },
      { question: "هل إطفاء النار محمود أم مذموم؟", answer: "إذا كانت ناراً للتدفئة أو الإضاءة فإطفاؤها تعطيل للمصالح أو فقر، أما إذا كانت نار حريق وفتنة فإطفاؤها محمود ويدل على إنهاء المشاكل." }
    ],
    searchCount: 950,
    variations: [
      { title: "النجاة من النار", content: "تدل النجاة من النار على البراءة من التهم، أو التوبة من الذنوب، أو الخروج من فتنة ومحنة بسلام." },
      { title: "أكل النار", content: "يدل على أكل المال الحرام أو مال الأيتام بالباطل، وهو نذير سوء للرائي." }
    ]
  },
  {
    id: "4",
    slug: "snake",
    name: "الثعبان",
    category: "الحيوانات",
    shortDesc: "الثعبان عدو لدود، وكلما كان أكبر كان العدو أخطر وأشد مكراً.",
    imageUrl: "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "يرى الإمام ابن سيرين أن الحية والثعبان في المنام هما في المقام الأول رمز للعدو. وحجم الثعبان وسمه يعكس قوة هذا العدو وشدة مكره وأذاه. فمن رأى ثعباناً كبيراً فهو عدو شديد البأس، والثعبان الصغير عدو ضعيف. وإذا رأى الثعبان في بيته فهو عدو من أهل بيته أو أقاربه، وإن كان خارج البيت فهو عدو غريب. وقتل الثعبان في المنام هو انتصار على العدو والظفر به.",
    nabulsi: "الشيخ عبد الغني النابلسي يؤكد أن الثعبان قد يرمز إلى عداوة من الأهل أو الزوجة أو الأولاد مصداقاً لقوله تعالى: (إن من أزواجكم وأولادكم عدواً لكم فاحذروهم). وربما دل على جار حسود حقود يتتبع العورات. ومن رأى أنه يمتلك ثعباناً لا يؤذيه فإنه ينال سلطاناً وجاهاً ومكاسب. والثعبان الميت دلالة على عدو كفاه الله شره بلا عناء.",
    ibnShaheen: "ويقول ابن شاهين إن لدغة الثعبان تدل على حصول مكروه من عدو بمقدار الألم الذي شعر به الرائي. ومن رأى ثعباناً يخرج من فمه، فقد يدل على كلام يخرج منه يكون سبباً في هلاكه أو هلاك غيره، فليحذر من فلتات لسانه. وأكل لحم الثعبان مال حلال يأتيه من جهة عدوه.",
    forSingle: "رؤية الثعبان للعزباء غالباً ما تكون تحذيراً من شخص مخادع وماكر يقترب منها بنوايا سيئة سواء كان رجلاً يطمع فيها أو صديقة تحسدها. لدغة الثعبان تشير إلى صدمة عاطفية أو ضرر يلحق بسمعتها. ولكن قتلها للثعبان دليل على قوة بصيرتها وتخلصها من هذا الخطر بنجاح.",
    forMarried: "للمتزوجة، الثعبان في بيتها يمثل امرأة حقود تسعى لخراب بيتها وإشعال الفتن بينها وبين زوجها، أو يدل على كثرة المشاكل الزوجية التي لا مبرر لها بسبب الحسد. قتل الثعبان أو طرده من البيت هو تحصين لأسرتها وحماية لحياتها الزوجية من الانهيار.",
    forPregnant: "الثعبان للحامل قد يكون انعكاساً لمخاوفها الداخلية من الولادة، أو يدل على وجود من يحسدها على حملها ويكن لها الضغينة. إذا رأت أنها تقتل الثعبان، فذلك مبشر بسلامتها وسلامة مولودها وتخلصها من كل شر.",
    forDivorced: "رؤية الثعبان للمطلقة تعكس المشاكل والضغوط التي تواجهها بسبب الطليق أو كلام الناس الجارح المحيط بها. الثعبان الأسود هموم كبيرة، ولكن إذا قتلته فهي تتجاوز كل هذه الأزمات بقوة وتبدأ حياة مستقرة خالية من المنغصات.",
    forSingleMan: "للرجل الأعزب، الثعبان يدل على صديق سوء يكيد له، أو امرأة سيئة السمعة تحاول الإيقاع به. كما يعبر عن تحديات ومنافسات غير شريفة في محيط العمل. الانتصار على الثعبان يدل على نجاحه وتخطيه لهذه العقبات بذكاء.",
    forMarriedMan: "للرجل المتزوج، الثعبان قد يشير إلى عداوة من بعض الأقارب أو شركاء العمل، أو مشاكل مع الزوجة. إذا لدغه الثعبان فقد يتعرض لخسارة مالية أو خيانة من شخص مقرب. التخلص من الثعبان حماية لبيته ورزقه.",
    goodOmens: "من دلالات الخير: قتل الثعبان، رؤية الثعبان ميتاً، الهروب من الثعبان دون أن يمسه بسوء، وأكل لحم الثعبان مطبوخاً (وهو مال من عدو).",
    badOmens: "من دلالات الشر: لدغة الثعبان، خروج الثعبان من الجسم، دخول الثعبان للبيت بكثرة، وتطويق الثعبان لعنق الرائي.",
    faqs: [
      { question: "هل ألوان الثعبان تختلف في التفسير؟", answer: "نعم، الثعبان الأسود أشد الأعداء وأكثرهم مكراً وقد يرمز للسحر، الثعبان الأصفر يدل على المرض أو الحسد، والثعبان الأخضر قد يرمز لعدو متخفٍ في ثياب الدين، والأبيض قد يدل على عدو ضعيف أو مرض عابر." },
      { question: "رأيت ثعباناً كبيراً ينظر إلي دون أن يهاجم، ما التفسير؟", answer: "هذا يدل على وجود عدو يتربص بك ويراقبك، ولكنه لم يجد الفرصة المناسبة لإيذائك، وهي رسالة تحذيرية لتكون أكثر حذراً." }
    ],
    searchCount: 2100,
    variations: [
      { title: "لدغة الثعبان", content: "تشير إلى إصابة الرائي بضرر بالغ وأذى من عدو، وربما دلت على خيانة غير متوقعة تصيبه بخيبة أمل كبيرة." },
      { title: "قتل الثعبان وقطعه", content: "قتل الثعبان نصر وظفر، وقطعه نصفين إنصاف للرائي من عدوه وأخذ حقه منه بالكامل." }
    ]
  },
  {
    id: "5",
    slug: "sky",
    name: "السماء",
    category: "الطبيعة",
    shortDesc: "النظر إلى السماء يدل على الطموح العالي والرجاء من الله تعالى.",
    imageUrl: "https://images.unsplash.com/photo-1513628253939-010e64ac66cd?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "يرى الإمام ابن سيرين أن السماء في المنام تدل على السلطان والملك، وربما دلت على الحج. فمن رأى أنه صعد إلى السماء بسلم فإنه ينال رفعة وملكاً إن كان من أهله، أو ينال علماً وحكمة. ومن رأى أنه في السماء فهو في أمن وراحة. والنظر إلى السماء يدل على رجاء أمر من الله تعالى وسيحصل عليه بإذن الله. وإذا رأى أبواب السماء مفتوحة فهو غيث ورحمة واستجابة دعاء.",
    nabulsi: "ويضيف عبد الغني النابلسي أن السماء بناء ورفعة. من رأى أنه يسقط من السماء فإنه يرتكب ذنباً ويهلك، أو يصيبه هم بعد رفعة، كما في قوله تعالى (فكأنما خر من السماء). ورؤية السماء صافية تدل على الأمن والسلام، والغيوم المتراكمة فيها تدل على الغم والمشاكل.",
    ibnShaheen: "يقول ابن شاهين من رأى أنه يطير في السماء فإنه يسافر سفراً بعيداً يحصل فيه على منفعة. ومن رأى أن السماء انشقت وخرج منها نور فهو خير كثير وبشارة لأهل ذلك المكان، وإن خرج منها ظلام أو نار فهو بلاء.",
    forSingle: "رؤية السماء الصافية للعزباء تدل على صفاء نيتها وتحقيق طموحاتها الكبيرة. النظر للسماء والدعاء في المنام من أعظم البشارات بقرب استجابة دعائها سواء في الزواج من شخص صالح أو النجاح في دراستها وعملها.",
    forMarried: "للمتزوجة، السماء الزرقاء الصافية تعبر عن استقرار حياتها الزوجية والهدوء النفسي. وإذا رأت السماء تمطر خيراً فهو رزق وفير لزوجها وبركة في بيتها، وانفراج للهموم إذا كانت تمر بضائقة.",
    forPregnant: "السماء للحامل بشارة خير ورجاء يتحقق. فإذا نظرت للسماء مبتسمة دل على ولادة ميسرة ورزق واسع يأتي مع قدوم الطفل، ورؤية النجوم المضيئة في السماء دلالة على إنجاب أبناء يكون لهم شأن عظيم.",
    forDivorced: "للمطلقة، ترمز السماء المفتوحة إلى أبواب الأمل والفرج بعد الضيق. دعاؤها وهي تنظر للسماء يدل على تفريج كربتها وعوض الله الجميل لها في المستقبل القريب.",
    forSingleMan: "للرجل الأعزب، الصعود للسماء أو الطيران نحوها يدل على طموحه العالي ونجاحه في الوصول لأهدافه المهنية، وقد يدل على سفره للخارج لتحقيق مستقبله.",
    forMarriedMan: "للرجل المتزوج، صفاء السماء صفاء لحياته. وإذا رأى أبواب السماء مفتوحة أمامه فهي أبواب الرزق والتوفيق تفتح له في تجارته وعمله، مما يعود بالخير على أسرته.",
    goodOmens: "من مبشرات رؤية السماء: السماء الزرقاء الصافية، فتح أبواب السماء، الصعود إليها بسلم، النظر إليها بخشوع، وخروج النور منها.",
    badOmens: "من محذرات رؤية السماء: سقوط الرائي من السماء، انشقاق السماء وخروج الدخان أو النار، وتلبد السماء بالغيوم السوداء الكثيفة المرعبة.",
    faqs: [
      { question: "ما معنى رؤية السماء تنشق؟", answer: "إذا انشقت وخرج منها نور فهو خير وبشارة، وإذا خرج منها ما يخيف كالنار فهو إنذار بعذاب أو فتنة في ذلك المكان." },
      { question: "رأيت أنني أطير في السماء، ما التفسير؟", answer: "الطيران في السماء يدل على السفر، أو الأمنيات العالية، وإذا كنت مسروراً فهو نجاح باهر، وإذا خفت السقوط فهو طموح تشوبه المخاطر." }
    ],
    searchCount: 820,
    variations: [
      { title: "سقوط شيء من السماء", content: "سقوط الخير كالطعام والعسل رزق واسع، وسقوط الحجارة والنار عذاب وبلاء." },
      { title: "الصعود إلى السماء", content: "نيل رفعة ومكانة عالية، أو سفر يحقق فيه الرائي مراده." }
    ]
  },
  {
    id: "6",
    slug: "gold",
    name: "الذهب",
    category: "المال والذهب",
    shortDesc: "الذهب في المنام لا يحمد، ويدل على الحزن والهم، أو ذهاب المال.",
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "يذهب الإمام ابن سيرين إلى أن الذهب في المنام لا يحمد للرجال، وذلك للفظه الذي يحمل معنى (الذهاب) ولونه الأصفر الذي يرمز للمرض أو الحزن. فمن رأى أنه لبس شيئاً من الذهب فإنه يصاهر قوماً غير أكفاء له، ومن أصاب سبيكة ذهب أصابه هم بقدر ما أصاب من الذهب، أو غضب عليه السلطان وغرمه مالاً. ولكن استثنى ابن سيرين الحلي المصوغ للنساء، فهو محمود ويدل على الزينة والأفراح.",
    nabulsi: "ويوافق النابلسي ابن سيرين في كراهة الذهب المسبوك للرجال، ولكنه يشير إلى أن الذهب المصوغ (كالحلي والقلائد) أقل خطراً من السبيكة. والذهب للنساء يدل على الأفراح والرزق والأعمال الصالحة وزوال الهموم. ومن رأى أن بيته من ذهب أصابه حريق.",
    ibnShaheen: "يرى ابن شاهين أن الذهب المسبوك شر وأذى، ومن رأى أنه وجد دنانير ذهب (عملات معدنية) فهو يرى وجهاً حسناً أو ينال علماً إذا كانت الدنانير صالحة. وتذويب الذهب في المنام يدل على خصومة يقع فيها الرائي ويقع في ألسنة الناس.",
    forSingle: "رؤية الذهب للعزباء محمودة جداً، فهو يدل على خطوبتها أو زواجها القريب. لبس الخاتم الذهب يدل على الزوج الصالح، والقلادة تدل على أمانة أو وظيفة مرموقة تنالها. ولكن ضياع الذهب منها قد يدل على ضياع فرصة ثمينة.",
    forMarried: "للمتزوجة، الذهب يرمز إلى أبنائها الذكور أو زينتها وحياتها الزوجية. إذا رأت أن زوجها يهديها ذهباً فهو حب ومودة ورزق يأتي للزوج. كسر الذهب أو ضياعه قد يعبر عن مشاكل مع الزوج أو قلق على أحد الأبناء.",
    forPregnant: "الذهب للحامل يبشر غالباً بإنجاب مولود ذكر (خاصة الخاتم الذهب)، بينما الفضة تبشر بالأنثى. رؤية الذهب السليم اللامع تدل على صحة الجنين الجيدة ومرور فترة الحمل بسلام وأمان.",
    forDivorced: "للمطلقة، ارتداء الذهب في المنام يدل على زوال همومها وعودة البهجة لحياتها، وربما ارتباطها برجل ذي مكانة مالية واجتماعية جيدة. بيعها للذهب القديم يرمز لتخلصها من ذكريات الماضي المؤلمة.",
    forSingleMan: "للرجل الأعزب، الذهب غير محمود غالباً. لبس خاتم الذهب قد يدل على زواج ولكن من عائلة غير متوافقة معه، أو يدل على ديون وهموم يقع فيها. العثور على ذهب قد يكون إنذاراً بضائقة مالية أو مشكلة في العمل.",
    forMarriedMan: "للرجل المتزوج، الذهب هموم والتزامات ثقيلة ومخاوف على الرزق. وإذا رأى أنه يلبس قلادة ذهب فقد يتولى منصباً فيه مسؤولية كبيرة وأمانة ثقيلة. وإذا أهدى ذهباً لزوجته فهو خير ورزق ينفقه على أسرته.",
    goodOmens: "من دلالات الخير: رؤية الذهب للنساء بجميع أشكاله، العثور على دنانير ذهبية (عملات)، إهداء الذهب للزوجة، وتحول الفضة إلى ذهب (زيادة في الخير).",
    badOmens: "من دلالات الشر: سبائك الذهب للرجال، لبس الرجال للذهب، تذويب الذهب (خصومة)، وتحول الذهب إلى فضة (نقص في المال أو الجاه).",
    faqs: [
      { question: "لماذا الذهب مكروه في المنام للرجال؟", answer: "استند المفسرون في ذلك إلى أمرين: الأول أن لبس الذهب محرم على الرجال في الشريعة، والثاني اشتقاق الكلمة (ذهب) أي الرحيل والفقد، ولونه الأصفر لون المرض." },
      { question: "رأيت أن أسناني أصبحت من ذهب، ما التفسير؟", answer: "إن كنت من أهل الكلام (كخطيب أو معلم) فهو جيد، ولغيرهم قد يدل على هم أو مرض يصيب الأسنان، وقيل قد يدل على حريق في البيت." }
    ],
    searchCount: 1850,
    variations: [
      { title: "العثور على سبيكة ذهب", content: "يدل على هم كبير يصيب الرائي، أو مشكلة مع شخص ذي سلطة، وغرامة مالية يدفعها." },
      { title: "ضياع الذهب", content: "للنساء يدل على زوال النعمة أو فقدان شخص عزيز، وللرجال قد يكون النجاة من ضائقة أو التخلص من هم ثقيل." }
    ]
  },
  {
    id: "7",
    slug: "rain",
    name: "المطر",
    category: "الطبيعة",
    shortDesc: "المطر في المنام خير ورزق ورحمة إذا لم يكن فيه ضرر.",
    imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80",
    ibnSirin: "المطر في المنام عند ابن سيرين رحمة من الله تعالى ودين وفرج ورزق، لقوله تعالى: (وهو الذي ينزل الغيث من بعد ما قنطوا). إذا كان المطر عاماً في البلاد فإنه غياث ورزق، وإذا كان خاصاً بمكان دون غيره فقد يكون بلاء ومرضاً لأهل ذلك المكان. والمطر في أوانه محمود، وفي غير أوانه أقل خيراً. من رأى المطر يغسل جسده فهو توبة وتطهير من الذنوب وشفاء من الأمراض.",
    nabulsi: "ويؤكد النابلسي أن المطر يدل على إغاثة الملهوف، وعودة الغائب، وشفاء المريض، وقضاء الدين. ولكنه يضيف أن المطر إذا كان دماً أو حجارة أو ناراً فهو عذاب ينزل بأهل ذلك المكان لكثرة ذنوبهم. شرب ماء المطر إن كان صافياً فهو خير وعافية، وإن كان كدراً فهو مرض.",
    ibnShaheen: "ابن شاهين يرى أن المطر الخفيف الدائم خير من المطر الغزير المدمر. الوضوء بماء المطر صلاح في الدين والدينا. ومن رأى أنه يستظل من المطر تحت سقف فقد يتعطل سفره أو عمله لبعض الوقت.",
    forSingle: "المطر للعزباء بشارة كبيرة بالفرج بعد الصبر، واستجابة لدعوات طالما ألحت بها. المشي تحت المطر الهادئ يدل على ارتباطها بشخص صالح يسعدها، وغسل الوجه بماء المطر طهارة وعفة ونجاح في حياتها.",
    forMarried: "للمتزوجة، المطر يرمز لبركة في بيتها ورزق واسع لزوجها. إذا كانت تنتظر الحمل، فالمطر بشارة بحمل قريب. أما المطر الغزير الذي يقتلع الأشجار فهو مشاكل زوجية قوية يجب تداركها بحكمة.",
    forPregnant: "المطر للحامل خير وسلامة، ويدل على ولادة سهلة وميسرة، وأن الطفل سيكون باراً وصالحاً وتكثر بمجيئه الأرزاق. الاستحمام بماء المطر ذهاب لتعب الحمل وتيسير للأمور.",
    forDivorced: "للمطلقة، نزول المطر يغسل أحزانها ويبشرها بعوض الله القريب. المشي تحت المطر يدل على بدايات جديدة وفرص عمل أو ارتباط بشخص يعوضها عما فات وتكون حياتها معه مليئة بالرحمة.",
    forSingleMan: "للرجل الأعزب، المطر رزق في العمل، وتوفيق في مساعيه. إذا كان يبحث عن عمل فسيجده، وإذا كان يسعى للزواج سهل الله له طريق الزواج من امرأة صالحة. المطر الغزير دون ضرر أرباح مالية كبيرة.",
    forMarriedMan: "الرجل المتزوج الذي يرى المطر يهطل على بيته ينال خيراً وبركة في ماله وأولاده. وإذا كان مديوناً قضى الله دينه، وإذا كان مهموماً فرج الله همه.",
    goodOmens: "من مبشرات المطر: المطر الهادئ المستمر، الاغتسال أو الوضوء بماء المطر، شرب ماء المطر الصافي، ونزول المطر بعد فترة قحط أو جفاف.",
    badOmens: "من محذرات المطر: أمطار الدم أو الحجارة، المطر الغزير الذي يهدم البيوت أو يغرقها، شرب ماء المطر الكدر، والمطر المحدود في مكان صغير جداً كالبيت الواحد (قد يدل على مصيبة فيه).",
    faqs: [
      { question: "هل البكاء والدعاء تحت المطر محمود؟", answer: "محمود جداً، ويدل على تفريج كرب عظيم واستجابة لدعاء صادق يغير حياة الرائي للأفضل بإذن الله." },
      { question: "رأيت السماء تمطر ناراً بدلاً من الماء؟", answer: "هذا من الرؤى التحذيرية التي تدل على فتنة شديدة أو عقاب إلهي يعم المنطقة، ووجب على الرائي التوبة والاستغفار." }
    ],
    searchCount: 1620,
    variations: [
      { title: "الاغتسال بماء المطر", content: "توبة للعاصي، وشفاء للمريض، وسداد دين للمديون، وغنى للفقير." },
      { title: "المطر الغزير المدمر", content: "يدل على الفتن والحروب، أو سلطان جائر يظلم الناس، أو انتشار أمراض معدية." }
    ]
  }
];

const MOCK_CATEGORIES = [
  { name: "الحيوانات", icon: "🦁" },
  { name: "الطبيعة", icon: "🌳" },
  { name: "الطيور", icon: "🦅" },
  { name: "الحشرات", icon: "🐜" },
  { name: "الزواج والعلاقات", icon: "💍" },
  { name: "الحمل والأطفال", icon: "👶" },
  { name: "المال والذهب", icon: "💰" },
  { name: "السفر", icon: "✈️" },
  { name: "العمل والوظائف", icon: "💼" },
  { name: "الطعام والشراب", icon: "🍎" },
  { name: "البيت والأثاث", icon: "🏠" },
  { name: "الموت والمرض", icon: "⚰️" }
];

app.get("/api/categories", (req, res) => {
  res.json(MOCK_CATEGORIES);
});

app.get("/api/symbols", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const category = req.query.category as string;
    const sort = req.query.sort as string;
    const search = req.query.search as string;
    
    let symbols: any[] = [];
    
    if (prisma) {
      let whereClause: any = {};
      if (category && category !== "الكل" && category !== "undefined" && category !== "null") {
        whereClause.category = category;
      }
      
      let orderBy: any = { searchCount: "desc" };
      if (sort === "latest") {
        orderBy = { id: "desc" };
      }
      
      symbols = await prisma.dreamSymbol.findMany({
        where: whereClause,
        orderBy,
        include: { variations: true, faqs: true }
      });
    } else {
      symbols = [...MOCK_SYMBOLS];
    }

    // Always mix in our in-memory DYNAMIC_SYMBOLS if they match criteria
    populateMassiveSymbolsIndex();
    const normalizedSelectedCategory = category && category !== "الكل" && category !== "undefined" && category !== "null" ? category : null;
    
    let activeDynamic = DYNAMIC_SYMBOLS;
    if (normalizedSelectedCategory) {
      activeDynamic = activeDynamic.filter(s => s.category === normalizedSelectedCategory);
    }
    
    // Add dynamic symbols that aren't already in symbols (matching by slug)
    const existingSlugs = new Set(symbols.map(s => s.slug));
    for (const d of activeDynamic) {
      if (!existingSlugs.has(d.slug)) {
        symbols.push(d);
        existingSlugs.add(d.slug);
      }
    }

    // Add matching massive dynamic symbols to satisfy user requirement (at least 1000 per category)
    let activeMassive = MASSIVE_SYMBOLS_INDEX;
    if (normalizedSelectedCategory) {
      activeMassive = activeMassive.filter(s => s.category === normalizedSelectedCategory);
    }
    
    for (const m of activeMassive) {
      if (!existingSlugs.has(m.slug)) {
        symbols.push(m);
        existingSlugs.add(m.slug);
      }
    }

    // If no DB is present, we still need to sort and handle latest logic in memory
    if (!prisma) {
      if (sort === "latest") {
        symbols = [...symbols].reverse();
      } else {
        symbols = [...symbols].sort((a, b) => b.searchCount - a.searchCount);
      }
    }
    
    // Apply robust Arabic search filtering in memory
    if (search && search.trim() !== "") {
      const normalizedQuery = normalizeArabic(search);
      let filtered = symbols.filter(s => {
        const normalizedName = normalizeArabic(s.name || "");
        const normalizedDesc = normalizeArabic(s.shortDesc || "");
        const normalizedIbnSirin = normalizeArabic(s.ibnSirin || "");
        const normalizedNabulsi = normalizeArabic(s.nabulsi || "");
        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedDesc.includes(normalizedQuery) ||
          normalizedIbnSirin.includes(normalizedQuery) ||
          normalizedNabulsi.includes(normalizedQuery)
        );
      });

      // Sort filtered results to place exact matches and relevant prefixes first
      filtered.sort((a, b) => {
        const normA = normalizeArabic(a.name || "");
        const normB = normalizeArabic(b.name || "");
        
        const exactA = normA === normalizedQuery ? 1 : 0;
        const exactB = normB === normalizedQuery ? 1 : 0;
        if (exactA !== exactB) return exactB - exactA; // Exact matches first

        const startsA = normA.startsWith(normalizedQuery) ? 1 : 0;
        const startsB = normB.startsWith(normalizedQuery) ? 1 : 0;
        if (startsA !== startsB) return startsB - startsA; // Starts with query second

        return 0;
      });

      // If we got NO results, trigger our live AI Generator on the fly!
      if (filtered.length === 0 && search.trim().length >= 2) {
        console.log(`No results found for "${search}". Triggering AI Dream Generation...`);
        const newSymbol = await generateAISymbol(search);
        if (newSymbol) {
          filtered = [newSymbol];
        }
      }
      symbols = filtered;
    }
    
    res.json(symbols.slice(0, limit));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/symbols/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    // 1. Check Prisma
    if (prisma) {
      const symbol = await prisma.dreamSymbol.findUnique({
        where: { slug },
        include: { variations: true, faqs: true }
      });
      if (symbol) return res.json(symbol);
      
      const symbolById = await prisma.dreamSymbol.findUnique({
        where: { id: slug },
        include: { variations: true, faqs: true }
      });
      if (symbolById) return res.json(symbolById);
    }
    
    // 2. Check predefined and dynamic arrays
    const symbol = [...MOCK_SYMBOLS, ...DYNAMIC_SYMBOLS].find(s => s.slug === slug || s.id === slug);
    if (symbol) return res.json(symbol);
    
    // 3. Dynamic AI Fallback if not found anywhere!
    console.log(`Slug "${slug}" not found in database or mocks. Triggering AI generator...`);
    const newSymbol = await generateAISymbol(slug);
    if (newSymbol) {
      return res.json(newSymbol);
    }
    
    return res.status(404).json({ error: "Symbol not found" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// Setup dev/production environments
async function setupVite() {
  const isProd = process.env.NODE_ENV === "production" || (typeof __filename !== "undefined" && __filename.includes("server.cjs"));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = typeof __dirname !== "undefined" && __dirname.includes("dist")
      ? __dirname
      : path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
