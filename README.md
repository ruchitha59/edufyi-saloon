# Salon Management App

Modern MERN stack starter for salon slot booking. Customers browse salons, view salon details and stylists, select services and pick available time slots at the salon to confirm appointments.

## Stack

- Frontend: React, Vite, React Router, Axios, React Toastify
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- Validation: API and frontend checks for required fields and connectivity
- Customer auth: email/password login followed by OTP verification to the registered phone number

## Structure

- `client/` React UI
- `server/` REST API

## Setup

1. Install dependencies from the repository root.
2. Create environment files from the examples.
3. Start both apps with the root dev script.

## Environment

Server variables:

- `PORT=5000`
- `MONGODB_URI=mongodb+srv://saloon:<db_password>@saloon.nhzipsx.mongodb.net/saloon?retryWrites=true&w=majority&appName=saloon`
- `CLIENT_URL=http://localhost:5173`

Client variables:

- `VITE_API_BASE_URL=http://localhost:5000/api`

## Customer Auth Flow

- Create account with name, age, gender, email, mobile number, password, and confirm password.
- Sign in with email and password.
- If credentials are valid, the server sends an OTP to the registered mobile number.
- Enter the OTP to complete login.
- Existing phone-only customer records are updated in place during registration when the mobile number matches, which prevents duplicate customer rows.

## Demo Login Accounts

- Customer: `customer.demo@saloon.local` / `Customer@12345`
- Admin: `admin.demo@saloon.local` / `Admin@12345`
- Staff: `staff.demo@saloon.local` / `Staff@12345`

In local development, the server falls back to a built-in JWT secret if `JWT_SECRET` is not set. Set `JWT_SECRET` explicitly in production.

## API

- Salon endpoints:
  - `GET /api/salons` — list salons
  - `GET /api/salons/:id` — salon details
  - `GET /api/salons/:id/stylists` — stylists at a salon
  - `GET /api/salons/:id/slots?date=YYYY-MM-DD` — available slots

- Booking endpoints:
  - `POST /api/bookings` — create a booking (protected)
  - `GET /api/bookings/customer/:customerId` — list bookings for customer (protected)

Example booking payload:

```json
{
  "salon_id": "<salonId>",
  "stylist_id": "<stylistId>",
  "slot_id": "<slotId>",
  "service_ids": ["svc-1", "svc-2"]
}
```

The server will reserve the slot and create a booking record with `booking_status` set to `CONFIRMED` when successful.

## Notes

- `status` defaults to `AA`.
- `created_at` and `modified_at` are managed through MongoDB timestamps.
- The stylist listing screen is included as a ready-to-expand placeholder.



