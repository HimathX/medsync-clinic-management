// ============================================================================
// MedSync React Component Library
// ============================================================================
// Reusable, modern React components built on the design system
// Import and use these components throughout your application
// ============================================================================

import React from 'react';

// ============================================================================
// 1. BUTTON COMPONENTS
// ============================================================================

/**
 * Modern Button Component with multiple variants
 * @param {string} variant - 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'text'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Disable the button
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Button content
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = `btn btn-${variant} btn-${size}`;
  return (
    <button
      className={`${baseClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================================================
// 2. CARD COMPONENTS
// ============================================================================

/**
 * Modern Card Component
 * @param {string} variant - 'default' | 'primary' | 'success' | 'elevated'
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Card content
 */
export const Card = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  return (
    <div className={`card ${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-lg border-b border-light ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Body Component
 */
export const CardBody = ({ className = '', children, ...props }) => (
  <div className={`p-lg ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`p-lg border-t border-light flex-between ${className}`} {...props}>
    {children}
  </div>
);

// ============================================================================
// 3. FORM COMPONENTS
// ============================================================================

/**
 * Form Group Component - Wrapper for label and input
 */
export const FormGroup = ({ label, error, required, className = '', children, ...props }) => (
  <div className={`form-group ${className}`} {...props}>
    {label && (
      <label className="font-semibold text-sm">
        {label}
        {required && <span className="text-danger ml-xs">*</span>}
      </label>
    )}
    {children}
    {error && <span className="text-danger text-xs mt-xs">{error}</span>}
  </div>
);

/**
 * Input Component
 */
export const Input = React.forwardRef(
  ({ error, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`${error ? 'border-danger' : ''} ${className}`}
      {...props}
    />
  )
);

/**
 * Textarea Component
 */
