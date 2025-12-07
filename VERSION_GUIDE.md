# מדריך ניהול גרסאות

## לפני כל דחיפה (Push) ל-GitHub

### שלב 1: עדכן את מספר הגרסה
עדכן את הקבצים הבאים:

1. **`package.json`**
   ```json
   "version": "1.x.x"
   ```

2. **`src/version.js`**
   ```javascript
   export const VERSION = '1.x.x'
   export const RELEASE_DATE = 'YYYY-MM-DD'
   export const RELEASE_NAME = 'שם הגרסה'
   ```

### שלב 2: עדכן את CHANGELOG.md
הוסף ערך חדש בראש הקובץ:

```markdown
## [1.x.x] - YYYY-MM-DD

### תכונות חדשות ✨
- תיאור התכונה...

### תיקוני באגים 🐛
- תיאור התיקון...

### שיפורים 🔧
- תיאור השיפור...
```

### שלב 3: בצע Commit ו-Push
```bash
git add .
git commit -m "chore: Bump version to 1.x.x"
git push
```

## כללי מספור גרסאות (Semantic Versioning)

פורמט: `MAJOR.MINOR.PATCH` (לדוגמה: `1.2.3`)

- **MAJOR** (1.x.x): שינויים משמעותיים שאינם תואמים לאחור
- **MINOR** (x.1.x): תכונות חדשות שתואמות לאחור
- **PATCH** (x.x.1): תיקוני באגים קטנים

### דוגמאות:
- `1.0.0` → `1.0.1` - תיקון באג קטן
- `1.0.1` → `1.1.0` - תכונה חדשה
- `1.1.0` → `2.0.0` - שינוי משמעותי (לא תואם לאחור)

## היסטוריית גרסאות

ראה את [CHANGELOG.md](CHANGELOG.md) לפירוט מלא של כל הגרסאות.
