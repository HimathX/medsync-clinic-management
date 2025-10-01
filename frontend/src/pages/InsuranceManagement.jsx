import { useState, useMemo } from 'react';
import QuickActions from '../components/insurance/QuickActions';
import CoverageSummary from '../components/insurance/CoverageSummary';
import InsuranceTabs from '../components/insurance/InsuranceTabs';
import PolicyOverview from '../components/insurance/PolicyOverview';
import CoverageDetails from '../components/insurance/CoverageDetails';
import ClaimsManagement from '../components/insurance/ClaimsManagement';
import Reimbursements from '../components/insurance/Reimbursements';
import ProviderNetwork from '../components/insurance/ProviderNetwork';
import '../insuranceManagement.css';

function InsuranceManagement() {
  const [activeTab, setActiveTab] = useState('policy');
  const [selectedPolicy, setSelectedPolicy] = useState('primary');

  // Sample insurance data
  const insuranceData = {
    primary: {
      provider: 'Blue Cross Blue Shield',
      providerShort: 'BC',
      planName: 'Premium Health Plan',
      policyHolder: 'John Smith',
      policyNumber: 'BC-789456123',
      groupNumber: 'GRP-45678',
      coverageType: 'Family Plan',
      effectiveDate: 'Jan 1, 2024',
      renewalDate: 'Dec 31, 2024',
      monthlyPremium: 485.00,
      deductible: 1500,
      deductibleMet: 750,
      outOfPocketMax: 5000,
      currentSpending: 1250,
      copays: {
        primaryCare: 25,
        specialist: 50,
        emergencyRoom: 250
      }
    },
    secondary: {
      provider: 'Aetna Health',
      providerShort: 'AH',
      planName: 'Supplemental Coverage',
      policyHolder: 'John Smith',
      policyNumber: 'AH-456789012',
      groupNumber: 'GRP-78901',
      coverageType: 'Individual',
      effectiveDate: 'Jan 1, 2024',
      renewalDate: 'Dec 31, 2024',
      monthlyPremium: 150.00,
      deductible: 500,
      deductibleMet: 200,
      outOfPocketMax: 2000,
      currentSpending: 350
    }
  };

  // Sample claims data
  const [claims] = useState([
    {
      id: 'CLM-001',
      date: '2024-09-15',
      provider: 'City General Hospital',
      service: 'Annual Physical Examination',
      amount: 250.00,
      covered: 225.00,
      yourCost: 25.00,
      status: 'approved',
      processedDate: '2024-09-18'
    },
    {
      id: 'CLM-002',
      date: '2024-09-20',
      provider: 'Advanced Imaging Center',
      service: 'MRI Scan - Lower Back',
      amount: 1500.00,
      covered: 1200.00,
      yourCost: 300.00,
      status: 'processing',
      submittedDate: '2024-09-21'
    },
    {
      id: 'CLM-003',
      date: '2024-09-25',
      provider: 'Downtown Dental Clinic',
      service: 'Root Canal Treatment',
      amount: 800.00,
      covered: 0,
      yourCost: 800.00,
      status: 'denied',
      reason: 'Service not covered under current plan',
      deniedDate: '2024-09-27'
    },
    {
      id: 'CLM-004',
      date: '2024-09-28',
      provider: 'Family Care Center',
      service: 'Pediatric Consultation',
      amount: 150.00,
      covered: 125.00,
      yourCost: 25.00,
      status: 'pending',
      submittedDate: '2024-09-29'
    }
  ]);

  // Sample reimbursements data
  const [reimbursements] = useState([
    {
      id: 'RMB-001',
      claimId: 'CLM-001',
      date: '2024-09-20',
      amount: 225.00,
      status: 'completed',
      method: 'Direct Deposit',
      accountEnding: '****4567'
    },
    {
      id: 'RMB-002',
      claimId: 'CLM-005',
      date: '2024-09-22',
      amount: 450.00,
      status: 'processing',
      expectedDate: '2024-10-05'
    }
  ]);

  const currentPolicy = insuranceData[selectedPolicy];
  const deductibleProgress = (currentPolicy.deductibleMet / currentPolicy.deductible) * 100;

  const handleSubmitClaim = () => {
    alert('Claim submission form will open here');
  };

  const handleViewCard = () => {
    alert('Digital insurance card viewer will open here');
  };

  const handleDownloadPolicy = () => {
    alert('Policy document download will start');
  };

  const handleFindProvider = () => {
    alert('Provider network search will open');
  };

  const handleViewClaimDetails = (claimId) => {
    alert(`Viewing details for claim: ${claimId}`);
  };

  const handleAppealClaim = (claimId) => {
    alert(`Appeal process for claim: ${claimId}`);
  };

  return (
    <div className="insurance-page">
      <div className="insurance-header">
        <div>
          <h1>Insurance Management</h1>
          <p className="insurance-subtitle">
            Manage your insurance policies, claims, and coverage information
          </p>
        </div>
      </div>

      <div className="insurance-layout">
        {/* Left Sidebar */}
        <aside className="insurance-sidebar">
          <QuickActions
            onSubmitClaim={handleSubmitClaim}
            onViewCard={handleViewCard}
            onDownloadPolicy={handleDownloadPolicy}
            onFindProvider={handleFindProvider}
          />
          
          <CoverageSummary
            deductible={currentPolicy.deductible}
            deductibleMet={currentPolicy.deductibleMet}
            remaining={currentPolicy.deductible - currentPolicy.deductibleMet}
            progress={deductibleProgress}
            outOfPocketMax={currentPolicy.outOfPocketMax}
            currentSpending={currentPolicy.currentSpending}
          />
        </aside>

        {/* Main Content */}
        <main className="insurance-main">
          <InsuranceTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="insurance-content">
            {activeTab === 'policy' && (
              <PolicyOverview
                policy={currentPolicy}
                selectedPolicy={selectedPolicy}
                onPolicyChange={setSelectedPolicy}
              />
            )}

            {activeTab === 'coverage' && (
              <CoverageDetails policy={currentPolicy} />
            )}

            {activeTab === 'claims' && (
              <ClaimsManagement
                claims={claims}
                onViewDetails={handleViewClaimDetails}
                onAppeal={handleAppealClaim}
              />
            )}

            {activeTab === 'reimbursements' && (
              <Reimbursements reimbursements={reimbursements} />
            )}

            {activeTab === 'network' && (
              <ProviderNetwork />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default InsuranceManagement;
