# AI Meal Planner (Thai) - วางแผนเมนูอาหารอัจฉริยะ 🍳🥗

![AI Meal Planner](./public/cover.png)

ยินดีต้อนรับสู่โปรเจกต์ **AI Meal Planner**! แอปพลิเคชันนี้ถูกสร้างขึ้นเพื่อช่วยให้การวางแผนเมนูอาหารในแต่ละสัปดาห์เป็นเรื่องง่าย สนุก และชาญฉลาด ด้วยการใช้พลังของ AI จาก **Google Gemini** เพื่อสร้างแผนอาหารและรายการซื้อของที่ปรับแต่งได้ตามใจคุณ

โปรเจกต์นี้เปิดเป็น Open Source เพื่อให้ทุกคนสามารถนำไปศึกษา, พัฒนาต่อยอด, หรือนำไปปรับใช้กับโปรเจกต์ของตัวเองได้เลยครับ!

---

## ❤️ ร่วมสนับสนุนและให้กำลังใจ
หากคุณชื่นชอบโปรเจกต์นี้และอยากสนับสนุนให้เราสร้างสรรค์ผลงานดีๆ ต่อไป คุณสามารถให้กำลังใจเราได้ง่ายๆ ผ่านช่องทางต่างๆ ด้านล่างนี้ครับ:

