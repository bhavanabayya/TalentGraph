# General Information Section - Testing Guide

## Pre-Testing Checklist

### Backend Setup
- [ ] Python environment activated
- [ ] Requirements installed: `pip install -r requirements.txt`
- [ ] Database backed up or ready to recreate
- [ ] Backend running: `uvicorn app.main:app --reload`

### Frontend Setup
- [ ] Node modules installed: `npm install`
- [ ] React frontend running: `npm start`
- [ ] API_BASE correctly set to `http://127.0.0.1:8000`

### Accounts Ready
- [ ] Test account 1: Email for new user (e.g., newuser@test.com)
- [ ] Test account 2: Existing user with data (or use after test 1)
- [ ] Clear browser cache/localStorage before starting

---

## Test Case 1: New User Full Journey

### Test 1.1 - Sign Up
**Precondition:** User not registered
**Steps:**
1. Navigate to `http://localhost:3000/signup`
2. Enter email: `newuser@test.com`
3. Enter password: `TestPass123!`
4. Select user type: Candidate
5. Click "Sign Up"

**Expected Results:**
- ✓ Account created successfully
- ✓ Redirected to sign-in page
- ✓ No errors shown

---

### Test 1.2 - Sign In (New User)
**Precondition:** User just signed up
**Steps:**
1. Enter email: `newuser@test.com`
2. Enter password: `TestPass123!`
3. Click "Sign In"
4. Wait for page to load

**Expected Results:**
- ✓ Login successful
- ✓ Backend checks `is_general_info_complete` (should be false)
- ✓ Frontend redirects to `/general-info`
- ✓ Welcome message displays

**What You Should See:**
```
┌─────────────────────────────────┐
│  Welcome to Your Profile!       │
│                                 │
│  Let's start by setting up...   │
│                                 │
│  [Setup General Information]    │
└─────────────────────────────────┘
```

---

### Test 1.3 - Click Setup Button
**Precondition:** On GeneralInfoPage welcome view
**Steps:**
1. Click "Setup General Information" button
2. Wait for page to load

**Expected Results:**
- ✓ Redirected to `/edit-general-info`
- ✓ Form displays with empty fields
- ✓ Header shows "Edit General Information"
- ✓ All 5 fields visible:
  - Full Name *
  - Email Address *
  - Phone Number *
  - Residential Address
  - Current Location

---

### Test 1.4 - Form Validation (Missing Required Field)
**Precondition:** On EditGeneralInfoPage form
**Steps:**
1. Leave "Full Name" empty
2. Fill "Email Address": `john@example.com`
3. Fill "Phone Number": `(555) 123-4567`
4. Click "Save Information"

**Expected Results:**
- ✗ Form NOT submitted
- ✓ Error message: "Please enter your full name"
- ✓ Still on edit form page

---

### Test 1.5 - Fill Form Correctly
**Precondition:** On EditGeneralInfoPage form
**Steps:**
1. Fill "Full Name": `John Doe`
2. Fill "Email Address": `john.doe@example.com`
3. Fill "Phone Number": `(555) 123-4567`
4. Fill "Residential Address": `123 Main Street, San Francisco, CA 94102`
5. Fill "Current Location": `San Francisco, CA`
6. Click "Save Information"
7. Wait for save to complete

**Expected Results:**
- ✓ All fields accepted
- ✓ Button shows "Saving..."
- ✓ Success alert: "General information saved successfully!"
- ✓ Redirected to `/candidate-dashboard`
- ✓ No errors

---

### Test 1.6 - Verify Data Saved
**Precondition:** Successfully saved general info, now on dashboard
**Steps:**
1. Click "General Information" tab
2. Observe the dashboard view

**Expected Results:**
- ✓ Tab appears first in menu
- ✓ Dashboard shows saved data:
  - Full Name: John Doe
  - Email Address: john.doe@example.com
  - Phone Number: (555) 123-4567
  - Residential Address: 123 Main Street...
  - Current Location: San Francisco, CA
- ✓ "✎ Edit Details" button available
- ✓ "Continue to Profile Dashboard" button available

---

### Test 1.7 - Sign Out & Sign Back In
**Precondition:** Data saved, viewing dashboard
**Steps:**
1. Click "Logout" button
2. Confirm logout
3. Navigate to `/signin`
4. Sign in with same credentials:
   - Email: `newuser@test.com`
   - Password: `TestPass123!`
5. Wait for redirect

**Expected Results:**
- ✓ Successfully logged out
- ✓ Successfully logged back in
- ✓ **Directly redirected to `/candidate-dashboard`** (NOT to `/general-info`)
- ✓ "General Information" tab visible
- ✓ Data still intact

