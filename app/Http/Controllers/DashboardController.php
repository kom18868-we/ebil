<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SupportTicket;
use App\Models\User;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $user = Auth::user();
        
        if ($user->hasRole('admin')) {
            return $this->adminDashboard();
        } elseif ($user->hasRole('service_provider')) {
            return $this->providerDashboard();
        } elseif ($user->hasRole('customer')) {
            return $this->customerDashboard();
        } elseif ($user->hasRole('support_agent')) {
            return $this->supportDashboard();
        }

        return view('dashboard.default');
    }

    /**
     * API endpoint for dashboard data
     */
    public function apiIndex(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->hasRole('admin')) {
            return response()->json($this->getAdminDashboardData());
        } elseif ($user->hasRole('service_provider')) {
            return response()->json($this->getProviderDashboardData($user));
        } elseif ($user->hasRole('customer')) {
            return response()->json($this->getCustomerDashboardData($user));
        } elseif ($user->hasRole('support_agent')) {
            return response()->json($this->getSupportDashboardData($user));
        }

        return response()->json(['message' => 'No dashboard data available'], 403);
    }

    private function adminDashboard()
    {
        return redirect()->route('admin.dashboard');
    }

    private function getAdminDashboardData(): array
    {
        return [
            'type' => 'admin',
            'stats' => [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'total_invoices' => Invoice::count(),
                'pending_invoices' => Invoice::where('status', 'pending')->count(),
                'overdue_invoices' => Invoice::overdue()->count(),
                'paid_invoices' => Invoice::where('status', 'paid')->count(),
                'total_payments' => Payment::where('status', 'completed')->count(),
                'total_revenue' => Payment::where('status', 'completed')->sum('amount') ?? 0,
                'open_tickets' => SupportTicket::where('status', 'open')->count(),
                'resolved_tickets' => SupportTicket::where('status', 'resolved')->count(),
            ],
            'recent_invoices' => Invoice::with(['user', 'serviceProvider'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'recent_payments' => Payment::with(['invoice', 'user'])
                ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    private function providerDashboard()
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return view('dashboard.provider', [
                'stats' => [],
                'recentInvoices' => collect(),
                'monthlyRevenue' => collect(),
            ]);
        }

        $stats = [
            'total_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)->count(),
            'pending_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->where('status', 'pending')->count(),
            'paid_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->where('status', 'paid')->count(),
            'total_revenue' => Payment::whereHas('invoice', function($q) use ($serviceProvider) {
                $q->where('service_provider_id', $serviceProvider->id);
            })->where('status', 'completed')->sum('amount') ?? 0,
        ];

        $recentInvoices = Invoice::where('service_provider_id', $serviceProvider->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $monthlyRevenue = Payment::whereHas('invoice', function($q) use ($serviceProvider) {
            $q->where('service_provider_id', $serviceProvider->id);
        })
        ->where('status', 'completed')
        ->whereYear('created_at', now()->year)
        ->get()
        ->groupBy(function($payment) {
            return $payment->created_at->format('m');
        })
        ->map(function($payments) {
            return [
                'month' => (int) $payments->first()->created_at->format('m'),
                'total' => $payments->sum('amount') ?? 0
            ];
        })
        ->sortBy('month')
        ->values();

        return view('dashboard.provider', compact('stats', 'recentInvoices', 'monthlyRevenue'));
    }

    private function getProviderDashboardData($user): array
    {
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return [
                'type' => 'provider',
                'stats' => [],
                'recent_invoices' => [],
                'monthly_revenue' => [],
            ];
        }

        return [
            'type' => 'provider',
            'stats' => [
                'total_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)->count(),
                'pending_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                    ->where('status', 'pending')->count(),
                'paid_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                    ->where('status', 'paid')->count(),
                'total_revenue' => Payment::whereHas('invoice', function($q) use ($serviceProvider) {
                    $q->where('service_provider_id', $serviceProvider->id);
                })->where('status', 'completed')->sum('amount') ?? 0,
            ],
            'recent_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'monthly_revenue' => Payment::whereHas('invoice', function($q) use ($serviceProvider) {
                $q->where('service_provider_id', $serviceProvider->id);
            })
            ->where('status', 'completed')
            ->whereYear('created_at', now()->year)
            ->get()
            ->groupBy(function($payment) {
                return $payment->created_at->format('m');
            })
            ->map(function($payments) {
                return [
                    'month' => (int) $payments->first()->created_at->format('m'),
                    'total' => $payments->sum('amount') ?? 0
                ];
            })
            ->sortBy('month')
            ->values(),
        ];
    }

    private function customerDashboard()
    {
        $user = Auth::user();
        
        $stats = [
            'total_invoices' => Invoice::where('user_id', $user->id)->count(),
            'pending_invoices' => Invoice::where('user_id', $user->id)
                ->where('status', 'pending')->count(),
            'overdue_invoices' => Invoice::where('user_id', $user->id)
                ->overdue()->count(),
            'paid_invoices' => Invoice::where('user_id', $user->id)
                ->where('status', 'paid')->count(),
            'total_paid' => Payment::where('user_id', $user->id)
                ->where('status', 'completed')->sum('amount') ?? 0,
            'pending_amount' => Invoice::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'overdue'])
                ->sum('total_amount') ?? 0,
        ];

        $recentInvoices = Invoice::where('user_id', $user->id)
            ->with('serviceProvider')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentPayments = Payment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with('invoice')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $upcomingDueDates = Invoice::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(7))
            ->orderBy('due_date', 'asc')
            ->get();

        return view('dashboard.customer', compact('stats', 'recentInvoices', 'recentPayments', 'upcomingDueDates'));
    }

    private function getCustomerDashboardData($user): array
    {
        return [
            'type' => 'customer',
            'stats' => [
                'total_invoices' => Invoice::where('user_id', $user->id)->count(),
                'pending_invoices' => Invoice::where('user_id', $user->id)
                    ->where('status', 'pending')->count(),
                'overdue_invoices' => Invoice::where('user_id', $user->id)
                    ->overdue()->count(),
                'paid_invoices' => Invoice::where('user_id', $user->id)
                    ->where('status', 'paid')->count(),
                'total_paid' => Payment::where('user_id', $user->id)
                    ->where('status', 'completed')->sum('amount') ?? 0,
                'pending_amount' => Invoice::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'overdue'])
                    ->sum('total_amount') ?? 0,
            ],
            'recent_invoices' => Invoice::where('user_id', $user->id)
                ->with('serviceProvider')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'recent_payments' => Payment::where('user_id', $user->id)
                ->where('status', 'completed')
                ->with('invoice')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'upcoming_due_dates' => Invoice::where('user_id', $user->id)
                ->where('status', 'pending')
                ->where('due_date', '>=', now())
                ->where('due_date', '<=', now()->addDays(7))
                ->orderBy('due_date', 'asc')
                ->get(),
        ];
    }

    private function supportDashboard()
    {
        $user = Auth::user();
        
        $stats = [
            'open_tickets' => SupportTicket::where('status', 'open')->count(),
            'assigned_tickets' => SupportTicket::where('assigned_to', $user->id)->count(),
            'resolved_tickets' => SupportTicket::where('status', 'resolved')
                ->where('assigned_to', $user->id)->count(),
        ];

        $myTickets = SupportTicket::where('assigned_to', $user->id)
            ->with(['user', 'replies'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $unassignedTickets = SupportTicket::whereNull('assigned_to')
            ->where('status', 'open')
            ->with('user')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return view('dashboard.support', compact('stats', 'myTickets', 'unassignedTickets'));
    }

    private function getSupportDashboardData($user): array
    {
        return [
            'type' => 'support',
            'stats' => [
                'open_tickets' => SupportTicket::where('status', 'open')->count(),
                'assigned_tickets' => SupportTicket::where('assigned_to', $user->id)->count(),
                'resolved_tickets' => SupportTicket::where('status', 'resolved')
                    ->where('assigned_to', $user->id)->count(),
            ],
            'my_tickets' => SupportTicket::where('assigned_to', $user->id)
                ->with(['user', 'replies'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'unassigned_tickets' => SupportTicket::whereNull('assigned_to')
                ->where('status', 'open')
                ->with('user')
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }
}
