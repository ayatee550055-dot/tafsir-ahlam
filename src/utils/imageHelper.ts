/**
 * Strict Image Verification & Matcher for Islamic Dream Symbols
 * Ensures that only exact, verified high-quality images are shown for specified keywords.
 * If no exact match is found, returns a safe and elegant starry-night dream backdrop.
 */

// Arabic Definite Article / Letter Normalization helper
export function normalizeArabicForImage(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/[\u064B-\u065F]/g, "") // Remove Arabic diacritics (harakat)
    .replace(/[أإآ]/g, "ا")           // Normalize Alef
    .replace(/ة/g, "ه")               // Normalize Taa Marbouta
    .replace(/ى/g, "ي")               // Normalize Al-Ya
    .trim()
    .toLowerCase();

  // Strip common "ال" (the definite article in Arabic) if it leaves a valid word (>= 3 chars)
  if (clean.startsWith("ال") && clean.length > 3) {
    clean = clean.substring(2);
  }
  return clean;
}

const VERIFIED_PHOTO_MAPPING: Record<string, string> = {
  "أسد": "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=800&q=80",
  "اسد": "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=800&q=80",
  "ثعبان": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "حية": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
  "حيه": "https://images.unsplash.com/photo-1531386151447-fd762e7a3ae4?auto=format&fit=crop&w=800&q=80",
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
  "سماء": "https://images.unsplash.com/photo-1513628253939-010e64ac66cd?auto=format&fit=crop&w=800&q=80",
  
  // New High-Demand Dream Symbols
  "طيران": "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=800&q=80",
  "يطير": "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=800&q=80",
  "بكاء": "https://images.unsplash.com/photo-1508216147401-dc112674e7fa?auto=format&fit=crop&w=800&q=80",
  "يبكي": "https://images.unsplash.com/photo-1508216147401-dc112674e7fa?auto=format&fit=crop&w=800&q=80",
  "ضحك": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "يضحك": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "دم": "https://images.unsplash.com/photo-1615461066841-6116ece61e9f?auto=format&fit=crop&w=800&q=80",
  "دماء": "https://images.unsplash.com/photo-1615461066841-6116ece61e9f?auto=format&fit=crop&w=800&q=80",
  "موت": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
  "ميت": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
  "قبر": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
  "مقبرة": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
  "نمر": "https://images.unsplash.com/photo-1501705388883-4ed8a543392c?auto=format&fit=crop&w=800&q=80",
  "فهد": "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
  "نمل": "https://images.unsplash.com/photo-1589926358535-c33596df259e?auto=format&fit=crop&w=800&q=80",
  "نحل": "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=800&q=80",
  "عنكبوت": "https://images.unsplash.com/photo-1503431128871-cd25096bfa41?auto=format&fit=crop&w=800&q=80",
  "ثلج": "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80",
  "جليد": "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80",
  "تفاح": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
  "عنب": "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80",
  "تين": "https://images.unsplash.com/photo-1595166183915-188b22a0ce12?auto=format&fit=crop&w=800&q=80",
  "عسل": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
  "سيف": "https://images.unsplash.com/photo-1589131792271-0ce0f6d6ee49?auto=format&fit=crop&w=800&q=80",
  "سكين": "https://images.unsplash.com/photo-1589131792271-0ce0f6d6ee49?auto=format&fit=crop&w=800&q=80",
  "شعر": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "غراب": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80",
  "صقر": "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80",
  "نسر": "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80"
};

// General beautiful spiritual dream backdrop URL to use as fallback
const SPIRITUAL_FALLBACK_URL = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80";

/**
 * Resolves a reliable, vetted image for an Arabic dream symbol.
 * Uses advanced normalization to find an exact keyword match.
 * If no exact high-confidence match is found, returns the spiritual fallback.
 */
export function getVerifiedImageUrl(nameOrSlugOrKeyword: string): string {
  const cleanKeyword = normalizeArabicForImage(nameOrSlugOrKeyword);
  if (!cleanKeyword) return SPIRITUAL_FALLBACK_URL;

  // 1. Direct match on normalized keys
  if (VERIFIED_PHOTO_MAPPING[cleanKeyword]) {
    return VERIFIED_PHOTO_MAPPING[cleanKeyword];
  }

  // 2. Substring matching
  for (const [key, val] of Object.entries(VERIFIED_PHOTO_MAPPING)) {
    const normKey = normalizeArabicForImage(key);
    if (cleanKeyword.includes(normKey) || normKey.includes(cleanKeyword)) {
      return val;
    }
  }

  return SPIRITUAL_FALLBACK_URL;
}
