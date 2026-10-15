# Student Information Management System

A three-tier cloud project based on the supplied assignment:
- **Frontend:** React + Vite (deploy to Netlify)
- **Backend:** Node.js + Express REST API (deploy to Render)
- **Database:** MongoDB Atlas

## Features
- Add, list, search, edit, and delete student records
- Backend validation and centralized error responses
- CORS restricted to the configured frontend origin
- MongoDB URI stored in backend environment variables (never in frontend)
- Responsive UI

## Student fields
`studentId`, `name`, `email`, `department`, `semester`, `contact`

## 1. Requirements
Install Node.js 20+ and npm. Create a MongoDB Atlas cluster and database user.

## 2. Run locally

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI and FRONTEND_URL
npm install
npm run dev
```
API default: `http://localhost:5000`; health check: `http://localhost:5000/health`.

### Frontend
In a second terminal:
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```
Open the Vite URL printed in the terminal.

## 3. MongoDB Atlas setup
1. Create a cluster and a database user with a strong password.
2. In Network Access, allow the Render service to connect. For initial testing, use your current IP; avoid opening access to all IPs unless your deployment requirements justify it.
3. Copy the Atlas connection string and replace the username/password placeholders.
4. Use database name `studentDB` in the URI, e.g. `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/studentDB?retryWrites=true&w=majority`.
5. Store the full URI only in `backend/.env` locally and in Render Environment settings in production.

## 4. Deploy backend to Render
1. Push this project to a Git repository.
2. In Render, create a **Web Service** connected to the repository.
3. Set **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:
   - `MONGODB_URI` = Atlas connection string
   - `FRONTEND_URL` = your deployed Netlify site URL (for example `https://your-site.netlify.app`)
   - `NODE_ENV` = `production`
7. Deploy and test `https://YOUR-RENDER-SERVICE.onrender.com/health`.

## 5. Deploy frontend to Netlify
1. In Netlify, import the same Git repository.
2. Set **Base directory** to `frontend`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL` = your Render service URL, without a trailing slash (e.g. `https://your-service.onrender.com`).
6. Deploy. If the Netlify URL changes, update `FRONTEND_URL` on Render and redeploy the backend.

## 6. API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/students` | List students; supports `?q=term` |
| GET | `/api/students/:id` | Get a student by MongoDB ID |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

Example create body:
```json
{
  "studentId": "ST101",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "department": "Computer Science",
  "semester": 5,
  "contact": "9876543210"
}
```

## 7. Test with curl
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/students
```
Use Postman or the UI for POST/PUT/DELETE. `studentId` and `email` must be unique.

## Security notes
- Never commit `.env` files or expose `MONGODB_URI` to the browser.
- CORS permits the configured `FRONTEND_URL` and localhost during development only.
- This academic demo does not implement login/authentication. Do not use it for sensitive production data without adding authentication, authorization, rate limiting, and further security review.
