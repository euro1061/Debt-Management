# Debt Free - ระบบจัดการหนี้ครบวงจร

แอป Single-Page สำหรับติดตามหนี้ส่วนบุคคล บิลรายเดือน คำนวณระยะเวลาปลดหนี้ และแนะนำกลยุทธ์การชำระ รองรับ PWA ติดตั้งเป็นแอปบนมือถือได้ ใช้งานร่วมกันในครอบครัวได้ (ข้อมูลชุดเดียวกันทุกอุปกรณ์)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| Build Tool | Vite |
| CSS | Tailwind CSS 4 + Custom CSS Variables (dark/light theme) |
| Database | Supabase (PostgreSQL) |
| Icons | Font Awesome 6 |
| PWA | vite-plugin-pwa (Workbox) |

## Project Structure

```
debt-dashboard/
├── index.html                  # Vite entry point + PWA meta tags
├── package.json
├── vite.config.ts              # Vite + Vue + Tailwind + PWA plugins
├── tsconfig.json
├── .env                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── supabase-migration.sql      # SQL สร้างตาราง debts/payments
│
├── public/
│   ├── icon-192.svg            # PWA icon 192x192
│   └── icon-512.svg            # PWA icon 512x512
│
└── src/
    ├── main.ts                 # createApp + mount
    ├── App.vue                 # Root component - layout, tab switching, modals, toast, notifications
    ├── style.css               # Tailwind import + custom CSS (1200+ lines)
    │
    ├── lib/
    │   └── supabase.ts         # Supabase client (ใช้ env vars)
    │
    ├── types/
    │   └── index.ts            # Debt, Payment interfaces + Insert/Update types
    │
    ├── utils/
    │   ├── format.ts           # fmt(n) → "฿1,234", fmtNum(n)
    │   └── calculations.ts     # calculateMonthsToPayoff(), calculateOverallFreedomDate()
    │
    ├── composables/
    │   ├── useDeviceId.ts      # สร้าง/ดึง anonymous UUID จาก localStorage (legacy, ไม่ได้ใช้แล้ว)
    │   ├── useDebts.ts         # CRUD หนี้ผ่าน Supabase (fetch/add/update/delete/reorder)
    │   ├── usePayments.ts      # CRUD การชำระผ่าน Supabase (fetch/add/update/delete)
    │   └── useTheme.ts         # สลับ dark/light mode
    │
    └── components/
        ├── AppHeader.vue           # Header + วันที่ + ปุ่มสลับธีม
        ├── SummaryCards.vue        # การ์ดสรุป: หนี้รวม, ชำระแล้ว, คงเหลือ, วันอิสรภาพ (ไม่รวมบิลรายเดือน)
        ├── BottomNav.vue           # Bottom tab navigation (4 แท็บ)
        ├── ToastNotification.vue   # Toast แจ้งเตือน
        ├── ConfirmModal.vue        # Modal ยืนยันลบ (animated)
        ├── DebtDetailModal.vue     # Modal แสดงรายละเอียดหนี้แบบเต็ม (สำหรับ screenshot/แชร์ progress)
        │
        ├── DebtList.vue            # รายการหนี้ แยก 2 แท็บ: หนี้สิน / บิลรายเดือน + drag-and-drop จัดเรียง
        ├── DebtItem.vue            # การ์ดหนี้ (progress bar) หรือ การ์ดบิล (สถานะจ่าย/ยังไม่จ่าย)
        ├── DebtModal.vue           # Modal เพิ่ม/แก้ไขหนี้ + บิล (icon picker, color picker, validation)
        ├── PaymentModal.vue        # Modal บันทึกการชำระ (pre-fill ยอดคงที่สำหรับบิล, validation)
        │
        ├── CountdownList.vue       # นับถอยหลังแต่ละหนี้ (ring chart)
        ├── WhatIfCalculator.vue    # จำลองสถานการณ์โปะเพิ่ม
        │
        ├── UpcomingPayments.vue    # กำหนดจ่าย: รายวัน (สถานะวันนี้) + รายเดือน (urgency/overdue) + กดบันทึกชำระได้
        ├── PaymentHistory.vue      # ประวัติการชำระ + filter เลือกเดือน
        │
        ├── MonthlyGoal.vue         # ตั้งเป้าหมายชำระรายเดือน (ring progress, validation)
        ├── MonthlyChart.vue        # กราฟแท่งสรุปยอดชำระรายเดือน (6/12/ทั้งหมด)
        ├── DailySummary.vue        # สรุปยอดจ่ายวันนี้
        ├── StrategyRecommendation.vue  # กลยุทธ์ Avalanche / Snowball
        └── InterestAnalysis.vue    # สัดส่วนดอกเบี้ยที่จ่ายไป (bar chart)
```

## Database Schema (Supabase)

