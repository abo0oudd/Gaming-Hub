import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize GoogleGenAI SDK safely
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment secrets. Please set it via Secrets Panel.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// In-Memory Database for dynamic content
let games = [
  {
    id: "gta-v",
    title: "GTA V Premium Edition",
    description: "النسخة الكاملة مع جميع التحديثات و1,000,000$ لطور الأونلاين لجهاز الكمبيوتر.",
    longDescription: "احصل على لعبة Grand Theft Auto V: Premium Edition مجاناً بالكامل. تشمل هذه النسخة تجربة قصة Grand Theft Auto V الكاملة، والوصول المجاني إلى عالم Grand Theft Auto Online المتطور باستمرار وجميع ترقيات اللعبة الحالية والمحتويات بما في ذلك Doomsday Heist و Gunrunning و Smuggler's Run و Bikers والمزيد.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg",
    banner: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg",
    platform: "Epic Games",
    originalPrice: 29.99,
    currentPrice: 0,
    discountPercentage: 100,
    timer: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    genre: "أكشن / عالم مفتوح",
    rating: 4.8,
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        cpu: "Intel Core 2 Quad CPU Q6600 @ 2.40GHz",
        ram: "4 GB RAM",
        gpu: "NVIDIA 9800 GT 1GB / AMD HD 4870 1GB",
        storage: "90 GB available space"
      },
      recommended: {
        os: "Windows 10 64-bit",
        cpu: "Intel Core i5 3470 @ 3.2GHz / AMD X8 FX-8350 @ 4GHz",
        ram: "8 GB RAM",
        gpu: "NVIDIA GTX 660 2GB / AMD HD 7870 2GB",
        storage: "90 GB available space"
      }
    },
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg"
    ],
    comments: [
      { id: "c1", username: "أحمد الميموني", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ahmad", comment: "أفضل لعبة مجانية حصلت عليها هذا الشهر! شكراً لكم جاري التحميل", date: "2026-05-28" },
      { id: "c2", username: "سارة جيمر", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sara", comment: "سيرفرات التحميل سريعة جداً والعرض حقيقي 100%!", date: "2026-05-28" }
    ],
    externalStoreUrl: "https://store.epicgames.com"
  },
  {
    id: "the-witcher-3",
    title: "The Witcher 3: Wild Hunt",
    description: "لعبة تقمص الأدوار الأسطورية الحائزة على أكثر من 250 جائزة كأفضل لعبة للعام.",
    longDescription: "أنت جيرالت من ريفيا، صائد الوحوش المأجور. تقف أمامك قارة مزقتها الحروب وتجتاحها الوحوش لتستكشفها كما تشاء. عقدك الحالي؟ العثور على سيري - طفلة النبوءة، وهي سلاح حي يمكنه تغيير شكل العالم.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg",
    banner: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg",
    platform: "Steam",
    originalPrice: 39.99,
    currentPrice: 0,
    discountPercentage: 100,
    timer: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    genre: "تقمص أدوار / عالم مفتوح",
    rating: 4.9,
    systemRequirements: {
      minimum: {
        os: "Windows 7 / 8 64-bit",
        cpu: "Intel Core i5-2500K 3.3GHz",
        ram: "6 GB RAM",
        gpu: "Nvidia GTX 660 / AMD Radeon HD 7870",
        storage: "35 GB available space"
      },
      recommended: {
        os: "Windows 10 64-bit",
        cpu: "Intel Core i7 3770 3.4 GHz",
        ram: "8 GB RAM",
        gpu: "Nvidia GTX 770 / AMD Radeon R9 290",
        storage: "35 GB available space"
      }
    },
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg"
    ],
    comments: [
      { id: "w1", username: "خالد الحربي", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Khaled", comment: "أسطورة الألعاب مجاناً! لا أصدق عينيّ، تم التفعيل بنجاح على ستيم.", date: "2026-05-27" }
    ],
    externalStoreUrl: "https://store.steampowered.com"
  },
  {
    id: "assassins-creed-valhalla",
    title: "Assassin's Creed Valhalla",
    description: "أكتب ملحمة الفايكنج الأسطورية الخاصة بك وعش في عالم العصور المظلمة الخلاب.",
    longDescription: "قم ببناء مستعمرتك الخاصة، وغزُ حصون الأعداء، وشق طريقك نحو المجد في إنجلترا العصور الوسطى كقائد لغزاة الفايكنج الشجعان في تجربة تقمص أدوار غامرة من يوبي سوفت.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2208920/header.jpg",
    banner: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2208920/header.jpg",
    platform: "Ubisoft Connect",
    originalPrice: 59.99,
    currentPrice: 0,
    discountPercentage: 100,
    timer: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    genre: "أكشن / مغامرات",
    rating: 4.6,
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        cpu: "AMD Ryzen 3 1200 / Intel i5-4460",
        ram: "8 GB RAM",
        gpu: "AMD R9 380 / Nvidia GTX 960 4GB",
        storage: "50 GB available space"
      },
      recommended: {
        os: "Windows 10 64-bit",
        cpu: "AMD Ryzen 5 1600 / Intel i7-4790",
        ram: "8 GB RAM",
        gpu: "AMD RX 570 / Nvidia GTX 1060 6GB",
        storage: "50 GB available space"
      }
    },
    screenshots: [
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2208920/header.jpg"
    ],
    comments: [],
    externalStoreUrl: "https://ubisoftconnect.com"
  }
];

