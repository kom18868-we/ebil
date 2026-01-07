<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:admin']);
    }

    public function index()
    {
        return view('admin.reports.index');
    }

    public function invoices(Request $request)
    {
        $query = Invoice::with(['user', 'serviceProvider']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('service_provider_id')) {
            $query->where('service_provider_id', $request->service_provider_id);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(50);

        // Statistics
        $stats = [
            'total_invoices' => $query->count(),
            'total_amount' => $query->sum('total_amount'),
            'paid_amount' => $query->where('status', 'paid')->sum('total_amount'),
            'pending_amount' => $query->where('status', 'pending')->sum('total_amount'),
            'overdue_amount' => $query->where('status', 'overdue')->sum('total_amount'),
        ];

        $serviceProviders = ServiceProvider::all();

        return view('admin.reports.invoices', compact('invoices', 'stats', 'serviceProviders'));
    }

    public function payments(Request $request)
    {
        $query = Payment::with(['invoice', 'user']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(50);

        // Statistics
        $stats = [
            'total_payments' => $query->count(),
            'total_amount' => $query->where('status', 'completed')->sum('amount'),
            'pending_amount' => $query->where('status', 'pending')->sum('amount'),
            'failed_amount' => $query->where('status', 'failed')->sum('amount'),
        ];

        // Monthly revenue chart data (using Laravel's date functions for compatibility)
        $monthlyRevenue = Payment::where('status', 'completed')
                                ->whereYear('created_at', now()->year)
                                ->get()
                                ->groupBy(function($payment) {
                                    return $payment->created_at->format('m');
                                })
                                ->map(function($payments, $month) {
                                    return [
                                        'month' => (int) $month,
                                        'total' => $payments->sum('amount')
                                    ];
                                })
                                ->sortBy('month')
                                ->values();

        return view('admin.reports.payments', compact('payments', 'stats', 'monthlyRevenue'));
    }

    public function users(Request $request)
    {
        $query = User::withCount(['invoices', 'payments']);

        // Apply filters
        if ($request->filled('role')) {
            $query->role($request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(50);

        // Statistics
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'inactive_users' => User::where('status', 'inactive')->count(),
            'customers' => User::role('customer')->count(),
            'service_providers' => User::role('service_provider')->count(),
            'new_this_month' => User::whereMonth('created_at', now()->month)->count(),
        ];

        return view('admin.reports.users', compact('users', 'stats'));
    }

    public function export(Request $request)
    {
        $request->validate([
            'type' => 'required|in:invoices,payments,users',
            'format' => 'required|in:excel,pdf',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $type = $request->type;
        $format = $request->format;
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;

        switch ($type) {
            case 'invoices':
                return $this->exportInvoices($format, $dateFrom, $dateTo);
            case 'payments':
                return $this->exportPayments($format, $dateFrom, $dateTo);
            case 'users':
                return $this->exportUsers($format, $dateFrom, $dateTo);
        }
    }

    private function exportInvoices($format, $dateFrom, $dateTo, $status = null, $serviceProviderId = null)
    {
        $query = Invoice::with(['user', 'serviceProvider']);

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($serviceProviderId) {
            $query->where('service_provider_id', $serviceProviderId);
        }

        $invoices = $query->orderBy('created_at', 'desc')->get();

        $filename = 'invoices_report_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'excel') {
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            ];
            
            return response()->streamDownload(function() use ($invoices) {
                $file = fopen('php://output', 'w');
                // Add BOM for UTF-8
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($file, ['Invoice Number', 'Title', 'User', 'Service Provider', 'Amount', 'Status', 'Due Date', 'Created At']);
                
                foreach ($invoices as $invoice) {
                    fputcsv($file, [
                        $invoice->invoice_number,
                        $invoice->title ?? 'N/A',
                        $invoice->user->name ?? 'N/A',
                        $invoice->serviceProvider->company_name ?? 'N/A',
                        number_format($invoice->total_amount, 2),
                        ucfirst($invoice->status),
                        $invoice->due_date ? Carbon::parse($invoice->due_date)->format('Y-m-d') : 'N/A',
                        $invoice->created_at->format('Y-m-d H:i:s'),
                    ]);
                }
                
                fclose($file);
            }, $filename . '.csv', $headers);
        } else {
            $stats = [
                'total_invoices' => $invoices->count(),
                'total_amount' => $invoices->sum('total_amount'),
                'paid_amount' => $invoices->where('status', 'paid')->sum('total_amount'),
                'pending_amount' => $invoices->where('status', 'pending')->sum('total_amount'),
                'overdue_amount' => $invoices->where('status', 'overdue')->sum('total_amount'),
            ];
            
            $html = view('admin.reports.pdf.invoices', compact('invoices', 'dateFrom', 'dateTo', 'stats'))->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'landscape');
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, $filename . '.pdf', [
                'Content-Type' => 'application/pdf',
            ]);
        }
    }

    private function exportPayments($format, $dateFrom, $dateTo, $status = null)
    {
        $query = Payment::with(['invoice', 'user', 'paymentMethod']);

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

        $filename = 'payments_report_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'excel') {
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            ];
            
            return response()->streamDownload(function() use ($payments) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($file, ['Payment Reference', 'Invoice', 'User', 'Amount', 'Status', 'Payment Type', 'Payment Method', 'Created At']);
                
                foreach ($payments as $payment) {
                    fputcsv($file, [
                        $payment->payment_reference ?? 'N/A',
                        $payment->invoice->invoice_number ?? 'N/A',
                        $payment->user->name ?? 'N/A',
                        number_format($payment->amount, 2),
                        ucfirst($payment->status),
                        ucfirst($payment->payment_type),
                        $payment->paymentMethod->type ?? 'N/A',
                        $payment->created_at->format('Y-m-d H:i:s'),
                    ]);
                }
                
                fclose($file);
            }, $filename . '.csv', $headers);
        } else {
            $stats = [
                'total_payments' => $payments->count(),
                'total_amount' => $payments->where('status', 'completed')->sum('amount'),
                'pending_amount' => $payments->where('status', 'pending')->sum('amount'),
                'failed_amount' => $payments->where('status', 'failed')->sum('amount'),
            ];
            
            $html = view('admin.reports.pdf.payments', compact('payments', 'dateFrom', 'dateTo', 'stats'))->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'landscape');
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, $filename . '.pdf', [
                'Content-Type' => 'application/pdf',
            ]);
        }
    }

    private function exportUsers($format, $dateFrom, $dateTo)
    {
        $query = User::withCount(['invoices', 'payments'])->with('roles');

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        $filename = 'users_report_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'excel') {
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            ];
            
            return response()->streamDownload(function() use ($users) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($file, ['Name', 'Email', 'Phone', 'Role', 'Status', 'Invoices Count', 'Payments Count', 'Created At']);
                
                foreach ($users as $user) {
                    fputcsv($file, [
                        $user->name,
                        $user->email,
                        $user->phone ?? 'N/A',
                        $user->roles->pluck('name')->join(', ') ?: 'N/A',
                        $user->is_active ? 'Active' : 'Inactive',
                        $user->invoices_count ?? 0,
                        $user->payments_count ?? 0,
                        $user->created_at->format('Y-m-d H:i:s'),
                    ]);
                }
                
                fclose($file);
            }, $filename . '.csv', $headers);
        } else {
            $stats = [
                'total_users' => $users->count(),
                'active_users' => $users->where('is_active', true)->count(),
                'inactive_users' => $users->where('is_active', false)->count(),
            ];
            
            $html = view('admin.reports.pdf.users', compact('users', 'dateFrom', 'dateTo', 'stats'))->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'landscape');
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, $filename . '.pdf', [
                'Content-Type' => 'application/pdf',
            ]);
        }
    }

    /**
     * Export financial report
     */
    private function exportFinancial($format, $dateFrom, $dateTo)
    {
        $dateFrom = $dateFrom ? Carbon::parse($dateFrom) : Carbon::now()->startOfMonth();
        $dateTo = $dateTo ? Carbon::parse($dateTo) : Carbon::now()->endOfMonth();

        // Revenue data
        $payments = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        $invoices = Invoice::whereBetween('created_at', [$dateFrom, $dateTo])->get();

        $revenueByProvider = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->with('invoice.serviceProvider')
            ->get()
            ->groupBy(function($payment) {
                return $payment->invoice->serviceProvider->company_name ?? 'Unknown';
            })
            ->map(function($payments) {
                return $payments->sum('amount');
            });

        $monthlyRevenue = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get()
            ->groupBy(function($payment) {
                return $payment->created_at->format('Y-m');
            })
            ->map(function($payments, $month) {
                return [
                    'month' => $month,
                    'total' => $payments->sum('amount')
                ];
            })
            ->values();

        $stats = [
            'total_revenue' => $payments->sum('amount'),
            'total_invoices' => $invoices->count(),
            'paid_invoices' => $invoices->where('status', 'paid')->count(),
            'pending_invoices' => $invoices->where('status', 'pending')->count(),
            'overdue_invoices' => $invoices->where('status', 'overdue')->count(),
            'average_payment' => $payments->count() > 0 ? $payments->avg('amount') : 0,
        ];

        $filename = 'financial_report_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'excel') {
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            ];
            
            return response()->streamDownload(function() use ($stats, $revenueByProvider, $monthlyRevenue, $dateFrom, $dateTo) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                
                fputcsv($file, ['Financial Report']);
                fputcsv($file, ['Period', $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d')]);
                fputcsv($file, []);
                fputcsv($file, ['Summary']);
                fputcsv($file, ['Total Revenue', number_format($stats['total_revenue'], 2)]);
                fputcsv($file, ['Total Invoices', $stats['total_invoices']]);
                fputcsv($file, ['Paid Invoices', $stats['paid_invoices']]);
                fputcsv($file, ['Pending Invoices', $stats['pending_invoices']]);
                fputcsv($file, ['Overdue Invoices', $stats['overdue_invoices']]);
                fputcsv($file, ['Average Payment', number_format($stats['average_payment'], 2)]);
                fputcsv($file, []);
                fputcsv($file, ['Revenue by Service Provider']);
                fputcsv($file, ['Provider', 'Revenue']);
                foreach ($revenueByProvider as $provider => $revenue) {
                    fputcsv($file, [$provider, number_format($revenue, 2)]);
                }
                fputcsv($file, []);
                fputcsv($file, ['Monthly Revenue']);
                fputcsv($file, ['Month', 'Revenue']);
                foreach ($monthlyRevenue as $data) {
                    fputcsv($file, [$data['month'], number_format($data['total'], 2)]);
                }
                
                fclose($file);
            }, $filename . '.csv', $headers);
        } else {
            $html = view('admin.reports.pdf.financial', compact('stats', 'revenueByProvider', 'monthlyRevenue', 'dateFrom', 'dateTo'))->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, $filename . '.pdf', [
                'Content-Type' => 'application/pdf',
            ]);
        }
    }

    /**
     * Export usage report
     */
    private function exportUsage($format, $dateFrom, $dateTo)
    {
        $dateFrom = $dateFrom ? Carbon::parse($dateFrom) : Carbon::now()->startOfMonth();
        $dateTo = $dateTo ? Carbon::parse($dateTo) : Carbon::now()->endOfMonth();

        // Service provider usage
        $providerUsage = ServiceProvider::withCount([
            'invoices' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            },
            'invoices as paid_invoices_count' => function($query) use ($dateFrom, $dateTo) {
                $query->where('status', 'paid')->whereBetween('created_at', [$dateFrom, $dateTo]);
            }
        ])
        ->withSum(['invoices as total_revenue' => function($query) use ($dateFrom, $dateTo) {
            $query->where('status', 'paid')->whereBetween('created_at', [$dateFrom, $dateTo]);
        }], 'total_amount')
        ->get();

        // User activity
        $userActivity = User::withCount([
            'invoices' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            },
            'payments' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            }
        ])
        ->whereHas('invoices', function($query) use ($dateFrom, $dateTo) {
            $query->whereBetween('created_at', [$dateFrom, $dateTo]);
        })
        ->orWhereHas('payments', function($query) use ($dateFrom, $dateTo) {
            $query->whereBetween('created_at', [$dateFrom, $dateTo]);
        })
        ->get();

        $stats = [
            'total_providers' => $providerUsage->count(),
            'active_providers' => $providerUsage->where('is_active', true)->count(),
            'total_invoices' => $providerUsage->sum('invoices_count'),
            'total_users_active' => $userActivity->count(),
        ];

        $filename = 'usage_report_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'excel') {
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            ];
            
            return response()->streamDownload(function() use ($stats, $providerUsage, $userActivity, $dateFrom, $dateTo) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                
                fputcsv($file, ['Usage Report']);
                fputcsv($file, ['Period', $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d')]);
                fputcsv($file, []);
                fputcsv($file, ['Service Provider Usage']);
                fputcsv($file, ['Provider', 'Status', 'Total Invoices', 'Paid Invoices', 'Revenue']);
                foreach ($providerUsage as $provider) {
                    fputcsv($file, [
                        $provider->company_name,
                        $provider->is_active ? 'Active' : 'Inactive',
                        $provider->invoices_count ?? 0,
                        $provider->paid_invoices_count ?? 0,
                        number_format($provider->total_revenue ?? 0, 2),
                    ]);
                }
                fputcsv($file, []);
                fputcsv($file, ['User Activity']);
                fputcsv($file, ['User', 'Email', 'Invoices', 'Payments']);
                foreach ($userActivity as $user) {
                    fputcsv($file, [
                        $user->name,
                        $user->email,
                        $user->invoices_count ?? 0,
                        $user->payments_count ?? 0,
                    ]);
                }
                
                fclose($file);
            }, $filename . '.csv', $headers);
        } else {
            $html = view('admin.reports.pdf.usage', compact('stats', 'providerUsage', 'userActivity', 'dateFrom', 'dateTo'))->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, $filename . '.pdf', [
                'Content-Type' => 'application/pdf',
            ]);
        }
    }

    public function schedule(Request $request)
    {
        $request->validate([
            'type' => 'required|in:invoices,payments,users',
            'frequency' => 'required|in:daily,weekly,monthly',
            'email' => 'required|email',
            'format' => 'required|in:excel,pdf',
        ]);

        // Here you would typically create a scheduled job
        // For now, we'll just return a success message

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Report scheduled successfully',
                'data' => [
                    'type' => $request->type,
                    'frequency' => $request->frequency,
                    'email' => $request->email,
                    'format' => $request->format,
                ],
            ]);
        }

        return redirect()->back()->with('success', __('Report scheduled successfully. You will receive reports at :email :frequency.', [
            'email' => $request->email,
            'frequency' => $request->frequency
        ]));
    }

    /**
     * API endpoint for reports index
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Reports endpoint',
        ]);
    }

    /**
     * API endpoint for invoice reports
     */
    public function apiInvoices(Request $request): JsonResponse
    {
        $query = Invoice::with(['user', 'serviceProvider']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('service_provider_id')) {
            $query->where('service_provider_id', $request->service_provider_id);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 50));

        // Statistics
        $stats = [
            'total_invoices' => $query->count(),
            'total_amount' => $query->sum('total_amount') ?? 0,
            'paid_amount' => $query->where('status', 'paid')->sum('total_amount') ?? 0,
            'pending_amount' => $query->where('status', 'pending')->sum('total_amount') ?? 0,
            'overdue_amount' => $query->where('status', 'overdue')->sum('total_amount') ?? 0,
        ];

        $serviceProviders = ServiceProvider::all();

        return response()->json([
            'invoices' => $invoices,
            'stats' => $stats,
            'service_providers' => $serviceProviders,
        ]);
    }

    /**
     * API endpoint for payment reports
     */
    public function apiPayments(Request $request): JsonResponse
    {
        $query = Payment::with(['invoice', 'user']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 50));

        // Statistics
        $stats = [
            'total_payments' => $query->count(),
            'total_amount' => $query->where('status', 'completed')->sum('amount') ?? 0,
            'pending_amount' => $query->where('status', 'pending')->sum('amount') ?? 0,
            'failed_amount' => $query->where('status', 'failed')->sum('amount') ?? 0,
        ];

        // Monthly revenue chart data
        $monthlyRevenue = Payment::where('status', 'completed')
                                ->whereYear('created_at', now()->year)
                                ->get()
                                ->groupBy(function($payment) {
                                    return $payment->created_at->format('m');
                                })
                                ->map(function($payments, $month) {
                                    return [
                                        'month' => (int) $month,
                                        'total' => $payments->sum('amount') ?? 0
                                    ];
                                })
                                ->sortBy('month')
                                ->values();

        return response()->json([
            'payments' => $payments,
            'stats' => $stats,
            'monthly_revenue' => $monthlyRevenue,
        ]);
    }

    /**
     * API endpoint for user reports
     */
    public function apiUsers(Request $request): JsonResponse
    {
        $query = User::withCount(['invoices', 'payments']);

        // Apply filters
        if ($request->filled('role')) {
            $query->role($request->role);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 50));

        // Statistics
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'inactive_users' => User::where('is_active', false)->count(),
            'customers' => User::role('customer')->count(),
            'service_providers' => User::role('service_provider')->count(),
            'new_this_month' => User::whereMonth('created_at', now()->month)->count(),
        ];

        return response()->json([
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * API endpoint for export
     */
    public function apiExport(Request $request)
    {
        $request->validate([
            'type' => 'required|in:invoices,payments,users,financial,usage',
            'format' => 'required|in:excel,pdf',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'nullable|string',
            'service_provider_id' => 'nullable|integer|exists:service_providers,id',
        ]);

        $type = $request->type;
        $format = $request->format;
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;

        try {
            switch ($type) {
                case 'invoices':
                    return $this->exportInvoices($format, $dateFrom, $dateTo, $request->status, $request->service_provider_id);
                case 'payments':
                    return $this->exportPayments($format, $dateFrom, $dateTo, $request->status);
                case 'users':
                    return $this->exportUsers($format, $dateFrom, $dateTo);
                case 'financial':
                    return $this->exportFinancial($format, $dateFrom, $dateTo);
                case 'usage':
                    return $this->exportUsage($format, $dateFrom, $dateTo);
                default:
                    return response()->json(['message' => 'Invalid report type'], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Export Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to generate export',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API endpoint for financial reports
     */
    public function apiFinancial(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now()->endOfMonth();

        $payments = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        $invoices = Invoice::whereBetween('created_at', [$dateFrom, $dateTo])->get();

        $revenueByProvider = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->with('invoice.serviceProvider')
            ->get()
            ->groupBy(function($payment) {
                return $payment->invoice->serviceProvider->company_name ?? 'Unknown';
            })
            ->map(function($payments, $provider) {
                return [
                    'provider' => $provider,
                    'revenue' => $payments->sum('amount')
                ];
            })
            ->values();

        $monthlyRevenue = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get()
            ->groupBy(function($payment) {
                return $payment->created_at->format('Y-m');
            })
            ->map(function($payments, $month) {
                return [
                    'month' => $month,
                    'total' => $payments->sum('amount')
                ];
            })
            ->values();

        $stats = [
            'total_revenue' => $payments->sum('amount'),
            'total_invoices' => $invoices->count(),
            'paid_invoices' => $invoices->where('status', 'paid')->count(),
            'pending_invoices' => $invoices->where('status', 'pending')->count(),
            'overdue_invoices' => $invoices->where('status', 'overdue')->count(),
            'average_payment' => $payments->count() > 0 ? $payments->avg('amount') : 0,
            'total_payments' => $payments->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'revenue_by_provider' => $revenueByProvider,
            'monthly_revenue' => $monthlyRevenue,
            'date_from' => $dateFrom->format('Y-m-d'),
            'date_to' => $dateTo->format('Y-m-d'),
        ]);
    }

    /**
     * API endpoint for usage reports
     */
    public function apiUsage(Request $request): JsonResponse
    {
        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now()->endOfMonth();

        $providerUsage = ServiceProvider::withCount([
            'invoices' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            },
            'invoices as paid_invoices_count' => function($query) use ($dateFrom, $dateTo) {
                $query->where('status', 'paid')->whereBetween('created_at', [$dateFrom, $dateTo]);
            }
        ])
        ->withSum(['invoices as total_revenue' => function($query) use ($dateFrom, $dateTo) {
            $query->where('status', 'paid')->whereBetween('created_at', [$dateFrom, $dateTo]);
        }], 'total_amount')
        ->get()
        ->map(function($provider) {
            return [
                'id' => $provider->id,
                'company_name' => $provider->company_name,
                'is_active' => $provider->is_active,
                'invoices_count' => $provider->invoices_count ?? 0,
                'paid_invoices_count' => $provider->paid_invoices_count ?? 0,
                'total_revenue' => $provider->total_revenue ?? 0,
            ];
        });

        $userActivity = User::withCount([
            'invoices' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            },
            'payments' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            }
        ])
        ->where(function($query) use ($dateFrom, $dateTo) {
            $query->whereHas('invoices', function($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('created_at', [$dateFrom, $dateTo]);
            })
            ->orWhereHas('payments', function($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('created_at', [$dateFrom, $dateTo]);
            });
        })
        ->get()
        ->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'invoices_count' => $user->invoices_count ?? 0,
                'payments_count' => $user->payments_count ?? 0,
            ];
        });

        $stats = [
            'total_providers' => $providerUsage->count(),
            'active_providers' => $providerUsage->where('is_active', true)->count(),
            'total_invoices' => $providerUsage->sum('invoices_count'),
            'total_users_active' => $userActivity->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'provider_usage' => $providerUsage,
            'user_activity' => $userActivity,
            'date_from' => $dateFrom->format('Y-m-d'),
            'date_to' => $dateTo->format('Y-m-d'),
        ]);
    }

    /**
     * API endpoint for schedule
     */
    public function apiSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:invoices,payments,users,financial,usage',
            'frequency' => 'required|in:daily,weekly,monthly',
            'email' => 'required|email',
            'format' => 'required|in:excel,pdf',
        ]);

        return response()->json([
            'message' => 'Report scheduled successfully',
            'data' => [
                'type' => $request->type,
                'frequency' => $request->frequency,
                'email' => $request->email,
                'format' => $request->format,
            ],
        ]);
    }
}