### `debts`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | auto-generated |
| device_id | TEXT | family identifier (ใช้ค่าคงที่ `'family'` เพื่อแชร์ข้อมูลทุกอุปกรณ์) |
| name | TEXT | ชื่อเจ้าหนี้/รายการ/ชื่อบิล |
| total_amount | NUMERIC | ยอดหนี้ทั้งหมด (0 สำหรับ recurring_bill) |
| remaining | NUMERIC | ยอดคงเหลือ (0 สำหรับ recurring_bill) |
| interest | NUMERIC | อัตราดอกเบี้ย (%/ปี) (0 สำหรับ recurring_bill) |
| min_payment | NUMERIC | ยอดจ่ายขั้นต่ำ หรือ ยอดคงที่ต่อเดือนของบิล (0 = ยอดไม่คงที่) |
| frequency | TEXT | 'monthly' / 'daily' / 'recurring_bill' |
| due_day | INTEGER | วันที่ครบกำหนดจ่ายในแต่ละเดือน (0 สำหรับ daily) |
| color | TEXT | สีจำแนกรายการ (hex) |
| icon | TEXT | Font Awesome class เช่น 'fas fa-credit-card' |
| sort_order | INTEGER | ลำดับการจัดเรียงที่ผู้ใช้กำหนด (drag-and-drop) |
| created_at | TIMESTAMPTZ | วันที่สร้าง |

### `payments`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | auto-generated |
| device_id | TEXT | family identifier |
| debt_id | UUID (FK → debts) | อ้างอิงรายการหนี้ (cascade delete) |
| debt_name | TEXT | ชื่อหนี้ (denormalized) |
| amount | NUMERIC | จำนวนเงินที่ชำระ |
| principal | NUMERIC | ส่วนที่ตัดเงินต้น (= amount สำหรับ recurring_bill) |
| interest | NUMERIC | ส่วนที่เป็นดอกเบี้ย (0 สำหรับ recurring_bill) |
| date | DATE | วันที่ชำระ |
| note | TEXT | หมายเหตุ |
| color | TEXT | สีของหนี้ |
| created_at | TIMESTAMPTZ | วันที่บันทึก |

## App Features (4 Tabs)

### Tab 1: ภาพรวม (Dashboard)
- สรุปหนี้รวม / ชำระแล้ว / คงเหลือ / วันอิสรภาพ (ไม่รวมบิลรายเดือน)
- Progress bar รวม
- รายการหนี้ทั้งหมด — **แยก 2 แท็บ: หนี้สิน / บิลรายเดือน** พร้อมจำนวนนับ
- **Drag-and-drop จัดเรียง** — กดปุ่ม "จัดเรียง" แล้วลากสลับตำแหน่งได้ (บันทึกลำดับลง Supabase)
- หนี้ปกติ: icon + สี + progress bar + ยอดคงเหลือ + ดอกเบี้ย
- บิลรายเดือน: สถานะ "จ่ายแล้ว/ยังไม่จ่าย" ของเดือนนี้ + ยอดที่จ่ายล่าสุด
- บิลยอดคงที่ (เน็ตบ้าน/subscription): กรอกยอดไว้ ระบบ pre-fill ตอนชำระ
- **ปุ่มดูรายละเอียด (Detail)** — เปิดหน้ารายละเอียดแบบเต็มจอ ออกแบบสำหรับ screenshot ส่งให้คนอื่นดู progress ได้:
  - Progress Ring + % ชำระแล้ว
  - ยอดรวม / ชำระแล้ว / คงเหลือ
  - ข้อมูลดอกเบี้ย, จ่ายขั้นต่ำ, วันกำหนดจ่าย
  - คาดว่าปลดหนี้วันไหน
  - สรุปยอดเงินต้น/ดอกเบี้ยที่จ่ายไป
  - ประวัติการชำระล่าสุด 10 รายการ
  - Watermark "Debt Free Dashboard" + วันที่ปัจจุบัน
- CRUD + ชำระด่วน
- **Form Validation** — ทุกฟิลด์ required แสดง `*` + ข้อความ error สีแดงใต้ฟิลด์ + ขอบแดง
- หนี้รายวันไม่ต้องกรอกวันครบกำหนด (ซ่อนฟิลด์อัตโนมัติ)

### Tab 2: คำนวณ (Calculator)
- นับถอยหลังแต่ละหนี้ (ring SVG chart)
- What-If: จำลองผลลัพธ์ถ้าโปะเพิ่ม

### Tab 3: การชำระ (Payments)
- **รายจ่ายรายวัน** — แสดงสถานะจ่ายวันนี้ (จ่ายแล้ว/ยังไม่จ่าย) กดบันทึกชำระได้ทันที
- **กำหนดจ่ายรายเดือน** — urgency badges + ตรวจ billing cycle + แสดง **"เลยกำหนด X วัน"** เมื่อยังไม่จ่าย
- **กดที่รายการเพื่อบันทึกชำระได้เลย** — เปิด PaymentModal พร้อม pre-select หนี้ที่กด
- ประวัติการชำระ — **filter เลือกเดือน** + สรุปจำนวน/ยอดรวม + แก้ไข/ลบได้

