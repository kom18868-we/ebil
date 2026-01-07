<?php

namespace App\Http\Controllers;

use App\Models\ServiceProviderRating;
use App\Models\ServiceProvider;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get ratings for a service provider
     */
    public function index(Request $request, $serviceProviderId): JsonResponse
    {
        // Validate service provider ID
        if (!$serviceProviderId || !is_numeric($serviceProviderId)) {
            return response()->json([
                'message' => 'Invalid service provider ID',
                'errors' => ['service_provider_id' => ['Invalid service provider ID provided']],
            ], 422);
        }

        $serviceProvider = ServiceProvider::find($serviceProviderId);
        
        if (!$serviceProvider) {
            return response()->json([
                'message' => 'Service provider not found',
                'errors' => ['service_provider' => ['Service provider not found']],
            ], 404);
        }

        $query = $serviceProvider->visibleRatings()
            ->with(['user:id,name,email', 'invoice:id,invoice_number,title']);

        // Filter by rating value
        if ($request->filled('rating')) {
            $query->where('rating', $request->rating);
        }

        // Sort by newest first
        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 10);
        $ratings = $query->paginate($perPage);

        // Calculate statistics
        $stats = [
            'average_rating' => round($serviceProvider->average_rating, 2),
            'total_ratings' => $serviceProvider->ratings_count,
            'rating_distribution' => [
                5 => $serviceProvider->visibleRatings()->where('rating', 5)->count(),
                4 => $serviceProvider->visibleRatings()->where('rating', 4)->count(),
                3 => $serviceProvider->visibleRatings()->where('rating', 3)->count(),
                2 => $serviceProvider->visibleRatings()->where('rating', 2)->count(),
                1 => $serviceProvider->visibleRatings()->where('rating', 1)->count(),
            ],
        ];

        return response()->json([
            'ratings' => $ratings,
            'statistics' => $stats,
        ]);
    }

    /**
     * Store a new rating
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_provider_id' => 'required|exists:service_providers,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        // Check if invoice is provided, verify it belongs to the user and service provider
        if ($validated['invoice_id']) {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
            
            // Verify invoice belongs to the user
            if ($invoice->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Invoice does not belong to you',
                    'errors' => ['invoice_id' => ['Invoice does not belong to you']],
                ], 403);
            }

            // Verify invoice belongs to the service provider
            if ($invoice->service_provider_id != $validated['service_provider_id']) {
                return response()->json([
                    'message' => 'Invoice does not belong to this service provider',
                    'errors' => ['invoice_id' => ['Invoice does not belong to this service provider']],
                ], 422);
            }

            // Check if user has already rated this invoice
            $existingRating = ServiceProviderRating::where('user_id', $user->id)
                ->where('invoice_id', $validated['invoice_id'])
                ->first();

            if ($existingRating) {
                return response()->json([
                    'message' => 'You have already rated this invoice',
                    'errors' => ['invoice_id' => ['You have already rated this invoice']],
                    'existing_rating' => $existingRating,
                ], 422);
            }
        }

        // Prevent users from rating their own service provider
        $serviceProvider = ServiceProvider::findOrFail($validated['service_provider_id']);
        if ($serviceProvider->user_id === $user->id) {
            return response()->json([
                'message' => 'You cannot rate your own service provider',
                'errors' => ['service_provider_id' => ['You cannot rate your own service provider']],
            ], 403);
        }

        $rating = ServiceProviderRating::create([
            'user_id' => $user->id,
            'service_provider_id' => $validated['service_provider_id'],
            'invoice_id' => $validated['invoice_id'] ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_visible' => true,
        ]);

        $rating->load(['user:id,name,email', 'serviceProvider:id,company_name', 'invoice:id,invoice_number,title']);

        return response()->json([
            'message' => 'Rating submitted successfully',
            'rating' => $rating,
        ], 201);
    }

    /**
     * Update a rating
     */
    public function update(Request $request, $ratingId): JsonResponse
    {
        $user = Auth::user();

        // Validate rating ID
        if (!$ratingId || !is_numeric($ratingId)) {
            return response()->json([
                'message' => 'Invalid rating ID',
                'errors' => ['rating_id' => ['Invalid rating ID provided']],
            ], 422);
        }

        // Find the rating
        $rating = ServiceProviderRating::find($ratingId);
        
        if (!$rating) {
            return response()->json([
                'message' => 'Rating not found',
                'errors' => ['rating' => ['Rating not found']],
            ], 404);
        }

        // Verify the rating belongs to the user
        if ($rating->user_id !== $user->id) {
            return response()->json([
                'message' => 'You can only update your own ratings',
                'errors' => ['rating' => ['You can only update your own ratings']],
            ], 403);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $rating->update($validated);
        $rating->load(['user:id,name,email', 'serviceProvider:id,company_name', 'invoice:id,invoice_number,title']);

        return response()->json([
            'message' => 'Rating updated successfully',
            'rating' => $rating,
        ]);
    }

    /**
     * Delete a rating
     */
    public function destroy($ratingId): JsonResponse
    {
        $user = Auth::user();

        // Validate rating ID
        if (!$ratingId || !is_numeric($ratingId)) {
            return response()->json([
                'message' => 'Invalid rating ID',
                'errors' => ['rating_id' => ['Invalid rating ID provided']],
            ], 422);
        }

        // Find the rating
        $rating = ServiceProviderRating::find($ratingId);
        
        if (!$rating) {
            return response()->json([
                'message' => 'Rating not found',
                'errors' => ['rating' => ['Rating not found']],
            ], 404);
        }

        // Verify the rating belongs to the user
        if ($rating->user_id !== $user->id) {
            return response()->json([
                'message' => 'You can only delete your own ratings',
                'errors' => ['rating' => ['You can only delete your own ratings']],
            ], 403);
        }

        $rating->delete();

        return response()->json([
            'message' => 'Rating deleted successfully',
        ]);
    }

    /**
     * Get user's rating for a specific invoice
     */
    public function getByInvoice($invoiceId): JsonResponse
    {
        $user = Auth::user();

        $invoice = Invoice::find($invoiceId);
        
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice not found',
                'errors' => ['invoice' => ['Invoice not found']],
            ], 404);
        }

        // Verify invoice belongs to the user
        if ($invoice->user_id !== $user->id) {
            return response()->json([
                'message' => 'Invoice does not belong to you',
                'errors' => ['invoice' => ['Invoice does not belong to you']],
            ], 403);
        }

        $rating = ServiceProviderRating::where('user_id', $user->id)
            ->where('invoice_id', $invoice->id)
            ->with(['user:id,name,email', 'serviceProvider:id,company_name'])
            ->first();

        return response()->json([
            'rating' => $rating,
        ]);
    }

    /**
     * Get user's ratings
     */
    public function myRatings(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = ServiceProviderRating::where('user_id', $user->id)
            ->with(['serviceProvider:id,company_name,user_id', 'invoice:id,invoice_number,title']);

        if ($request->filled('service_provider_id')) {
            $query->where('service_provider_id', $request->service_provider_id);
        }

        $perPage = $request->input('per_page', 10);
        $ratings = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'ratings' => $ratings,
        ]);
    }
}

