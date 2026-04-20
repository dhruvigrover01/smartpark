# 🅿️ SmartPark — Full-Stack React + Node.js

Smart city parking platform with live OpenStreetMap data, real authentication, and a full REST API backend.

---

## 📁 Project Structure

```
smartpark/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── controllers/      # Auth, Parking, Booking logic
│   │   ├── middleware/auth.js # JWT protect + signToken
│   │   ├── models/           # User, Parking, Booking (Mongoose)
│   │   └── routes/           # auth, parking, bookings, users
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React 18 + Vite
│   ├── src/
│   │   ├── api/index.js      # Axios client with JWT interceptors
│   │   ├── components/       # Navbar, AuthModal, ParkingCard, DetailDrawer, BookingModal
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── pages/            # Home, Map, Features, ListSpace, MyPlaces
│   │   ├── utils/index.js    # haversine, getTier, geocode, fetchOSMParking, osmToSpot
│   │   └── styles/globals.css
│   ├── .env.example
│   └── package.json
│
└── package.json              # Root: run both with one command
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
# From the smartpark/ root:
npm install
npm run install:all
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartpark
JWT_SECRET=change_this_to_a_long_random_string
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:5173
```

### 3. Configure the frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) — just paste the connection string into MONGO_URI
```

### 5. Run both servers

```bash
# From the smartpark/ root:
npm run dev
```

- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:5173

---

## 🔑 Google Sign-In Setup (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create an **OAuth 2.0 Client ID** (Web Application)
4. Add `http://localhost:5173` to **Authorized JavaScript Origins**
5. Copy the Client ID into both `.env` files

> Without a Google Client ID, email/password registration still works fully.

---

## 📡 API Endpoints

### Auth
| Method | Route              | Auth     | Description          |
|--------|--------------------|----------|----------------------|
| POST   | `/api/auth/register` | —        | Email registration   |
| POST   | `/api/auth/login`    | —        | Email login          |
| POST   | `/api/auth/google`   | —        | Google ID token auth |
| GET    | `/api/auth/me`       | JWT      | Get current user     |

### Parking
| Method | Route                    | Auth         | Description             |
|--------|--------------------------|--------------|-------------------------|
| GET    | `/api/parking`           | —            | Nearby spots (geospatial) |
| GET    | `/api/parking/:id`       | —            | Get single spot         |
| POST   | `/api/parking`           | owner/admin  | Create listing          |
| PUT    | `/api/parking/:id`       | owner/admin  | Update listing          |
| DELETE | `/api/parking/:id`       | owner/admin  | Remove listing          |
| GET    | `/api/parking/mine`      | JWT          | My listings             |
| PATCH  | `/api/parking/:id/verify`| admin        | Verify listing          |

### Bookings
| Method | Route                      | Auth | Description        |
|--------|----------------------------|------|--------------------|
| POST   | `/api/bookings`            | JWT  | Create booking     |
| GET    | `/api/bookings/mine`       | JWT  | My bookings        |
| GET    | `/api/bookings/earnings`   | JWT  | Owner earnings     |
| PATCH  | `/api/bookings/:id/cancel` | JWT  | Cancel booking     |

### Users
| Method | Route                       | Auth | Description        |
|--------|-----------------------------|------|--------------------|
| GET    | `/api/users/profile`        | JWT  | Get profile        |
| PATCH  | `/api/users/profile`        | JWT  | Update profile     |
| PATCH  | `/api/users/change-password`| JWT  | Change password    |

---

## 🗺️ Data Sources

- **Real parking data**: OpenStreetMap Overpass API (`amenity=parking`)
- **Geocoding**: Nominatim (no API key required)
- **Map tiles**: OpenStreetMap tile CDN via Leaflet.js
- **Backend listings**: MongoDB with 2dsphere geospatial indexing

---

## 🏗️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- React Leaflet + Leaflet.js
- Axios (JWT interceptors)
- React Hot Toast
- CSS Modules

**Backend**
- Node.js + Express
- MongoDB + Mongoose (2dsphere geo indexing)
- JWT (jsonwebtoken) + bcryptjs
- Google Auth Library (ID token verification)
- Helmet + CORS + Rate Limiting

---

## 🔐 Security Model

- Passwords hashed with bcrypt (12 rounds)
- JWTs expire in 7 days, re-verified on every protected request
- Google ID tokens verified server-side with `google-auth-library`
- Role-based access: `user`, `owner`, `admin`
- Helmet headers, CORS whitelisted to frontend URL, global rate limiter

---

## 💰 Pricing Logic

| Security Features         | Tier     | Rate    |
|---------------------------|----------|---------|
| None                      | Basic    | ₹10/hr  |
| CCTV only                 | Standard | ₹25/hr  |
| Any 2 of 3                | Premium  | ₹40/hr  |
| CCTV + Guard + Gated      | Elite    | ₹60/hr  |

Price is auto-computed in both the Mongoose `pre('save')` hook and the frontend `getTier()` utility.

---

## 🌗 Themes

Light/dark toggle in the navbar. Preference saved to `localStorage`. Full CSS variable system with `.light` body class override.
