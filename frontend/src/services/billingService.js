import apiClient, { handleApiError } from './api';

class BillingService {
  // ============ INVOICES ============
  
  /**
   * Get all invoices
   * @param {Object} filters - { patient_id, status }
   */
  async getAllInvoices(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.patient_id) params.append('patient_id', filters.patient_id);
      if (filters.status) params.append('status', filters.status);
      
      const response = await apiClient.get(`/invoices/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch invoices'));
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   */
  async getInvoiceById(invoiceId) {
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch invoice'));
    }
  }

  /**
   * Create invoice
   * @param {Object} invoiceData - Invoice creation data
   */
  async createInvoice(invoiceData) {
    try {
      const response = await apiClient.post('/invoices/', invoiceData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create invoice'));
    }
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices() {
    try {
      const response = await apiClient.get('/invoices/pending');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch pending invoices'));
    }
  }

  /**
   * Get invoices by patient ID
   * @param {string} patientId - Patient ID
   */
  async getInvoicesByPatient(patientId) {
    try {
      const response = await this.getAllInvoices({ patient_id: patientId });
      return response.invoices || response || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient invoices'));
    }
  }

  // ============ PAYMENTS ============
  
  /**
   * Process payment
   * @param {Object} paymentData - { invoice_id, patient_id, payment_method, amount }
   */
  async processPayment(paymentData) {
    try {
      const response = await apiClient.post('/payments/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to process payment'));
    }
  }

  /**
   * Get all payments
   * @param {string|null} patientId - Optional patient ID filter
   */
  async getAllPayments(patientId = null) {
    try {
      const url = patientId ? `/payments/patient/${patientId}` : '/payments/';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payments'));
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   */
  async getPaymentById(paymentId) {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payment'));
    }
  }

  /**
   * Get payment summary
   * @param {Object} filters - { start_date, end_date }
   */
  async getPaymentSummary(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await apiClient.get(`/payments/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payment summary'));
    }
  }

  /**
   * Get recent payments
   * @param {number} limit - Number of recent payments to fetch
   */
  async getRecentPayments(limit = 10) {
    try {
      const response = await apiClient.get(`/payments/?limit=${limit}`);
      return response.data.payments || response.data || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch recent payments'));
    }
  }
}

export default new BillingService();
