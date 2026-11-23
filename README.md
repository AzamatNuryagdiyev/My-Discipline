# MY DISCIPLINE — Production-Ready Shaxsiy Intizom PWA

**MY DISCIPLINE** — yuqori samaradorlik, intizom, kunlik vazifalar, maqsadlar va streak tizimini boshqarish uchun yaratilgan to‘liq mustaqil (zero-dependency, 100% oflayn ishlaydigan) Progressive Web App (PWA).

U hech qanday tashqi framework (React, Vue, Node.js backend) yoki tashqi CDN'larga (Tailwind CDN, Google Fonts) bog‘liq emas. Barcha CSS, SVG ikonlar va JavaScript modullari ilovaning o‘zida joylashgan bo‘lib, internet bo‘lmagan paytda ham to‘liq quvvat bilan ishlaydi.

---

## 🌟 Asosiy Xususiyatlar va Imkoniyatlar

### 1. Bugun — Dashboard
- **Bugungi sana va vaqt:** O‘zbek tilida haftaning kuni va oy nomi to‘liq ko‘rsatiladi.
- **Dinamik Tough-Love Motivatsiya Tizimi:** Kunlik bajarilish foiziga qarab 4 xil daraja (0% — Harakat vaqti!, 1–69% — Sustlashma!, 70–99% — Marra yaqin!, 100% — 100% Intizom!). Har bir daraja uchun bir nechta keskin va rag‘batlantiruvchi gaplar va ↻ tugmasi orqali almashtirish imkoniyati.
- **Ballar va Bonuslar:**
  - Har bir bajarilgan vazifa uchun: **+10 ball**
  - Kunni 100% yopganlik uchun maxsus bonus: **+25 ball**
  - Takroriy yuklanishda ballar qayta qo‘shilmaydi.
- **Kunlik va Faqat bugungi vazifalar:**
  - `Har kunlik`: har kuni avtomatik ro‘yxatda paydo bo‘ladigan muntazam odatlar.
  - `Faqat bugun`: faqat belgilangan sanada bajarilishi kerak bo‘lgan bir martalik ishlar.
- **Vazifalar boshqaruvi (CRUD):** Qo‘shish, tahrirlash (modal orqali), holatini o‘zgartirish (toggle) va o‘chirish.

### 2. Maqsadlar (Goals)
- **30 kunlik** va **Uzoq muddatli** maqsadlar toifalari.
- Har bir maqsadda: Nomi, joriy natija, mo‘ljal, o‘lchov birligi (bet, kun, km, %, va h.k.), progress bar va foiz.
- **Tezkor qadam tugmalari (+1 / -1)** va to‘liq tahrirlash imkoniyati.
- 100% marraga yetganda g‘alaba xabarnomasi.

### 3. Kalendar va Tarixiy Snapshot Mexanizmi (Immutability)
- **Oylik Heatmap Kalendar:**
  - `0%`: neytral kulrang
  - `1–69%`: qizil / pushti
  - `70–99%`: sariq / qahrabo
  - `100%`: zumrad yashil
- **Tarixiy Snapshot Kafolati:** Kelajakda yangi vazifa qo‘shilsa yoki o‘chirilsa, o‘tib ketgan kunlarning foizi va statistikasi **aslo o‘zgarmaydi**. Har bir kun yakuni muzlatilgan snapshot sifatida saqlanadi.
- **Tanlangan kun tahlili:** Kalendardagi istalgan kunga bosganda o‘sha kundagi barcha vazifalar holati va yozilgan jurnal ochiladi.
- **Oxirgi 7 kunlik bar chart** va oylik o‘rtacha ko‘rsatkichlar.

### 4. Kunlik Jurnal
- Har kuni 3 ta muhim savolga javob:
  1. *Bugungi asosiy yutug‘im nima?*
  2. *Nima menga xalaqit berdi?*
  3. *Ertaga birinchi bo‘lib bajaradigan vazifam nima?*
- O‘tgan barcha yozuvlarni ko‘rish, tahrirlash (modal orqali) va o‘chirish.

