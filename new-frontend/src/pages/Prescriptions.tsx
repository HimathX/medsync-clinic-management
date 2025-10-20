import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const Prescriptions: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getMedicalSummary(user!.user_id, {
        include_prescriptions: true,
        prescriptions_limit: 20,
      });
      setPrescriptions(data.active_prescriptions || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadPrescriptions();
    }
  }, [user, loadPrescriptions]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Prescriptions
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {prescriptions.length === 0 ? (
        <Alert severity="info">No prescriptions found</Alert>
      ) : (
        <Grid container spacing={3}>
          {prescriptions.map((rx) => (
            <Grid item xs={12} md={6} key={rx.prescription_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {format(new Date(rx.prescription_date), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dr. {rx.doctor_name}
                      </Typography>
                    </Box>
                    <Chip 
                      label={rx.is_active ? 'Active' : 'Expired'} 
                      color={rx.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Medications:
                  </Typography>
                  {rx.medications.map((med: any, idx: number) => (
                    <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {med.medication_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dosage: {med.dosage}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Frequency: {med.frequency}
                      </Typography>
                      {med.duration_days && (
                        <Typography variant="body2" color="text.secondary">
                          Duration: {med.duration_days} days
                        </Typography>
                      )}
                      {med.instructions && (
                        <Typography variant="caption" color="text.secondary">
                          {med.instructions}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Prescriptions;
