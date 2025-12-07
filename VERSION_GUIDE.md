# מדריך ניהול גרסאות

## 🚀 דרך קלה - סקריפט אוטומטי (מומלץ!)

### שלב 1: הרץ את סקריפט העדכון
בחר את סוג העדכון המתאים:

```bash
# תיקון באג (1.0.0 -> 1.0.1)
npm run version:patch

# תכונה חדשה (1.0.0 -> 1.1.0)
npm run version:minor

# שינוי משמעותי (1.0.0 -> 2.0.0)
npm run version:major
```

הסקריפט יעדכן אוטומטית:
- ✅ `package.json`
- ✅ `src/version.js`
- ✅ תאריך השחרור

### שלב 2: עדכן את CHANGELOG.md
הוסף ערך חדש בראש הקובץ עם תיאור השינויים:

```markdown
## [1.x.x] - YYYY-MM-DD

### תכונות חדשות ✨
- תיאור התכונה...

### תיקוני באגים 🐛
- תיאור התיקון...

### שיפורים 🔧
- תיאור השיפור...
```

### שלב 3: Commit, Tag ו-Push
```bash
# הוסף את כל הקבצים
git add -A

# צור commit
git commit -m "chore: Bump version to 1.x.x"

# צור tag לגרסה
git tag -a v1.x.x -m "Release v1.x.x"

# דחוף הכל ל-GitHub
git push && git push --tags
```

---

## 📝 דרך ידנית (לא מומלץ)

אם בכל זאת תרצה לעדכן ידנית:

### שלב 1: עדכן קבצים
1. **`package.json`** - שנה את `"version": "1.x.x"`
2. **`src/version.js`** - עדכן VERSION, RELEASE_DATE, RELEASE_NAME

### שלב 2: עדכן CHANGELOG.md
הוסף ערך חדש כמו למעלה

### שלב 3: Commit ו-Push
כמו בדרך האוטומטית

---

## 📐 כללי מספור גרסאות (Semantic Versioning)

פורמט: `MAJOR.MINOR.PATCH` (לדוגמה: `1.2.3`)

- **MAJOR** (1.x.x): שינויים משמעותיים שאינם תואמים לאחור
- **MINOR** (x.1.x): תכונות חדשות שתואמות לאחור
- **PATCH** (x.x.1): תיקוני באגים קטנים

### דוגמאות:
- `1.0.0` → `1.0.1` - תיקון באג קטן → `npm run version:patch`
- `1.0.1` → `1.1.0` - תכונה חדשה → `npm run version:minor`
- `1.1.0` → `2.0.0` - שינוי משמעותי → `npm run version:major`

---

## 📚 היסטוריית גרסאות

ראה את [CHANGELOG.md](CHANGELOG.md) לפירוט מלא של כל הגרסאות.

---

## 💡 טיפים

1. **תמיד השתמש בסקריפט האוטומטי** - זה מונע שגיאות ושכחות
2. **עדכן את CHANGELOG.md לפני ה-commit** - כדי לא לשכוח
3. **השתמש ב-tags** - זה יוצר releases יפים ב-GitHub
4. **בדוק את הגרסה בדף הבית** - אחרי push, ודא שהגרסה עודכנה
