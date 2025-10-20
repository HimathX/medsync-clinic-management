# MedSync Patient Portal

A modern, responsive patient portal built with React and TypeScript for the MedSync Clinic Management System.

## Features

### 🏥 Patient-Centric Features

- **Dashboard**: Overview of appointments, medical records, and health summary
- **Appointments**: View, book, and manage appointments
- **Medical Records**: Access consultation history, vital signs, and medical information
- **Prescriptions**: View active and past prescriptions with medication details
- **Lab Results**: Check laboratory test results and status
- **Profile Management**: Update personal, contact, and emergency information

### 🔐 Authentication & Security

- JWT-based authentication
- Secure session management
- Role-based access control (Patient-only access)
- Protected routes

### 🎨 Modern UI/UX

- Material-UI components
- Responsive design (Mobile, Tablet, Desktop)
- Dark/Light theme support
- Intuitive navigation

## Tech Stack

- **Frontend Framework**: React 18.3
- **Language**: TypeScript 4.9
- **UI Library**: Material-UI (MUI) 5.16
- **Routing**: React Router DOM 6.26
- **HTTP Client**: Axios 1.7
- **Date Handling**: date-fns 3.6
- **Build Tool**: Create React App
- **Web Server**: Nginx (Production)

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker (for containerized deployment)

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   cd new-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your backend URL:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_API_TIMEOUT=30000
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   
   Application will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Build files will be in the `build/` directory.

## Docker Deployment

### Build Docker Image

```bash
docker build -t medsync-patient-portal .
```

### Run Container

```bash
docker run -p 80:80 medsync-patient-portal
```

### Using Docker Compose

The application is configured to work with the MedSync backend. Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  patient-portal:
    build: ./new-frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_BASE_URL=http://backend:8000
    depends_on:
      - backend
    networks:
      - medsync-network

  backend:
    # ... existing backend configuration ...
```

Then run:
```bash
docker-compose up -d
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (⚠️ one-way operation)

## API Endpoints Used

The patient portal integrates with the following backend endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Patient Profile
- `GET /patients/{patient_id}/profile` - Get patient profile
- `PUT /patients/{patient_id}/profile` - Update profile
- `GET /patients/{patient_id}/stats` - Get patient statistics
- `GET /patients/{patient_id}/medical-summary` - Get medical summary

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/patient` - Get patient appointments
- `GET /api/appointments/available-slots` - Get available time slots
- `PATCH /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

## Project Structure

```
new-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with sidebar
│   │   └── PrivateRoute.tsx    # Protected route wrapper
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Appointments.tsx    # Appointments list
│   │   ├── BookAppointment.tsx # Appointment booking
│   │   ├── MedicalRecords.tsx  # Medical history
│   │   ├── Prescriptions.tsx   # Prescriptions list
│   │   ├── LabResults.tsx      # Lab results
│   │   └── Profile.tsx         # User profile
│   ├── services/
│   │   ├── api.ts              # Axios instance
│   │   ├── authService.ts      # Auth API calls
│   │   ├── patientService.ts   # Patient API calls
│   │   └── appointmentService.ts # Appointment API calls
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main app component
│   ├── index.tsx               # Entry point
│   └── index.css               # Global styles
├── Dockerfile
├── nginx.conf
├── package.json
└── tsconfig.json
```

## Features by Page

### 📊 Dashboard
- Quick stats (appointments, consultations, prescriptions)
- Upcoming appointments
- Medical alerts and information
- Recent activity summary

### 📅 Appointments
- View all appointments (scheduled, completed, cancelled)
- Filter by status
- Cancel appointments
- Quick booking button

### 🩺 Medical Records
- Personal information
- Allergies and chronic conditions
- Consultation history
- Vital signs

### 💊 Prescriptions
- Active and expired prescriptions
- Medication details (dosage, frequency, duration)
- Prescribing doctor information

### 🔬 Lab Results
- Test results with status (Normal/Abnormal/Critical)
- Result values and normal ranges
- Test dates and ordering doctor

### 👤 Profile
- Edit personal information
- Update contact details
- Manage emergency contacts
- Update medical information
- Insurance details

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `REACT_APP_API_TIMEOUT` | API request timeout (ms) | `30000` |

## Security Features

- JWT token storage in localStorage
- Automatic token refresh
- Protected routes with authentication check
- Patient-only access validation
- Automatic logout on 401 responses
- Secure API communication

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### State Management
- Use React Context for global state (Auth)
- Use local state for component-specific data
- Implement proper loading and error states

### API Integration
- Centralized API service layer
- Proper error handling and user feedback
- Loading indicators for all async operations

## Troubleshooting

### Port already in use
```bash
# Change port in package.json or use:
PORT=3001 npm start
```

### API connection issues
- Verify `REACT_APP_API_BASE_URL` is correct
- Check backend is running
- Check CORS configuration on backend

### Build issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private - MedSync Clinic Management System

## Support

For issues or questions, contact your system administrator.
