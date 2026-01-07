// User Types
export type UserRole = 'admin' | 'provider' | 'customer' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Invoice Types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  description?: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

// Payment Types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

export interface Payment {
  id: string;
  reference: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  createdAt: Date;
}

// Payment Method Types
export interface PaymentMethodDetails {
  id: string;
  type: 'card' | 'bank_account';
  lastFour: string;
  brand?: string;
  bankName?: string;
  holderName: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

// Ticket Types
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  customerName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  isStaff: boolean;
  createdAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  totalPaidAmount: number;
  pendingAmount: number;
  totalRevenue: number;
  totalUsers: number;
  openTickets: number;
  resolvedTickets: number;
}
