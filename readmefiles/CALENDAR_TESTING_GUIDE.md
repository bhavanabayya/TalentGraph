# 🧪 Availability Calendar Date Picker - Testing Guide

## Quick Test Checklist

### ✅ Component Installation
- [x] `react-datepicker` package installed
- [x] AvailabilityDatePicker.tsx created
- [x] AvailabilityDatePicker.css created
- [x] All 3 pages updated with imports
- [x] Build successful with no errors

---

## 🎯 Test Scenarios

### Scenario 1: Basic Date Selection
**Objective**: User can select a date from calendar

**Steps**:
1. Navigate to any form (Edit Profile, Job Preferences, or Candidate Dashboard)
2. Locate "Availability Date" field
3. Click on the field
4. Verify calendar picker opens
5. Click any date (e.g., 15)
6. Verify calendar closes
7. Verify field shows date in format: "January 15, 2026"

**Expected Result**: ✅ Calendar opens/closes, date displays correctly

---

### Scenario 2: Quick Option Buttons
**Objective**: Quick buttons set correct dates

**Test Cases**:

#### Test 2A: Today Button
1. Click "Availability Date" field
2. Click [Today] button
3. Verify field shows today's date (e.g., "January 9, 2026")
4. Submit form and verify backend receives: `2026-01-09`

#### Test 2B: Tomorrow Button
1. Click "Availability Date" field
2. Click [Tomorrow] button
3. Verify field shows tomorrow's date (e.g., "January 10, 2026")
4. Submit form and verify backend receives: `2026-01-10`

#### Test 2C: 2 Weeks Button
1. Click "Availability Date" field
2. Click [2 Weeks] button
3. Calculate expected date: Today + 14 days
4. Verify field shows correct date
5. Submit form and verify backend receives ISO format

#### Test 2D: 1 Month Button
1. Click "Availability Date" field
2. Click [1 Month] button
3. Calculate expected date: Today + 30 days
4. Verify field shows correct date
5. Submit form and verify backend receives ISO format

**Expected Result**: ✅ All buttons calculate and set correct dates

---

### Scenario 3: Clear Selection
**Objective**: User can clear selected date

**Steps**:
1. Select a date (any method)
2. Verify field shows selected date
3. Click ✕ (X) button
4. Verify field becomes empty
5. Verify calendar picker is still available for new selection

**Expected Result**: ✅ Clear button removes selection

---

### Scenario 4: Month/Year Navigation
**Objective**: User can navigate to different months

**Steps**:
1. Click "Availability Date" field
2. Calendar opens (showing current month)
3. Click month dropdown (e.g., "January")
4. Select different month (e.g., "March")
5. Verify calendar updates to March
6. Click year dropdown (e.g., "2026")
7. Select different year (e.g., "2027")
8. Verify calendar updates to 2027
9. Select date and verify it's in selected month/year

**Expected Result**: ✅ Can navigate to any month/year

---

### Scenario 5: Date Validation
**Objective**: Only future dates are selectable

**Steps**:
1. Click "Availability Date" field
2. Verify past dates are disabled/grayed out (if calendar shows old months)
3. Try to click on a past date
4. Verify it cannot be selected
5. Verify only dates from today forward are selectable

**Expected Result**: ✅ Past dates cannot be selected

---

### Scenario 6: Mobile Responsiveness
**Objective**: Date picker works on mobile devices

**Steps on Desktop**:
1. Open browser DevTools (F12)
2. Click mobile device icon
3. Select iPhone/mobile viewport
4. Navigate to form with availability field
5. Click field - calendar should adapt to mobile
6. Test all interactions:
   - Clicking dates
   - Using quick buttons
   - Clearing selection
7. Verify layout is readable and buttons are clickable

**Expected Result**: ✅ Mobile view is responsive and usable

---

### Scenario 7: Form Submission
**Objective**: Selected date is correctly submitted and stored

**Test 7A: Edit Profile**
1. Navigate to Edit Profile page
2. Select availability date (e.g., "January 20, 2026")
3. Fill other required fields
4. Click "Save Profile"
5. Check browser console/network tab
6. Verify API request includes: `availability: "2026-01-20"`
7. Verify response indicates success
8. Reload page and verify date persists

**Test 7B: Job Preferences**
1. Navigate to Job Preferences page
2. Fill in job preference fields
3. Select availability date
4. Click "Save Profile"
5. Verify API request sends ISO format date
6. Create another preference - verify previous date is not lost

**Test 7C: Candidate Dashboard**
1. Navigate to Candidate Dashboard
2. In profile edit form, select availability date
3. Submit form
4. Verify date saves correctly
5. Reload page - verify date persists

**Expected Result**: ✅ Dates are correctly sent to backend and persisted

---

### Scenario 8: Multiple Page Testing
**Objective**: Date picker works consistently across all pages

