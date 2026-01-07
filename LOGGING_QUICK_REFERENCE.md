# Quick Logging Reference Guide

## How to View Logs

### Frontend Logs (Browser Console)
1. Open your browser (Chrome/Edge/Firefox)
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. The app will continuously log user interactions with `[PREFIX]` format
5. Search/Filter logs using Ctrl+F and search for the prefix

### Backend Logs (Terminal/Command Prompt)
1. Backend logs appear in the terminal where you ran `uvicorn app.main:app --reload`
2. You can see all `[PREFIX]` logs in the console output
3. Each endpoint hit will show the request flow with detailed logging

## Log Prefixes for Easy Filtering

### Frontend Prefixes
| Prefix | Location | Purpose |
|--------|----------|---------|
| `[SIGNUP]` | SignUpPage.tsx | User registration flow |
| `[SIGNIN]` | SignInPage.tsx | User login flow |
| `[DASHBOARD]` | CandidateDashboard.tsx | All candidate dashboard actions |

### Backend Prefixes
| Prefix | Endpoint | Purpose |
|--------|----------|---------|
| `[SIGNUP]` | `/auth/signup` | User account creation |
| `[LOGIN]` | `/auth/login` | User authentication |
| `[SEND-OTP]` | `/auth/send-otp` | OTP generation and sending |
| `[VERIFY-OTP]` | `/auth/verify-otp` | OTP verification |
| `[GET-PROFILE]` | `/candidates/me` | Fetch user profile |
| `[UPDATE-PROFILE]` | `/candidates/me` | Update user profile |
| `[ADD-SKILL]` | `/candidates/me/skills` | Add skill to profile |
| `[LIST-SKILLS]` | `/candidates/me/skills` | Fetch all skills |
| `[REMOVE-SKILL]` | `/candidates/me/skills/{id}` | Delete skill |
| `[ADD-CERT]` | `/candidates/me/certifications` | Add certification |
| `[LIST-CERTS]` | `/candidates/me/certifications` | Fetch certifications |
| `[UPLOAD-RESUME]` | `/candidates/me/resumes` | Upload resume file |

## Common Debugging Scenarios

### Scenario 1: "Sign-up is not working"
**Frontend**: 
1. Open Console (F12)
2. Filter for `[SIGNUP]`
3. Watch the flow: Form validation → API call → Response handling → Error display

**Backend**:
1. Check uvicorn console for `[SIGNUP]` logs
2. Look for error messages in logs
3. Example: "User with this email already exists" → validation error

### Scenario 2: "Skills are not saving"
**Frontend**:
1. Filter console for `[DASHBOARD]` and `handleAddSkill`
2. Check if API call was sent successfully
3. Check if data refresh (`fetchAllData`) completed

**Backend**:
1. Look for `[ADD-SKILL]` logs
2. Verify skill_id returned from API
3. Check if database commit was successful

### Scenario 3: "Login fails after signup"
**Frontend**:
1. Check `[SIGNUP]` logs for successful user creation
2. Check `[SIGNIN]` logs for login attempt
3. Look for token storage in localStorage

**Backend**:
1. Check `[SIGNUP]` logs - verify user and candidate created
2. Check `[LOGIN]` logs - verify password validation passes
3. Check token creation success

### Scenario 4: "Resume upload fails"
**Frontend**:
1. Filter for `[DASHBOARD]` and `handleUploadResume`
2. Check if file validation passes
3. Check API response status

**Backend**:
1. Look for `[UPLOAD-RESUME]` logs
2. Check file save path in logs
3. Check database storage success

## Interpreting Log Messages

### Success Log Pattern
```
[PREFIX] Action started - initial state
[PREFIX] Processing - intermediate steps
[PREFIX] Successfully completed - final state
```

### Error Log Pattern
```
[PREFIX] Error description with details
[PREFIX] Error occurred: {specific error message}
```

### Data Flow Pattern
```
[PREFIX] User action triggered
[PREFIX] Validation checks
[PREFIX] API request sent with data
[PREFIX] API response received with status
[PREFIX] Data processing/transformation
[PREFIX] State updates and refresh
```

## Example Log Sequences

### Complete Sign-Up Flow
```
Frontend [SIGNUP]: Form submitted - email: user@example.com, type: candidate
Frontend [SIGNUP]: Password validation passed
Frontend [SIGNUP]: Sending API request
Frontend [SIGNUP]: API response received - status 200
Frontend [SIGNUP]: User created successfully - redirecting to sign-in

Backend [SIGNUP]: Starting signup for email: user@example.com, type: candidate
Backend [SIGNUP]: Creating user account for user@example.com
Backend [SIGNUP]: User created with ID: 5
Backend [SIGNUP]: Creating candidate profile for user 5
Backend [SIGNUP]: Candidate profile created for 5
```

### Complete Skill Addition Flow
```
Frontend [DASHBOARD]: Add skill button clicked - skill: Python, category: technical
Frontend [DASHBOARD]: Sending skill add request
Frontend [DASHBOARD]: Skill Python added successfully
Frontend [DASHBOARD]: Refreshing dashboard data after skill addition
Frontend [DASHBOARD]: fetchAllData - Starting data load
Frontend [DASHBOARD]: fetchAllData - Data load completed successfully

Backend [ADD-SKILL]: Adding skill for user_id: 5, skill: Python, category: technical
Backend [ADD-SKILL]: Skill added successfully: skill_id=12, name=Python, category=technical
```

## Performance Tips

1. **Filter logs during development** to reduce console noise
2. **Look for timing** between request and response logs
3. **Check for duplicate logs** - indicates multiple state updates
4. **Watch API response counts** in fetchAllData - 8 concurrent calls should all succeed

## Production Considerations

To save logs to a file for production debugging:

### Backend (main.py)
```python
import logging.handlers

handler = logging.handlers.RotatingFileHandler(
    'app.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)
logging.basicConfig(
    level=logging.INFO,
    handlers=[handler, logging.StreamHandler()]
)
```

This creates rotating log files that don't grow unbounded.
