<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    /**
     * Switch the application language
     */
    public function switch(Request $request)
    {
        $locale = $request->input('lang', 'en');
        
        // Validate locale
        if (!in_array($locale, ['en', 'ar'])) {
            $locale = 'en';
        }

        // Set the application locale
        App::setLocale($locale);
        
        // Store the locale in session
        Session::put('locale', $locale);
        
        // Update user preference if authenticated
        if (auth()->check()) {
            auth()->user()->update(['preferred_language' => $locale]);
        }

        return redirect()->route('dashboard')->with('success', __('Language changed successfully.'));
    }

    /**
     * Get available locales
     */
    public function getAvailableLocales()
    {
        return response()->json(config('app.available_locales'));
    }

    /**
     * Get current locale
     */
    public function getCurrentLocale()
    {
        return response()->json([
            'current_locale' => App::getLocale(),
            'available_locales' => config('app.available_locales')
        ]);
    }
}
