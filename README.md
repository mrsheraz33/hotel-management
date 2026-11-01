# Hotel Management System

A complete hotel management app: rooms, bookings, guests, billing, staff and reports.

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs
- **Frontend:** plain HTML, CSS and JavaScript (no frameworks, no build step)

## Features

- Landing page with login (roles: Admin, Receptionist, Staff)
- Rooms with filters (available / booked / cleaning / maintenance)
- Bookings with live nights and total calculation, plus double-booking protection
- Guests with live search
- Billing with itemised, printable invoices and a "Mark paid" action
- Staff directory
- Reports (admin only): summary, occupancy, monthly revenue, top guests
- Settings: hotel info (used on invoices), real password change, dark mode

## Folder structure

```
hotel-management-system/
├── backend/   config, controllers, models, routes, middleware, utils, server.js, seed.js
└── frontend/  HTML pages, css/, js/, assets/
```

## 1. Install MongoDB

Pick one:

**Option A - Local MongoDB**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community and install it.
2. Make sure the service is running (Windows: it runs as a service after install; Linux: `sudo systemctl start mongod`; macOS: `brew services start mongodb-community`).
3. Your connection string is `mongodb://localhost:27017/hotel_management`.

**Option B - MongoDB Atlas (free cloud)**
1. Create a free cluster at https://www.mongodb.com/atlas.
2. Create a database user and allow your IP under Network Access.
3. Click Connect > Drivers and copy the connection string, for example
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hotel_management`.

## 2. Set up `.env`

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hotel_management
JWT_SECRET=put_a_long_random_string_here
JWT_EXPIRES_IN=7d
```

Never commit your real `.env` file.

## 3. Install dependencies

```bash
cd backend
npm install
```

## 4. Seed sample data

```bash
node seed.js
```

This **clears the collections** and creates 3 users, 9 rooms, 5 guests, 5 bookings, 4 invoices and 5 staff members. Everything created is printed to the console.

## 5. Start the backend

```bash
npm start            # or: npm run dev   /   nodemon server.js
```

The server runs at http://localhost:5000 and also serves the frontend.

## 6. Open the frontend

- **Recommended:** open http://localhost:5000 (served by the backend).
- **Alternative:** open `frontend/index.html` directly, or use VS Code Live Server. The frontend then talks to `http://localhost:5000/api`, so the backend must still be running.

## Default login credentials

| Role         | Username    | Password   |
|--------------|-------------|------------|
| Admin        | `admin`     | `admin123` |
| Receptionist | `reception` | `recep123` |
| Staff        | `staff`     | `staff123` |

Pick the matching role in the login form. Only admins can open Reports.

## API endpoints

All routes except `register` and `login` need the header `Authorization: Bearer <token>`.

**Auth** `/api/auth`
- `POST /register` - `{username, password, role}` (admin/receptionist roles need an admin token)
- `POST /login` - `{username, password, role?}` returns `{token, user}`
- `GET /me`
- `PUT /password` - `{currentPassword, newPassword}`

**Rooms** `/api/rooms`
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /filter/:status`

**Bookings** `/api/bookings`
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- Nights and amount are calculated on the server; overlapping dates for the same room return `409`.

**Guests** `/api/guests`
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

**Invoices** `/api/invoices`
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- Total = nights x room price + extra. Invoice numbers (`INV-0001`...) are generated automatically.

**Staff** `/api/staff`
- `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

**Reports** `/api/reports` (admin only)
- `GET /summary` - bookings, revenue, guests, unpaid, today's revenue
- `GET /occupancy` - rooms by status with percentages
- `GET /monthly-revenue`
- `GET /top-guests` - top 5 by total spend

**Other:** `GET /api/health`

## Notes

- Currency is shown as `Rs`. Change `ui.money()` in `frontend/js/api.js` to use another one.
- The login page background uses an Unsplash photo. To work offline, save your own image as `frontend/assets/images/hotel-bg.jpg`.
- Hotel info and dark mode are stored in the browser's localStorage.

## Troubleshooting

- **"Cannot reach the server"** - the backend is not running, or is not on port 5000.
- **"MongoDB connection failed"** - MongoDB is not running, or `MONGO_URI` is wrong (for Atlas, check the password and IP access).
- **Login says "not registered as ..."** - the role dropdown does not match that user's role.
