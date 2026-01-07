<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): View
    {
        return view('profile.edit', [
            'user' => $request->user(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Display the user's security settings.
     */
    public function security(Request $request): View
    {
        return view('profile.security', [
            'user' => $request->user(),
        ]);
    }

    /**
     * Display the user's preferences.
     */
    public function preferences(Request $request): View
    {
        return view('profile.preferences', [
            'user' => $request->user(),
        ]);
    }

    /**
     * API: Get the authenticated user's profile.
     */
    public function apiShow(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roles', 'permissions');
        
        return response()->json($user);
    }

    /**
     * API: Update the authenticated user's profile information.
     */
    public function apiUpdate(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Get validated data
        $validated = $request->validated();
        
        // Update user
        $user->fill($validated);
        
        // If email changed, reset email verification
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        
        $user->save();
        $user->load('roles', 'permissions');
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * API: Get the user's security settings.
     */
    public function apiSecurity(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'two_factor_enabled' => $user->two_factor_enabled ?? false,
            'last_login_at' => $user->last_login_at,
        ]);
    }

    /**
     * API: Get the user's preferences.
     */
    public function apiPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $defaultPreferences = [
            'email_reminders_enabled' => true,
            'reminder_7_days' => true,
            'reminder_3_days' => true,
            'reminder_1_day' => true,
            'reminder_overdue' => true,
        ];
        
        $preferences = array_merge($defaultPreferences, $user->preferences ?? []);
        
        return response()->json([
            'preferred_language' => $user->preferred_language ?? 'en',
            'preferences' => $preferences,
        ]);
    }

    /**
     * API: Update the user's preferences.
     */
    public function apiUpdatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferred_language' => 'nullable|string|max:10',
            'preferences' => 'nullable|array',
            'preferences.email_reminders_enabled' => 'nullable|boolean',
            'preferences.reminder_7_days' => 'nullable|boolean',
            'preferences.reminder_3_days' => 'nullable|boolean',
            'preferences.reminder_1_day' => 'nullable|boolean',
            'preferences.reminder_overdue' => 'nullable|boolean',
        ]);

        $user = $request->user();
        
        // Update preferred language if provided
        if (isset($validated['preferred_language'])) {
            $user->preferred_language = $validated['preferred_language'];
        }
        
        // Merge preferences
        $currentPreferences = $user->preferences ?? [];
        if (isset($validated['preferences'])) {
            $currentPreferences = array_merge($currentPreferences, $validated['preferences']);
        }
        
        $user->preferences = $currentPreferences;
        $user->save();
        
        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferred_language' => $user->preferred_language,
            'preferences' => $user->preferences,
        ]);
    }

    /**
     * API: Change the user's password.
     */
    public function apiChangePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        $user->password = bcrypt($validated['password']);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
