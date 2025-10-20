import apiClient, { handleApiError } from './api';

class BillingService {
  // ============================================
  // INVOICE ENDPOINTS
  // ============================================
  
  /**
   * Create invoice for consultation
   * @param {Object} invoiceData - { consultation_rec_id, tax_percentage, due_days }
   * @returns {Promise} Created invoice
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
   * Get all invoices with pagination
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {boolean} overdueOnly - Show only overdue invoices (default: false)
   * @returns {Promise} Invoices list
   */
  async getAllInvoices(skip = 0, limit = 100, overdueOnly = false) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (overdueOnly) params.append('overdue_only', 'true');
      
      const response = await apiClient.get(`/invoices/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch invoices'));
    }
  }

  /**
   * Get invoice by ID with full details
   * @param {string} invoiceId - Invoice ID (UUID)
   * @returns {Promise} Invoice details with treatments and payment summary
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
   * Get invoice by consultation ID
   * @param {string} consultationRecId - Consultation record ID (UUID)
   * @returns {Promise} Invoice for consultation
   */
  async getInvoiceByConsultation(consultationRecId) {
    try {
      const response = await apiClient.get(`/invoices/consultation/${consultationRecId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch invoice for consultation'));
    }
  }

  /**
   * Update invoice
   * @param {string} invoiceId - Invoice ID (UUID)
   * @param {Object} updateData - { tax_amount, due_date }
   * @returns {Promise} Updated invoice
   */
  async updateInvoice(invoiceId, updateData) {
    try {
      const response = await apiClient.patch(`/invoices/${invoiceId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update invoice'));
    }
  }

  /**
   * Delete invoice
   * @param {string} invoiceId - Invoice ID (UUID)
   * @returns {Promise} Success response
   */
  async deleteInvoice(invoiceId) {
    try {
      const response = await apiClient.delete(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete invoice'));
    }
  }

  /**
   * Get invoice statistics
   * @returns {Promise} Invoice summary statistics
   */
  async getInvoiceStatistics() {
    try {
      const response = await apiClient.get('/invoices/statistics/summary');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch invoice statistics'));
    }
  }

  // ============================================
  // PAYMENT ENDPOINTS
  // ============================================
  
  /**
   * Create payment
   * @param {Object} paymentData - { patient_id, amount_paid, payment_method, payment_date, notes }
   * @returns {Promise} Created payment
   */
  async createPayment(paymentData) {
    try {
      const response = await apiClient.post('/payments/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create payment'));
    }
  }

  /**
   * Get all payments with filters
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {string|null} statusFilter - Filter by status (Completed, Pending, Failed, Refunded)
   * @param {string|null} paymentMethod - Filter by payment method
   * @param {string|null} dateFrom - Start date (YYYY-MM-DD)
   * @param {string|null} dateTo - End date (YYYY-MM-DD)
   * @returns {Promise} Payments list
   */
  async getAllPayments(skip = 0, limit = 100, statusFilter = null, paymentMethod = null, dateFrom = null, dateTo = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (statusFilter) params.append('status_filter', statusFilter);
      if (paymentMethod) params.append('payment_method', paymentMethod);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await apiClient.get(`/payments/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payments'));
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID (UUID)
   * @returns {Promise} Payment details
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
   * Get payments by patient
   * @param {string} patientId - Patient ID (UUID)
   * @returns {Promise} Patient payments with totals
   */
  async getPaymentsByPatient(patientId) {
    try {
      const response = await apiClient.get(`/payments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient payments'));
    }
  }

  /**
   * Update payment
   * @param {string} paymentId - Payment ID (UUID)
   * @param {Object} updateData - { status, notes }
   * @returns {Promise} Updated payment
   */
  async updatePayment(paymentId, updateData) {
    try {
      const response = await apiClient.patch(`/payments/${paymentId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update payment'));
    }
  }

  /**
   * Delete payment
   * @param {string} paymentId - Payment ID (UUID)
   * @returns {Promise} Success response
   */
  async deletePayment(paymentId) {
    try {
      const response = await apiClient.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete payment'));
    }
  }

  /**
   * Get payment statistics
   * @param {string|null} dateFrom - Start date (YYYY-MM-DD)
   * @param {string|null} dateTo - End date (YYYY-MM-DD)
   * @returns {Promise} Payment summary statistics
   */
  async getPaymentStatistics(dateFrom = null, dateTo = null) {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await apiClient.get(`/payments/statistics/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payment statistics'));
    }
  }

  // ============================================
  // CLAIMS ENDPOINTS
  // ============================================
  
  /**
   * Create insurance claim
   * @param {Object} claimData - { invoice_id, insurance_id, claim_amount, claim_date, notes }
   * @returns {Promise} Created claim
   */
  async createClaim(claimData) {
    try {
      const response = await apiClient.post('/claims/', claimData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create claim'));
    }
  }

  /**
   * Get claim details by ID
   * @param {string} claimId - Claim ID (UUID)
   * @returns {Promise} Claim details with full information
   */
  async getClaimById(claimId) {
    try {
      const response = await apiClient.get(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch claim'));
    }
  }

  /**
   * Get all claims for patient
   * @param {string} patientId - Patient ID (UUID)
   * @returns {Promise} Patient claims with insurance details
   */
  async getClaimsByPatient(patientId) {
    try {
      const response = await apiClient.get(`/claims/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient claims'));
    }
  }

  /**
   * Get insurance summary with claim limits
   * @param {string} insuranceId - Insurance ID (UUID)
   * @returns {Promise} Insurance claim summary with utilization
   */
  async getInsuranceSummary(insuranceId) {
    try {
      const response = await apiClient.get(`/claims/insurance/${insuranceId}/summary`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance summary'));
    }
  }

  /**
   * Get claims statistics
   * @param {string|null} startDate - Start date (YYYY-MM-DD)
   * @param {string|null} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} Claims statistics with aggregations
   */
  async getClaimsStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await apiClient.get(`/claims/statistics/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch claims statistics'));
    }
  }

  /**
   * Delete claim
   * @param {string} claimId - Claim ID (UUID)
   * @returns {Promise} Success response
   */
  async deleteClaim(claimId) {
    try {
      const response = await apiClient.delete(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete claim'));
    }
  }

  // ============================================
  // LEGACY/COMPATIBILITY METHODS
  // ============================================

  /**
   * Get invoices by patient ID (legacy)
   * @param {string} patientId - Patient ID
   */
  async getInvoicesByPatient(patientId) {
    try {
      // Note: Backend doesn't have a direct patient invoice endpoint
      // We'll get all invoices and filter client-side
      // If no invoices exist, return empty array instead of throwing error
      const data = await this.getAllInvoices(0, 500);
      if (!data || !data.invoices) {
        return [];
      }
      const patientInvoices = data.invoices.filter(inv => inv.patient_id === patientId) || [];
      return patientInvoices;
    } catch (error) {
      // Return empty array instead of throwing error if no invoices found
      console.warn('Could not fetch invoices:', error.message);
      return [];
    }
  }

  /**
   * Get pending invoices (legacy)
   */
  async getPendingInvoices() {
    try {
      const data = await this.getAllInvoices(0, 100, true);
      return data.invoices || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch pending invoices'));
    }
  }

  /**
   * Process payment (legacy alias)
   * @param {Object} paymentData - Payment data
   */
  async processPayment(paymentData) {
    return this.createPayment(paymentData);
  }

  /**
   * Get payment summary (legacy)
   * @param {Object} filters - { start_date, end_date }
   */
  async getPaymentSummary(filters = {}) {
    return this.getPaymentStatistics(filters.start_date, filters.end_date);
  }

  /**
   * Get recent payments (legacy)
   * @param {number} limit - Number of recent payments
   */
  async getRecentPayments(limit = 10) {
    try {
      const data = await this.getAllPayments(0, limit);
      return data.payments || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch recent payments'));
    }
  }
}

export default new BillingService();
