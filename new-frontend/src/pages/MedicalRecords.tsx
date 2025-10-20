import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { MedicalSummary } from '../types';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<MedicalSummary | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const loadMedicalSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getMedicalSummary(user!.user_id, {
        include_consultations: true,
        include_prescriptions: true,
        include_lab_results: true,
      });
      setSummary(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadMedicalSummary();
    }
  }, [user, loadMedicalSummary]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Medical Records
      </Typography>

      <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Consultations" />
        <Tab label="Vital Signs" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Age
                  </Typography>
                  <Typography variant="body1">{summary?.age} years</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">{summary?.gender}</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Blood Group
                  </Typography>
                  <Typography variant="body1">{summary?.blood_group || 'Not specified'}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Allergies
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {summary?.allergies && summary.allergies.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {summary.allergies.map((allergy, idx) => (
                      <Chip key={idx} label={allergy} color="error" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No allergies recorded
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chronic Conditions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {summary?.chronic_conditions && summary.chronic_conditions.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {summary.chronic_conditions.map((condition, idx) => (
                      <Chip key={idx} label={condition} color="warning" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No chronic conditions recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {summary?.recent_consultations && summary.recent_consultations.length > 0 ? (
            summary.recent_consultations.map((consultation) => (
              <Grid item xs={12} md={6} key={consultation.consultation_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {format(new Date(consultation.consultation_date), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Dr. {consultation.doctor_name}
                    </Typography>
                    {consultation.specialty && (
                      <Typography variant="caption" color="text.secondary">
                        {consultation.specialty}
                      </Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    {consultation.diagnosis && (
                      <Box mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                          Diagnosis:
                        </Typography>
                        <Typography variant="body2">{consultation.diagnosis}</Typography>
                      </Box>
                    )}
                    {consultation.symptoms && (
                      <Box mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                          Symptoms:
                        </Typography>
                        <Typography variant="body2">{consultation.symptoms}</Typography>
                      </Box>
                    )}
                    {consultation.notes && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Notes:
                        </Typography>
                        <Typography variant="body2">{consultation.notes}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">No consultations recorded</Alert>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest Vital Signs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {summary?.latest_vitals ? (
              <Grid container spacing={2}>
                {summary.latest_vitals.blood_pressure && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Blood Pressure
                    </Typography>
                    <Typography variant="h6">{summary.latest_vitals.blood_pressure}</Typography>
                  </Grid>
                )}
                {summary.latest_vitals.heart_rate && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Heart Rate
                    </Typography>
                    <Typography variant="h6">{summary.latest_vitals.heart_rate} bpm</Typography>
                  </Grid>
                )}
                {summary.latest_vitals.temperature && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Temperature
                    </Typography>
                    <Typography variant="h6">{summary.latest_vitals.temperature}°C</Typography>
                  </Grid>
                )}
                {summary.latest_vitals.weight && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Weight
                    </Typography>
                    <Typography variant="h6">{summary.latest_vitals.weight} kg</Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity="info">No vital signs recorded</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MedicalRecords;
