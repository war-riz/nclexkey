# NCLEX Virtual School – Frontend

This is the **Next.js frontend** for the NCLEX Virtual School platform. It connects to a Django REST API backend to provide interactive UI for students, instructors, and administrators.

---

## Table of Contents

* [Features](#features)
* [Project Structure](#project-structure)
* [Quick Start](#quick-start)
* [Environment Configuration](#environment-configuration)
* [Frontend Routing](#frontend-routing)
* [Authentication](#authentication)
* [Development](#development)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* Responsive UI for desktop and mobile
* Student dashboard for courses, progress tracking, and messaging
* Admin dashboard for course and user management
* Authentication with JWT (login, registration, logout)
* Password reset flows integrated with backend
* Payment integration interfaces
* Dynamic course listings and lesson previews
* Custom reusable components using TailwindCSS
* Optional PWA support for offline usage

---

## Project Structure

```
frontend/
├── public/             # Static assets (images, fonts)
├── src/
│   ├── components/     # Reusable UI components (buttons, forms, modals)
│   ├── layouts/        # Layout wrappers (dashboard, landing page)
│   ├── pages/          # Next.js pages (routes)
│   ├── routes/         # API request functions and endpoints
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React Context providers
│   └── styles/         # TailwindCSS or CSS modules
├── package.json
├── tsconfig.json       # TypeScript configuration
├── next.config.js
└── README.md
```

---

## Quick Start

### Prerequisites

* Node.js 18+
* npm or yarn
* Backend API running (Django REST API)

---

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/war-riz/nclexkey.git
cd nclexkey/frontend
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
   Create `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

4. **Run development server**

```bash
npm run dev
# or
yarn dev
```

Frontend available at `http://localhost:3000/`

---

## Frontend Routing

* `/` – Landing page
* `/auth/login` – Login page
* `/auth/register` – Registration page
* `/dashboard` – Student/Instructor dashboard
* `/courses` – Course listing
* `/courses/[id]` – Course detail
* `/messages` – Messaging interface
* `/admin` – Admin dashboard (role-based access)

---

## Authentication

Frontend communicates with the backend via JWT.

```javascript
// Example: login and store token
const login = async (email, password) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  return data;
};

// Making authenticated requests
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

---

## Development

### Code Style

* TailwindCSS for styling
* TypeScript for type safety
* Optional ESLint & Prettier

```bash
npm install eslint prettier -D
npx eslint --fix .
```

### Running Tests

```bash
npm run test
# or
yarn test
```

### Building for Production

```bash
npm run build
npm start
```

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License – see [LICENSE](../LICENSE)

---

**NCLEX Virtual School Frontend** – Interactive, responsive, and student-friendly UI for nursing exam preparation.

---
