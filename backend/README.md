# NCLEX Virtual School – Backend

This is the **Django REST API backend** for the NCLEX Virtual School platform. It provides secure authentication, course management, messaging, payment integration, and administrative features for the frontend application.

---

## Table of Contents

* [Features](#features)
* [Project Structure](#project-structure)
* [Quick Start](#quick-start)
* [Environment Configuration](#environment-configuration)
* [API Documentation](#api-documentation)
* [Authentication](#authentication)
* [Testing](#testing)
* [Development](#development)
* [Contributing](#contributing)
* [License](#license)

---

## Features

### 🔐 Authentication & Security

* JWT access and refresh tokens
* Email verification
* Password reset functionality
* TOTP-based 2FA
* Login alerts and device tracking
* Account lockout and deletion scheduling

### 👤 User Management

* User profile CRUD
* Session tracking
* Account deletion and recovery

### 📚 Course Management

* Full CRUD for courses (admin)
* Student course browsing and progress tracking
* Media support for video lessons and URLs

### 💬 Messaging

* Direct messaging between users
* Conversation tracking
* Message history with timestamps

### 💳 Payment Integration

* Secure payment initiation
* Webhook processing for automatic updates
* Enrollment and payment tracking

### 📧 Email System

* HTML email templates
* Cloudinary-hosted media support
* Timezone-aware timestamps

---

## Project Structure

```
backend/
├── auth/               # Authentication and JWT management
├── users/              # User profiles and session tracking
├── courses/            # Course CRUD and progress tracking
├── messaging/          # Messaging system
├── payments/           # Payment gateway integration
├── admin/              # Admin dashboard functionality
├── templates/emails/   # Email templates
├── config/             # Django settings and configurations
├── requirements.txt    # Python dependencies
└── manage.py           # Django CLI commands
```

---

## Quick Start

### Prerequisites

* Python 3.8+
* PostgreSQL
* Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/war-riz/nclexkey.git
cd nclexkey/backend
```

2. **Create and activate virtual environment**

```bash
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Configuration)
```

5. **Run database migrations**

```bash
python manage.py migrate
```

6. **Create a superuser (optional)**

```bash
python manage.py createsuperuser
```

7. **Start development server**

```bash
python manage.py runserver
```

API available at `http://localhost:8000/`

---

## Environment Configuration

Create a `.env` file in `backend/`:

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
DEFAULT_FROM_EMAIL=NCLEX Virtual School <noreply@nclexschool.com>
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment Gateway
PAYSTACK_SECRET_KEY=your-paystack-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-key
```

---

## API Documentation

**Authentication**

* `POST /api/auth/register/` – Register user
* `POST /api/auth/login/` – Login
* `POST /api/auth/logout/` – Logout
* `POST /api/auth/refresh/` – Refresh JWT
* `POST /api/auth/verify-email/` – Verify email
* `POST /api/auth/password-reset/` – Request password reset
* `POST /api/auth/password-reset-confirm/` – Confirm password reset

**User Management**

* `GET /api/users/profile/` – Get profile
* `PUT /api/users/profile/` – Update profile
* `GET /api/users/sessions/` – List active sessions
* `DELETE /api/users/account/` – Delete account

**Courses**

* `GET /api/courses/` – List courses
* `GET /api/courses/{id}/` – Get course details
* `POST /api/courses/` – Create course (admin)
* `PUT /api/courses/{id}/` – Update course (admin)
* `DELETE /api/courses/{id}/` – Delete course (admin)

**Messaging**

* `GET /api/messaging/conversations/` – List conversations
* `POST /api/messaging/send/` – Send message
* `GET /api/messaging/messages/{conversation_id}/` – Get messages

**Payments**

* `POST /api/payments/initiate/` – Start payment
* `POST /api/payments/webhook/` – Webhook callback
* `GET /api/payments/status/{transaction_id}/` – Payment status

---

## Authentication

The backend uses **JWT**. Example integration:

```python
# Login view returns
{
  "access_token": "...",
  "refresh_token": "..."
}

# Use in frontend
Authorization: Bearer <access_token>
```

---

## Testing

```bash
# Run all tests
python manage.py test

# Run tests for specific app
python manage.py test auth
python manage.py test courses

# With coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

---

## Development

* Follows **PEP 8**
* Use `flake8` and `black` for linting and formatting

```bash
pip install flake8 black
black .
flake8 .
```

* Database management:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py flush  # reset DB (dev only)
```

---

## Contributing

1. Fork repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## License

MIT License – see [LICENSE](LICENSE)

---

**NCLEX Virtual School Backend** – Secure, scalable API for a comprehensive digital nursing school platform.
