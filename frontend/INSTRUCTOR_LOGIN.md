# Instructor Login System

## Overview
This system is designed for student registration only. Instructors access the system through a default login system.

## Student Registration
- **Path**: `/register`
- **Requirement**: Payment before registration
- **Role**: Automatically set to "student"
- **Features**: Course selection, payment processing, account creation

## Instructor Access
- **Path**: `/login` (then redirected to `/admin`)
- **Default Credentials**:
  - Email: `instructor@nclexprep.com`
  - Password: `instructor123`
- **Dashboard**: `/admin` - Full instructor/admin dashboard
- **Features**: Course management, student monitoring, analytics

## Security Notes
⚠️ **Important**: The default instructor credentials are for demonstration purposes only.

In production:
1. Change default passwords immediately
2. Use secure authentication methods
3. Implement proper user management
4. Store credentials securely
5. Enable 2FA for instructor accounts

## How It Works
1. Students register at `/register` with payment
2. Instructors login at `/login` with default credentials
3. Instructors are redirected to `/admin` dashboard
4. Students are redirected to `/dashboard` after login

## File Structure
- `frontend/app/register/` - Student registration only
- `frontend/app/login/` - Login for both students and instructors
- `frontend/app/admin/` - Instructor dashboard
- `frontend/app/dashboard/` - Student dashboard
- `frontend/lib/instructor-credentials.js` - Default credentials (remove in production)
