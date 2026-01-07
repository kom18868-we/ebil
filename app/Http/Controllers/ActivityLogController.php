<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    /**
     * Get activity logs for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Admins can see all logs, others see only their own
        $query = ActivityLog::with('user')
            ->when(!$user->hasRole('admin'), function ($q) use ($user) {
                return $q->where('user_id', $user->id);
            });

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by user (admin only)
        if ($request->has('user_id') && $user->hasRole('admin')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by model type
        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        // Filter by model ID
        if ($request->has('model_id')) {
            $query->where('model_id', $request->model_id);
        }

        // Search in description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get activity log statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = ActivityLog::query()
            ->when(!$user->hasRole('admin'), function ($q) use ($user) {
                return $q->where('user_id', $user->id);
            });

        // Date range filter
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $stats = [
            'total_activities' => $query->count(),
            'activities_today' => (clone $query)->whereDate('created_at', today())->count(),
            'activities_this_week' => (clone $query)->whereDate('created_at', '>=', now()->startOfWeek())->count(),
            'activities_this_month' => (clone $query)->whereDate('created_at', '>=', now()->startOfMonth())->count(),
            'top_actions' => (clone $query)
                ->selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->map(fn($item) => ['action' => $item->action, 'count' => $item->count]),
        ];

        return response()->json($stats);
    }

    /**
     * Get a specific activity log
     */
    public function show(ActivityLog $activityLog): JsonResponse
    {
        $user = Auth::user();
        
        // Users can only view their own logs unless admin
        if (!$user->hasRole('admin') && $activityLog->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $activityLog->load('user', 'model');

        return response()->json($activityLog);
    }
}