**Why?** Because `is_general_info_complete` is now true, so system skips general-info page.

---

## Test Case 2: Existing User (Data Update)

### Test 2.1 - Access General Information Tab
**Precondition:** Logged in as existing user with general info complete
**Steps:**
1. View candidate dashboard
2. Click "General Information" tab
3. Observe current data

**Expected Results:**
- ✓ Tab appears in menu
- ✓ Dashboard view shows current saved data
- ✓ Data displays correctly in 2-column grid (name, email, phone, location)
- ✓ Full address shows on full width

---

### Test 2.2 - Edit Information
**Precondition:** Viewing General Information dashboard
**Steps:**
1. Click "✎ Edit Details" button
2. Wait for form to load
3. Change "Full Name" to: `Jane Smith`
4. Change "Current Location" to: `New York, NY`
5. Leave other fields as-is
6. Click "Save Information"

**Expected Results:**
- ✓ Form loads with current data populated
- ✓ Fields can be edited
- ✓ Save button works
- ✓ Success message shown
- ✓ Redirected back to `/general-info` (not dashboard)
- ✓ Changes reflected in view:
  - Full Name: Jane Smith
  - Current Location: New York, NY
  - Other fields unchanged

---

### Test 2.3 - Verify Dashboard Integration
**Precondition:** Updated general info, back on general info page
**Steps:**
1. Click "Continue to Profile Dashboard →" button
2. Click "General Information" tab again
3. Verify updated data

**Expected Results:**
- ✓ Successfully navigates to main dashboard
- ✓ General Information tab shows updated data
- ✓ Can switch between tabs without data loss

---

## Test Case 3: Edge Cases

### Test 3.1 - Special Characters in Name
**Precondition:** On edit form
**Steps:**
1. Fill "Full Name": `O'Brien-Smith, Jr.`
2. Fill required fields
3. Save

**Expected Results:**
- ✓ Accepts special characters
- ✓ Data saved and displayed correctly

---

### Test 3.2 - International Phone Number
**Precondition:** On edit form
**Steps:**
1. Fill "Phone Number": `+44 20 7946 0958`
2. Fill other required fields
3. Save

**Expected Results:**
- ✓ Accepts international format
- ✓ No validation errors
- ✓ Stored and displayed as-is

---

### Test 3.3 - Long Address
**Precondition:** On edit form
**Steps:**
1. Fill "Residential Address": `123 Main Street, Suite 456, Building A, San Francisco, CA 94102, United States of America`
2. Fill other required fields
3. Save

**Expected Results:**
- ✓ Accepts long text
- ✓ Textarea expands if needed
- ✓ Full text saved and displayed

---

### Test 3.4 - Cancel Edit
**Precondition:** On edit form with changes
**Steps:**
1. Fill in some fields
2. Click "Cancel" button

**Expected Results:**
- ✓ Changes NOT saved
- ✓ Redirected to `/general-info`
- ✓ Data unchanged

---

### Test 3.5 - Empty Optional Fields
**Precondition:** On edit form
**Steps:**
1. Fill required fields (name, email, phone)
2. Leave optional fields (address, location) empty
3. Save

**Expected Results:**
- ✓ Saves successfully
- ✓ Optional fields shown as "—" on dashboard
- ✓ No error messages

---

## Test Case 4: API Level Testing

### Test 4.1 - GET /candidates/me
**Using:** Postman or curl
**Headers:** `Authorization: Bearer <your_token>`
**Method:** GET
**URL:** `http://localhost:8000/candidates/me`

**Expected Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  "residential_address": "123 Main Street...",
  "location": "San Francisco, CA",
  "is_general_info_complete": true,
  "user_id": 1,
  ...
}
```

---

### Test 4.2 - PUT /candidates/me
**Using:** Postman or curl
**Headers:** 
```
Authorization: Bearer <your_token>
Content-Type: application/json
```
**Method:** PUT
**URL:** `http://localhost:8000/candidates/me`
**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "(555) 987-6543",
  "residential_address": "456 Oak Ave",
  "location": "New York, NY",
  "is_general_info_complete": true
}
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "(555) 987-6543",
  "residential_address": "456 Oak Ave",
  "location": "New York, NY",
  "is_general_info_complete": true,
  ...
}
```

---

### Test 4.3 - GET /candidates/me/general-info-status
**Using:** Postman or curl
**Headers:** `Authorization: Bearer <your_token>`
**Method:** GET
**URL:** `http://localhost:8000/candidates/me/general-info-status`

