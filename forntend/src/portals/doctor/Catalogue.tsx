import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "@/portals/doctor/Navbar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  Loader2,
  Download,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import treatmentCatalogueService from "@/services/treatmentCatalogueService";
import "@/index.css";

// ============================================
// TYPES
// ============================================

interface Treatment {
  treatment_service_code?: string;
  treatment_name: string;
  base_price: number;
  duration: string;
  description?: string;
}

interface TreatmentSummary {
  total: number;
  average_price: number;
  min_price: number;
  max_price: number;
}

// ============================================
// DOCTOR TREATMENTS COMPONENT
// ============================================

export default function DoctorCatalogue(): React.ReactElement {
  const navigate = useNavigate();

  // State
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceSort, setPriceSort] = useState<"all" | "asc" | "desc">("all");
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doctorName = useMemo(
    () => localStorage.getItem("full_name") || "Doctor",
    []
  );
  const doctorEmail = useMemo(() => localStorage.getItem("email") || "", []);
  const specialization = useMemo(
    () => localStorage.getItem("specialization") || "Physician",
    []
  );

  // Fetch treatments
  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await treatmentCatalogueService.getAllTreatments(
        0,
        500,
        search
      );
      setTreatments(response.treatments || []);
    } catch (err) {
      console.error("Error loading treatments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load treatments"
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Filter and sort treatments
  const filtered = useMemo(() => {
    let list = treatments;

    // Search
    if (search.trim()) {
      list = treatmentCatalogueService.searchTreatments(list, search);
    }

    // Sort by price
    if (priceSort !== "all") {
      list = treatmentCatalogueService.sortByPrice(
        list,
        priceSort === "asc" ? "asc" : "desc"
      );
    }

    return list;
  }, [treatments, search, priceSort]);

  // Summary stats
  const summary: TreatmentSummary = useMemo(() => {
    if (treatments.length === 0) {
      return { total: 0, average_price: 0, min_price: 0, max_price: 0 };
    }

    const prices = treatments.map((t) => t.base_price);
    return {
      total: treatments.length,
      average_price: treatmentCatalogueService.getAveragePrice(treatments),
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
    };
  }, [treatments]);

  // Lifecycle
  useEffect(() => {
    void fetchTreatments();
  }, [fetchTreatments, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/doctor-login", { replace: true });
  };

  const handleDeleteTreatment = async (code: string) => {
    if (!window.confirm("Are you sure you want to delete this treatment?"))
      return;

    setDeleting(true);
    try {
      await treatmentCatalogueService.deleteTreatment(code);
      setTreatments(
        treatments.filter((t) => t.treatment_service_code !== code)
      );
      setShowDetails(false);
      alert("Treatment deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete treatment");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    treatmentCatalogueService.exportAsCSV(filtered, "treatments.csv");
  };

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-2">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading treatments...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              Treatment Catalogue
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage available treatments
            </p>
          </div>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search & Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search treatments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select
                value={priceSort}
                onValueChange={(v) => setPriceSort(v as "all" | "asc" | "desc")}
              >
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="asc">Price: Low to High</SelectItem>
                  <SelectItem value="desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Treatments List */}
        <Card>
          <CardHeader>
            <CardTitle>Treatments ({filtered.length})</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No treatments found
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2 pr-4">
                  {filtered.map((treatment) => (
                    <div
                      key={treatment.treatment_service_code}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      {/* Treatment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm truncate">
                            {treatment.treatment_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] flex-shrink-0"
                          >
                            {treatment.treatment_service_code}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {treatmentCatalogueService.formatPrice(
                              treatment.base_price
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {treatmentCatalogueService.formatDuration(
                              treatment.duration
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTreatment(treatment);
                            setShowDetails(true);
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Details Dialog */}
      {selectedTreatment && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedTreatment.treatment_name}</DialogTitle>
              <DialogDescription>
                {selectedTreatment.treatment_service_code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Price
                </label>
                <p className="text-lg font-bold">
                  {treatmentCatalogueService.formatPrice(
                    selectedTreatment.base_price
                  )}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Duration
                </label>
                <p className="text-sm">
                  {treatmentCatalogueService.formatDuration(
                    selectedTreatment.duration
                  )}
                </p>
              </div>

              {selectedTreatment.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedTreatment.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigate(
                      `/doctor/treatments/${selectedTreatment.treatment_service_code}/edit`
                    );
                    setShowDetails(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    handleDeleteTreatment(
                      selectedTreatment.treatment_service_code || ""
                    )
                  }
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
