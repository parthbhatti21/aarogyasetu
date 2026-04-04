# Registration Desk Staff Management - Visual Guide

## Admin Dashboard Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ADMIN DASHBOARD                                         ┃
┃  Welcome back, Admin · Live data · April 4, 2026      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

STAT CARDS
┌────────────────┬────────────────┬────────────────┬────────────────┐
│  👥 Total      │  ⏱️  Avg Wait  │  ✅ Completed  │  🏥 Hospitals  │
│  Patients      │  Time          │  Today         │  Active        │
│  1,234         │  12 min        │  567           │  5             │
└────────────────┴────────────────┴────────────────┴────────────────┘

┌──────────────────────────────────┬──────────────────────────────────┐
│  👨‍⚕️ DOCTOR MANAGEMENT            │  📋 REGISTRATION DESK MANAGEMENT │
├──────────────────────────────────┼──────────────────────────────────┤
│  [Create Doctor]                 │  [Create Staff Account]          │
│                                  │                                  │
│  Show Form / Empty Message       │  Show Form / Empty Message       │
└──────────────────────────────────┴──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  👨‍⚕️ Doctor-wise patients handled (completed today)             │
├──────────────────────────────────────────────────────────────────┤
│  Doctor Name              │ Completed │ Avg Time  │ Status        │
├──────────────────────────────────────────────────────────────────┤
│  Dr. Sharma, Cardiologist │ 12        │ 15 min    │ Active        │
│  Dr. Patel, Neurologist   │ 8         │ 18 min    │ Active        │
│  Dr. Kumar, Orthopedic    │ 10        │ 12 min    │ Active        │
└──────────────────────────────────────────────────────────────────┘
```

## Staff Creation Form

### Collapsed State
```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Registration Desk Management                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Click "Create Staff Account" to add registration desk staff   │
│                                      [Create Staff Account] ──┐  │
│                                                              │  │
└──────────────────────────────────────────────────────────────────┘
```

### Expanded State
```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Registration Desk Management            [Cancel]             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Full Name *                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Rajesh Kumar                                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Email *                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ rajesh@hospital.com                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Phone (Optional)                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 9876543210                                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Password *                                                     │
│  ┌────────────────────────────────────────┐ [Generate] Button  │
│  │ ••••••••••••                       👁️  │                   │
│  └────────────────────────────────────────┘                    │
│                                                                  │
│  ┌────────────────────────────────────────┐                    │
│  │ K7#mPq2@xR9$                       📋   │ ← Copy Button     │
│  └────────────────────────────────────────┘                    │
│                                                                  │
│  Role *                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ▼ Operator                                                │ │
│  │ ├─ Operator                                               │ │
│  │ └─ Supervisor                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Hospital Selection * (Search hospitals...)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ▼ City Hospital                                            │ │
│  │ ├─ City Hospital                                           │ │
│  │ ├─ Rural Hospital                                          │ │
│  │ └─ Teaching Hospital                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│           [Create Staff Account]  (Full width button)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Form Field Reference

| Field | Type | Required | Validation | Example |
|-------|------|----------|-----------|---------|
| Full Name | Text | ✓ | Non-empty | "Rajesh Kumar" |
| Email | Email | ✓ | Valid email format | "rajesh@hospital.com" |
| Phone | Tel | ✗ | Max 10 digits, numeric | "9876543210" |
| Password | Password | ✓ | Min 6 chars | "K7#mPq2@xR9$" |
| Role | Select | ✓ | Operator/Supervisor | "Operator" |
| Hospital | Select | ✓ | From hospital list | "City Hospital" |

## Password Generation Flow

```
Initial State
    │
    ├─ Password field empty
    ├─ "Generate" button available
    └─ Copy button hidden
            │
            ▼
    Click "Generate"
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
 Success        Error
    │
    ├─ Password appears (12 chars)
    ├─ Password shown as dots
    ├─ Eye icon visible (toggle show/hide)
    ├─ Copy button appears
    └─ Toast: "Password Generated"
            │
            ├─ Admin can copy
            │  └─ Toast: "Copied!"
            │
            ├─ Admin can show password
            │  └─ Password visible
            │
            └─ Admin can create account
               └─ Account created successfully
```

## Password Visibility States

### Hidden (Default)
```
Password *
┌────────────────────────────────────────┐ [Generate] Button
│ ••••••••••••                       👁️  │
└────────────────────────────────────────┘

└─ Text is masked
└─ Eye icon open (click to show)
```

