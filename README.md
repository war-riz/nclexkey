# NCLEX Virtual School

A comprehensive platform for NCLEX students, with a **Django REST API backend** and a **Next.js frontend**. The backend handles authentication, course management, messaging, payments, and admin features, while the frontend provides a responsive and interactive user interface.

---

## Table of Contents

* [Features](#features)
* [Project Structure](#project-structure)
* [Quick Start](#quick-start)
* [Environment Configuration](#environment-configuration)
* [API Documentation](#api-documentation)
* [Frontend Setup](#frontend-setup)
* [Authentication](#authentication)
* [Testing](#testing)
* [Contributing](#contributing)
* [License](#license)

---

## Features

### 🔐 Authentication & Security

* JWT access & refresh tokens
* Email verification and password reset
* TOTP-based 2FA
* Login alerts, device detection, account lockout

### 👤 User Management

* Profile CRUD
* Session tracking
* Account deletion scheduling/cancellation

### 📚 Course Management

* Admin course CRUD
* Student course browsing & progress tracking
* Video upload & URL management

### 💬 Messaging

* Direct user-to-user messaging
* Conversation & message history tracking

### 💳 Payments

* Secure payment initiation
* Webhook processing
* Enrollment tracking

### 📧 Email System

* HTML templates
* Cloudinary-hosted media
* Timezone-aware timestamps

---

## Project Structure

### Backend (Django)

```
backend/
├── auth/               # Authentication & JWT management
├── users/              # User profiles & session management
├── courses/            # Course CRUD & progress tracking
├── messaging/          # Messaging system
├── payments/           # Payment gateway integration
├── admin/              # Admin dashboard
├── templates/emails/   # Email templates
├── config/             # Django settings
├── requirements.txt    # Python dependencies
└── manage.py           # Django CLI
```

### Frontend (Next.js)

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Layout wrappers
│   ├── pages/          # Next.js pages
│   ├── routes/         # API routes (client-side)
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   └── styles/         # Tailwind or CSS modules
├── package.json
└── next.config.js
```

---

## Quick Start

### Prerequisites

* Python 3.8+
* Node.js 18+
* PostgreSQL
* Git

---

### Backend Setup

1. **Clone repo and navigate to backend**

```bash
git clone https://github.com/war-riz/nclexkey.git
cd nclexkey/backend
```

2. **Set up virtual environment**

```bash
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

3. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Run migrations**

```bash
python manage.py migrate
```

6. **Create superuser (optional)**

```bash
python manage.py createsuperuser
```

7. **Start backend server**

```bash
python manage.py runserver
```

API available at `http://localhost:8000/`

---

### Frontend Setup

1. **Navigate to frontend**

```bash
cd ../frontend
```

2. **Install Node dependencies**

```bash
npm install
```

3. **Run development server**

```bash
npm run dev
```

Frontend available at `http://localhost:3000/`

4. **Environment variables** (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

---

## API Documentation

**Auth**

* `POST /api/auth/register/`
* `POST /api/auth/login/`
* `POST /api/auth/logout/`
* `POST /api/auth/refresh/`
* `POST /api/auth/verify-email/`
* `POST /api/auth/password-reset/`
* `POST /api/auth/password-reset-confirm/`

**Users**

* `GET /api/users/profile/`
* `PUT /api/users/profile/`
* `GET /api/users/sessions/`
* `DELETE /api/users/account/`

**Courses**

* `GET /api/courses/`
* `GET /api/courses/{id}/`
* `POST /api/courses/` (admin)
* `PUT /api/courses/{id}/` (admin)
* `DELETE /api/courses/{id}/` (admin)

**Messaging**

* `GET /api/messaging/conversations/`
* `POST /api/messaging/send/`
* `GET /api/messaging/messages/{conversation_id}/`

**Payments**

* `POST /api/payments/initiate/`
* `POST /api/payments/webhook/`
* `GET /api/payments/status/{transaction_id}/`

---

## Authentication

Frontend uses JWT to authenticate requests.

```javascript
// Store tokens after login
localStorage.setItem('access_token', data.access_token)
localStorage.setItem('refresh_token', data.refresh_token)

// Make authenticated requests
fetch(`${API_URL}/users/profile/`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }
})
```

---

## Testing

**Backend**

```bash
python manage.py test
# Coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

**Frontend**

```bash
npm run test
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add feature"`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## License

MIT License – see [LICENSE](LICENSE)

---

**NCLEX Virtual School** – Empowering nursing students with digital learning solutions.

---
