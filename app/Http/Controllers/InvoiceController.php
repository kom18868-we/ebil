<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\ServiceProvider;
use App\Services\WebhookService;
use App\Services\ActivityLogService;
use App\Notifications\InvoiceCreated;
use App\Notifications\InvoicePaid;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->authorizeResource(Invoice::class, 'invoice');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Invoice::with(['serviceProvider', 'user']);

        // Filter based on user role
        if ($user->hasRole('customer')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('service_provider')) {
            $serviceProvider = $user->serviceProvider;
            if ($serviceProvider) {
                $query->where('service_provider_id', $serviceProvider->id);
            }
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where('issue_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('issue_date', '<=', $request->date_to);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(15);

        if ($request->expectsJson()) {
            return response()->json($invoices);
        }

        return view('invoices.index', compact('invoices'));
    }

    /**
     * API endpoint for listing invoices
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $serviceProviders = ServiceProvider::where('status', 'active')->get();
        
        // Get customers for service providers
        $customers = \App\Models\User::role('customer')->get();
        
        if (request()->expectsJson()) {
            return response()->json([
                'service_providers' => $serviceProviders,
                'customers' => $customers,
            ]);
        }
        
        return view('invoices.create', compact('serviceProviders', 'customers'));
    }

    /**
     * API endpoint to get customers for invoice creation
     */
    public function apiGetCustomers(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Service providers can only see their own customers
            if ($user->hasRole('service_provider')) {
                $serviceProvider = $user->serviceProvider;
                if ($serviceProvider) {
                    $customers = \App\Models\User::role('customer')
                        ->whereHas('invoices', function($query) use ($serviceProvider) {
                            $query->where('service_provider_id', $serviceProvider->id);
                        })
                        ->select('id', 'name', 'email')
                        ->distinct()
                        ->get();
                } else {
                    $customers = collect([]);
                }
            } else {
                // Admins can see all customers
                $customers = \App\Models\User::role('customer')
                    ->select('id', 'name', 'email')
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get();
            }
            
            return response()->json($customers);
        } catch (\Exception $e) {
            \Log::error('Error fetching customers: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check authorization
        $this->authorize('create', Invoice::class);
        
        // Validation rules
        $rules = [
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'due_date' => 'required|date',
            'issue_date' => 'nullable|date',
            'status' => 'nullable|in:pending,paid,overdue',
        ];

        // Service providers can only create invoices for their own service provider
        if ($user->hasRole('service_provider')) {
            // Service provider ID is optional - will be set automatically
            $rules['service_provider_id'] = 'nullable|exists:service_providers,id';
        } else {
            // Admin must specify service provider, but make it optional if not provided
            // We'll try to find a default service provider or use the first one
            $rules['service_provider_id'] = 'nullable|exists:service_providers,id';
        }

        try {
            $validated = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        // Automatically set service_provider_id for service providers
        if ($user->hasRole('service_provider')) {
            $serviceProvider = $user->serviceProvider;
            if (!$serviceProvider) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Service provider account not found.',
                        'errors' => ['service_provider_id' => ['Service provider account not found.']]
                    ], 422);
                }
                return redirect()->back()
                               ->with('error', __('Service provider account not found.'));
            }
            $validated['service_provider_id'] = $serviceProvider->id;
        } elseif (empty($validated['service_provider_id'])) {
            // For admins, if no service_provider_id provided, use the first active service provider
            $firstServiceProvider = ServiceProvider::where('status', 'active')->first();
            if ($firstServiceProvider) {
                $validated['service_provider_id'] = $firstServiceProvider->id;
            } else {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'No active service provider found.',
                        'errors' => ['service_provider_id' => ['No active service provider available.']]
                    ], 422);
                }
                return redirect()->back()
                               ->with('error', __('No active service provider available.'));
            }
        }

        $validated['total_amount'] = $validated['amount'] + ($validated['tax_amount'] ?? 0);
        $validated['invoice_number'] = Invoice::generateInvoiceNumber();
        $validated['issue_date'] = $validated['issue_date'] ?? now();

        try {
            $invoice = Invoice::create($validated);
            $invoice->load(['serviceProvider', 'user']);

            // Log activity
            try {
                ActivityLogService::logInvoiceCreated($invoice);
            } catch (\Exception $e) {
                \Log::error('Failed to log invoice creation activity', [
                    'invoice_id' => $invoice->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Send notification to customer
            if ($invoice->user) {
                try {
                    $invoice->user->notify(new InvoiceCreated($invoice));
                } catch (\Exception $e) {
                    \Log::error('Failed to send invoice created notification', [
                        'invoice_id' => $invoice->id,
                        'user_id' => $invoice->user->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Don't fail the request if notification fails
                }
            }

            // Dispatch webhook for invoice created
            if ($invoice->serviceProvider) {
                try {
                    app(WebhookService::class)->dispatchInvoiceEvent('invoice.created', $invoice);
                } catch (\Exception $e) {
                    \Log::error('Failed to dispatch invoice created webhook', [
                        'invoice_id' => $invoice->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the request if webhook fails
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $validated,
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to create invoice.',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            throw $e;
        }

        if ($request->expectsJson()) {
            return response()->json($invoice, 201);
        }

        return redirect()->route('invoices.show', $invoice)
                        ->with('success', __('Invoice created successfully.'));
    }

    /**
     * API endpoint for creating invoice
     */
    public function apiStore(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Display the specified resource.
     */
    public function show(Invoice $invoice)
    {
        // Always load payments for API requests to calculate remaining amount correctly
        $invoice->load(['serviceProvider', 'user', 'payments' => function($query) {
            $query->where('status', 'completed');
        }, 'payments.paymentMethod']);
        
        if (request()->expectsJson()) {
            return response()->json($invoice);
        }

        return view('invoices.show', compact('invoice'));
    }

    /**
     * API endpoint for showing invoice
     */
    public function apiShow(Invoice $invoice): JsonResponse
    {
        return $this->show($invoice);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Invoice $invoice)
    {
        $serviceProviders = ServiceProvider::where('status', 'active')->get();
        return view('invoices.edit', compact('invoice', 'serviceProviders'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Invoice $invoice)
    {
        // Only allow editing if invoice is not paid
        if ($invoice->status === 'paid') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Cannot edit paid invoice.',
                    'errors' => ['status' => ['Cannot edit paid invoice.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Cannot edit paid invoice.'));
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $validated['total_amount'] = $validated['amount'] + ($validated['tax_amount'] ?? 0);

        $invoice->update($validated);
        $invoice->load(['serviceProvider', 'user']);

        // Log activity
        try {
            ActivityLogService::logInvoiceUpdated($invoice);
        } catch (\Exception $e) {
            \Log::error('Failed to log invoice update activity', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json($invoice);
        }

        return redirect()->route('invoices.show', $invoice)
                        ->with('success', __('Invoice updated successfully.'));
    }

    /**
     * API endpoint for updating invoice
     */
    public function apiUpdate(Request $request, Invoice $invoice): JsonResponse
    {
        return $this->update($request, $invoice);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Invoice $invoice)
    {
        // Only allow deletion if invoice is not paid
        if ($invoice->status === 'paid') {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Cannot delete paid invoice.',
                ], 422);
            }
            return redirect()->back()->with('error', __('Cannot delete paid invoice.'));
        }

        // Log activity before deletion
        try {
            ActivityLogService::logInvoiceDeleted($invoice);
        } catch (\Exception $e) {
            \Log::error('Failed to log invoice deletion activity', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }

        $invoice->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Invoice deleted successfully.']);
        }

        return redirect()->route('invoices.index')
                        ->with('success', __('Invoice deleted successfully.'));
    }

    /**
     * API endpoint for deleting invoice
     */
    public function apiDestroy(Invoice $invoice): JsonResponse
    {
        return $this->destroy($invoice);
    }

    /**
     * Download invoice as PDF
     */
    public function download(Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        
        $invoice->load(['serviceProvider', 'user', 'payments.paymentMethod']);
        
        try {
            $pdf = Pdf::loadView('invoices.pdf', compact('invoice'));
            
            $filename = "invoice-{$invoice->invoice_number}.pdf";
            
            // For API requests, use streamDownload to ensure proper headers
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->streamDownload(function () use ($pdf) {
                    echo $pdf->output();
                }, $filename, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            }
            
            return $pdf->download($filename);
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to generate PDF',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()->with('error', __('Failed to generate PDF. Please try again.'));
        }
    }

    /**
     * API endpoint for downloading invoice PDF
     */
    public function apiDownload(Invoice $invoice)
    {
        return $this->download($invoice);
    }

    /**
     * Mark invoice as paid
     */
    public function markAsPaid(Invoice $invoice)
    {
        $this->authorize('update', $invoice);
        
        $invoice->markAsPaid();
        $invoice->load(['serviceProvider', 'user']);

        // Send notification to customer
        if ($invoice->user) {
            $invoice->user->notify(new InvoicePaid($invoice));
        }

        // Dispatch webhook for invoice paid
        if ($invoice->serviceProvider) {
            app(WebhookService::class)->dispatchInvoiceEvent('invoice.paid', $invoice);
        }
        
        if (request()->expectsJson()) {
            return response()->json($invoice);
        }
        
        return redirect()->back()->with('success', __('Invoice marked as paid.'));
    }

    /**
     * API endpoint for marking invoice as paid
     */
    public function apiMarkAsPaid(Invoice $invoice): JsonResponse
    {
        return $this->markAsPaid($invoice);
    }

    /**
     * Cancel invoice
     */
    public function cancel(Request $request, Invoice $invoice)
    {
        $this->authorize('cancel', $invoice);

        // Validate cancellation reason if provided
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $invoice->cancel($validated['reason'] ?? null);
            $invoice->load(['serviceProvider', 'user']);

            // Dispatch webhook for invoice cancelled
            if ($invoice->serviceProvider) {
                app(WebhookService::class)->dispatchInvoiceEvent('invoice.cancelled', $invoice);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Invoice cancelled successfully.',
                    'data' => $invoice
                ]);
            }

            return redirect()->back()->with('success', __('Invoice cancelled successfully.'));
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => ['status' => [$e->getMessage()]]
                ], 422);
            }

            return redirect()->back()->with('error', __($e->getMessage()));
        }
    }

    /**
     * API endpoint for cancelling invoice
     */
    public function apiCancel(Request $request, Invoice $invoice): JsonResponse
    {
        return $this->cancel($request, $invoice);
    }

    /**
     * Archive old invoices
     */
    public function archive()
    {
        $this->authorize('archive', Invoice::class);
        
        $archivedCount = Invoice::where('status', 'paid')
            ->where('paid_date', '<', now()->subMonths(6))
            ->update(['archived_at' => now()]);
        
        if (request()->expectsJson()) {
            return response()->json([
                'message' => "Archived {$archivedCount} invoices.",
                'archived_count' => $archivedCount,
            ]);
        }
        
        return redirect()->back()->with('success', __("Archived {$archivedCount} invoices."));
    }

    /**
     * API endpoint for archiving invoices
     */
    public function apiArchive(): JsonResponse
    {
        return $this->archive();
    }
}