**Steps**:
1. Edit Profile Page:
   - Select date → "January 20, 2026"
   - Save → Verify
2. Job Preferences Page:
   - Select date → "February 1, 2026"
   - Save → Verify
3. Candidate Dashboard:
   - Edit profile with date → "March 15, 2026"
   - Save → Verify
4. Navigate between pages
5. Verify each page retains its selected date

**Expected Result**: ✅ Date picker works identically on all pages

---

### Scenario 9: Edge Cases
**Objective**: Component handles edge cases gracefully

**Test 9A: Same Day Selection**
1. Select today's date using [Today] button
2. Verify field shows today
3. Clear selection
4. Select today's date by clicking calendar date 9
5. Verify both methods produce same result

**Test 9B: Year Boundary**
1. Navigate to December 2026
2. Select December 31, 2026
3. Submit form
4. Reload
5. Navigate to January 2027
6. Select January 1, 2027
7. Submit form
8. Verify both dates work across year boundary

**Test 9C: Empty Selection**
1. Don't select any date
2. Submit form
3. Verify backend accepts empty availability
4. Navigate back - field should be empty

**Expected Result**: ✅ All edge cases handled correctly

---

## 📋 Manual Test Cases

### Test Case 1: Visual Inspection
```
□ Calendar opens on click
□ Calendar closes on date selection
□ Selected date highlighted in blue
□ 2-month view on desktop
□ Calendar icon visible
□ Clear button (X) visible when date selected
□ Quick option buttons visible
□ Date formatted as "Month Day, Year"
```

### Test Case 2: Interaction
```
□ Keyboard tab navigation works
□ Click outside closes calendar
□ Quick buttons have hover effect
□ Clear button responds to click
□ Month/year dropdowns functional
□ Arrow keys navigate dates
□ Enter key selects date
```

### Test Case 3: Data Integrity
```
□ Selected date converts to ISO format
□ ISO format is YYYY-MM-DD
□ No time component included
□ Empty selection is allowed
□ Date persists after page reload
□ Date persists in API response
□ Multiple dates don't interfere
```

---

## 🐛 Known Issues & Workarounds

### None Currently Known ✅

If you encounter issues:

1. **Calendar doesn't open**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Check console for errors

2. **Dates not persisting**
   - Verify backend receives `availability` field
   - Check database column exists
   - Verify API endpoint accepts date format

3. **Mobile layout broken**
   - Check CSS media queries loaded
   - Verify viewport meta tag present
   - Test in actual mobile device, not just devtools

4. **TypeScript errors**
   - Verify react-datepicker types installed
   - Check component imports are correct
   - Run `npm install` to update types

---

## 🔍 Debugging Tips

### Check Component Props:
```typescript
// In page component
console.log('Current availability:', formData.availability);
console.log('ISO Format:', new Date(formData.availability).toISOString());
```

### Verify API Call:
```
Network tab → POST/PUT request → Payload
Should show: { ... "availability": "2026-01-15" ... }
```

### Check Database:
```sql
SELECT id, availability FROM candidate LIMIT 5;
-- Should show ISO format: 2026-01-15
```

### Browser Console:
```javascript
// Check if date picker is mounted
document.querySelector('.availability-picker-wrapper')

// Check if value is set
document.querySelector('input.availability-picker-display').value
```

---

## 📊 Test Results Template

```
Date: __________
Tester: __________

Component Installation: [ ] Pass [ ] Fail
Basic Date Selection: [ ] Pass [ ] Fail
Quick Buttons: [ ] Pass [ ] Fail
Clear Selection: [ ] Pass [ ] Fail
Month/Year Navigation: [ ] Pass [ ] Fail
Date Validation: [ ] Pass [ ] Fail
Mobile Responsiveness: [ ] Pass [ ] Fail
Form Submission: [ ] Pass [ ] Fail
Multiple Pages: [ ] Pass [ ] Fail
Edge Cases: [ ] Pass [ ] Fail

Notes:
_____________________________________
_____________________________________
```

---

## ✅ Sign Off

When all tests pass:

**Date Picker Status**: ✅ **APPROVED FOR PRODUCTION**

- [x] All test scenarios passed
- [x] No critical bugs found
- [x] Mobile responsive verified
- [x] Data persists correctly
- [x] No breaking changes
- [x] Documentation complete

---

## 📞 Support

If tests fail, check:

1. **Package installed?**
   ```powershell
   npm list react-datepicker
   ```

2. **Components created?**
   ```
   ✅ AvailabilityDatePicker.tsx
   ✅ AvailabilityDatePicker.css
   ```

3. **Pages updated?**
   ```
   ✅ JobPreferencesPage.tsx
   ✅ EditProfilePage.tsx
   ✅ CandidateDashboard.tsx
   ```

4. **Build passes?**
   ```powershell
   npm run build
   ```

If all checks pass but tests fail, check browser console for specific errors.
