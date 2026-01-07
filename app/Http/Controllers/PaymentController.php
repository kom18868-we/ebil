<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Services\WebhookService;
use App\Services\ActivityLogService;
use App\Notifications\PaymentCompleted;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Payment::with(['invoice', 'paymentMethod', 'user']);

        // Filter based on user role
        if ($user->hasRole('customer')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('service_provider')) {
            $serviceProvider = $user->serviceProvider;
            if ($serviceProvider) {
                $query->whereHas('invoice', function($q) use ($serviceProvider) {
                    $q->where('service_provider_id', $serviceProvider->id);
                });
            }
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('payment_reference', 'like', "%{$search}%")
                  ->orWhere('gateway_transaction_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(15);

        if ($request->expectsJson()) {
            return response()->json($payments);
        }

        return view('payments.index', compact('payments'));
    }

    /**
     * API endpoint for listing payments
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $invoiceId = $request->get('invoice_id');
        
        if (!$invoiceId) {
            return redirect()->route('invoices.index')
                           ->with('error', __('Please select an invoice to pay.'));
        }

        $invoice = Invoice::findOrFail($invoiceId);
        
        // Check authorization
        if (Auth::user()->hasRole('customer') && $invoice->user_id !== Auth::id()) {
            abort(403);
        }

        // Check if invoice is already paid
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.show', $invoice)
                           ->with('error', __('This invoice is already paid.'));
        }

        $paymentMethods = PaymentMethod::where('user_id', Auth::id())
                                     ->where('is_active', true)
                                     ->get();

        return view('payments.create', compact('invoice', 'paymentMethods'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Log incoming request for debugging
        \Log::info('Payment creation request', [
            'data' => $request->all(),
            'data_types' => [
                'invoice_id' => gettype($request->input('invoice_id')),
                'payment_method_id' => gettype($request->input('payment_method_id')),
                'amount' => gettype($request->input('amount')),
                'payment_type' => gettype($request->input('payment_type')),
            ],
            'user_id' => Auth::id(),
        ]);

        try {
            $validated = $request->validate([
                'invoice_id' => 'required|integer|exists:invoices,id',
                'payment_method_id' => 'required|integer|exists:payment_methods,id',
                'amount' => 'required|numeric|min:0.01',
                'payment_type' => 'required|string|in:full,partial',
                'gateway' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Payment validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
                'request_data_types' => [
                    'invoice_id' => gettype($request->input('invoice_id')),
                    'payment_method_id' => gettype($request->input('payment_method_id')),
                    'amount' => gettype($request->input('amount')),
                    'payment_type' => gettype($request->input('payment_type')),
                ],
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $e->errors(),
                    'request_data' => $request->all(), // Include request data for debugging
                ], 422);
            }
            throw $e;
        }

        $invoice = Invoice::with('payments')->findOrFail($validated['invoice_id']);
        
        // Check authorization
        if (Auth::user()->hasRole('customer') && $invoice->user_id !== Auth::id()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['invoice_id' => ['You do not have permission to pay this invoice.']]
                ], 403);
            }
            abort(403);
        }

        // Check if invoice is cancelled
        if ($invoice->status === 'cancelled') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Cannot pay a cancelled invoice.',
                    'errors' => ['invoice_id' => ['Cannot pay a cancelled invoice.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Cannot pay a cancelled invoice.'));
        }
        
        // Calculate remaining amount to check if invoice can be paid
        // Use remaining amount instead of status, as status might be incorrect
        $remainingAmount = $invoice->remaining_amount;
        
        // Log invoice status for debugging
        \Log::info('Invoice payment check', [
            'invoice_id' => $invoice->id,
            'status' => $invoice->status,
            'total_amount' => $invoice->total_amount,
            'total_paid' => $invoice->total_paid,
            'remaining_amount' => $remainingAmount,
            'payments_count' => $invoice->payments->count(),
        ]);
        
        // Check if invoice is already fully paid (by remaining amount, not just status)
        if ($remainingAmount <= 0) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'This invoice is already fully paid.',
                    'errors' => ['invoice_id' => ['This invoice is already fully paid. Remaining amount: $' . number_format($remainingAmount, 2)]]
                ], 422);
            }
            return redirect()->back()->with('error', __('This invoice is already fully paid.'));
        }

        // Validate payment method belongs to user
        $paymentMethod = PaymentMethod::where('id', $validated['payment_method_id'])
                                     ->where('user_id', Auth::id())
                                     ->where('is_active', true)
                                     ->first();

        if (!$paymentMethod) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Payment method not found or inactive.',
                    'errors' => ['payment_method_id' => ['Payment method not found or inactive.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Payment method not found or inactive.'));
        }

        // Calculate remaining amount
        $remainingAmount = $invoice->remaining_amount;

        // Validate amount against invoice remaining amount
        if ($validated['payment_type'] === 'full') {
            $validated['amount'] = $remainingAmount;
        } else {
            // Validate amount doesn't exceed remaining
            if ($validated['amount'] > $remainingAmount) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Payment amount cannot exceed remaining amount.',
                        'errors' => ['amount' => ['Payment amount cannot exceed remaining amount of $' . number_format($remainingAmount, 2) . '.']]
                    ], 422);
                }
                return redirect()->back()->with('error', __('Payment amount cannot exceed remaining amount.'));
            }
        }

        // Create payment
        $payment = Payment::create([
            'payment_reference' => Payment::generatePaymentReference(),
            'invoice_id' => $invoice->id,
            'user_id' => Auth::id(),
            'payment_method_id' => $paymentMethod->id,
            'amount' => $validated['amount'],
            'status' => 'pending',
            'payment_type' => $validated['payment_type'],
            'gateway' => $validated['gateway'] ?? 'manual',
            'notes' => $validated['notes'] ?? null,
        ]);

        // Process payment (in a real app, this would call a payment gateway)
        // For now, we'll simulate processing
        try {
            // Simulate payment processing
            $payment->update([
                'status' => 'processing',
                'gateway_transaction_id' => 'TXN-' . time(),
            ]);

            // Simulate successful payment
            $payment->markAsCompleted();
            
            // Reload payment with all relationships
            $payment->refresh();
            $payment->load(['invoice.serviceProvider', 'invoice.user', 'paymentMethod', 'user']);

            // Log activity
            try {
                ActivityLogService::logPaymentCreated($payment);
            } catch (\Exception $e) {
                \Log::error('Failed to log payment creation activity', [
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Send notification to customer
            if ($payment->user) {
                try {
                    $payment->user->notify(new PaymentCompleted($payment));
                } catch (\Exception $e) {
                    \Log::error('Failed to send payment completed notification', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the request if notification fails
                }
            }

            // Dispatch webhook for payment completed
            if ($payment->invoice && $payment->invoice->serviceProvider) {
                try {
                    app(WebhookService::class)->dispatchPaymentEvent('payment.completed', $payment);
                } catch (\Exception $e) {
                    \Log::error('Failed to dispatch payment completed webhook', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the request if webhook fails
                }
            }

            if ($request->expectsJson()) {
                return response()->json($payment, 201);
            }

            return redirect()->route('payments.show', $payment)
                           ->with('success', __('Payment processed successfully.'));
        } catch (\Exception $e) {
            \Log::error('Payment processing failed', [
                'payment_id' => $payment->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            if (isset($payment)) {
                try {
                    $payment->markAsFailed($e->getMessage());
                } catch (\Exception $markFailedException) {
                    \Log::error('Failed to mark payment as failed', [
                        'payment_id' => $payment->id ?? null,
                        'error' => $markFailedException->getMessage(),
                    ]);
                }
            }
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Payment failed',
                    'error' => $e->getMessage(),
                    'errors' => ['payment' => [$e->getMessage()]],
                ], 422);
            }
            
            return redirect()->back()
                           ->with('error', __('Payment failed: :message', ['message' => $e->getMessage()]));
        }
    }

    /**
     * API endpoint for creating payment
     */
    public function apiStore(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        // Check authorization
        if (Auth::user()->hasRole('customer') && $payment->user_id !== Auth::id()) {
            abort(403);
        } elseif (Auth::user()->hasRole('service_provider')) {
            $serviceProvider = Auth::user()->serviceProvider;
            if (!$serviceProvider || $payment->invoice->service_provider_id !== $serviceProvider->id) {
                abort(403);
            }
        }

        $payment->load(['invoice.serviceProvider', 'invoice.user', 'paymentMethod', 'user']);

        if (request()->expectsJson()) {
            return response()->json($payment);
        }

        return view('payments.show', compact('payment'));
    }

    /**
     * API endpoint for showing payment
     */
    public function apiShow(Payment $payment): JsonResponse
    {
        return $this->show($payment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        // Only allow deletion if payment is pending or failed
        if (!in_array($payment->status, ['pending', 'failed'])) {
            return redirect()->back()->with('error', __('Cannot delete completed payments.'));
        }

        // Check authorization
        if (Auth::user()->hasRole('customer') && $payment->user_id !== Auth::id()) {
            abort(403);
        }

        $payment->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Payment deleted successfully.']);
        }

        return redirect()->route('payments.index')
                        ->with('success', __('Payment deleted successfully.'));
    }

    /**
     * API endpoint for deleting payment
     */
    public function apiDestroy(Payment $payment): JsonResponse
    {
        return $this->destroy($payment);
    }

    /**
     * Download payment receipt as PDF
     */
    public function receipt(Payment $payment)
    {
        // Check authorization
        if (Auth::user()->hasRole('customer') && $payment->user_id !== Auth::id()) {
            abort(403);
        }

        if ($payment->status !== 'completed') {
            return redirect()->back()->with('error', __('Receipt is only available for completed payments.'));
        }

        $payment->load(['invoice.serviceProvider', 'invoice.user', 'paymentMethod', 'user']);
        
        $pdf = Pdf::loadView('payments.receipt', compact('payment'));
        
        return $pdf->download("receipt-{$payment->payment_reference}.pdf");
    }

    /**
     * API endpoint for downloading payment receipt
     */
    public function apiReceipt(Payment $payment)
    {
        return $this->receipt($payment);
    }
}