export const Textarea = React.forwardRef(
  ({ error, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${error ? 'border-danger' : ''} ${className}`}
      {...props}
    />
  )
);

/**
 * Select Component
 */
export const Select = React.forwardRef(
  ({ error, options = [], className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`${error ? 'border-danger' : ''} ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
);

// ============================================================================
// 4. ALERT & NOTIFICATION COMPONENTS
// ============================================================================

/**
 * Alert Component
 * @param {string} type - 'success' | 'warning' | 'danger' | 'info'
 * @param {string} title - Alert title
 * @param {ReactNode} children - Alert content
 */
export const Alert = ({ type = 'info', title, children, onClose, className = '' }) => {
  const icons = {
    success: '✓',
    warning: '⚠️',
    danger: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`alert alert-${type} ${className}`}>
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-col flex-1">
        {title && <strong>{title}</strong>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="btn-text text-sm"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 5. BADGE COMPONENTS
// ============================================================================

/**
 * Badge Component
 * @param {string} variant - 'primary' | 'success' | 'warning' | 'danger'
 * @param {ReactNode} children - Badge content
 */
export const Badge = ({ variant = 'primary', children, className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>
    {children}
  </span>
);

// ============================================================================
// 6. MODAL COMPONENTS
// ============================================================================

/**
 * Modal Component
 * @param {boolean} isOpen - Control modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 */
export const Modal = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="modal-header">
            {title && <h2>{title}</h2>}
            {onClose && (
              <button
                onClick={onClose}
                className="btn-icon text-2xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ============================================================================
// 7. TABLE COMPONENTS
// ============================================================================

/**
 * Table Component
 */
export const Table = ({ children, className = '' }) => (
  <div className="table-wrapper">
    <table className={className}>{children}</table>
  </div>
);

/**
 * Table Header
 */
export const TableHeader = ({ columns }) => (
  <thead>
    <tr>
      {columns.map((col) => (
        <th key={col.key}>{col.label}</th>
      ))}
    </tr>
  </thead>
);

/**
 * Table Body
 */
export const TableBody = ({ rows, columns, renderRow }) => (
  <tbody>
    {rows.map((row, idx) => (
      <tr key={row.id || idx}>
        {renderRow ? (
          renderRow(row)
        ) : (
          columns.map((col) => (
            <td key={col.key}>{row[col.key]}</td>
          ))
        )}
      </tr>
    ))}
  </tbody>
);

// ============================================================================
// 8. GRID & LAYOUT COMPONENTS
// ============================================================================

/**
 * Grid Component for responsive layouts
 * @param {number} cols - Number of columns (1-4)
 */
export const Grid = ({ cols = 3, className = '', children }) => (
  <div className={`grid grid-cols-${cols} ${className}`}>
    {children}
  </div>
);

/**
 * Flexbox Component
 */
export const Flex = ({
  direction = 'row',
  justify = 'start',
  align = 'stretch',
  gap = 'md',
  className = '',
  children,
}) => (
  <div
    className={`flex flex-${direction === 'col' ? 'col' : 'row'} flex-gap-${gap} ${className}`}
    style={{
      justifyContent: justify,
      alignItems: align,
    }}
  >
    {children}
  </div>
);

// ============================================================================
// 9. STAT CARD COMPONENT
// ============================================================================

/**
 * Stat Card - Common pattern in dashboards
 */
export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendDirection = 'up',
  color = 'primary',
}) => (
  <Card className="stat-card">
    <div className="flex-between mb-lg">
      <h5>{title}</h5>
      {icon && <span className="text-2xl">{icon}</span>}
    </div>
    <div className="mb-md">
      <p className={`text-3xl font-bold text-${color}`}>{value}</p>
    </div>
    {trend && (
      <p className={`text-sm text-${trendDirection === 'up' ? 'success' : 'danger'}`}>
        {trendDirection === 'up' ? '↑' : '↓'} {trend}
      </p>
    )}
  </Card>
);

// ============================================================================
// 10. LOADING & SKELETON COMPONENTS
// ============================================================================

/**
 * Loading Spinner
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  return <div className={`spinner ${sizes[size]} ${className}`} />;
};

/**
 * Skeleton Loading Component
 */
export const Skeleton = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-lg',
}) => (
  <div className={`skeleton ${width} ${height} ${rounded}`} />
);

/**
 * Card Skeleton - Loading placeholder for cards
 */
export const CardSkeleton = () => (
  <Card>
    <Skeleton height="h-6" className="mb-lg" />
    <Skeleton height="h-4" className="mb-md" />
    <Skeleton height="h-4" />
    <Skeleton height="h-4" className="mt-md" width="w-2/3" />
  </Card>
);

// ============================================================================
// 11. UTILITY COMPONENTS
// ============================================================================

/**
 * Container - Responsive max-width wrapper
 */
export const Container = ({ className = '', children }) => (
  <div className={`container ${className}`}>{children}</div>
);

/**
 * Section - Page section with optional heading
 */
export const Section = ({ title, className = '', children }) => (
  <section className={`mb-3xl ${className}`}>
    {title && <h2 className="mb-lg">{title}</h2>}
    {children}
  </section>
);

/**
 * Divider - Visual separator
 */
export const Divider = ({ className = '' }) => (
  <hr className={`border-t border-light my-lg ${className}`} />
);

/**
 * Badge Pill - Small inline label
 */
export const BadgePill = ({ children, className = '' }) => (
  <span
    className={`inline-block px-2 py-1 text-xs rounded-full font-semibold bg-primary-100 text-primary-700 ${className}`}
  >
    {children}
  </span>
);

// ============================================================================
// 12. USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Dashboard with Stats
import { Container, Grid, StatCard, Card, Button } from './components/ComponentLibrary';

export const ExampleDashboard = () => (
  <Container>
    <h1 className="mb-3xl">Dashboard</h1>
    
    <Grid cols={4}>
      <StatCard
        title="Total Patients"
        value="1,234"
        icon="👥"
        trend="+12%"
        trendDirection="up"
      />
      <StatCard
        title="Today's Appointments"
        value="24"
        icon="📅"
        trend="+5%"
        trendDirection="up"
      />
      <StatCard
        title="Pending Consultations"
        value="8"
        icon="📋"
        trend="-3%"
        trendDirection="down"
      />
      <StatCard
        title="Revenue (Today)"
        value="$2,450"
        icon="💰"
        trend="+18%"
        trendDirection="up"
      />
    </Grid>
  </Container>
);

// Example 2: Form Modal
import { Modal, FormGroup, Input, Button } from './components/ComponentLibrary';

export const ExampleFormModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Form</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Patient"
        footer={
          <div className="flex-gap-md">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Create
            </Button>
          </div>
        }
      >
        <FormGroup label="Patient Name" required>
          <Input type="text" placeholder="Enter patient name" />
        </FormGroup>
        <FormGroup label="Email" required>
          <Input type="email" placeholder="patient@example.com" />
        </FormGroup>
        <FormGroup label="Phone">
          <Input type="tel" placeholder="+1 (555) 000-0000" />
        </FormGroup>
      </Modal>
    </>
  );
};

// Example 3: Data Table
import { Table, TableHeader, TableBody, Button } from './components/ComponentLibrary';

export const ExampleTable = () => {
  const columns = [
    { key: 'name', label: 'Patient Name' },
    { key: 'appointment', label: 'Appointment' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action' },
  ];

  const data = [
    { id: 1, name: 'John Doe', appointment: '10:00 AM', status: 'Confirmed' },
    { id: 2, name: 'Jane Smith', appointment: '10:30 AM', status: 'Pending' },
  ];

  return (
    <Table>
      <TableHeader columns={columns} />
      <TableBody
        rows={data}
        columns={columns}
        renderRow={(row) => (
          <>
            <td>{row.name}</td>
            <td>{row.appointment}</td>
            <td>
              <Badge variant={row.status === 'Confirmed' ? 'success' : 'warning'}>
                {row.status}
              </Badge>
            </td>
            <td>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </td>
          </>
        )}
      />
    </Table>
  );
};
*/

// ============================================================================
// EXPORT ALL COMPONENTS
// ============================================================================

export default {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Input,
  Textarea,
  Select,
  Alert,
  Badge,
  Modal,
  Table,
  TableHeader,
  TableBody,
  Grid,
  Flex,
  StatCard,
  Spinner,
  Skeleton,
  CardSkeleton,
  Container,
  Section,
  Divider,
  BadgePill,
};
