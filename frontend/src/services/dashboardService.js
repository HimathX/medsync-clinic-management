// Dashboard Service - Handles dashboard statistics and aggregated data
import api from './api';
import appointmentService from './appointmentService';
import patientService from './patientService';
import billingService from './billingService';
import doctorService from './doctorService';
import branchService from './branchService';

/**
 * Dashboard Service
 * Aggregates data from multiple services for dashboard views
 */
class DashboardService {
  /**
   * Get staff dashboard statistics
   * @param {string} branchName - Optional branch filter
   * @returns {Promise} Dashboard statistics
   */
  async getStaffDashboardStats(branchName = null) {
    try {
      // Fetch data from multiple endpoints in parallel
      const [
        appointments,
        pendingInvoices,
        branches,
        doctors
      ] = await Promise.all([
        appointmentService.getAppointments({ 
          date: new Date().toISOString().split('T')[0] 
        }).catch(() => ({ appointments: [] })),
        billingService.getPendingInvoices().catch(() => []),
        branchService.getAllBranches().catch(() => []),
        doctorService.getAllDoctors().catch(() => [])
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.appointments || [];
      
      // Calculate statistics
      const stats = {
        totalAppointments: todayAppointments.length,
        checkedIn: todayAppointments.filter(a => a.status === 'Checked-in' || a.status === 'Completed').length,
        completed: todayAppointments.filter(a => a.status === 'Completed').length,
        cancelled: todayAppointments.filter(a => a.status === 'Cancelled').length,
        newPatients: todayAppointments.filter(a => a.is_new_patient).length,
        pendingBills: pendingInvoices.length,
        totalRevenue: pendingInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
        outstandingBalance: pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount || 0), 0)
      };

      return {
        stats,
        todayAppointments: todayAppointments.slice(0, 10),
        branches: branches,
        doctors: doctors.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get patient dashboard data
   * @param {number} patientId - Patient ID
   * @returns {Promise} Patient dashboard data
   */
  async getPatientDashboardData(patientId) {
    try {
      const [
        patient,
        appointments,
        prescriptions,
        invoices
      ] = await Promise.all([
        patientService.getPatientById(patientId).catch(() => null),
        appointmentService.getPatientAppointments(patientId).catch(() => []),
        // Assuming prescription endpoint exists
        api.get(`/prescription/patient/${patientId}`).then(r => r.data).catch(() => []),
        billingService.getInvoicesByPatient(patientId).catch(() => [])
      ]);

      const outstandingBalance = invoices.reduce((sum, inv) => 
        sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0
      );

      return {
        patient,
        appointments,
        prescriptions,
        finance: {
          balance: outstandingBalance,
          invoices
        }
      };
    } catch (error) {
      console.error('Error fetching patient dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get recent activity log
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise} Recent activity items
   */
  async getRecentActivity(limit = 10) {
    try {
      // This would need a dedicated endpoint in the backend
      // For now, we'll aggregate from appointments and payments
      const [appointments, payments] = await Promise.all([
        appointmentService.getAppointments({ limit: 5 }).catch(() => ({ appointments: [] })),
        billingService.getRecentPayments(5).catch(() => [])
      ]);

      const activities = [];
      
      // Add appointment activities
      (appointments.appointments || []).forEach(appt => {
        activities.push({
          time: new Date(appt.appointment_date),
          description: `Appointment with ${appt.doctor_name || 'Doctor'} for patient ${appt.patient_id}`,
          type: 'appointment'
        });
      });

      // Add payment activities
      payments.forEach(payment => {
        activities.push({
          time: new Date(payment.payment_date),
          description: `Payment of LKR ${payment.amount} received from ${payment.patient_name || 'patient'}`,
          type: 'payment'
        });
      });

      // Sort by time descending
      return activities
        .sort((a, b) => b.time - a.time)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get notifications for staff
   * @returns {Promise} List of notifications
   */
  async getNotifications() {
    try {
      // This would ideally be a dedicated endpoint
      const pendingInvoices = await billingService.getPendingInvoices().catch(() => []);
      
      const notifications = [];
      
      if (pendingInvoices.length > 0) {
        notifications.push({
          id: 'billing-1',
          type: 'Billing',
          text: `${pendingInvoices.length} pending invoices need attention`,
          when: 'Now',
          priority: 'medium'
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
}

export default new DashboardService();
