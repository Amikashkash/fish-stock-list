# מערכת תכנון העברות - תיעוד ליישום

## סטטוס נוכחי
✅ נוצר `transfer-plan.service.js` מלא עם כל הפונקציונליות
⏳ נותר לבנות את הממשקים (UI Components)

## מה עשינו עד עכשיו

### 1. Service Layer (`src/services/transfer-plan.service.js`)
יצרנו service מלא עם הפונקציות הבאות:

#### ניהול תוכניות:
- `createTransferPlan()` - יצירת תוכנית העברה חדשה
- `getTransferPlans()` - קבלת כל התוכניות (עם סינון לפי status)
- `getTransferPlan()` - קבלת תוכנית בודדת
- `updateTransferPlan()` - עדכון תוכנית
- `deleteTransferPlan()` - מחיקת תוכנית וכל המשימות שלה
- `finalizeTransferPlan()` - סימון תוכנית כמוכנה לביצוע

#### ניהול משימות:
- `addTransferTask()` - הוספת משימת העברה לתוכנית
- `getTransferTasks()` - קבלת כל המשימות של תוכנית (ממוין לפי order)
- `updateTransferTask()` - עדכון משימה
- `deleteTransferTask()` - מחיקת משימה
- `executeTransferTask()` - **ביצוע בפועל** - מעביר את הדגים

#### Virtual State & Validation:
- `calculateVirtualAquariumState()` - חישוב מצב וירטואלי של אקווריומים בתוכנית
- `validateTaskWarnings()` - בדיקת התנגשויות והתראות (3 סוגים):
  1. ניסיון להוסיף דגים לאקווריום שמתוכנן להתרוקן
  2. ניסיון להוציא דגים מאקווריום שמתוכנן לקבל דגים
  3. ניסיון להעביר דגים לאקווריום תפוס (ללא אישור mixing)

#### ניהול תקלות:
- `blockTransferTask()` - חסימת משימה עם סיבה (temperature/size/leak/other)
- `unblockTransferTask()` - שחרור חסימה - מנהל מאשר continue/cancel

### 2. מבני נתונים ב-Firestore

#### Collection: `transfer_plans`
```javascript
{
  planId: string,
  farmId: string,
  planName: string,
  status: 'planning' | 'ready' | 'in-progress' | 'completed' | 'cancelled',
  createdBy: string,
  taskCount: number,
  completedTaskCount: number,
  blockedTaskCount: number,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Collection: `transfer_tasks`
```javascript
{
  taskId: string,
  planId: string,
  farmId: string,
  fishId: string,
  fishName: string,
  scientificName: string,
  size: string,
  quantity: number,
  sourceAquariumId: string,
  sourceAquariumNumber: string,
  sourceRoom: string,
  targetAquariumId: string,
  targetAquariumNumber: string,
  targetRoom: string,
  order: number,              // סדר ביצוע!
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled',
  blockReason: string | null, // 'temperature' | 'size' | 'leak' | 'other'
  blockNotes: string | null,
  allowMixing: boolean,       // אישור לערבב דגים
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  executedAt: Timestamp | null
}
```

## מה נותר לעשות

### שלב 1: שדרוג הממשק הקיים (המלצה ליישום הדרגתי)

#### A. עדכון `FishTransferModal.jsx`
במקום להעביר דגים מיידית, המודל יתכנן העברות:

1. **שינוי ב-UI:**
   - כפתור "תכנן העברה" במקום "העבר"
   - אפשרות להוסיף מספר העברות לתוכנית
   - הצגת רשימת המשימות שנוספו

2. **אינטגרציה עם ה-service:**
```javascript
// דוגמה:
import {
  createTransferPlan,
  addTransferTask,
  validateTaskWarnings
} from '../../services/transfer-plan.service'

// במקום להעביר מיידית:
async function handleAddToPlan() {
  // יצירת תוכנית אם אין
  if (!currentPlan) {
    const { planId } = await createTransferPlan(farmId, {
      planName: 'תוכנית העברה - ' + new Date().toLocaleDateString('he-IL'),
      createdBy: user.email
    })
    setCurrentPlan(planId)
  }

  // בדיקת warnings
  const warnings = await validateTaskWarnings(farmId, currentPlan, taskData)
  if (warnings.length > 0) {
    // הצגת התראה למשתמש
    const confirmed = await showWarningDialog(warnings)
    if (!confirmed) return
  }

  // הוספת משימה
  await addTransferTask(farmId, {
    ...taskData,
    planId: currentPlan,
    order: taskList.length, // מספר סידורי
    allowMixing: userConfirmedMixing
  })
}
```

3. **Virtual State Display:**
   - הצגת אקווריומים בצבעים שונים:
     - 🟢 ירוק - ריק (פיזית ווירטואלית)
     - 🟡 צהוב - מתוכנן לפינוי
     - 🔵 כחול - מתוכנן לקבלת דגים
     - 🔴 אדום - תפוס (עם אפשרות mixing)

#### B. מודל ביצוע חדש: `TransferExecutionModal.jsx`
מודל נפרד לביצוע התוכנית:

```javascript
// רכיבים עיקריים:
1. רשימת משימות לפי סדר (order)
2. כל משימה עם:
   - פרטי הדג
   - אקווריום מקור → אקווריום יעד
   - כפתור "בוצע ✓"
   - כפתור "תקוע ⚠️"
