"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Loader2,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import authService from "@/services/authService";
import PatientProfileService, {
  type PatientProfile,
} from "@/services/patientProfileService";
import BillingService, {
  type Invoice,
  type Payment,
  type InsuranceClaim,
  type PaymentCreateData,
} from "@/services/billingService";

export default function PatientBilling(): React.ReactElement {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "outstanding" | "history" | "insurance"
  >("outstanding");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  // Payment modal state
  const [selectedBill, setSelectedBill] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "Credit Card" | "Bank Transfer" | "Mobile Payment"
  >("Credit Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Get patient ID
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.userId || localStorage.getItem("userId");

  const fetchProfile = useCallback(async () => {
    try {
      if (!patientId) return;
      const profileData = await PatientProfileService.getPatientProfile(
        patientId
      );
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [patientId]);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!patientId) return;

      let invoicesData: Invoice[] = [];
      let paymentsData: Payment[] = [];
      let claimsData: InsuranceClaim[] = [];

      try {
        invoicesData = await BillingService.getInvoicesByPatient(patientId);
      } catch (err) {
        console.warn("Could not fetch invoices:", err);
      }

      try {
        const paymentsResponse = await BillingService.getPaymentsByPatient(
          patientId
        );
        paymentsData = paymentsResponse.payments || [];
      } catch (err) {
        console.warn("Could not fetch payments:", err);
      }

      try {
        const claimsResponse = await BillingService.getClaimsByPatient(
          patientId
        );
        claimsData = claimsResponse.claims || [];
      } catch (err) {
        console.warn("Could not fetch claims:", err);
      }

      setInvoices(invoicesData || []);
      setPayments(paymentsData || []);
      setClaims(claimsData || []);
    } catch (err) {
      console.error("❌ Error fetching billing data:", err);
      setError("Failed to load billing information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      navigate("/patient-login");
      return;
    }
    fetchProfile();
    fetchBillingData();
  }, [patientId, navigate, fetchProfile, fetchBillingData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchBillingData()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      authService.logout();
      navigate("/");
    }
  };

  // Calculate financials - Updated to use total_amount from Invoice interface
  const totalInvoiceAmount = invoices.reduce((sum, inv) => {
    const amount =
      inv.total_amount ||
      parseFloat(String(inv.sub_total || 0)) +
        parseFloat(String(inv.tax_amount || 0));
    return sum + parseFloat(String(amount));
  }, 0);

  const totalPaymentsMade = payments
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + parseFloat(String(p.amount_paid || 0)), 0);

  const patientBalance = totalInvoiceAmount - totalPaymentsMade;

  const outstandingBills = invoices.filter((inv) => {
    const invoiceAmount = inv.total_amount
      ? parseFloat(String(inv.total_amount))
      : parseFloat(String(inv.sub_total || 0)) +
        parseFloat(String(inv.tax_amount || 0));

    const paidAmount = payments
      .filter((p) => p.status === "Completed")
      .reduce((sum, p) => sum + parseFloat(String(p.amount_paid)), 0);
    return invoiceAmount > paidAmount;
  });

  const totalOutstanding = outstandingBills.reduce((sum, bill) => {
    const amount =
      bill.total_amount ||
      parseFloat(String(bill.sub_total || 0)) +
        parseFloat(String(bill.tax_amount || 0));
    return sum + parseFloat(String(amount));
  }, 0);

  const totalPaidThisMonth = payments
    .filter((p) => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return (
        p.status === "Completed" &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + parseFloat(String(p.amount_paid)), 0);

  const handlePayNow = (bill: Invoice) => {
    setSelectedBill(bill);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBill || !patientId) return;

    if (
      paymentMethod === "Credit Card" &&
      (!cardNumber || !cardExpiry || !cardCVV)
    ) {
      alert("Please fill in all card details");
      return;
    }

    try {
      setProcessingPayment(true);

      const billTotal = selectedBill.total_amount
        ? parseFloat(String(selectedBill.total_amount))
        : parseFloat(String(selectedBill.sub_total || 0)) +
          parseFloat(String(selectedBill.tax_amount || 0));

      const paymentData: PaymentCreateData = {
        patient_id: patientId,
        amount_paid: billTotal,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split("T")[0],
        notes: `Payment for invoice ${selectedBill.invoice_id}`,
      };

      await BillingService.createPayment(paymentData);

      alert(
        `Payment of LKR ${billTotal.toLocaleString()} processed successfully!`
      );

      // Refresh billing data
      await fetchBillingData();

      // Reset form
      setSelectedBill(null);
      setShowPaymentDialog(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCVV("");
      setPaymentMethod("Credit Card");
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert(
        "Payment failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "Failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "Refunded":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-900";
      case "Pending":
        return "bg-amber-50 text-amber-900";
      case "Failed":
        return "bg-red-50 text-red-900";
      case "Refunded":
        return "bg-blue-50 text-blue-900";
      default:
        return "bg-gray-50 text-gray-900";
    }
  };

  // Helper function to get invoice display date
  const getInvoiceDate = (invoice: Invoice): string => {
    return invoice.created_at || new Date().toISOString();
  };

  // Helper function to get invoice total
  const getInvoiceTotal = (invoice: Invoice): number => {
    if (invoice.total_amount) {
      return parseFloat(String(invoice.total_amount));
    }
    return (
      parseFloat(String(invoice.sub_total || 0)) +
      parseFloat(String(invoice.tax_amount || 0))
    );
  };

  if (error && loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">Error Loading Billing Data</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={handleRefresh} className="w-full">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Billing & Payments
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your invoices and payments
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Current Balance
            </p>
            <p
              className={`text-2xl font-bold ${
                patientBalance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              LKR {Math.abs(patientBalance).toLocaleString()}
              {patientBalance < 0 && (
                <span className="text-sm ml-2">(Overpaid)</span>
              )}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Loading billing information...
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <>
            {/* Balance Breakdown */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Balance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Total Invoices:</span>
                    <span className="font-bold">
                      LKR {totalInvoiceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Total Payments:</span>
                    <span className="font-bold text-green-600">
                      - LKR {totalPaymentsMade.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div
                    className={`flex justify-between items-center p-4 rounded-lg font-bold text-lg ${
                      patientBalance > 0
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-green-50 text-green-600 border border-green-200"
                    }`}
                  >
                    <span>Patient Balance:</span>
                    <span>
                      LKR {Math.abs(patientBalance).toLocaleString()}{" "}
                      {patientBalance < 0
                        ? "(Credit)"
                        : patientBalance > 0
                        ? "(Due)"
                        : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(value: string) =>
                    setActiveTab(value as typeof activeTab)
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="outstanding">
                      Outstanding{" "}
                      <Badge className="ml-2">{outstandingBills.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      Payment History{" "}
                      <Badge className="ml-2">{payments.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="insurance">
                      Insurance Claims{" "}
                      <Badge className="ml-2">{claims.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* Outstanding Bills Tab */}
                  <TabsContent value="outstanding" className="mt-6 space-y-4">
                    {outstandingBills.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Outstanding Bills
                        </h3>
                        <p className="text-muted-foreground">
                          You're all caught up on payments!
                        </p>
                      </div>
                    ) : (
                      outstandingBills.map((bill) => (
                        <div
                          key={bill.invoice_id}
                          className="p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                Invoice {bill.invoice_id.slice(0, 8)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  getInvoiceDate(bill)
                                ).toLocaleDateString()}
                              </p>
                              {bill.due_date && (
                                <p className="text-xs text-muted-foreground">
                                  Due:{" "}
                                  {new Date(bill.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <Badge variant="destructive">Outstanding</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-foreground">
                              LKR {getInvoiceTotal(bill).toLocaleString()}
                            </p>
                            <Button
                              variant="default"
                              onClick={() => handlePayNow(bill)}
                            >
                              Pay Now
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Payment History Tab */}
                  <TabsContent value="history" className="mt-6 space-y-4">
                    {payments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Payment History
                        </h3>
                        <p className="text-muted-foreground">
                          You haven't made any payments yet.
                        </p>
                      </div>
                    ) : (
                      payments.map((payment, idx) => (
                        <div
                          key={payment.payment_id || idx}
                          className={`p-4 border border-border rounded-lg ${getPaymentStatusColor(
                            payment.status
                          )}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getPaymentStatusIcon(payment.status)}
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {payment.payment_method} Payment
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    payment.payment_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                payment.status === "Completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            LKR{" "}
                            {parseFloat(
                              String(payment.amount_paid)
                            ).toLocaleString()}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Insurance Claims Tab */}
                  <TabsContent value="insurance" className="mt-6 space-y-4">
                    {claims.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Insurance Claims
                        </h3>
                        <p className="text-muted-foreground">
                          You don't have any insurance claims yet.
                        </p>
                      </div>
                    ) : (
                      claims.map((claim) => (
                        <div
                          key={claim.claim_id}
                          className="p-4 border border-border rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                Claim {claim.claim_id.slice(0, 8)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  claim.claim_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge>{claim.status}</Badge>
                          </div>
                          {claim.package_name && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Package: {claim.package_name}
                            </p>
                          )}
                          <p className="text-2xl font-bold text-foreground">
                            LKR{" "}
                            {parseFloat(
                              String(claim.claim_amount)
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Complete your payment for invoice{" "}
              {selectedBill?.invoice_id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Invoice Amount:</span>
                      <span className="font-medium">
                        LKR {getInvoiceTotal(selectedBill).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Due:</span>
                      <span>
                        LKR {getInvoiceTotal(selectedBill).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Payment Method
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    ["Credit Card", "Bank Transfer", "Mobile Payment"] as const
                  ).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        paymentMethod === method
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === "Credit Card" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "Bank Transfer" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please transfer funds to the bank account details provided.
                    Reference your invoice number in the transfer description.
                  </AlertDescription>
                </Alert>
              )}

              {paymentMethod === "Mobile Payment" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You will receive a payment link via SMS or email. Follow the
                    instructions to complete the payment.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={processingPayment}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={processingPayment}
                  className="flex-1"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