### 5. Yutuqlar (Achievements) va Streak
- **Aqlli Streak:** Sozlamalardagi intizom chegarasi (masalan, 80%) ga mos holda seriyani hisoblash.
- Eng uzun seriya (Best streak) va ketma-ket 100% kunlar monitoringi.
- **Badjlar tizimi:**
  - 1 - kun 🌱, 3 - kun 💪, 7 - kun 🔥, 14 - kun 👑, 30 - kun 🏆
  - 100 ball ⚡, 500 ball 🌟
  - Jurnalist ✍️, Katta Jurnalist 📚
- Yangi yutuq ochilganda real-vaqtda bayramona toast bildirishnomasi.

### 6. Xavfsizlik va Ma'lumotlarni Boshqarish
- **IndexedDB + localStorage dualligi:** Katta hajmdagi ma'lumotlar IndexedDB da asinxron, kichik tezkor parametrlar localStorage'da saqlanadi.
- **Avtomatik Migratsiya:** Eski `my_discipline_v2` ma'lumotlari avtomatik aniqlanadi va hech qanday yo‘qotishsiz yangi tizimga o‘tkaziladi. Eski kalit zaxira sifatida saqlanib qoladi.
- **JSON Zaxira (Backup):** To‘liq ma'lumotlarni bir marta bosishda JSON fayl qilib yuklab olish va qat'iy schema validatsiyasi bilan qayta yuklash (import).
- **XSS Himoyasi:** Foydalanuvchi kiritgan barcha matnlar HTML entity escaping orqali tozalangan holda render qilinadi.

---

## 📁 Loyiha Strukturasi

```
my-discipline/
├── index.html                   # Semantik, toza va qulay HTML5 shell
├── manifest.json                # Standart PWA Web Manifest
├── service-worker.js            # Cache-first oflayn Service Worker & Versiyalash
├── README.md                    # Loyiha qo‘llanmasi
├── assets/
│   └── icons/
│       └── icon.jpg             # Asosiy brend logotipi va PWA ikonka
├── css/
│   ├── main.css                 # Dark/Light CSS Variables, Reset, Typography
│   ├── components.css           # Kartalar, Tugmalar, Formalar, Modallar, Toastlar
│   └── responsive.css           # Desktop Sidebar va Mobile Bottom Bar moslashuvi
├── js/
│   ├── app.js                   # Kirish nuqtasi va Event boshqaruvi
│   ├── core/
│   │   ├── storage.js           # IndexedDB + localStorage dualligi
│   │   ├── dates.js             # Sana yordamchilari, ISO, O‘zbekcha nomlar
│   │   ├── state.js             # Reaktiv State va obuna mexanizmi
│   │   ├── migration.js         # my_discipline_v2 migratsiyasi
│   │   └── history.js           # Tarixiy Snapshotlar va o‘zgarmaslik (Immutability)
│   ├── features/
│   │   ├── tasks.js             # Vazifalar CRUD, Toggle va Ballar
│   │   ├── goals.js             # Maqsadlar CRUD va progress
│   │   ├── journal.js           # Kun yakuni savollari va tahrirlash
│   │   ├── calendar.js          # Heatmap, tahlil va 7 kunlik chart
│   │   ├── statistics.js        # Streak va umumiy ballar
│   │   └── achievements.js      # Badjlar va yangi yutuq xabarnomalari
│   └── ui/
│       ├── navigation.js        # Tablar va sarlavha ko‘rsatkichlari
│       ├── dashboard.js         # 5 ta asosiy bo‘lim rendererlari
│       ├── components.js        # Modallar va SVG ikonlar
│       └── notifications.js     # Toast va Status banneri
└── tests/
    └── test-suite.js            # Avtomatlashtirilgan testlar (39 ta test)
```

---

## 🚀 Ishga Tushirish Yo‘riqnomasi

### A. Lokal Kompyuterda Ishga Tushirish

