# Migration Plan: Integrating Drug Interaction & Medicine Expiry into SmartPillApp

## 📊 Source Projects Analysis

### Project 1: Drug Interaction Checker
**Location:** `C:\Users\Yugendra\Downloads\Drug-Interaction-Checking-Website-main\Drug-Interaction-Checking-Website-main`

**What we found:**
- ✅ 8 CSV files with drug interaction data (A, B, D, H, L, P, R, V)
- ✅ Data structure: `DDInterID_A, Drug_A, DDInterID_B, Drug_B, Level`
- ✅ Severity levels: Major, Moderate, Minor
- ✅ Next.js-based UI
- ✅ Components for drug search and results display

**What we'll migrate:**
1. Drug interaction dataset → Firestore `interactions` collection
2. Search/filter logic → `/app/interactions/page.tsx`
3. UI components → Adapt to our design system

### Project 2: Medicine Expiry Reminder
**Location:** `C:\Users\Yugendra\Downloads\GCP-Medicine-Expiry-Reminder-main\GCP-Medicine-Expiry-Reminder-main`

**What we found:**
- ✅ Flask backend with QR code scanning
- ✅ Google Calendar integration (already have this!)
- ✅ MySQL database schema
- ✅ Medicine data structure: name, expiry, company, doctor info
- ✅ QR code decoder (Java-based)
- ✅ Email notifications

**What we'll migrate:**
1. QR code scanning logic → Already have in `/app/scan/page.tsx`
2. Calendar integration → Already have in `/lib/google.ts`
3. Medicine data structure → Firestore `medicines` collection
4. Expiry calculation → `/lib/expiryCalculations.ts`

## 🎯 Integration Strategy

### Phase 1: Drug Interaction Data Import (30 min)

**Step 1.1: Install CSV parser**
```bash
npm install csv-parser
```

**Step 1.2: Download Firebase service account**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Save as `firebase-service-account.json` in smartpillapp root
4. Add to .gitignore

**Step 1.3: Run import script**
```bash
node scripts/importInteractions.js
```

**Expected result:**
- ~50,000+ drug interactions imported to Firestore
- Collection: `interactions`
- Fields: `Drug_A`, `Drug_B`, `Level`, `DDInterID_A`, `DDInterID_B`

### Phase 2: Enhance Drug Interaction UI (30 min)

**Step 2.1: Update interactions page**
- Add autocomplete drug search
- Show severity badges (Major=red, Moderate=yellow, Minor=green)
- Add filtering by severity level
- Display interaction count
- Add export to PDF functionality

**Step 2.2: Create reusable components**
```
components/
├── DrugSearchInput.tsx    - Autocomplete search
├── InteractionBadge.tsx   - Severity badge
├── InteractionTable.tsx   - Results table
└── DrugCard.tsx           - Individual drug display
```

### Phase 3: Medicine Scanner & Expiry (45 min)

**Step 3.1: Enhance scanner page**
- Test QR/barcode scanning
- Add manual entry form
- Save to Firestore `medicines` collection
- Create Google Calendar event
- Show success confirmation

**Step 3.2: Create medicine list page**
```typescript
// app/medicines/page.tsx
- List all user's medicines
- Filter by expiry status (expired, expiring soon, safe)
- Edit/delete functionality
- Export to CSV
```

**Step 3.3: Add expiry calculations**
```typescript
// lib/expiryCalculations.ts
export function getExpiryStatus(expiryDate: Date) {
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 30) return 'warning';
  return 'safe';
}
```

### Phase 4: Dashboard Integration (30 min)

**Step 4.1: Update dashboard**
```typescript
// app/page.tsx
- Medicine expiry chart (already have!)
- Recent drug interactions checked
- Medicines expiring soon (top 5)
- Quick action cards
- Statistics overview
```

**Step 4.2: Add widgets**
- Expiry countdown widget
- Interaction risk widget
- Recent chat history widget
- Quick scan button

### Phase 5: Additional Features (30 min)

