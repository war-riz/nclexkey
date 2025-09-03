# Simplified NCLEX Virtual School System

## Overview
This is a simplified learning management system with only two user types:
- **Students** - Register through the frontend and take courses
- **Instructors** - Created in the backend and manage courses

## Key Changes Made

### 1. Removed Platform Admin
- No superadmin role or complex platform management
- No revenue sharing or platform fees
- Payments go directly to Paystack/Flutterwave accounts

### 2. Simplified User Model
- Only `instructor` and `student` roles
- Instructors are auto-verified (no email verification needed)
- Students need email verification after registration

### 3. Simplified Payment System
- No platform revenue tracking
- No instructor payout management
- Payments go directly to payment gateways
- Simple payment status tracking only

## How to Use

### Creating Instructor Accounts
Instructors are created in the backend using Django management commands:

```bash
cd backend
python manage.py create_instructor instructor@example.com password123 "John" "Doe"
```

This creates an instructor account that can:
- Login at `/admin` route
- Create and manage courses
- Upload videos and content
- View student enrollments

### Student Registration
Students register through the frontend at `/register`:
- Fill out registration form
- Receive verification email
- Login and access courses

### Payment Flow
1. Student selects course and payment method
2. Payment is processed through Paystack/Flutterwave
3. Money goes directly to the payment gateway account
4. System tracks payment status for enrollment

## File Structure

### Backend
```
backend/
├── users/
│   ├── models.py          # Simplified User model
│   ├── auth_views.py      # Basic auth (login/register)
│   └── management/
│       └── commands/
│           └── create_instructor.py  # Create instructor accounts
├── payments/
│   └── models.py          # Simplified payment tracking
└── courses/
    └── models.py          # Course management
```

### Frontend
```
frontend/app/
├── dashboard/             # Student dashboard
├── admin/                 # Instructor dashboard
├── login/                 # Student login
├── register/              # Student registration
└── courses/               # Course browsing
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Student login
- `POST /api/auth/instructor/login` - Instructor login
- `POST /api/auth/logout` - Logout

### User Management
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile/update` - Update profile

### Courses
- `GET /api/courses/` - List all courses
- `POST /api/courses/` - Create course (instructor only)
- `GET /api/courses/{id}/` - Get course details

### Payments
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/status/{reference}` - Check payment status

## Database Migrations
After making changes, run:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Testing the System

### 1. Create Instructor Account
```bash
python manage.py create_instructor admin@school.com admin123 "Admin" "User"
```

### 2. Start Backend
```bash
python manage.py runserver
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Test Flows
- Instructor login at `/admin`
- Student registration at `/register`
- Course creation by instructor
- Course enrollment by student
- Payment processing

## Benefits of Simplified System

1. **Easier Maintenance** - Less complex code to manage
2. **Faster Development** - Focus on core features
3. **Better Performance** - Fewer database queries and calculations
4. **Easier Debugging** - Simpler logic flow
5. **Direct Payment Control** - Money goes directly to your accounts

## Future Enhancements
When you're ready to add more features:
- Email verification system
- Course reviews and ratings
- Student progress tracking
- Advanced analytics
- Multi-language support

## Support
For any issues or questions about the simplified system, check the logs and ensure all migrations are applied correctly.