**Expected Response (New User):**
```json
{
  "is_general_info_complete": false,
  "has_required_fields": false,
  "candidate_id": 1
}
```

**Expected Response (Completed User):**
```json
{
  "is_general_info_complete": true,
  "has_required_fields": true,
  "candidate_id": 1
}
```

---

## Test Case 5: Responsive Design

### Test 5.1 - Desktop View (1920px)
**Steps:**
1. Open Chrome DevTools
2. Set viewport to 1920x1080
3. Navigate to `/general-info`
4. Navigate to `/edit-general-info`

**Expected Results:**
- ✓ 2-column grid displays correctly
- ✓ All fields have proper spacing
- ✓ Buttons aligned horizontally with good spacing
- ✓ Text readable, no overflow

---

### Test 5.2 - Tablet View (768px)
**Steps:**
1. Open Chrome DevTools
2. Set viewport to 768x1024
3. Navigate to `/edit-general-info`

**Expected Results:**
- ✓ Layout adjusts appropriately
- ✓ Single column for address field
- ✓ Buttons stack or adjust spacing
- ✓ Form remains usable

---

### Test 5.3 - Mobile View (375px)
**Steps:**
1. Open Chrome DevTools
2. Set viewport to 375x667 (iPhone SE)
3. Navigate to `/edit-general-info`

**Expected Results:**
- ✓ All fields stack in single column
- ✓ Text readable without zoom
- ✓ Buttons full width or stacked
- ✓ Form inputs properly sized
- ✓ No horizontal scroll

---

## Test Case 6: Browser Compatibility

### Test 6.1 - Chrome/Edge
**Steps:**
1. Complete all test cases in Chrome
2. Repeat in Edge

**Expected Results:**
- ✓ All tests pass
- ✓ No console errors
- ✓ Styling renders correctly

---

### Test 6.2 - Firefox
**Steps:**
1. Complete core test cases in Firefox

**Expected Results:**
- ✓ Form submission works
- ✓ Styling displays correctly
- ✓ Navigation works

---

## Test Case 7: Performance

### Test 7.1 - Form Load Time
**Steps:**
1. Open Chrome DevTools → Network tab
2. Navigate to `/edit-general-info`
3. Observe load time

**Expected Results:**
- ✓ Page loads in < 2 seconds
- ✓ No resource loading errors
- ✓ Smooth interaction

---

### Test 7.2 - Save Speed
**Steps:**
1. Fill form with complete data
2. Click save
3. Measure time from click to redirect

**Expected Results:**
- ✓ Save completes in < 1 second
- ✓ User sees feedback (button shows "Saving...")
- ✓ Success message displays

---

## Regression Tests (After Any Changes)

### Core Flows
- [ ] New user sign-in → general info flow
- [ ] Existing user sign-in → dashboard direct
- [ ] Edit general info from dashboard
- [ ] Sign out and back in
- [ ] All form validations
- [ ] API endpoints return correct data

### Related Features
- [ ] Profile dashboard still works
- [ ] Other tabs still accessible
- [ ] Candidate skills section works
- [ ] Certifications section works
- [ ] Resumes section works

---

## Known Issues / Workarounds

### Issue 1: Data not updating after save
**Symptom:** Save says successful but data doesn't change
**Cause:** Browser cache
**Fix:** Clear browser cache or do hard refresh (Ctrl+Shift+R)

### Issue 2: Form fields empty when editing
**Symptom:** Edit form shows blank fields
**Cause:** API call failed
**Fix:** Check network tab in DevTools, check API server running

### Issue 3: Always redirects to general-info
**Symptom:** Even existing users see general-info page
**Cause:** is_general_info_complete not set correctly
**Fix:** Run SQL: `UPDATE candidate SET is_general_info_complete = true WHERE email IS NOT NULL`

---

## Test Report Template

```
DATE: [Date]
TESTER: [Name]
BROWSER: [Chrome/Firefox/Safari]
VERSION: [OS & Browser Version]

TEST CASE: [Test Case Number]
STATUS: [PASS/FAIL]
NOTES: [Any observations]

OVERALL STATUS: [PASS/FAIL]
BLOCKERS: [Any issues preventing completion]
```

---

## Checklist for Production Deployment

- [ ] All test cases pass
- [ ] No console errors
- [ ] Database migration successful
- [ ] API endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] Sign-in redirects work correctly
- [ ] Form validation works
- [ ] Data persists after refresh
- [ ] Responsive design verified
- [ ] No performance issues
- [ ] Error messages clear and helpful
- [ ] Logout works correctly
- [ ] Back button doesn't break flow
