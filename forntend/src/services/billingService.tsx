import apiClient, { handleApiError } from './api';

export interface Invoice {
  invoice_id: string;
  consultation_rec_id: string;
  sub_total: number | string;
  tax_amount: number | string;
  due_date: string;
  created_at?: string;
  total_amount?: number;
  patient_id?: string;
  patient_name?: string;
  patient_email?: string;
  doctor_id?: string;
  doctor_name?: string;
  status?: string; // Derived or stored
}

export interface InvoiceCreateData {
  consultation_rec_id: string;
  tax_percentage?: number; // Optional, default 0 in backend
  due_days?: number;       // Optional, default 30 in backend
}

export interface InvoiceUpdateData {
  tax_amount?: number;
  due_date?: string; // YYYY-MM-DD
}

export interface InvoiceResponse {
  success: boolean;
  message: string;
  invoice_id?: string;
  invoice?: Invoice;
}

export interface InvoiceDetailResponse {
  invoice: Invoice;
  treatments: Array<{
    treatment_id: string;
    treatment_name: string;
    base_price: number | string;
    notes?: string;
  }>;
  payment_summary: {
    total_paid: number;
    balance: number;
    is_overdue: boolean;
  };
}

export interface Payment {
  payment_id: string;
  patient_id: string;
  amount_paid: number | string;
  payment_method: 'Credit Card' | 'Bank Transfer' | 'Mobile Payment' | 'Cash' | string;
  payment_date: string; // YYYY-MM-DD
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  notes?: string;
  created_at?: string;
}

export interface PaymentCreateData {
  patient_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string; // YYYY-MM-DD
  notes?: string;
}

export interface PaymentUpdateData {
  status?: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  notes?: string;
}

export interface InsuranceClaim {
  claim_id: string;
  invoice_id: string;
  insurance_id: string;
  claim_amount: number | string;
  claim_date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing';
  notes?: string;
  package_name?: string;
}

export interface ClaimCreateData {
  invoice_id: string;
  insurance_id: string;
  claim_amount: number;
  claim_date: string;
  notes?: string;
}

export interface InvoiceStatistics {
  total_revenue: number;
  total_invoices: number;
  overdue_invoices: {
    count: number;
    amount: number;
  };
  current_month: {
    count: number;
    amount: number;
  };
}

// ==========================================
// Billing Service
// ==========================================

class BillingService {
  // ============================================
  // INVOICE ENDPOINTS
  // ============================================

  /**
   * Create invoice for consultation
   */
  async createInvoice(invoiceData: InvoiceCreateData): Promise<InvoiceResponse> {
    try {
      const response = await apiClient.post<InvoiceResponse>('/invoices/', invoiceData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all invoices with pagination
   */
  async getAllInvoices(skip: number = 0, limit: number = 100, overdueOnly: boolean = false): Promise<{ total: number; returned: number; invoices: Invoice[] }> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (overdueOnly) params.append('overdue_only', 'true');

      const response = await apiClient.get<{ total: number; returned: number; invoices: Invoice[] }>(`/invoices/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get invoice by ID with full details
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceDetailResponse> {
    try {
      const response = await apiClient.get<InvoiceDetailResponse>(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get invoice by consultation ID
   */
  async getInvoiceByConsultation(consultationRecId: string): Promise<{ invoice: Invoice }> {
    try {
      const response = await apiClient.get<{ invoice: Invoice }>(`/invoices/consultation/${consultationRecId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, updateData: InvoiceUpdateData): Promise<InvoiceResponse> {
    try {
      const response = await apiClient.patch<InvoiceResponse>(`/invoices/${invoiceId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(): Promise<InvoiceStatistics> {
    try {
      const response = await apiClient.get<InvoiceStatistics>('/invoices/statistics/summary');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================
  // PAYMENT ENDPOINTS
  // ============================================

  /**
   * Create payment
   */
  async createPayment(paymentData: PaymentCreateData): Promise<Payment> {
    try {
      const response = await apiClient.post<Payment>('/payments/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all payments with filters
   */
  async getAllPayments(
    skip: number = 0,
    limit: number = 100,
    statusFilter: string | null = null,
    paymentMethod: string | null = null,
    dateFrom: string | null = null,
    dateTo: string | null = null
  ): Promise<{ payments: Payment[]; total?: number }> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (statusFilter) params.append('status_filter', statusFilter);
      if (paymentMethod) params.append('payment_method', paymentMethod);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await apiClient.get<{ payments: Payment[]; total?: number }>(`/payments/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payments by patient
   */
  async getPaymentsByPatient(patientId: string): Promise<{ payments: Payment[]; summary?: any }> {
    try {
      const response = await apiClient.get<{ payments: Payment[]; summary?: any }>(`/payments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update payment
   */
  async updatePayment(paymentId: string, updateData: PaymentUpdateData): Promise<Payment> {
    try {
      const response = await apiClient.patch<Payment>(`/payments/${paymentId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(paymentId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(dateFrom: string | null = null, dateTo: string | null = null): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await apiClient.get<any>(`/payments/statistics/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================
  // CLAIMS ENDPOINTS
  // ============================================

  /**
   * Create insurance claim
   */
  async createClaim(claimData: ClaimCreateData): Promise<InsuranceClaim> {
    try {
      const response = await apiClient.post<InsuranceClaim>('/claims/', claimData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get claim details by ID
   */
  async getClaimById(claimId: string): Promise<InsuranceClaim> {
    try {
      const response = await apiClient.get<InsuranceClaim>(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all claims for patient
   */
  async getClaimsByPatient(patientId: string): Promise<{ claims: InsuranceClaim[] }> {
    try {
      const response = await apiClient.get<{ claims: InsuranceClaim[] }>(`/claims/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get insurance summary with claim limits
   */
  async getInsuranceSummary(insuranceId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/claims/insurance/${insuranceId}/summary`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get claims statistics
   */
  async getClaimsStatistics(startDate: string | null = null, endDate: string | null = null): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<any>(`/claims/statistics/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete claim
   */
  async deleteClaim(claimId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================
  // LEGACY/COMPATIBILITY METHODS
  // ============================================

  /**
   * Get invoices by patient ID (Client-side filtering compatibility)
   */
  async getInvoicesByPatient(patientId: string): Promise<Invoice[]> {
    try {
      // Note: Backend doesn't have a direct patient invoice endpoint yet
      // We'll get all invoices and filter client-side
      const data = await this.getAllInvoices(0, 500);
      if (!data || !data.invoices) {
        return [];
      }
      return data.invoices.filter((inv) => inv.patient_id === patientId);
    } catch (error: any) {
      console.warn('Could not fetch invoices:', error.message);
      return [];
    }
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    try {
      const data = await this.getAllInvoices(0, 100, true);
      return data.invoices || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Process payment (legacy alias)
   */
  async processPayment(paymentData: PaymentCreateData): Promise<Payment> {
    return this.createPayment(paymentData);
  }

  /**
   * Get payment summary (legacy)
   */
  async getPaymentSummary(filters: { start_date?: string; end_date?: string } = {}): Promise<any> {
    return this.getPaymentStatistics(filters.start_date || null, filters.end_date || null);
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(limit: number = 10): Promise<Payment[]> {
    try {
      const data = await this.getAllPayments(0, limit);
      return data.payments || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new BillingService();