let steamAccounts = [
  {
    id: "acc-1",
    title: "حساب ستيم باقة الأكشن الكلاسيكية ومودرن وورفير 3",
    includedGames: ["Prototype", "Half Life 2", "Counter-Strike Source", "Call of Duty Modern Warfare 3 (2011)"],
    dateAdded: "2026-05-28",
    isAvailable: true,
    email: "axelturba3660",
    password: "monster3660",
    notes: "العب دائماً في وضع Offline Mode لمنع تعارض الحفظ وقطع اللعب على الآخرين. استمتع برحلة كلاسيكية أسطورية!",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/42690/header.jpg"
  },
  {
    id: "acc-2",
    title: "حساب ستيم الأساطير ريسنغ ومغامرات فورزا هورايزن 4",
    includedGames: [
      "Forza Horizon 4", 
      "Life 4 Dead 2", 
      "A Way Out", 
      "Euro Truck Simulator 2", 
      "Little Nightmares", 
      "ARK: Survival Evolved", 
      "Warframe"
    ],
    dateAdded: "2026-05-28",
    isAvailable: true,
    email: "classicalvetrox349",
    password: "ASDdsa1230",
    notes: "حساب غني جداً ومتنوع الأطوار والمغامرات التعاونية الفخمة. يرجى تفعيل وضع أوفلاين في تطبيق Steam قبل تشغيل اللعبة.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1293830/header.jpg"
  },
  {
    id: "acc-3",
    title: "حساب ستيم رعب البقاء والتحفة الشهيرة Resident Evil 4 Remake",
    includedGames: ["Resident Evil 4 Remake"],
    dateAdded: "2026-05-27",
    isAvailable: true,
    email: "7854YIxK",
    password: "6399dnEVfh13",
    notes: "عش مغامرة العميل المحترف ليون كينيدي كاملة مع هذا الحساب المخصص للرعب. لا تنس تفعيل وضع Offline لتفادي المشاكل.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2050650/header.jpg"
  },
  {
    id: "acc-4",
    title: "حساب ستيم قاتل الشياطين المخصص لعشاق الأنمي والقتال",
    includedGames: ["Demon Slayer 1"],
    dateAdded: "2026-05-27",
    isAvailable: true,
    email: "dunfentengdu1812",
    password: "08XiniuGM2008",
    notes: "خض أرقى معارك قتلة الشياطين الحماسية بروح عالية ونفّذ ضرباتك السحرية بهدوء في وضع عدم الاتصال.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1433420/header.jpg"
  },
  {
    id: "acc-5",
    title: "حساب ستيم المغامرات والمنتظرة بقوة Hollow Knight Silksong",
    includedGames: ["Hollow Knight Silksong"],
    dateAdded: "2026-05-28",
    isAvailable: true,
    email: "dna85624",
    password: "sfb13758",
    notes: "بوابة حصرية لأعضاء مجتمعنا لتجربة مغامرة الأميرة هورنت الأسطورية في عالم الحشرات الساحر الغامض.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg"
  },
  {
    id: "acc-6",
    title: "حساب ستيم الخوارق والتحكم والفيزياء المذهلة Control Ultimate Edition",
    includedGames: ["Control Ultimate Edition"],
    dateAdded: "2026-05-26",
    isAvailable: true,
    email: "72108fd4",
    password: "Hjy413687",
    notes: "النسخة النهائية الفاخرة من كونترول كاملة مع الحزم والمستويات الإضافية والتأثيرات البصرية المتطورة تتبع الأشعة RTX.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/870780/header.jpg"
  },
  {
    id: "acc-7",
    title: "حساب ستيم العالم المفتوح الكلاسيكي وسلسلة كول أوف ديوتي",
    includedGames: ["Call of Duty Modern Warfare Remastered", "Garry's Mod", "GTA 4 Complete Edition"],
    dateAdded: "2026-05-28",
    isAvailable: true,
    email: "yapirdole69",
    password: "XWdfgHKhh00",
    notes: "باقة ألعاب أصلية تجمع المتعة المطلقة في غاريز مود والقتال الحربي وتفاصيل قصة نيكو بيليك الواقعية في ليبرتي سيتي.",
    image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/12210/header.jpg"
  }
];

