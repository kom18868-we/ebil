<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ServiceProviderController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:admin']);
    }

    /**
     * Display a listing of service providers.
     */
    public function index(Request $request)
    {
        $query = ServiceProvider::with('user')
            ->withCount('visibleRatings as ratings_count')
            ->withAvg('visibleRatings as average_rating', 'rating');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('business_registration', 'like', "%{$search}%")
                  ->orWhere('tax_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $serviceProviders = $query->orderBy('created_at', 'desc')->paginate(20);

        if ($request->expectsJson()) {
            return response()->json([
                'service_providers' => $serviceProviders,
            ]);
        }

        return view('admin.service-providers.index', compact('serviceProviders'));
    }

    /**
     * Show the form for creating a new service provider.
     */
    public function create()
    {
        $users = User::whereDoesntHave('serviceProvider')->get();
        return view('admin.service-providers.create', compact('users'));
    }

    /**
     * Store a newly created service provider.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:service_providers,user_id',
            'company_name' => 'required|string|max:255',
            'business_registration' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive,suspended',
        ]);

        DB::beginTransaction();
        try {
            $serviceProvider = ServiceProvider::create($validated);
            
            // Assign service_provider role to user if not already assigned
            $user = User::findOrFail($validated['user_id']);
            if (!$user->hasRole('service_provider')) {
                $user->assignRole('service_provider');
            }

            DB::commit();

            if ($request->expectsJson()) {
                $serviceProvider->load('user');
                return response()->json([
                    'message' => 'Service provider created successfully',
                    'service_provider' => $serviceProvider,
                ], 201);
            }

            return redirect()->route('admin.service-providers.index')
                            ->with('success', __('Service provider created successfully.'));
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to create service provider',
                    'errors' => ['general' => [$e->getMessage()]],
                ], 422);
            }

            return back()->with('error', __('Failed to create service provider.'));
        }
    }

    /**
     * Display the specified service provider.
     */
    public function show(ServiceProvider $serviceProvider)
    {
        $serviceProvider->load(['user', 'invoices.user', 'invoices.payments']);
        
        if (request()->expectsJson()) {
            return response()->json([
                'service_provider' => $serviceProvider,
            ]);
        }

        return view('admin.service-providers.show', compact('serviceProvider'));
    }

    /**
     * Show the form for editing the specified service provider.
     */
    public function edit(ServiceProvider $serviceProvider)
    {
        $serviceProvider->load('user');
        $users = User::whereDoesntHave('serviceProvider')
                     ->orWhere('id', $serviceProvider->user_id)
                     ->get();
        return view('admin.service-providers.edit', compact('serviceProvider', 'users'));
    }

    /**
     * Update the specified service provider.
     */
    public function update(Request $request, ServiceProvider $serviceProvider)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:service_providers,user_id,' . $serviceProvider->id,
            'company_name' => 'required|string|max:255',
            'business_registration' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive,suspended',
        ]);

        DB::beginTransaction();
        try {
            // If user_id changed, update roles
            if ($serviceProvider->user_id != $validated['user_id']) {
                $oldUser = User::find($serviceProvider->user_id);
                $newUser = User::findOrFail($validated['user_id']);
                
                // Remove role from old user if they have no other service provider
                if ($oldUser && !$oldUser->serviceProviders()->where('id', '!=', $serviceProvider->id)->exists()) {
                    $oldUser->removeRole('service_provider');
                }
                
                // Assign role to new user
                if (!$newUser->hasRole('service_provider')) {
                    $newUser->assignRole('service_provider');
                }
            }

            $serviceProvider->update($validated);
            $serviceProvider->load('user');

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Service provider updated successfully',
                    'service_provider' => $serviceProvider,
                ]);
            }

            return redirect()->route('admin.service-providers.index')
                            ->with('success', __('Service provider updated successfully.'));
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update service provider',
                    'errors' => ['general' => [$e->getMessage()]],
                ], 422);
            }

            return back()->with('error', __('Failed to update service provider.'));
        }
    }

    /**
     * Remove the specified service provider.
     */
    public function destroy(ServiceProvider $serviceProvider)
    {
        DB::beginTransaction();
        try {
            $user = $serviceProvider->user;
            $serviceProvider->delete();
            
            // Remove role from user if they have no other service providers
            if ($user && !$user->serviceProviders()->exists()) {
                $user->removeRole('service_provider');
            }

            DB::commit();

            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Service provider deleted successfully',
                ]);
            }

            return redirect()->route('admin.service-providers.index')
                            ->with('success', __('Service provider deleted successfully.'));
        } catch (\Exception $e) {
            DB::rollBack();
            
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to delete service provider',
                    'errors' => ['general' => [$e->getMessage()]],
                ], 422);
            }

            return back()->with('error', __('Failed to delete service provider.'));
        }
    }

    /**
     * Toggle service provider status.
     */
    public function toggleStatus(ServiceProvider $serviceProvider)
    {
        $newStatus = $serviceProvider->status === 'active' ? 'inactive' : 'active';
        $serviceProvider->update(['status' => $newStatus]);
        $serviceProvider->load('user');

        if (request()->expectsJson()) {
            return response()->json([
                'message' => 'Service provider status updated successfully',
                'service_provider' => $serviceProvider,
            ]);
        }

        return back()->with('success', __('Service provider status updated successfully.'));
    }

    /**
     * API: Get all service providers
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * API: Create a new service provider
     */
    public function apiStore(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * API: Get a specific service provider
     */
    public function apiShow(ServiceProvider $serviceProvider): JsonResponse
    {
        return $this->show($serviceProvider);
    }

    /**
     * API: Update a service provider
     */
    public function apiUpdate(Request $request, ServiceProvider $serviceProvider): JsonResponse
    {
        return $this->update($request, $serviceProvider);
    }

    /**
     * API: Delete a service provider
     */
    public function apiDestroy(ServiceProvider $serviceProvider): JsonResponse
    {
        return $this->destroy($serviceProvider);
    }

    /**
     * API: Toggle service provider status
     */
    public function apiToggleStatus(ServiceProvider $serviceProvider): JsonResponse
    {
        return $this->toggleStatus($serviceProvider);
    }

    /**
     * API: Get available users for service provider creation
     */
    public function apiGetAvailableUsers(Request $request): JsonResponse
    {
        $query = User::whereDoesntHave('serviceProvider');
        
        // If editing, include the current user
        if ($request->filled('exclude_provider_id')) {
            $provider = ServiceProvider::find($request->exclude_provider_id);
            if ($provider) {
                $query->orWhere('id', $provider->user_id);
            }
        }
        
        $users = $query->select('id', 'name', 'email', 'is_active')
                      ->where('is_active', true)
                      ->orderBy('name')
                      ->get();
        
        return response()->json([
            'users' => $users,
        ]);
    }
}

