<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\SupportTicket;
use App\Models\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:admin']);
    }

    public function index()
    {
        // Overall Statistics
        $stats = [
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
            'total_service_providers' => ServiceProvider::where('status', 'active')->count(),
        ];

        // Recent Activity
        $recentInvoices = Invoice::with(['user', 'serviceProvider'])
                                ->orderBy('created_at', 'desc')
                                ->limit(10)
                                ->get();

        $recentPayments = Payment::with(['invoice', 'user'])
                                ->where('status', 'completed')
                                ->orderBy('created_at', 'desc')
                                ->limit(10)
                                ->get();

        $recentTickets = SupportTicket::with(['user', 'assignedTo'])
                                     ->orderBy('created_at', 'desc')
                                     ->limit(10)
                                     ->get();

        // Monthly Revenue Chart Data (using Laravel's date functions for SQLite compatibility)
        // Use collection-based method for database compatibility
        $monthlyRevenue = Payment::where('status', 'completed')
                                ->whereYear('created_at', now()->year)
                                ->get()
                                ->groupBy(function($payment) {
                                    return Carbon::parse($payment->created_at)->format('m');
                                })
                                ->map(function($payments) {
                                    $first = $payments->first();
                                    return [
                                        'month' => $first ? (int) $first->created_at->format('m') : 0,
                                        'total' => $payments->sum('amount') ?? 0
                                    ];
                                })
                                ->sortBy('month')
                                ->values();

        // Revenue by Service Provider
        $revenueByProvider = ServiceProvider::with('user')
        ->get()
        ->map(function($provider) {
            $revenue = Payment::whereHas('invoice', function($q) use ($provider) {
                $q->where('service_provider_id', $provider->id);
            })
            ->where('status', 'completed')
            ->sum('amount');
            
            return [
                'provider' => $provider,
                'revenue' => $revenue ?? 0
            ];
        })
        ->sortByDesc('revenue')
        ->take(5)
        ->values();

        // Payment Status Distribution
        $paymentStatusDistribution = Payment::select('status', DB::raw('count(*) as count'))
                                           ->groupBy('status')
                                           ->get();

        // Invoice Status Distribution
        $invoiceStatusDistribution = Invoice::select('status', DB::raw('count(*) as count'))
                                           ->groupBy('status')
                                           ->get();

        // New Users This Month
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year)
                                ->count();

        // Revenue This Month
        $revenueThisMonth = Payment::where('status', 'completed')
                                  ->whereMonth('created_at', now()->month)
                                  ->whereYear('created_at', now()->year)
                                  ->sum('amount') ?? 0;

        // Revenue Last Month
        $revenueLastMonth = Payment::where('status', 'completed')
                                  ->whereMonth('created_at', now()->subMonth()->month)
                                  ->whereYear('created_at', now()->subMonth()->year)
                                  ->sum('amount') ?? 0;

        // Revenue Growth
        $revenueGrowth = ($revenueLastMonth > 0 && $revenueLastMonth !== null) 
            ? (($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100 
            : 0;

        return view('admin.dashboard', compact(
            'stats',
            'recentInvoices',
            'recentPayments',
            'recentTickets',
            'monthlyRevenue',
            'revenueByProvider',
            'paymentStatusDistribution',
            'invoiceStatusDistribution',
            'newUsersThisMonth',
            'revenueThisMonth',
            'revenueLastMonth',
            'revenueGrowth'
        ));
    }

    /**
     * API endpoint for admin dashboard
     */
    public function apiIndex(Request $request): JsonResponse
    {
        // Overall Statistics
        $stats = [
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
            'total_service_providers' => ServiceProvider::where('status', 'active')->count(),
        ];

        // Recent Activity
        $recentInvoices = Invoice::with(['user', 'serviceProvider'])
                                ->orderBy('created_at', 'desc')
                                ->limit(10)
                                ->get();

        $recentPayments = Payment::with(['invoice', 'user'])
                                ->where('status', 'completed')
                                ->orderBy('created_at', 'desc')
                                ->limit(10)
                                ->get();

        $recentTickets = SupportTicket::with(['user', 'assignedTo'])
                                     ->orderBy('created_at', 'desc')
                                     ->limit(10)
                                     ->get();

        // Monthly Revenue Chart Data
        $monthlyRevenue = Payment::where('status', 'completed')
                                ->whereYear('created_at', now()->year)
                                ->get()
                                ->groupBy(function($payment) {
                                    return Carbon::parse($payment->created_at)->format('m');
                                })
                                ->map(function($payments) {
                                    $first = $payments->first();
                                    return [
                                        'month' => $first ? (int) $first->created_at->format('m') : 0,
                                        'total' => $payments->sum('amount') ?? 0
                                    ];
                                })
                                ->sortBy('month')
                                ->values();

        // Revenue by Service Provider
        $revenueByProvider = ServiceProvider::with('user')
        ->get()
        ->map(function($provider) {
            $revenue = Payment::whereHas('invoice', function($q) use ($provider) {
                $q->where('service_provider_id', $provider->id);
            })
            ->where('status', 'completed')
            ->sum('amount');
            
            return [
                'provider' => $provider,
                'revenue' => $revenue ?? 0
            ];
        })
        ->sortByDesc('revenue')
        ->take(5)
        ->values();

        // Payment Status Distribution
        $paymentStatusDistribution = Payment::select('status', DB::raw('count(*) as count'))
                                           ->groupBy('status')
                                           ->get();

        // Invoice Status Distribution
        $invoiceStatusDistribution = Invoice::select('status', DB::raw('count(*) as count'))
                                           ->groupBy('status')
                                           ->get();

        // New Users This Month
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year)
                                ->count();

        // Revenue This Month
        $revenueThisMonth = Payment::where('status', 'completed')
                                  ->whereMonth('created_at', now()->month)
                                  ->whereYear('created_at', now()->year)
                                  ->sum('amount') ?? 0;

        // Revenue Last Month
        $revenueLastMonth = Payment::where('status', 'completed')
                                  ->whereMonth('created_at', now()->subMonth()->month)
                                  ->whereYear('created_at', now()->subMonth()->year)
                                  ->sum('amount') ?? 0;

        // Revenue Growth
        $revenueGrowth = ($revenueLastMonth > 0 && $revenueLastMonth !== null) 
            ? (($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100 
            : 0;

        return response()->json([
            'stats' => $stats,
            'recent_invoices' => $recentInvoices,
            'recent_payments' => $recentPayments,
            'recent_tickets' => $recentTickets,
            'monthly_revenue' => $monthlyRevenue,
            'revenue_by_provider' => $revenueByProvider,
            'payment_status_distribution' => $paymentStatusDistribution,
            'invoice_status_distribution' => $invoiceStatusDistribution,
            'new_users_this_month' => $newUsersThisMonth,
            'revenue_this_month' => $revenueThisMonth,
            'revenue_last_month' => $revenueLastMonth,
            'revenue_growth' => round($revenueGrowth, 2),
        ]);
    }
}