let posts = [
  {
    id: "post-1",
    username: "جيمر_الشرق",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gamer1",
    title: "الميمز العربي الخرافي للعبة Valorant 🤣",
    content: "لما تطلب من صاحبك النوب يغطي ضهرك وهو ماسك سنايبر ووجهه بالجدار هههههههههههه. مين صايرتله شباب؟ يكتب رأيه كومنت وجربوا مولد الميمز الرهيب بالذكاء الاصطناعي في هالصفحة!",
    date: "منذ ساعتين",
    likes: 42,
    dislikes: 1,
    comments: [
      { id: "cm-1", username: "سفير_الموت", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=cm1", content: "والله كأنك توصف خويي ههههههههههه دايماً يطالع السقف مدري ليه", date: "منذ ساعة" },
      { id: "cm-2", username: "RiyadhHero", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=cm2", content: "توليد الميمز بالذكاء الاصطناعي رهيب جداً وسريع، جربته على صورة جيرالت وعطاني كابشن يضحك", date: "منذ نص ساعة" }
    ],
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "post-2",
    username: "فيصل_تيك",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=TechFaisal",
    title: "مقارنة كرت شاشة RTX 4060 vs RX 7600 XT بالقيمز",
    content: "يا شباب وش أفضل تجميعة اقتصادية حالياً؟ هل كرت الـ 4060 يستاهل عشان تقنية DLSS 3 وإلا الـ 7600 أقوى كفريمات خام؟ شاركوني تجاربكم وتحليلاتكم.",
    date: "منذ 4 ساعات",
    likes: 28,
    dislikes: 3,
    comments: [
      { id: "cm-3", username: "هاردوير_كنج", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Hardware", content: "للمستقبل والمدى البعيد فريم باتل الـ 7600 أقوى عشان قنوات الذاكرة (16GB), لكن الـ 4060 يتفوق بالذكاء الاصطناعي واستهلاك الطاقة الخرافي.", date: "منذ 3 ساعات" }
    ]
  }
];

// Analytics Mock API for Admin
app.get("/api/analytics", (req, res) => {
  res.json({
    totalGames: games.length,
    totalAccounts: steamAccounts.length,
    totalPosts: posts.length,
    activeUsers: 85241,
    interactions: 32410,
    pageViews: 142050
  });
});

// API Routes for Games
app.get("/api/games", (req, res) => {
  res.json(games);
});

app.post("/api/games", (express.json() as any), (req, res) => {
  const newGame = {
    id: req.body.id || `game-${Date.now()}`,
    title: req.body.title || "لعبة مجانية جديدة",
    description: req.body.description || "",
    longDescription: req.body.longDescription || "",
    image: req.body.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    banner: req.body.banner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    platform: req.body.platform || "Epic Games",
    originalPrice: parseFloat(req.body.originalPrice) || 29.99,
    currentPrice: 0,
    discountPercentage: 100,
    timer: req.body.timer || new Date(Date.now() + 5*24*60*60*1000).toISOString(),
    genre: req.body.genre || "ألعاب المغامرات",
    rating: parseFloat(req.body.rating) || 4.5,
    systemRequirements: req.body.systemRequirements || {
      minimum: { os: "Windows 10 64-bit", cpu: "Intel Core i3", ram: "8 GB RAM", gpu: "GTX 1050", storage: "50 GB" },
      recommended: { os: "Windows 11 64-bit", cpu: "Intel Core i5", ram: "16 GB RAM", gpu: "RTX 2060", storage: "50 GB" }
    },
    screenshots: req.body.screenshots || [],
    comments: [],
    externalStoreUrl: req.body.externalStoreUrl || "https://store.epicgames.com"
  };
  games.push(newGame);
  res.status(201).json(newGame);
});

app.put("/api/games/:id", (req, res) => {
  const { id } = req.params;
  const index = games.findIndex(g => g.id === id);
  if (index !== -1) {
    games[index] = { ...games[index], ...req.body };
    res.json(games[index]);
  } else {
    res.status(404).json({ error: "Game not found" });
  }
});

app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;
  games = games.filter(g => g.id !== id);
  res.json({ success: true, id });
});

// Steam Accounts API
app.get("/api/steam-accounts", (req, res) => {
  res.json(steamAccounts);
});

app.post("/api/steam-accounts", (req, res) => {
  const newAccount = {
    id: `acc-${Date.now()}`,
    title: req.body.title || "حساب ستيم VIP",
    includedGames: Array.isArray(req.body.includedGames) ? req.body.includedGames : [req.body.includedGames || ""],
    dateAdded: new Date().toISOString().split('T')[0],
    isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
    email: req.body.email || "vip_hub_steam@outlook.com",
    password: req.body.password || "PasswordHub99!",
    notes: req.body.notes || "العب دائماً في وضع Offline Mode.",
    image: req.body.image || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400"
  };
  steamAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

app.put("/api/steam-accounts/:id", (req, res) => {
  const { id } = req.params;
  const index = steamAccounts.findIndex(acc => acc.id === id);
  if (index !== -1) {
    steamAccounts[index] = { ...steamAccounts[index], ...req.body };
    res.json(steamAccounts[index]);
  } else {
    res.status(404).json({ error: "Account not found" });
  }
});

app.delete("/api/steam-accounts/:id", (req, res) => {
  const { id } = req.params;
  steamAccounts = steamAccounts.filter(acc => acc.id !== id);
  res.json({ success: true, id });
});

// API: Posts & Social Community
app.get("/api/posts", (req, res) => {
  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const newPost = {
    id: `post-${Date.now()}`,
    username: req.body.username || "عضو_جيمر",
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.body.username || 'user' + Date.now()}`,
    title: req.body.title || "",
    content: req.body.content || "",
    date: "الآن",
    likes: 0,
    dislikes: 0,
    comments: [],
    image: req.body.image || undefined
  };
  posts.unshift(newPost);
  res.status(201).json(newPost);
});

app.post("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { username, content } = req.body;
  const post = posts.find(p => p.id === id);
  if (post) {
    const newComment = {
      id: `cm-${Date.now()}`,
      username: username || "معلق_جيمر",
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'com'}`,
      content: content || "",
      date: "الآن"
    };
    post.comments.push(newComment);
    res.status(210).json(newComment);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === id);
  if (post) {
    post.likes += 1;
    res.json({ success: true, likes: post.likes });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

app.post("/api/posts/:id/dislike", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === id);
  if (post) {
    post.dislikes += 1;
    res.json({ success: true, dislikes: post.dislikes });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// API: Generate Magic Captions for Memes
app.post("/api/magic-caption", async (req, res) => {
  try {
    const { imageBase64, mimeType, description } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image content provided." });
    }

    const ai = getAi();

    // Prepare multimodal parts for Gemini
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };

    const promptText = `
Analyze this image context to generate exactly 5 funny, creative, sarcastic, and hilarious meme captions in Arabic language.
The captions should be gaming-focused, related to popular games (like Fortnite, GTA, Valorant, Witcher, FIFA, Minecraft etc.), gaming struggles (like lag, rage quitting, toxic teammates, noobs, pay-to-win, etc.), or generic highly shareable gaming humor.
Ensure the output matches the visual context of the image. The humor must be natural, engaging, and in popular Arabic gaming and social media slang (like "لما، شكلي لما، البي سي بنص القيم، إلخ").

Provide the output as a clean array of exactly 5 Arabic text captions.
    `.trim() + (description ? `\nAdditional context of the image: ${description}` : "");

    const textPart = { text: promptText };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "An array of exactly 5 Arabic meme captions that are relevant, funny, and relate to gaming.",
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    const captions = JSON.parse(resultText);
    res.json({ captions });
  } catch (err: any) {
    console.error("Error generating magic caption:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI captions." });
  }
});

// ==========================================
// 🧠 GAMEMIND NEXUS - ADVANCED PLAYER TOOLS API
// ==========================================

// 1. AI Game Name Generator
app.post("/api/ai/gaming-name", async (req, res) => {
  try {
    const { mode, style, language, letters, isRandom } = req.body;
    const ai = getAi();
    const prompt = `
Generate exactly 8 legendary, cool, and futuristic gaming names/handles or clan/esports team tags in English/Arabic according to these preferences:
- Mode/Type: ${mode} (individual player alias, clan tag, esports professional moniker, epic gaming handle)
- Theme/Style: ${style} (cyberpunk neon, dark gothic, high-fantasy legend, raw futuristic sci-fi)
- Language Preference: ${language} (ar: Arabic, en: English, mix: blended Arab-English slang)
- Start Preference: ${isRandom ? "Fully randomized creative handles" : `Contains or starts with characters: "${letters}"`}

Return a JSON array containing objects with the suggested "name" and a short "story" (explaining the cyber story/meaning behind this esports title in Arabic).
Response schema MUST be:
{
  "names": [
    { "name": "...", "story": "..." }
  ]
}
Do NOT output any markdown tags outside of the JSON. Only return clean JSON.
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.9,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Gaming name generation failed:", err);
    res.status(500).json({ error: "Failed to generate gaming names." });
  }
});

// 2. AI Avatar & Identity Prompt Designer
app.post("/api/ai/gaming-avatar", async (req, res) => {
  try {
    const { style, avatarType, preferredColors } = req.body;
    const ai = getAi();
    const colorsStr = preferredColors ? preferredColors.join(", ") : "neon blue, cyber purple";
    const prompt = `
Design exactly 4 distinct and highly cinematic esports logo, profile picture (avatar), and visual banner concepts based on:
- Visual Style Era: Cyberpunk/Holographic, RGB Neon Setup, ${style}
- Subject Theme: ${avatarType} (like humanoid robotic cyborg, bio-organic cyber animal, esports tactical mascot, abstract geometric matrix)
- Color Accents: ${colorsStr}

For each concept, provide:
1. "title": A descriptive, futuristic title in Arabic (e.g. "ذئب السايبر القرمزي").
2. "description": Detailed layout description of the branding, icon elements, typography, and visual cues in Arabic.
3. "prompt": A high-fidelity detailed prompt in English formatted for AI image generators (like Midjourney or DALL-E) to produce this avatar.
4. "seed": A random string/number that represents this visual combination.

Return a JSON array containing objects with these fields.
Response schema MUST be:
{
  "concepts": [
    { "title": "...", "description": "...", "prompt": "...", "seed": "..." }
  ]
}
Do NOT output any markdown code blocks. Only return clean JSON.
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Gaming avatar generation failed:", err);
    res.status(500).json({ error: "Failed to design branding concepts." });
  }
});

// 3. AI Game Recommendation System
app.post("/api/ai/games-suggest", async (req, res) => {
  try {
    const { favoriteGames, categories, mood, style } = req.body;
    const ai = getAi();
    const prompt = `
Recommend exactly 5 REAL, actual video-games (do NOT invent fictional or imaginary games!) that match these user preferences:
- Similar titles they love: "${favoriteGames || "None specified"}"
- Preferred niches/tags: "${categories ? categories.join(", ") : "Any"}"
- Current player state/Mood: "${mood}" (e.g., intense battlefield sweat, relaxing immersive storyline, retro nostalgia, cozy indie puzzle sandbox)
- General Gameplay style: "${style}" (seeking highly competitive esports vs casual exploring and chill vibes)

For each game, return:
1. "title": Exact original name of the game (English/Arabic).
2. "matchRate": An integer percentage between 75% and 99% based on preference alignment.
3. "description": A highly engaging explanation in elegant Arabic of WHY this matches their mood and gaming history.
4. "platform": Available platforms (e.g. PC, PS5, Xbox Series X, Nintendo Switch).
5. "releaseYear": The real release year.
6. "imageUrl": A realistic high-quality gaming background query (e.g. "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600" or other gaming setups / character art).

Return a JSON array containing objects with these fields.
Response schema MUST be:
{
  "recommendations": [
    { "title": "...", "matchRate": 95, "description": "...", "platform": "...", "releaseYear": "...", "imageUrl": "..." }
  ]
}
Only output clean, valid JSON.
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Game recommendations failed:", err);
    res.status(500).json({ error: "Failed to generate game recommendations." });
  }
});

// 4. Game Settings Optimization Assistant
app.post("/api/ai/fps-optimizer", async (req, res) => {
  try {
    const { gameName, cpuName, gpuName, ramSize, targetGoal } = req.body;
    const ai = getAi();
    const prompt = `
Act as an elite cyber PC diagnostic optimization agent. Analyze:
- Target Game: "${gameName}"
- CPU Model: "${cpuName}"
- GPU Model: "${gpuName}"
- Memory: "${ramSize}"
- Tuning Objective: "${targetGoal}" (Maximize FPS vs Ultra Cinematic Quality vs Perfectly Balanced Setup)

Generate custom real optimization settings and hardware diagnostic reports.
Return a JSON object containing:
1. "fpsIncreaseEstimate": A realistic estimate percentage (e.g. "18% - 30% FPS boost").
2. "latencyDecrease": Reduced latency (e.g. "9ms reduction").
3. "bottleneckCheck": A technical overview in Arabic explaining if CPU, GPU, or RAM creates a gaming bottleneck.
4. "inGameConfig": An array of objects with fields: "setting" (the game settings menu option) and "recommendation" (value/status e.g. "Disable Raytracing", "DLSS: Balanced", "Volumetric Fog: Low") in Arabic.
5. "systemOptimizations": An array of at least 3 strings with Windows/drivers setups (like GPU hardware scheduling, game-mode setups, overclocking tips) in Arabic.

Response schema MUST be:
{
  "fpsIncreaseEstimate": "...",
  "latencyDecrease": "...",
  "bottleneckCheck": "...",
  "inGameConfig": [ { "setting": "...", "recommendation": "..." } ],
  "systemOptimizations": [ "...", "...", "..." ]
}
Only return valid JSON. Do not include markdown blocks.
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Performance optimizer failed:", err);
    res.status(500).json({ error: "Failed to optimize gaming settings." });
  }
});

// 5. RGB Wallpaper & Theme Generator
app.post("/api/ai/rgb-themes", async (req, res) => {
  try {
    const { setupType, primaryColor, secondaryColor, vibes } = req.body;
    const ai = getAi();
    const prompt = `
Architect an expert cyberpunk and high-tech RGB lighting setup guide for:
- Setup Layout: ${setupType} (Full master bedroom, sleek clean minimal desk, cozy dual monitor corner)
- Main LED Light Accents: "${primaryColor}" and "${secondaryColor}"
- Aesthetics/Theme: "${vibes}" (e.g. Tokyo Midnight, Cyberpunk Red, Matrix Green Hacker, Synthwave Sunset)

Return a JSON object containing:
1. "themeName": An elegant Arabic title for this theme (e.g. "غروب نيون طوكيو").
2. "lightingLayout": Detailed lighting setup blueprint, explaining placement of RGB light strips, ambient backlighting, and panels in Arabic.
3. "wallpapers": Ideal futuristic wallpaper description / suggestions in Arabic.
4. "accessories": 3 recommended futuristic physical gadgets / desk items that fit this theme in Arabic.
5. "cssColors": A list of exactly 4 hex codes (with # prefix) matching this RGB gradient setup.

Response schema MUST be:
{
  "themeName": "...",
  "lightingLayout": "...",
  "wallpapers": "...",
  "accessories": ["...", "...", "..."],
  "cssColors": ["...", "...", "...", "..."]
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("RGB setup planner failed:", err);
    res.status(500).json({ error: "Failed to build setup theme." });
  }
});

// 6. Content Idea Generator for Gamers
app.post("/api/ai/content-ideas", async (req, res) => {
  try {
    const { platform, contentStyle, preferredGame } = req.body;
    const ai = getAi();
    const prompt = `
Act as a viral esports and gaming media content engine. Generate exactly 5 viral, engaging video ideas layout tailored for content creators:
- Platform: "${platform}" (TikTok, YouTube Shorts, Twitch Stream clips)
- Styling Category: "${contentStyle}" (insane gameplay challenge, lore-storytelling, funny glitches, toxic lobby encounters, tips & tricks)
- Featured Game Title: "${preferredGame || "Trendy Multiplayer Game"}"

For each idea, return:
1. "title": A clickbait, high CTR video title in Arabic.
2. "hook": Sarcastic opening hook for the first 3 seconds (visual / verbal script) in Arabic.
3. "outline": Storyboard/segment outline in Arabic.
4. "audioAdvise": SFX or background music guide in Arabic.
5. "viralTag": Creative hashtag concepts.

Return a JSON array of these ideas.
Response schema MUST be:
{
  "ideas": [
    { "title": "...", "hook": "...", "outline": "...", "audioAdvise": "...", "viralTag": "..." }
  ]
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.9,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Content idea generation failed:", err);
    res.status(500).json({ error: "Failed to generate viral content plans." });
  }
});

// 7. Player Personality Analyzer
app.post("/api/ai/gamer-personality", async (req, res) => {
  try {
    const { answers } = req.body;
    const ai = getAi();
    const prompt = `
Analyze this gamer's psychiatric responses to these five hypothetical gaming dilemmas to determine their true Gamer Archetype:
- Dilemma 1 (Handling Toxicity): "${answers[0]}"
- Dilemma 2 (Overcoming Impossible Bosses): "${answers[1]}"
- Dilemma 3 (Lore/Storytelling vs Speedrunning): "${answers[2]}"
- Dilemma 4 (Clutch 1v5 Team Responsibility): "${answers[3]}"
- Dilemma 5 (Curiosity with Easter Eggs/Outerbounds): "${answers[4]}"

Generate a futuristic, Cyberpunk-themed diagnostic profile report of their gaming psyche.
Return a JSON object containing:
1. "archetype": A powerful Arabic title (e.g. "الشبح الصامت", "العقل السيبراني المدبر", "الفوضوي الصاخب", "صائد الأسرار الأبدي").
2. "archetypeEnglish": Cool English translation subtitle (e.g. "Phantom Rogue Assassin" or "Elite Cyber Strategist").
3. "description": Deep, psychological gaming bio in Arabic analyzing how they approach goals, teammates, and stress.
4. "strength": Principal cognitive strength in Arabic.
5. "weakness": A funny/sarcastic gaming weakness or trigger in Arabic.
6. "stats": A dictionary / object containing numeric percentage skills (between 40 and 100):
   - "competitive": Competitive drive / Sweat index
   - "lore": Story & Narrative devotion
   - "mechanics": APM / Hardware reflex
   - "tactics": Tactical awareness / strategic IQ
   - "chaos": Unpredictability / troll index

Response schema MUST be:
{
  "archetype": "...",
  "archetypeEnglish": "...",
  "description": "...",
  "strength": "...",
  "weakness": "...",
  "stats": { "competitive": 90, "lore": 60, "mechanics": 80, "tactics": 75, "chaos": 45 }
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Gamer personality analysis failed:", err);
    res.status(500).json({ error: "Failed to analyze gamer personality." });
  }
});

// Vite middleware setup
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