### Tab 4: วิเคราะห์ (Insights)
- **เป้าหมายรายเดือน** — ตั้งเป้ายอดชำระ + วงแหวน progress + สถานะถึงเป้า
- **กราฟสรุปรายเดือน** — กราฟแท่ง stacked (เงินต้น/ดอกเบี้ย) เลือกช่วง 6/12 เดือน/ทั้งหมด
- สรุปยอดจ่ายวันนี้
- กลยุทธ์ปิดหนี้: Avalanche (ดอกเบี้ยแพงก่อน) / Snowball (ยอดน้อยก่อน)
- สัดส่วนดอกเบี้ยที่จ่ายไป (horizontal stacked bar)

## Recurring Bill (บิลรายเดือน)

สำหรับค่าน้ำ/ค่าไฟ/ค่าเน็ต ที่ไม่ใช่หนี้แต่ต้องจ่ายทุกเดือน:

| | หนี้ปกติ | บิลรายเดือน |
|---|---|---|
| ยอดรวม/คงเหลือ | มี ลดตามชำระ | ไม่มี (0) |
| ดอกเบี้ย | มี | ไม่มี |
| จ่ายขั้นต่ำ | คงที่ | ยอดคงที่ (optional) หรือกรอกเอง |
| Progress | % ปิดหนี้ | จ่ายแล้ว / ยังไม่จ่าย ของเดือนนี้ |
| ปุ่มชำระ | คำนวณเงินต้น/ดอกเบี้ย | บันทึกยอดบิลตรงๆ |

## Key Architecture Decisions

- **No Pinia / Vuex** -- State อยู่ใน composables (`useDebts`, `usePayments`) ที่เป็น module-level reactive refs แชร์ข้ามทุก component ที่เรียกใช้
- **No Vue Router** -- Tab switching ด้วย `v-show` + `activeTab` ref ใน App.vue
- **Family Shared Data** -- ใช้ `device_id = 'family'` คงที่แทน UUID ต่ออุปกรณ์ ทำให้ทุกคนในครอบครัวเห็นข้อมูลเดียวกัน
- **Dark/Light Theme** -- CSS Variables ใน `:root` / `.dark` class toggle บน `<body>`
- **Payment Calculation** -- เมื่อบันทึกชำระ จะคำนวณ interest portion = remaining × monthly rate แล้ว principal portion = amount - interest ก่อนอัพเดทยอดคงเหลือ (ไม่ใช้กับ recurring_bill)
- **Drag-and-Drop Ordering** -- จัดเรียงรายการหนี้ด้วย drag (HTML5 drag บนเดสก์ท็อป + touch events บนมือถือ) บันทึก `sort_order` ลง Supabase
- **Overdue Detection** -- รายการที่เลยกำหนดชำระแล้วยังไม่จ่ายจะแสดงเป็นสีแดง "เลยกำหนด X วัน" แทนที่จะข้ามไปเดือนถัดไป
- **Daily Debt Handling** -- หนี้รายวันแยกแสดงในส่วนของตัวเอง เช็คสถานะจ่ายเฉพาะวันนี้ ไม่แสดงในปฏิทินรายเดือน
- **PWA** -- vite-plugin-pwa สร้าง manifest + service worker อัตโนมัติ แคช CDN (Font Awesome, Google Fonts)
- **Smart Notifications** -- แจ้งเตือนวันละ 1 ครั้ง รวมรายการเป็น notification เดียว ไม่ซ้ำถ้าเปิดใหม่ (ไม่แจ้งเตือนหนี้รายวัน)
- **Monthly Goal** -- เก็บเป้าหมายใน localStorage (ไม่ต้องเปลี่ยน schema)
- **Form Validation** -- ทุก Modal/Form มี client-side validation แสดง error แบบ inline ใต้ฟิลด์ พร้อม `*` ระบุ required, ขอบแดงเมื่อผิด, reset เมื่อเปิด modal ใหม่
- **Loading Screen** -- Fullscreen loading แบบ animated (spinning rings + bouncing dots) ขณะโหลดข้อมูลจาก Supabase ครั้งแรก fade-out เมื่อ `fetchDebts()` + `fetchPayments()` เสร็จ รองรับ dark mode

## Getting Started

```bash
# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

ก่อนรัน ต้องตั้งค่า `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

และรัน `supabase-migration.sql` ใน Supabase SQL Editor เพื่อสร้างตาราง

หากเป็นโปรเจกต์ที่มีอยู่แล้ว ต้องเพิ่มคอลัมน์ `sort_order`:
```sql
ALTER TABLE debts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
```
