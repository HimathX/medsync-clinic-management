import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import reportService, {
  type ReportFilters,
  type BranchAppointmentsReport,
  type DoctorRevenueReport,
  type OutstandingBalancesReport,
  type TreatmentsByCategoryReport,
  type InsuranceVsOutOfPocketReport,
} from "@/services/reportService";
import EmployeeNavbar from "@/portals/employee/Navbar";

type ReportType =
  | "branch-appointments"
  | "doctor-revenue"
  | "outstanding-balances"
  | "treatments"
  | "insurance";

export default function EmployeeReports(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ReportType>("branch-appointments");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>("");

  // Report data states
  const [branchAppointments, setBranchAppointments] =
    useState<BranchAppointmentsReport | null>(null);
  const [doctorRevenue, setDoctorRevenue] =
    useState<DoctorRevenueReport | null>(null);
  const [outstandingBalances, setOutstandingBalances] =
    useState<OutstandingBalancesReport | null>(null);
  const [treatmentsByCategory, setTreatmentsByCategory] =
    useState<TreatmentsByCategoryReport | null>(null);
  const [insuranceVsOutOfPocket, setInsuranceVsOutOfPocket] =
    useState<InsuranceVsOutOfPocketReport | null>(null);

  // Filter states
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: "",
    dateTo: "",
    branchName: "",
    year: new Date().getFullYear(),
    month: "",
    doctorId: "",
    minBalance: "",
    maxBalance: "",
  });

  const handleLogout = (): void => {
    localStorage.removeItem("auth_token");
    window.location.href = "/employee-login";
  };

  const handleRefresh = useCallback(async (): Promise<void> => {
    await fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (reportType: ReportType): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      switch (reportType) {
        case "branch-appointments":
          const appointments = await reportService.getBranchAppointments(
            filters
          );
          setBranchAppointments(appointments);
          break;
        case "doctor-revenue":
          const revenue = await reportService.getDoctorRevenue(filters);
          setDoctorRevenue(revenue);
          break;
        case "outstanding-balances":
          const balances = await reportService.getOutstandingBalances(filters);
          setOutstandingBalances(balances);
          break;
        case "treatments":
          const treatments = await reportService.getTreatmentsByCategory(
            filters
          );
          setTreatmentsByCategory(treatments);
          break;
        case "insurance":
          const insurance = await reportService.getInsuranceVsOutOfPocket(
            filters
          );
          setInsuranceVsOutOfPocket(insurance);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (reportType: ReportType): Promise<void> => {
    setDownloading(true);
    try {
      await reportService.downloadPDF(reportType, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount || 0);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num || 0);
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    description,
    variant = "default",
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    description: string;
    variant?: "default" | "success" | "warning" | "info";
  }) => {
    const variants = {
      default: "bg-blue-50 border-l-blue-500",
      success: "bg-green-50 border-l-green-500",
      warning: "bg-amber-50 border-l-amber-500",
      info: "bg-cyan-50 border-l-cyan-500",
    };

    return (
      <Card className={`border-l-4 ${variants[variant]}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            {Icon}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <CardDescription className="text-xs mt-1">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    );
  };

  const DownloadButton = ({
    reportType,
    label = "Download PDF",
  }: {
    reportType: ReportType;
    label?: string;
  }) => (
    <Button
      variant="outline"
      onClick={() => handleDownloadPDF(reportType)}
      disabled={downloading}
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );

  // Auto-load data on tab change
  useEffect(() => {
    void fetchReportData(activeTab);
  }, [activeTab]);

  // Auto-load on filter change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchReportData(activeTab);
    }, 400);
    return () => clearTimeout(t);
  }, [activeTab, filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName="Employee"
        employeeEmail="employee@example.com"
        employeeRole="Reports Analyst"
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Reports & Analytics
          </h1>
          <p className="text-slate-600 mt-2">
            Comprehensive clinic reports with PDF export
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ReportType)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger
              value="branch-appointments"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger
              value="doctor-revenue"
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger
              value="outstanding-balances"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Outstanding</span>
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Treatments</span>
            </TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Insurance</span>
            </TabsTrigger>
          </TabsList>

          {/* Branch Appointments Report */}
          <TabsContent value="branch-appointments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Branch Appointments Report
                  </CardTitle>
                  <CardDescription>
                    View appointment data across branches
                  </CardDescription>
                </div>
                <DownloadButton reportType="branch-appointments" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="apt-from">From Date</Label>
                    <Input
                      id="apt-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apt-to">To Date</Label>
                    <Input
                      id="apt-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apt-branch">Branch Name</Label>
                    <Input
                      id="apt-branch"
                      placeholder="Branch name"
                      value={filters.branchName}
                      onChange={(e) =>
                        setFilters({ ...filters, branchName: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                {branchAppointments && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      icon={<Calendar className="w-5 h-5 text-blue-600" />}
                      title="Total Records"
                      value={formatNumber(branchAppointments.total_records)}
                      description="Appointment records found"
                      variant="default"
                    />
                  </div>
                )}

                {/* Table */}
                {branchAppointments?.data &&
                  branchAppointments.data.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow>
                            <TableHead>Branch</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {branchAppointments.data
                            .slice(0, 10)
                            .map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {item.branch_name}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    item.available_date
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      item.status === "confirmed"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {item.appointment_count}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {branchAppointments.data.length > 10 && (
                        <div className="p-4 bg-slate-50 text-center text-sm text-slate-600 border-t">
                          Showing 10 of {branchAppointments.data.length}{" "}
                          records. Download PDF for full report.
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctor Revenue Report */}
          <TabsContent value="doctor-revenue" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Doctor Revenue Report
                  </CardTitle>
                  <CardDescription>
                    Track revenue by doctor and period
                  </CardDescription>
                </div>
                <DownloadButton reportType="doctor-revenue" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="rev-year">Year</Label>
                    <Input
                      id="rev-year"
                      type="number"
                      value={filters.year}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          year: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rev-month">Month (YYYY-MM)</Label>
                    <Input
                      id="rev-month"
                      placeholder="2024-01"
                      value={filters.month}
                      onChange={(e) =>
                        setFilters({ ...filters, month: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rev-doctor">Doctor ID</Label>
                    <Input
                      id="rev-doctor"
                      placeholder="Doctor ID"
                      value={filters.doctorId}
                      onChange={(e) =>
                        setFilters({ ...filters, doctorId: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                {doctorRevenue && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      icon={<DollarSign className="w-5 h-5 text-green-600" />}
                      title="Total Revenue"
                      value={formatCurrency(doctorRevenue.total_revenue)}
                      description="All doctors combined"
                      variant="success"
                    />
                    <StatCard
                      icon={<Users className="w-5 h-5 text-blue-600" />}
                      title="Doctor Records"
                      value={formatNumber(doctorRevenue.total_records)}
                      description="Doctors with revenue"
                      variant="info"
                    />
                  </div>
                )}

                {/* Table */}
                {doctorRevenue?.data && doctorRevenue.data.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead>Doctor Name</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctorRevenue.data.slice(0, 10).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.doctor_name}
                            </TableCell>
                            <TableCell>{item.month}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {doctorRevenue.data.length > 10 && (
                      <div className="p-4 bg-slate-50 text-center text-sm text-slate-600 border-t">
                        Showing 10 of {doctorRevenue.data.length} records.
                        Download PDF for full report.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outstanding Balances Report */}
          <TabsContent value="outstanding-balances" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Outstanding Balances
                  </CardTitle>
                  <CardDescription>
                    Patients with unpaid balances
                  </CardDescription>
                </div>
                <DownloadButton reportType="outstanding-balances" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="bal-min">Min Balance</Label>
                    <Input
                      id="bal-min"
                      type="number"
                      placeholder="1000"
                      value={filters.minBalance}
                      onChange={(e) =>
                        setFilters({ ...filters, minBalance: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bal-max">Max Balance</Label>
                    <Input
                      id="bal-max"
                      type="number"
                      placeholder="50000"
                      value={filters.maxBalance}
                      onChange={(e) =>
                        setFilters({ ...filters, maxBalance: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                {outstandingBalances && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                      title="Total Outstanding"
                      value={formatCurrency(
                        outstandingBalances.total_outstanding
                      )}
                      description="All unpaid amounts"
                      variant="warning"
                    />
                    <StatCard
                      icon={<Users className="w-5 h-5 text-blue-600" />}
                      title="Patients"
                      value={formatNumber(outstandingBalances.total_patients)}
                      description="With outstanding balance"
                      variant="info"
                    />
                  </div>
                )}

                {/* Table */}
                {outstandingBalances?.data &&
                  outstandingBalances.data.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Patient Name</TableHead>
                            <TableHead className="text-right">
                              Balance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outstandingBalances.data
                            .slice(0, 10)
                            .map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">
                                  #{item.patient_id}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {item.patient_name}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-red-600">
                                  {formatCurrency(item.patient_balance)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {outstandingBalances.data.length > 10 && (
                        <div className="p-4 bg-slate-50 text-center text-sm text-slate-600 border-t">
                          Showing 10 of {outstandingBalances.data.length}{" "}
                          records. Download PDF for full report.
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Report */}
          <TabsContent value="treatments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Treatments by Category
                  </CardTitle>
                  <CardDescription>
                    View treatment data and revenue breakdown
                  </CardDescription>
                </div>
                <DownloadButton reportType="treatments" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="treat-from">From Date</Label>
                    <Input
                      id="treat-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treat-to">To Date</Label>
                    <Input
                      id="treat-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                {treatmentsByCategory && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                      title="Total Treatments"
                      value={formatNumber(
                        treatmentsByCategory.total_treatments
                      )}
                      description="All treatments performed"
                      variant="default"
                    />
                    <StatCard
                      icon={<DollarSign className="w-5 h-5 text-green-600" />}
                      title="Total Revenue"
                      value={formatCurrency(treatmentsByCategory.total_revenue)}
                      description="From treatments"
                      variant="success"
                    />
                  </div>
                )}

                {/* Table */}
                {treatmentsByCategory?.data &&
                  treatmentsByCategory.data.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow>
                            <TableHead>Treatment Name</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">
                              Revenue
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {treatmentsByCategory.data
                            .slice(0, 10)
                            .map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {item.treatment_name}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(item.treatment_count)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                  {formatCurrency(item.total_revenue)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {treatmentsByCategory.data.length > 10 && (
                        <div className="p-4 bg-slate-50 text-center text-sm text-slate-600 border-t">
                          Showing 10 of {treatmentsByCategory.data.length}{" "}
                          records. Download PDF for full report.
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Report */}
          <TabsContent value="insurance" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Insurance vs Out-of-Pocket
                  </CardTitle>
                  <CardDescription>
                    Payment method breakdown and analysis
                  </CardDescription>
                </div>
                <DownloadButton reportType="insurance" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="ins-from">From Date</Label>
                    <Input
                      id="ins-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ins-to">To Date</Label>
                    <Input
                      id="ins-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stats */}
                {insuranceVsOutOfPocket && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
                      title="Insurance Total"
                      value={formatCurrency(
                        insuranceVsOutOfPocket.insurance_total
                      )}
                      description="Insurance payments"
                      variant="info"
                    />
                    <StatCard
                      icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                      title="Out-of-Pocket Total"
                      value={formatCurrency(
                        insuranceVsOutOfPocket.out_of_pocket_total
                      )}
                      description="Patient payments"
                      variant="warning"
                    />
                    <StatCard
                      icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                      title="Insurance Coverage"
                      value={`${
                        insuranceVsOutOfPocket.insurance_total &&
                        insuranceVsOutOfPocket.out_of_pocket_total
                          ? Math.round(
                              (insuranceVsOutOfPocket.insurance_total /
                                (insuranceVsOutOfPocket.insurance_total +
                                  insuranceVsOutOfPocket.out_of_pocket_total)) *
                                100
                            )
                          : 0
                      }%`}
                      description="Percentage covered"
                      variant="success"
                    />
                  </div>
                )}

                {/* Table */}
                {insuranceVsOutOfPocket?.details &&
                  insuranceVsOutOfPocket.details.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">
                              Patients
                            </TableHead>
                            <TableHead className="text-right">
                              Avg Payment
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insuranceVsOutOfPocket.details.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {item.payment_method}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(item.patient_count)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.avg_payment)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
