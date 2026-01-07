<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();

        // Regenerate session if available
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user = Auth::user();
        $user->load('roles', 'permissions');

        // Log login activity
        try {
            ActivityLogService::logUserLogin($user);
        } catch (\Exception $e) {
            \Log::error('Failed to log user login activity', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        if ($request->expectsJson()) {
            // Create Sanctum token for API
            $token = $user->createToken('api-token')->plainTextToken;
            
            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful',
            ]);
        }

        return redirect()->intended(RouteServiceProvider::HOME);
    }

    /**
     * API Login endpoint
     */
    public function apiLogin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            // Regenerate session if available (for stateful requests)
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
            
            $user = Auth::user();
            $user->load('roles', 'permissions');
            
            // Log login activity
            try {
                ActivityLogService::logUserLogin($user);
            } catch (\Exception $e) {
                \Log::error('Failed to log user login activity', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
            
            // Create Sanctum token for API
            $token = $user->createToken('api-token')->plainTextToken;
            
            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful',
            ]);
        }

        return response()->json([
            'message' => 'The provided credentials do not match our records.',
            'errors' => [
                'email' => ['The provided credentials do not match our records.'],
            ],
        ], 422);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Revoke Sanctum tokens
        if ($user) {
            $user->tokens()->delete();
            
            // Log logout activity
            try {
                ActivityLogService::logUserLogout($user);
            } catch (\Exception $e) {
                \Log::error('Failed to log user logout activity', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Logged out successfully']);
        }

        return redirect('/');
    }

    /**
     * API endpoint for logout
     */
    public function apiDestroy(Request $request): JsonResponse
    {
        return $this->destroy($request);
    }
}
