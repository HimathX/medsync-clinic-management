import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  TextField,
} from '@mui/material';
import { ArrowBack, CheckCircle, LocalHospital, Person, Schedule } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { doctorService, Specialization, Doctor, DoctorTimeSlot } from '../services/doctorService';
import { handleApiError } from '../services/api';
import { format, parseISO } from 'date-fns';

const steps = ['Select Specialization', 'Choose Doctor', 'Pick Time Slot', 'Confirm'];

const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Step 0: Specializations
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  
  // Step 1: Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  
  // Step 2: Time Slots
  const [timeSlots, setTimeSlots] = useState<DoctorTimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // Additional info
  const [notes, setNotes] = useState('');

  // Load specializations on mount
  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorService.getAllSpecializations();
      setSpecializations(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async (specializationId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorService.getDoctorsBySpecialization(specializationId);
      setDoctors(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async (doctorId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorService.getTimeSlotsByDoctor(doctorId, false, undefined);
      setTimeSlots(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedSpecialization) {
      loadDoctors(selectedSpecialization);
    } else if (activeStep === 1 && selectedDoctor) {
      loadTimeSlots(selectedDoctor);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBookAppointment = async () => {
    if (!selectedTimeSlot) {
      setError('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await appointmentService.bookAppointment({
        patient_id: user!.user_id,
        time_slot_id: selectedTimeSlot,
        notes,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedSpecialization !== '';
      case 1:
        return selectedDoctor !== '';
      case 2:
        return selectedTimeSlot !== '';
      default:
        return false;
    }
  };

  const getSlotColor = (slot: DoctorTimeSlot) => {
    return slot.is_booked ? 'error' : 'success';
  };

  const getSlotLabel = (slot: DoctorTimeSlot) => {
    return slot.is_booked ? 'Booked' : 'Available';
  };

  const selectedSpecializationData = specializations.find(
    (s) => s.specialization_id === selectedSpecialization
  );
  const selectedDoctorData = doctors.find((d) => d.doctor_id === selectedDoctor);
  const selectedTimeSlotData = timeSlots.find((ts) => ts.time_slot_id === selectedTimeSlot);

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/appointments')}
        sx={{ mb: 2 }}
      >
        Back to Appointments
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Book New Appointment
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
          Appointment booked successfully! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Step 0: Select Specialization */}
              {activeStep === 0 && (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Select Medical Specialization</Typography>
                  </Box>
                  
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : specializations.length === 0 ? (
                    <Alert severity="info">No specializations available</Alert>
                  ) : (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                      >
                        <Grid container spacing={2}>
                          {specializations.map((spec) => (
                            <Grid item xs={12} sm={6} key={spec.specialization_id}>
                              <Card
                                sx={{
                                  border: 2,
                                  borderColor:
                                    selectedSpecialization === spec.specialization_id
                                      ? 'primary.main'
                                      : 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { borderColor: 'primary.light' },
                                }}
                                onClick={() => setSelectedSpecialization(spec.specialization_id)}
                              >
                                <CardContent>
                                  <FormControlLabel
                                    value={spec.specialization_id}
                                    control={<Radio />}
                                    label={
                                      <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                          {spec.specialization_title}
                                        </Typography>
                                        {spec.other_details && (
                                          <Typography variant="caption" color="text.secondary">
                                            {spec.other_details}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  )}
                </>
              )}

              {/* Step 1: Choose Doctor */}
              {activeStep === 1 && (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Choose Your Doctor</Typography>
                  </Box>

                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : doctors.length === 0 ? (
                    <Alert severity="info">No doctors available for this specialization</Alert>
                  ) : (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                      >
                        <Grid container spacing={2}>
                          {doctors.map((doctor) => (
                            <Grid item xs={12} key={doctor.doctor_id}>
                              <Card
                                sx={{
                                  border: 2,
                                  borderColor:
                                    selectedDoctor === doctor.doctor_id
                                      ? 'primary.main'
                                      : 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { borderColor: 'primary.light' },
                                }}
                                onClick={() => setSelectedDoctor(doctor.doctor_id)}
                              >
                                <CardContent>
                                  <FormControlLabel
                                    value={doctor.doctor_id}
                                    control={<Radio />}
                                    label={
                                      <Box sx={{ width: '100%' }}>
                                        <Grid container spacing={2}>
                                          <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                              Dr. {doctor.full_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              {doctor.branch_name}
                                            </Typography>
                                            {doctor.room_no && (
                                              <Typography variant="caption" color="text.secondary">
                                                Room: {doctor.room_no}
                                              </Typography>
                                            )}
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <Box textAlign={{ sm: 'right' }}>
                                              <Typography variant="body2" color="text.secondary">
                                                Consultation Fee
                                              </Typography>
                                              <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                ${doctor.consultation_fee}
                                              </Typography>
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    }
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  )}
                </>
              )}

              {/* Step 2: Pick Time Slot */}
              {activeStep === 2 && (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Select Time Slot</Typography>
                  </Box>

                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : timeSlots.length === 0 ? (
                    <Alert severity="info">No time slots available for this doctor</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {timeSlots.map((slot) => (
                        <Grid item xs={12} sm={6} md={4} key={slot.time_slot_id}>
                          <Card
                            sx={{
                              cursor: slot.is_booked ? 'not-allowed' : 'pointer',
                              border: 2,
                              borderColor:
                                selectedTimeSlot === slot.time_slot_id
                                  ? 'primary.main'
                                  : slot.is_booked
                                  ? 'error.light'
                                  : 'divider',
                              opacity: slot.is_booked ? 0.6 : 1,
                              '&:hover': {
                                borderColor: slot.is_booked ? 'error.light' : 'primary.light',
                              },
                            }}
                            onClick={() => !slot.is_booked && setSelectedTimeSlot(slot.time_slot_id)}
                          >
                            <CardContent>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {format(parseISO(slot.available_date), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="h6" color="primary.main">
                                {slot.start_time} - {slot.end_time}
                              </Typography>
                              <Box mt={1}>
                                <Chip
                                  label={getSlotLabel(slot)}
                                  color={getSlotColor(slot)}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </>
              )}

              {/* Step 3: Confirm */}
              {activeStep === 3 && (
                <>
                  <Box display="flex" alignItems="center" mb={3}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Confirm Your Appointment</Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Specialization
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" mb={2}>
                            {selectedSpecializationData?.specialization_title}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Doctor
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            Dr. {selectedDoctorData?.full_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {selectedDoctorData?.branch_name}
                          </Typography>
                          <Typography variant="body2" color="primary.main" fontWeight="bold" mb={2}>
                            Consultation Fee: ${selectedDoctorData?.consultation_fee}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Date & Time
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedTimeSlotData &&
                              format(parseISO(selectedTimeSlotData.available_date), 'EEEE, MMMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body1" color="primary.main" fontWeight="bold" mb={2}>
                            {selectedTimeSlotData?.start_time} - {selectedTimeSlotData?.end_time}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <TextField
                            fullWidth
                            label="Additional Notes (Optional)"
                            multiline
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any specific concerns, symptoms, or preferences..."
                            variant="outlined"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
                  Back
                </Button>
                {activeStep < 3 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleBookAppointment}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Booking Summary
              </Typography>

              {selectedSpecializationData && (
                <>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Specialization
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedSpecializationData.specialization_title}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {selectedDoctorData && (
                <>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Doctor
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      Dr. {selectedDoctorData.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedDoctorData.branch_name}
                    </Typography>
                    <Typography variant="body2" color="primary.main" mt={1}>
                      Fee: ${selectedDoctorData.consultation_fee}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {selectedTimeSlotData && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {format(parseISO(selectedTimeSlotData.available_date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body1" color="primary.main">
                    {selectedTimeSlotData.start_time} - {selectedTimeSlotData.end_time}
                  </Typography>
                </Box>
              )}

              {activeStep < 3 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Complete all steps to book your appointment
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookAppointment;
