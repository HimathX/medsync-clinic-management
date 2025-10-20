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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const LabResults: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const loadLabResults = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getMedicalSummary(user!.user_id, {
        include_lab_results: true,
        lab_results_limit: 20,
      });
      setResults(data.recent_lab_results || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadLabResults();
    }
  }, [user, loadLabResults]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'success';
      case 'abnormal':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

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
        Lab Results
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {results.length === 0 ? (
        <Alert severity="info">No lab results found</Alert>
      ) : (
        <Grid container spacing={3}>
          {results.map((result) => (
            <Grid item xs={12} md={6} lg={4} key={result.result_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" gutterBottom>
                      {result.test_name}
                    </Typography>
                    <Chip
                      label={result.status}
                      color={getStatusColor(result.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    📅 {format(new Date(result.result_date), 'MMM dd, yyyy')}
                  </Typography>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Result: {result.result_value}
                    </Typography>
                    {result.normal_range && (
                      <Typography variant="body2" color="text.secondary">
                        Normal Range: {result.normal_range}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Ordered by: Dr. {result.doctor_name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LabResults;