**Step 5.1: Notifications**
- Browser notifications for expiring medicines
- Email reminders (optional)

**Step 5.2: Export functionality**
- Export medicine list to CSV
- Export interaction results to PDF
- Share via email

## 📁 Final Structure

```
smartpillapp/
├── app/
│   ├── chat/              ✅ DONE - Medical chatbot
│   ├── interactions/      🔨 Drug interaction checker
│   ├── scan/              🔨 Medicine scanner
│   ├── medicines/         🔨 NEW - Medicine list/management
│   ├── page.tsx           🔨 Dashboard with all modules
│   └── api/
│       ├── chat/          ✅ DONE
│       ├── interactions/  ✅ DONE (needs data)
│       ├── medicines/     ✅ DONE (needs testing)
│       └── analytics/     ✅ DONE
├── components/
│   ├── DrugSearchInput.tsx
│   ├── InteractionBadge.tsx
│   ├── InteractionTable.tsx
│   ├── MedicineCard.tsx
│   ├── ExpiryAlert.tsx
│   └── DashboardWidget.tsx
├── lib/
│   ├── firebaseClient.ts       ✅ DONE
│   ├── firebaseAdmin.ts        ✅ DONE
│   ├── google.ts               ✅ DONE
│   ├── expiryCalculations.ts   🔨 NEW
│   └── drugSearch.ts           🔨 NEW
├── scripts/
│   └── importInteractions.js   ✅ CREATED
└── docs/
    ├── MIGRATION_PLAN.md       ✅ THIS FILE
    ├── CHAT_SETUP_GUIDE.md     ✅ DONE
    └── PROJECT_STATUS.md       ✅ DONE
```

## 🗄️ Firestore Collections

### Collection: `interactions`
```typescript
{
  Drug_A: string,
  Drug_B: string,
  Level: "Major" | "Moderate" | "Minor",
  DDInterID_A: string | null,
  DDInterID_B: string | null
}
```

### Collection: `medicines`
```typescript
{
  name: string,
  code: string | null,
  purchaseDate: string | null,
  expiryDate: string,
  company: string | null,
  dosage: string | null,
  userEmail: string | null,
  calendarEventId: string | null,
  createdAt: string
}
```

### Collection: `chatSessions`
```typescript
{
  title: string,
  messages: Array<{
    role: "user" | "assistant",
    content: string,
    timestamp: number
  }>,
  createdAt: number
}
```

## ⏱️ Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Import drug interactions | 30 min | ⏳ Ready |
| 2 | Enhance interactions UI | 30 min | ⏳ Pending |
| 3 | Medicine scanner & expiry | 45 min | ⏳ Pending |
| 4 | Dashboard integration | 30 min | ⏳ Pending |
| 5 | Additional features | 30 min | ⏳ Pending |
| **Total** | | **2.5 hours** | |

## 🚀 Getting Started

### Prerequisites
1. ✅ Firebase project configured (smartpilladvisor)
2. ✅ Firestore database enabled
3. ✅ Security rules published
4. ⏳ Firebase service account key downloaded
5. ✅ GROQ API key configured
6. ⏳ Google Calendar service account (optional)

### Next Steps
1. Download Firebase service account key
2. Run `npm install csv-parser` in smartpillapp
3. Run `node scripts/importInteractions.js`
4. Verify data in Firestore Console
5. Test `/interactions` page
6. Move to Phase 2

## 📝 Notes

- **No code duplication** - Reusing existing API routes and components
- **Single database** - Everything in Firestore
- **Unified UI** - Consistent design across all modules
- **Progressive enhancement** - Each phase builds on the previous
- **Backward compatible** - Existing chat functionality untouched

## ✅ Success Criteria

- [ ] All drug interactions imported to Firestore
- [ ] Drug interaction checker fully functional
- [ ] Medicine scanner saves to Firestore
- [ ] Google Calendar integration working
- [ ] Dashboard shows all modules
- [ ] Mobile responsive
- [ ] No errors in console
- [ ] All features tested

---

**Ready to start?** Begin with Phase 1: Import drug interactions!
