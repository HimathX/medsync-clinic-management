import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const statusMap = ['Scheduled', 'Completed', 'Cancelled'];
      const status = tabValue < 3 ? statusMap[tabValue] : undefined;

      const data = await appointmentService.getPatientAppointments(user!.user_id, { status });
      setAppointments(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user, tabValue]);

  useEffect(() => {
    if (user?.user_id) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const handleCancel = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.cancelAppointment(appointmentId, 'Cancelled by patient');
        loadAppointments();
      } catch (err) {
        alert(handleApiError(err));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          My Appointments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/appointments/book')}
        >
          Book Appointment
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <Tab label="Scheduled" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
        <Tab label="All" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : appointments.length === 0 ? (
        <Alert severity="info">No appointments found</Alert>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((apt) => (
            <Grid item xs={12} md={6} key={apt.appointment_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {apt.doctor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {apt.branch_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={apt.status}
                      color={getStatusColor(apt.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" gutterBottom>
                    📅 {format(new Date(apt.available_date), 'EEEE, MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    🕐 {apt.start_time} - {apt.end_time}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    🏥 {apt.branch_name}
                  </Typography>
                  
                  {apt.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Notes: {apt.notes}
                    </Typography>
                  )}

                  {apt.status === 'Scheduled' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleCancel(apt.appointment_id)}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Appointments;
