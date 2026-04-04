# Registration Desk Staff Creation - Quick Reference

## 🎯 How to Create Registration Desk Staff

### Step-by-Step

1. **Go to Admin Dashboard** → `/admin`

2. **Scroll down** to "Registration Desk Management" section

3. **Click "Create Staff Account"**

4. **Fill in the form:**
   ```
   Full Name:        [Required] E.g., "Rajesh Kumar"
   Email:            [Required] E.g., "rajesh@hospital.com"
   Phone:            [Optional] E.g., "9876543210"
   Password:         [Required] Manual or click "Generate"
   Role:             [Required] "Operator" or "Supervisor"
   Hospital:         [Required] Select from dropdown
   ```

5. **Generate Password** (Optional)
   - Click "Generate" button
   - Get 12-character secure password
   - Click "Copy" to copy to clipboard

6. **Click "Create Staff Account"**

7. **See Success Message** ✅
   ```
   "Operator at City Hospital created successfully"
   ```

---

## 🔓 How Staff Logs In

1. Go to `/registration`
2. Enter email and password
3. Click "Login"
4. Access Registration Desk Dashboard

---

## 📝 Form Fields Explained

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text | Yes | Display name for staff |
| Email | Email | Yes | Login ID (must be unique) |
| Phone | Number | No | 10 digits max |
| Password | Text | Yes | Auto-generate or custom |
| Role | Select | Yes | Operator or Supervisor |
| Hospital | Select | Yes | Which hospital works at |

---

## 🔐 Password Options

### Option A: Auto-Generate
```
1. Click "Generate" button
2. Get 12-char password (e.g., "K7#mPq2@xR9$")
3. Click "Copy" to clipboard
4. Paste to send to staff
```

### Option B: Manual
```
1. Type custom password in field
2. Click "Create Staff Account"
```

---

## 👥 Staff Roles

### Operator
- Register patients
- View own registration history
- Generate tokens
- See today's queue

### Supervisor
- All operator permissions
- Manage operators
- Override registrations
- View audit logs

---

## ⚡ Quick Tips

- ✅ Pre-generate password before giving to staff
- ✅ Copy password to send securely
- ✅ Use "Generate" for strong passwords
- ✅ Hospital field must be selected
- ✅ Email will be login ID (keep simple)
- ✅ Phone field is optional
- ✅ Staff can change password after first login

---

## ❌ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Fill all required fields" | Check all fields are filled + hospital selected |
| "Invalid email" | Use proper email format (name@domain.com) |
| Password not generating | Try again, check internet connection |
| Can't copy password | Try again or manually copy from field |
| Staff can't login | Verify email/password, check hospital assignment |
| Duplicate email error | Use different email address |

---

## 📊 Example Workflow

```
Morning: Create 3 staff for registration desk
├─ Rajesh Kumar (Operator) at City Hospital
├─ Priya Singh (Operator) at City Hospital  
└─ Amit Patel (Supervisor) at City Hospital

Afternoon: Staff registers patients
├─ Patient 1 → Token 001
├─ Patient 2 → Token 002
└─ Patient 3 → Token 003

Queue appears in Admin Dashboard
```

---

## 🎓 Training Checklist for New Staff

After creation, give staff:

- [ ] Email address
- [ ] Password
- [ ] URL: `http://hospital-domain.com/registration`
- [ ] Instructions:
  1. Go to /registration
  2. Login with email + password
  3. Click "New Registration" tab
  4. Fill patient form
  5. Submit → Get token
  6. Print token for patient

---

## 📞 Support

For issues:
1. Check error message in toast
2. Verify all fields filled correctly
3. Confirm hospital selected
4. Check email format
5. Try generating password again

---

## ✅ Verification

After creation, verify:
- Staff account created ✓
- Staff can login at /registration ✓
- Staff can register patients ✓
- Tokens appear in admin queue ✓
- Patient data syncs correctly ✓

---

**Version:** 1.0
**Last Updated:** April 4, 2026
**Status:** ✅ Ready to Use