### Visible
```
Password *
┌────────────────────────────────────────┐ [Generate] Button
│ K7#mPq2@xR9$                      👁️x │
└────────────────────────────────────────┘

└─ Text is shown
└─ Eye icon crossed (click to hide)
```

### With Copy Button
```
Password shown
┌────────────────────────────────────────┐
│ K7#mPq2@xR9$                       📋  │
└────────────────────────────────────────┘
         ▲
         └─ Copy button appears when password is set
```

## Role Selection Dropdown

```
Role *
┌────────────────────────────────────────┐
│ ▼ Operator                            │ ← Default
└────────────────────────────────────────┘

Click to expand:
┌────────────────────────────────────────┐
│ ▼ Operator                            │
│ ├─ ✓ Operator                          │
│ └─   Supervisor                        │
└────────────────────────────────────────┘
```

## Hospital Selector

```
Hospital Selection * (Search hospitals...)
┌────────────────────────────────────────┐
│ ▼ City Hospital                        │ ← Selected
└────────────────────────────────────────┘

Click to expand:
┌────────────────────────────────────────┐
│ Search...                              │
├────────────────────────────────────────┤
│ ✓ City Hospital                        │
│   Rural Hospital                       │
│   Teaching Hospital                    │
│   Metro Hospital                       │
│   District Hospital                    │
└────────────────────────────────────────┘
```

## Success Flow

```
Create Button Clicked
    │
    ▼
Form Validation
    │
    ├─ ❌ Invalid? Show error
    │
    └─ ✅ Valid
        │
        ▼
    Loading State
    │ Button: "Creating..." with spinner
    │
    ▼
Account Created
    │
    ├─ ✅ Toast: "Operator at City Hospital created successfully"
    ├─ Form Reset
    ├─ Button Back to Normal
    └─ Ready for Next Entry
```

## Error States

### Missing Fields
```
Toast: ⚠️ "Fill all required fields"
Action: Highlight empty fields
```

### Invalid Email
```
Toast: ⚠️ "Invalid email format"
Action: Show error indicator on email field
```

### No Hospital Selected
```
Button: Disabled (grayed out)
Hover: "Select hospital to continue"
```

### Creation Failed
```
Toast: ⚠️ "Failed to create account"
Details: Server error message
Action: Try again or contact support
```

## Integration Points

```
Admin Dashboard
    │
    ├─ State Management (useState)
    │  ├─ staffName, staffEmail, staffPassword
    │  ├─ staffRole, staffHospital
    │  ├─ showCreateStaff, showStaffPassword
    │  └─ creatingStaff
    │
    ├─ Event Handlers
    │  ├─ handleCreateRegistrationStaff()
    │  ├─ handleGenerateStaffPassword()
    │  └─ handleCopyStaffPassword()
    │
    ├─ Services
    │  ├─ createRegistrationStaff() from registrationStaffService
    │  └─ generateTemporaryPassword() from registrationStaffService
    │
    ├─ Components
    │  ├─ Input, Label, Button (UI components)
    │  └─ InlineHospitalSelector (hospital picker)
    │
    └─ Supabase
       ├─ Auth (signUpWithPassword)
       └─ Database (registration_staff_profiles table)
```

## User Journey

```
┌─────────────┐
│ Admin Login │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Admin Dashboard          │
│ (see doctor management)  │
└──────┬───────────────────┘
       │ Scroll down
       ▼
┌──────────────────────────────┐
│ Registration Desk Management │
└──────┬───────────────────────┘
       │ Click "Create Staff Account"
       ▼
┌──────────────────────────────┐
│ Staff Creation Form          │
│ ├─ Fill Name                 │
│ ├─ Fill Email                │
│ ├─ Fill Phone (optional)     │
│ ├─ Generate/Enter Password   │
│ ├─ Select Role               │
│ └─ Select Hospital           │
└──────┬───────────────────────┘
       │ Click "Create Staff Account"
       ▼
┌──────────────────────────────┐
│ ✅ Success Toast             │
│ Staff Account Created        │
└──────┬───────────────────────┘
       │ Send credentials to staff
       ▼
┌──────────────────────────────┐
│ Staff Goes to /registration  │
│ Logs in with email + password│
│ Accesses Registration Desk   │
└──────────────────────────────┘
```

---

**Version:** 1.0
**Last Updated:** April 4, 2026
**Status:** ✅ Complete
