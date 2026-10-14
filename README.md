# Campus Election Polling Desk

An institutional, real-time voter turnout and attendance registration system designed for university campus elections. Features multi-device synchronization across polling officers' devices, role-based access control, and hybrid offline/cloud database persistence.

---

## Key Features

- **Live Voter Roll**: Fast lookup and attendance marking across 490+ registered voters across multiple departments.
- **Multi-Device Real-Time Sync**: Instant WebSocket synchronization between polling desk laptops and mobile phones.
- **Hybrid Data Architecture**: Instant in-memory cache backed by local storage with seamless asynchronous PostgreSQL (Neon) cloud synchronization.
- **Institutional Role-Based Access Control (RBAC)**:
  - **Chief Election Officer (Admin)**: Full control, voter management, account administration, database synchronization.
  - **Polling Agent / Officer (Editor)**: Ballot verification and attendance check-in.
  - **Election Observer (Viewer)**: Read-only live turnout analytics and voter register browsing.
- **Cryptographic Security**: PBKDF2 password hashing with unique salts, signed session tokens, and zero client-exposed credentials.
- **Turnout Analytics**: Live metrics, hostel vs. day-scholar breakdown, department-level statistics, and voter roll export.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, WebSockets (`ws`), PBKDF2 Cryptography
- **Database**: PostgreSQL (Neon Cloud Serverless) + Local Hybrid Store

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/YOUR_USERNAME/campus-election-desk.git
cd campus-election-desk
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
PORT=3001
JWT_SECRET="your_secure_random_jwt_secret"
ADMIN_INIT_PASS="your_admin_password"
AGENT_INIT_PASS="your_agent_password"
VIEWER_INIT_PASS="your_viewer_password"
```

### 3. Running Locally

Start the backend sync server:
```bash
npm run server
```

Start the frontend application:
```bash
npm run dev
```

---

## Deployment

### Frontend (Vercel)
1. Push this repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Deploy!

### Multi-Device Sync Server (Render / Railway)
1. Deploy as a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set Build Command to `npm install` and Start Command to `node server.js`.
3. Add your `DATABASE_URL` and `JWT_SECRET` in the Environment Variables dashboard.