PWA imkoniyatlari (Service Worker, IndexedDB va Kesh) to‘liq ishlashi uchun ilovani lokal web-server orqali ochish tavsiya etiladi (chunki brauzerlar xavfsizlik nuqtai nazaridan `file://` protokolida Service Worker'ni cheklaydi).

1. **Python orqali (eng osoni):**
   ```bash
   # Loyiha papkasida terminalni oching:
   python -m http.server 8080
   # Brauzerda oching: http://localhost:8080
   ```

2. **Node.js `npx serve` orqali:**
   ```bash
   npx serve .
   ```

3. **VS Code Live Server plagini orqali:**
   - VS Code'da `index.html` faylini o‘ng tugma bilan bosing va **"Open with Live Server"** ni tanlang.

---

## 🌐 Bepul Statik Hostingga Joylashtirish

Loyiha hech qanday server yoki murakkab build talab qilmaydi. Quyidagi bepul platformalarga to‘g‘ridan-to‘g‘ri yuklashingiz mumkin:

### 1. GitHub Pages
1. Loyihani GitHub repozitoriyangizga push qiling (`git init`, `git add .`, `git commit -m "Init"`, `git push origin main`).
2. Repozitoriyaning **Settings** -> **Pages** bo‘limiga kiring.
3. **Branch** bo‘limida `main` (yoki `master`) ni tanlang va **Save** bosing.
4. Ilova `https://foydalanuvchi.github.io/repo-nomi/` manzilida ishlaydi.
   *(Nisbiy yo‘llar `./` ishlatilgani sababli subpath'da hech qanday muammosiz ochiladi).*

### 2. Netlify
1. [Netlify.com](https://www.netlify.com) ga kiring.
2. Repozitoriyangizni ulang yoki ushbu papkani to‘g‘ridan-to‘g‘ri **Drag and Drop** qilib yuklang.
3. **Build Command**: *bo‘sh qoldiring*.
4. **Publish Directory**: `.` (root).
5. Netlify sizga bir necha soniyada bepul HTTPS manzil taqdim etadi.

### 3. Cloudflare Pages
1. [Cloudflare Dashboard](https://dash.cloudflare.com) ga kiring.
2. **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Framework preset: **None**.
4. Build output directory: `.` (root).
5. **Save and Deploy** tugmasini bosing.

---

## 📱 PWA'ni Telefonga O‘rnatish Yo‘riqnomasi

Ilova o‘rnatilgach, u telefonda alohida mustaqil dastur sifatida (brauzer manzil qatorisiz, fullscreen va oflayn) ochiladi.

### Android (Chrome / Samsung Internet):
1. Saytga HTTPS manzili orqali kiring.
2. Brauzerning o‘ng yuqori qismidagi **uch nuqta (⋮)** menyusini bosing.
3. **"Ilovani o‘rnatish" (Install app)** yoki **"Bosh ekranga qo‘shish" (Add to Home screen)** ni bosing.
4. Ilova ekranda mustaqil dastur ikonkasi sifatida paydo bo‘ladi.

### iOS (iPhone / iPad — Safari):
1. Safari brauzerida saytni oching.
2. Pastki paneldagi **"Ulashish" (Share - kvadratdan yuqoriga strelka)** tugmasini bosing.
3. Menyu pastiga tushib, **"Bosh ekranga" (Add to Home Screen)** bandini tanlang.
4. **"Qo‘shish" (Add)** ni bosing.

---

## 🧪 Avtomatlashtirilgan Testlar

Loyihaning barcha muhim mantiqiy hisob-kitoblari (sana, streak, ballar, snapshot o‘zgarmasligi, migratsiya, schema validation) avtomatlashtirilgan testlar bilan ta'minlangan.

Testlarni yurgizish:
```bash
node tests/test-suite.js
```
Natija:
```
==================================================
🎉 TEST SUMMARY: 39 PASSED, 0 FAILED
==================================================
```

---

## 🛡️ Hozirgi Cheklovlar va Tavsiyalar
- **Lokal Saqlash:** Ma'lumotlar foydalanuvchining o‘z qurilmasida (IndexedDB/localStorage) saqlanadi. Boshqa telefonga yoki kompyuterga o‘tkazish uchun **Sozlamalar -> JSON Eksport** qilib olib, yangi qurilmada **JSON Import** qilish kerak.
- **Keshni Tozalash:** Agar brauzer keshini to‘liq tozalab tashlasangiz, oldindan JSON eksport zaxira nusxasi olib qo‘yilgan bo‘lishi tavsiya etiladi.
