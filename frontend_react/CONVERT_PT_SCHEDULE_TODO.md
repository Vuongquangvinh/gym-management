# PT Schedule Conversion TODO

This file tracks the className conversion for PTSchedule.jsx from string literals to CSS Modules.

## Files to Update:
1. ✅ PTFaceCheckinModal.module.css - All kebab-case converted to camelCase
2. ✅ PTFaceRegistrationModal.module.css - All kebab-case converted to camelCase  
3. ✅ PTSchedule.module.css - All kebab-case converted to camelCase
4. ⏳ PTFaceCheckinModal.jsx - Need to update all className (currently uses styles.xxx correctly)
5. ⏳ PTFaceRegistrationModal.jsx - Need to update all className (currently uses styles.xxx correctly)
6. ⏳ PTSchedule.jsx - Need to convert ALL string className to styles.className

## PTSchedule.jsx Classes to Convert:

### Week Picker Component (lines 14-125):
- `className="pt-weekly-date-picker"` → `className={styles.ptWeeklyDatePicker}`
- `className="pt-week-navigation"` → `className={styles.ptWeekNavigation}`
- `className="pt-nav-button"` → `className={styles.ptNavButton}`
- `className="pt-week-info"` → `className={styles.ptWeekInfo}`
- `className="pt-week-title"` → `className={styles.ptWeekTitle}`
- `className="pt-today-button"` → `className={styles.ptTodayButton}`
- `className="pt-week-days"` → `className={styles.ptWeekDays}`
- `className={\`pt-day-button\${isSelected(day) ? ' selected' : ''}\${isToday(day) ? ' today' : ''}\`}` → `className={\`\${styles.ptDayButton}\${isSelected(day) ? ' '+styles.selected : ''}\${isToday(day) ? ' '+styles.today : ''}\`}`
- `className="pt-day-name"` → `className={styles.ptDayName}`
- `className="pt-day-number"` → `className={styles.ptDayNumber}`

### Member Detail Modal (lines 127-278):
- Many classes need conversion...

### Main Content (lines 367-951):
- Hundreds of className conversions needed

## Strategy:
Use multi_replace_string_in_file with careful context matching to convert all instances.
