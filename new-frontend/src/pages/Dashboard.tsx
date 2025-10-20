import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  MedicalServices,
  Assignment,
  EventAvailable,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { MedicalSummary, PatientStats, Appointment } from '../types';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const patientId = user!.user_id;

      // Load all dashboard data in parallel
      const [statsData, summaryData, appointmentsData] = await Promise.all([
        patientService.getStats(patientId),
        patientService.getMedicalSummary(patientId, {
          include_consultations: true,
          include_prescriptions: true,
          include_lab_results: true,
          consultations_limit: 3,
          prescriptions_limit: 3,
          lab_results_limit: 3,
        }),
        appointmentService.getPatientAppointments(patientId, {
          status: 'Scheduled',
          from_date: format(new Date(), 'yyyy-MM-dd'),
        }),
      ]);

      setStats(statsData);
      setMedicalSummary(summaryData);
      setUpcomingAppointments(appointmentsData.slice(0, 3));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.full_name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's your health overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.total_appointments || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EventAvailable sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Upcoming
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.upcoming_appointments || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MedicalServices sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Consultations
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.total_consultations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Active Prescriptions
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats?.active_prescriptions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Appointments
                </Typography>
                <Button size="small" onClick={() => navigate('/appointments')}>
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <Box key={apt.appointment_id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {apt.doctor_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {apt.branch_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      📅 {format(new Date(apt.available_date), 'MMM dd, yyyy')} at {apt.start_time}
                    </Typography>
                    <Chip label={apt.status} size="small" color="primary" sx={{ mt: 1 }} />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming appointments
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => navigate('/appointments/book')}
              >
                Book New Appointment
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Alerts & Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Medical Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {medicalSummary?.medical_alerts && medicalSummary.medical_alerts.length > 0 && (
                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Warning sx={{ color: 'warning.main', mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Medical Alerts
                    </Typography>
                  </Box>
                  {medicalSummary.medical_alerts.map((alert, idx) => (
                    <Alert severity="warning" key={idx} sx={{ mb: 1 }}>
                      {alert}
                    </Alert>
                  ))}
                </Box>
              )}

              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Allergies:
                </Typography>
                {medicalSummary?.allergies && medicalSummary.allergies.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {medicalSummary.allergies.map((allergy, idx) => (
                      <Chip key={idx} label={allergy} size="small" color="error" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None recorded
                  </Typography>
                )}
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Chronic Conditions:
                </Typography>
                {medicalSummary?.chronic_conditions && medicalSummary.chronic_conditions.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {medicalSummary.chronic_conditions.map((condition, idx) => (
                      <Chip key={idx} label={condition} size="small" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None recorded
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Current Medications:
                </Typography>
                {medicalSummary?.current_medications && medicalSummary.current_medications.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {medicalSummary.current_medications.map((med, idx) => (
                      <Chip key={idx} label={med} size="small" color="info" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None recorded
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 3 }}
                onClick={() => navigate('/medical-records')}
              >
                View Full Medical Record
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Last Visit:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats?.last_visit_date
                        ? format(new Date(stats.last_visit_date), 'MMM dd, yyyy')
                        : 'No visits yet'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Next Appointment:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats?.next_appointment_date
                        ? format(new Date(stats.next_appointment_date), 'MMM dd, yyyy')
                        : 'None scheduled'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Member Since:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats?.registered_since
                        ? format(new Date(stats.registered_since), 'MMM dd, yyyy')
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
