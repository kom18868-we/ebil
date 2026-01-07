import { cn } from '@/lib/utils';
import { InvoiceStatus, PaymentStatus, TicketStatus, TicketPriority } from '@/types';

interface StatusBadgeProps {
  status: InvoiceStatus | PaymentStatus | TicketStatus | TicketPriority | string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { className: string; label: string }> = {
  // Invoice & Payment Status
  pending: { className: 'bg-warning-light text-warning', label: 'Pending' },
  paid: { className: 'bg-success-light text-success', label: 'Paid' },
  completed: { className: 'bg-success-light text-success', label: 'Completed' },
  overdue: { className: 'bg-error-light text-error', label: 'Overdue' },
  cancelled: { className: 'bg-muted text-muted-foreground', label: 'Cancelled' },
  archived: { className: 'bg-muted text-muted-foreground', label: 'Archived' },
  failed: { className: 'bg-error-light text-error', label: 'Failed' },
  refunded: { className: 'bg-info-light text-info', label: 'Refunded' },
  
  // Ticket Status
  open: { className: 'bg-info-light text-info', label: 'Open' },
  in_progress: { className: 'bg-warning-light text-warning', label: 'In Progress' },
  resolved: { className: 'bg-success-light text-success', label: 'Resolved' },
  closed: { className: 'bg-muted text-muted-foreground', label: 'Closed' },
  
  // Priority
  low: { className: 'bg-muted text-muted-foreground', label: 'Low' },
  medium: { className: 'bg-info-light text-info', label: 'Medium' },
  high: { className: 'bg-warning-light text-warning', label: 'High' },
  urgent: { className: 'bg-error-light text-error', label: 'Urgent' },
  
  // User Status
  active: { className: 'bg-success-light text-success', label: 'Active' },
  inactive: { className: 'bg-muted text-muted-foreground', label: 'Inactive' },
  suspended: { className: 'bg-error-light text-error', label: 'Suspended' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { className: 'bg-muted text-muted-foreground', label: status };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full capitalize',
      config.className,
      sizeClasses[size]
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
