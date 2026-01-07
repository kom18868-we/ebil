<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);
        
        App::setLocale($locale);
        Session::put('locale', $locale);

        return $next($request);
    }

    private function determineLocale(Request $request): string
    {
        $supportedLocales = ['en', 'ar'];
        $defaultLocale = 'en';

        // 1. Check if locale is set in URL parameter
        if ($request->has('lang') && in_array($request->get('lang'), $supportedLocales)) {
            return $request->get('lang');
        }

        // 2. Check if locale is set in session
        if (Session::has('locale') && in_array(Session::get('locale'), $supportedLocales)) {
            return Session::get('locale');
        }

        // 3. Check authenticated user's preferred language
        if ($request->user() && in_array($request->user()->preferred_language, $supportedLocales)) {
            return $request->user()->preferred_language;
        }

        // 4. Check browser's preferred language
        $browserLocale = $request->getPreferredLanguage($supportedLocales);
        if ($browserLocale && in_array($browserLocale, $supportedLocales)) {
            return $browserLocale;
        }

        // 5. Fall back to default locale
        return $defaultLocale;
    }
}
