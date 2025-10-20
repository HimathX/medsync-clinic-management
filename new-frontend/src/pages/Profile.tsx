import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { PatientProfile } from '../types';
import { handleApiError } from '../services/api';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getProfile(user!.user_id);
      setFormData(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleChange = (field: keyof PatientProfile, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await patientService.updateProfile(user!.user_id, formData);
      setSuccess('Profile updated successfully!');
      await loadProfile();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
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
        My Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Full Name"
                value={formData.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="NIC"
                value={formData.NIC || ''}
                disabled
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Gender"
                value={formData.gender || ''}
                disabled
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Date of Birth"
                value={formData.DOB ? format(new Date(formData.DOB), 'yyyy-MM-dd') : ''}
                disabled
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Blood Group"
                value={formData.blood_group || ''}
                disabled
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Primary Phone"
                value={formData.contact_num1 || ''}
                onChange={(e) => handleChange('contact_num1', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Secondary Phone"
                value={formData.contact_num2 || ''}
                onChange={(e) => handleChange('contact_num2', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Address Line 1"
                value={formData.address_line1 || ''}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address_line2 || ''}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Province"
                    value={formData.province || ''}
                    onChange={(e) => handleChange('province', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Contact Name"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergency_contact_relationship || ''}
                onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Phone Number"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Allergies"
                multiline
                rows={2}
                value={formData.allergies || ''}
                onChange={(e) => handleChange('allergies', e.target.value)}
                sx={{ mb: 2 }}
                placeholder="List any allergies..."
              />

              <TextField
                fullWidth
                label="Chronic Conditions"
                multiline
                rows={2}
                value={formData.chronic_conditions || ''}
                onChange={(e) => handleChange('chronic_conditions', e.target.value)}
                sx={{ mb: 2 }}
                placeholder="List any chronic conditions..."
              />

              <TextField
                fullWidth
                label="Current Medications"
                multiline
                rows={2}
                value={formData.current_medications || ''}
                onChange={(e) => handleChange('current_medications', e.target.value)}
                placeholder="List current medications..."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Insurance Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insurance Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Insurance Provider"
                    value={formData.insurance_provider || ''}
                    onChange={(e) => handleChange('insurance_provider', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Policy Number"
                    value={formData.insurance_policy_number || ''}
                    onChange={(e) => handleChange('insurance_policy_number', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
