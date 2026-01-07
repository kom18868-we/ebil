<?php

namespace App\Http\Controllers;

use App\Models\ServiceProvider;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ServiceProviderIntegrationController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:service_provider']);
    }

    /**
     * Get service provider profile
     */
    public function getProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $serviceProvider->load('user');
        
        return response()->json([
            'service_provider' => $serviceProvider,
        ]);
    }

    /**
     * Update service provider profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'business_registration' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $serviceProvider->update($validated);
        $serviceProvider->load('user');

        return response()->json([
            'message' => 'Profile updated successfully',
            'service_provider' => $serviceProvider,
        ]);
    }

    /**
     * Get service provider statistics
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth());
        $dateTo = $request->input('date_to', Carbon::now()->endOfMonth());

        $stats = [
            'total_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)->count(),
            'pending_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->where('status', 'pending')->count(),
            'paid_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->where('status', 'paid')->count(),
            'overdue_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->where('status', 'overdue')->count(),
            'total_revenue' => Payment::whereHas('invoice', function($q) use ($serviceProvider) {
                $q->where('service_provider_id', $serviceProvider->id);
            })->where('status', 'completed')->sum('amount'),
            'period_revenue' => Payment::whereHas('invoice', function($q) use ($serviceProvider) {
                $q->where('service_provider_id', $serviceProvider->id);
            })
            ->where('status', 'completed')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->sum('amount'),
            'period_invoices' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->count(),
            'average_invoice_amount' => Invoice::where('service_provider_id', $serviceProvider->id)
                ->avg('total_amount'),
        ];

        return response()->json([
            'statistics' => $stats,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
        ]);
    }

    /**
     * Get service provider invoices
     */
    public function getInvoices(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $query = Invoice::where('service_provider_id', $serviceProvider->id)
            ->with(['user', 'payments']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('user_id', $request->customer_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 20);
        $invoices = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'invoices' => $invoices,
        ]);
    }

    /**
     * Create invoice via API
     */
    public function createInvoice(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'due_date' => 'required|date|after_or_equal:today',
            'issue_date' => 'nullable|date',
        ]);

        // Calculate total amount
        $totalAmount = $validated['amount'] + ($validated['tax_amount'] ?? 0);

        // Generate invoice number
        $invoiceNumber = Invoice::generateInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'user_id' => $validated['user_id'],
            'service_provider_id' => $serviceProvider->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount' => $validated['amount'],
            'tax_amount' => $validated['tax_amount'] ?? 0,
            'total_amount' => $totalAmount,
            'due_date' => $validated['due_date'],
            'issue_date' => $validated['issue_date'] ?? now(),
            'status' => 'pending',
        ]);

        $invoice->load(['user', 'serviceProvider']);

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice,
        ], 201);
    }

    /**
     * Get service provider customers
     */
    public function getCustomers(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $customers = User::whereHas('invoices', function($q) use ($serviceProvider) {
            $q->where('service_provider_id', $serviceProvider->id);
        })
        ->select('id', 'name', 'email', 'phone', 'is_active')
        ->distinct()
        ->get();

        return response()->json([
            'customers' => $customers,
        ]);
    }

    /**
     * Get API keys for service provider
     */
    public function getApiKeys(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $settings = $serviceProvider->settings ?? [];
        $apiKeys = $settings['api_keys'] ?? [];

        return response()->json([
            'api_keys' => $apiKeys,
        ]);
    }

    /**
     * Generate new API key
     */
    public function generateApiKey(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $apiKey = 'sp_' . Str::random(40);
        $keyId = Str::uuid()->toString();

        $settings = $serviceProvider->settings ?? [];
        $apiKeys = $settings['api_keys'] ?? [];
        
        $apiKeys[] = [
            'id' => $keyId,
            'name' => $validated['name'],
            'key' => $apiKey,
            'created_at' => now()->toIso8601String(),
            'last_used_at' => null,
        ];

        $settings['api_keys'] = $apiKeys;
        $serviceProvider->update(['settings' => $settings]);

        return response()->json([
            'message' => 'API key generated successfully',
            'api_key' => [
                'id' => $keyId,
                'name' => $validated['name'],
                'key' => $apiKey, // Only shown once
                'created_at' => now()->toIso8601String(),
            ],
            'warning' => 'Please save this API key. It will not be shown again.',
        ], 201);
    }

    /**
     * Revoke API key
     */
    public function revokeApiKey(Request $request, string $keyId): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $settings = $serviceProvider->settings ?? [];
        $apiKeys = $settings['api_keys'] ?? [];
        
        $apiKeys = array_filter($apiKeys, function($key) use ($keyId) {
            return ($key['id'] ?? null) !== $keyId;
        });

        $settings['api_keys'] = array_values($apiKeys);
        $serviceProvider->update(['settings' => $settings]);

        return response()->json([
            'message' => 'API key revoked successfully',
        ]);
    }

    /**
     * Get webhook configuration
     */
    public function getWebhooks(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $settings = $serviceProvider->settings ?? [];
        $webhooks = $settings['webhooks'] ?? [];

        return response()->json([
            'webhooks' => $webhooks,
        ]);
    }

    /**
     * Configure webhook
     */
    public function configureWebhook(Request $request): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $validated = $request->validate([
            'url' => 'required|url|max:500',
            'events' => 'required|array',
            'events.*' => 'in:invoice.created,invoice.paid,invoice.overdue,invoice.cancelled,payment.completed',
            'secret' => 'nullable|string|max:255',
        ]);

        $webhookId = Str::uuid()->toString();
        $settings = $serviceProvider->settings ?? [];
        $webhooks = $settings['webhooks'] ?? [];

        $webhooks[] = [
            'id' => $webhookId,
            'url' => $validated['url'],
            'events' => $validated['events'],
            'secret' => $validated['secret'] ?? Str::random(32),
            'active' => true,
            'created_at' => now()->toIso8601String(),
        ];

        $settings['webhooks'] = $webhooks;
        $serviceProvider->update(['settings' => $settings]);

        return response()->json([
            'message' => 'Webhook configured successfully',
            'webhook' => [
                'id' => $webhookId,
                'url' => $validated['url'],
                'events' => $validated['events'],
                'active' => true,
            ],
        ], 201);
    }

    /**
     * Delete webhook
     */
    public function deleteWebhook(Request $request, string $webhookId): JsonResponse
    {
        $user = Auth::user();
        $serviceProvider = $user->serviceProvider;
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider account not found',
                'errors' => ['general' => ['Service provider account not found']],
            ], 404);
        }

        $settings = $serviceProvider->settings ?? [];
        $webhooks = $settings['webhooks'] ?? [];
        
        $webhooks = array_filter($webhooks, function($webhook) use ($webhookId) {
            return ($webhook['id'] ?? null) !== $webhookId;
        });

        $settings['webhooks'] = array_values($webhooks);
        $serviceProvider->update(['settings' => $settings]);

        return response()->json([
            'message' => 'Webhook deleted successfully',
        ]);
    }
}