3. Progress bar
4. התראות על משימות חסומות
```

**פונקציונליות:**
```javascript
// ביצוע משימה
async function executeTask(taskId) {
  try {
    await executeTransferTask(farmId, taskId)
    // רענון רשימה
  } catch (error) {
    showError(error.message)
  }
}

// דיווח תקלה
async function reportIssue(taskId) {
  const { reason, notes } = await showBlockDialog()
  await blockTransferTask(farmId, planId, taskId, { reason, notes })
  // שליחת התראה למנהל
}

// מנהל מאשר המשך
async function handleUnblock(taskId, action) {
  await unblockTransferTask(farmId, planId, taskId, action)
  // 'continue' או 'cancel'
}
```

### שלב 2: אינטגרציה בדף הבית

```javascript
// HomePage.jsx
const actionCards = [
  // ...
  { icon: '📋', label: 'תכנון העברות', action: 'plan-transfers' },
  { icon: '▶️', label: 'ביצוע העברות', action: 'execute-transfers' },
]
```

### שלב 3: הוספת Notifications למנהל
כאשר עובד מדווח על תקלה, המנהל צריך לקבל התראה:
- ניתן להשתמש ב-Firebase Cloud Messaging
- או רק הצגה בממשק עם badge אדום

## דוגמת Flow מלא

### תכנון:
1. מנהל פותח "תכנון העברות"
2. בוחר דג מאקווריום X
3. המערכת מציגה רק אקווריומים פנויים (פיזית + וירטואלית)
4. מנהל בוחר אקווריום Y
5. **אם Y תפוס**: המערכת מזהירה "אקווריום תפוס - לערבב?"
6. **אם Y מתוכנן להתרוקן**: המערכת מזהירה "אקווריום מתוכנן להתרוקן"
7. מנהל מאשר ומוסיף למשימה מס' 1
8. חוזר על זה עוד כמה פעמים
9. לוחץ "סיים תכנון" → status = 'ready'

### ביצוע:
1. עובד פותח "ביצוע העברות"
2. רואה רשימת משימות ממוינת (1, 2, 3...)
3. מבצע משימה 1 → לוחץ "בוצע" → הדגים עוברים בפועל
4. מבצע משימה 2 → רואה שהאקווריום קטן → לוחץ "תקוע"
5. בוחר סיבה: "גודל אקווריום לא מתאים"
6. מנהל מקבל התראה
7. מנהל בוחר: "בטל משימה זו, תמשיך הלאה"
8. עובד ממשיך למשימה 3

## טיפים ליישום

1. **התחל קטן**: קודם תמוסס רק את חלק התכנון הבסיסי
2. **בדוק צעד אחר צעד**: אחרי כל שינוי, תבדוק שהכל עובד
3. **השתמש ב-Virtual State**: זה המפתח למניעת טעויות
4. **Warnings הם חשובים**: תן למשתמש לדעת מה קורה
5. **Order חשוב**: תמיד שמור ומציג לפי סדר ביצוע

## קבצים לעדכן (סיכום)

### קיימים - לשנות:
- ❌ `src/components/features/transfer/FishTransferModal.jsx` → לעדכן לתכנון
- ✅ `src/pages/HomePage.jsx` → להוסיף 2 כפתורים חדשים

### חדשים - ליצור:
- ⏳ `src/components/features/transfer-plan/TransferPlanModal.jsx`
- ⏳ `src/components/features/transfer-plan/TransferExecutionModal.jsx`
- ⏳ `src/components/features/transfer-plan/WarningDialog.jsx`
- ⏳ `src/components/features/transfer-plan/BlockReportDialog.jsx`

### סטטוס נוכחי:
✅ Backend מוכן לחלוטין (transfer-plan.service.js)
⏳ Frontend - ממתין ליישום

## הערות חשובות

1. **Firestore Security Rules**: תצטרך להוסיף rules עבור:
   - `transfer_plans`
   - `transfer_tasks`

2. **Indexes**: Firestore ידרוש indexes עבור:
   - `transfer_tasks` where planId + orderBy order
   - `transfer_tasks` where planId + where status

3. **Testing**: תתחיל עם תוכנית פשוטה (משימה 1-2) לפני שירשורים מורכבים

---

**📝 סטטוס**: מוכן להמשך פיתוח מהבית
**📅 תאריך**: 2025-12-21
**✍️ נוצר על ידי**: Claude Sonnet 4.5