- **🎬 [YouTube](https://www.youtube.com/@benzondataen):** กด **Subscribe** ช่องของเราเพื่อติดตามโปรเจกต์ใหม่ๆ และเทคนิคการเขียนโค้ดดีๆ
- **👍 [Facebook](https://www.facebook.com/benzondata):** กด Like เพจเพื่อไม่พลาดข่าวสารและบทความที่น่าสนใจ

ทุกการติดตามและสนับสนุนมีความหมายกับผมมากครับ ขอบคุณครับ

---

## ✨ ฟีเจอร์หลัก (Features)
แอปพลิเคชันนี้มาพร้อมกับฟีเจอร์ที่ครบครันเพื่อประสบการณ์การวางแผนอาหารที่ดีที่สุด:

- **🤖 การสร้างแผนอาหารด้วย AI:**
  - **สร้างแผนแบบกำหนดเอง:** เลือกวันและมื้ออาหาร (เช้า/กลางวัน/เย็น) ที่ต้องการวางแผนได้ผ่านปฏิทิน
  - **แนะนำเมนูอัตโนมัติ:** AI จะแนะนำเมนูอาหารสำหรับทุกมื้อที่เลือก โดยเน้นเมนูที่ทำง่ายและเหมาะสมกับการใช้ชีวิตในคอนโด
  - **ปรับเปลี่ยนเมนูได้:** ผู้ใช้สามารถแก้ไขชื่อเมนูและจำนวนคนทานในแต่ละมื้อได้ตามต้องการ

- **🛒 รายการซื้อของอัจฉริยะ (Shopping List):**
  - **สร้างรายการอัตโนมัติ:** AI จะคำนวณและสร้างรายการวัตถุดิบทั้งหมดที่ต้องซื้อจากแผนอาหารที่กำหนด
  - **คำนวณตามจำนวนคน:** ปริมาณวัตถุดิบจะถูกปรับตามจำนวนคนทาน (Servings) ที่ระบุในแต่ละมื้อ
  - **จัดหมวดหมู่:** วัตถุดิบจะถูกจัดเป็นหมวดหมู่ (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง) เพื่อให้ง่ายต่อการซื้อ

- **💸 ติดตามค่าใช้จ่าย:**
  - **กรอกราคา:** ผู้ใช้สามารถใส่ราคาของวัตถุดิบแต่ละรายการได้ (ค่าเริ่มต้น 0 บาท)
  - **เพิ่มรายจ่ายอื่นๆ:** สามารถเพิ่มรายการค่าใช้จ่ายนอกเหนือจากวัตถุดิบได้ เช่น ของใช้ในบ้าน
  - **สรุปยอดรวม:** มีหน้าสรุปค่าใช้จ่ายทั้งหมดของสัปดาห์

- **📸 สแกนใบเสร็จด้วย OCR:**
  - **อ่านข้อมูลจากรูปภาพ:** ผู้ใช้สามารถถ่ายรูปหรืออัปโหลดใบเสร็จเพื่อให้ AI (Gemini Vision) ช่วยอ่านรายการสินค้าและราคา
  - **จับคู่อัจฉริยะ:** AI ช่วยจับคู่รายการในใบเสร็จกับรายการซื้อของ แม้ว่าชื่อจะไม่ตรงกัน 100% (เช่น "สันนอกหมู" กับ "หมูสันนอก")
  - **อัปเดตอัตโนมัติ:** ระบบจะกรอกราคาและติ๊กเช็คลิสต์รายการที่ตรงกันให้โดยอัตโนมัติ

- **🗂️ การจัดการแผน:**
  - **บันทึกแผนอาหาร:** ผู้ใช้สามารถบันทึกแผนอาหารที่สร้างเสร็จแล้วลงใน Firestore ได้
  - **แดชบอร์ด:** หน้าแดชบอร์ดแสดงแผนที่บันทึกไว้ทั้งหมด พร้อมสถานะของแต่ละแผน (สัปดาห์นี้, สัปดาห์หน้า, สำเร็จแล้ว)
  - **ดูแผนย้อนหลัง:** สามารถเรียกดูรายละเอียดของแผนที่เคยบันทึกไว้ได้

- **📝 ระบบ Feedback:**
  - ผู้ใช้สามารถส่งข้อเสนอแนะ, แจ้งปัญหา (Bug), หรือแนะนำฟีเจอร์ใหม่ๆ ให้กับผู้พัฒนาได้โดยตรงผ่านแอป
  - ข้อมูลจะถูกเก็บลงใน Firestore collection `feedback`

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend:** [React](https://reactjs.org/) (with Hooks) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI Model:** [Google Gemini API](https://ai.google.dev/) (gemini-2.5-flash)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Build Tool:** Vite (ทำงานผ่าน Web-based IDE)

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)
```
/
├── public/                  # ไฟล์สาธารณะ เช่น รูปภาพ
├── src/
│   ├── components/          # React Components ที่ใช้ซ้ำได้
│   │   ├── icons/           # SVG Icon Components
│   │   └── ...
│   ├── hooks/
│   │   └── useMealPlanner.ts # Hook หลักที่จัดการ State และ Logic ทั้งหมดของแอป
│   ├── services/
│   │   ├── geminiService.ts   # ฟังก์ชันสำหรับเรียก Gemini API
│   │   ├── firestoreService.ts# ฟังก์ชันสำหรับสื่อสารกับ Firestore
│   │   └── ...
│   ├── utils/                 # ฟังก์ชันช่วยเหลือต่างๆ (Helper Functions)
│   ├── App.tsx                # Component หลักที่ควบคุมการแสดงผลของแต่ละหน้า
│   ├── firebase.ts            # การตั้งค่าและ Initialize Firebase
│   ├── index.tsx              # Entry point ของ React App
│   └── types.ts               # Type definitions ของ TypeScript
├── index.html               # ไฟล์ HTML หลัก
├── README.md                # เอกสารนี้
└── ...
```

---

## 🚀 การตั้งค่าและรันโปรเจกต์ (Setup and Running the Project)

### 1. Clone โปรเจกต์
```bash
git clone https://github.com/benzondataen/ai-meal-planner-thai.git
cd ai-meal-planner
```

### 2. ตั้งค่า Firebase
คุณต้องมีโปรเจกต์ Firebase ของตัวเองก่อน:
1.  ไปที่ [Firebase Console](https://console.firebase.google.com/) และสร้างโปรเจกต์ใหม่
2.  ในโปรเจกต์ของคุณ ไปที่ **Authentication** > **Sign-in method** และเปิดใช้งาน **Google**
3.  ไปที่ **Firestore Database** และสร้างฐานข้อมูลใน **Production mode**
4.  ไปที่ **Project settings** (ไอคอนฟันเฟือง) > **General** และหา **Your apps**
5.  คลิกที่ไอคอน Web (`</>`) เพื่อสร้าง Web App ใหม่ และคัดลอกค่า `firebaseConfig` มา

### 3. ตั้งค่า API Keys
เปิดไฟล์ `src/firebase.ts` และแก้ไขค่า `firebaseConfig` ด้วยข้อมูลจากโปรเจกต์ของคุณ:
```typescript
// src/firebase.ts

// ...
export const FIREBASE_PROJECT_ID = "your-firebase-project-id";
export const FIREBASE_API_KEY = "your-firebase-web-api-key"; // Key from firebaseConfig

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "your-project-id.firebaseapp.com",
  projectId: FIREBASE_PROJECT_ID,
  // ... ค่าอื่นๆ จาก firebaseConfig ของคุณ
};
// ...
```
**สำคัญ:** `FIREBASE_API_KEY` ที่ใช้ในไฟล์นี้จะถูกใช้สำหรับเรียก Gemini API ด้วย หากคุณต้องการแยก Key ก็สามารถทำได้ใน `src/services/geminiService.ts`

### 4. ตั้งค่า Firestore Security Rules
เพื่อให้แอปสามารถบันทึกข้อมูลได้อย่างปลอดภัย ให้ไปที่ **Firestore Database** > **Rules** และวางกฎด้านล่างนี้ลงไป:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // อนุญาตให้ผู้ใช้ อ่าน/เขียน ได้เฉพาะแผนของตัวเองเท่านั้น
    match /users/{userId}/plans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // อนุญาตให้ผู้ใช้ที่ล็อกอินแล้ว สามารถ "สร้าง" feedback ได้เท่านั้น
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read, update, delete: if false; // ป้องกันการเข้าถึงข้อมูลของคนอื่น
    }
  }
}
```

### 5. รันโปรเจกต์
เนื่องจากโปรเจกต์นี้ถูกสร้างขึ้นบน Web-based IDE จึงไม่มีขั้นตอน `npm install` แต่หากคุณต้องการรันบนเครื่องของคุณเอง ให้ใช้คำสั่ง:
```bash
npm install
npm run dev
```

---

ขอให้สนุกกับการพัฒนาต่อยอดนะครับ! หากมีคำถามหรือข้อเสนอแนะ สามารถเปิด Issue ใน GitHub ได้เลยครับ
