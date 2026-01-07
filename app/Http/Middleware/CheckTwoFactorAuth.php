<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTwoFactorAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip if user is not authenticated
        if (!$user) {
            return $next($request);
        }

        // Skip if two-factor is not enabled
        if (!$user->two_factor_enabled) {
            return $next($request);
        }

        // Skip if already verified in this session
        if ($request->session()->has('two_factor_verified')) {
            return $next($request);
        }

        // Skip for two-factor verification routes
        if ($request->routeIs('two-factor.*')) {
            return $next($request);
        }

        // Skip for logout route
        if ($request->routeIs('logout')) {
            return $next($request);
        }

        // Redirect to two-factor verification
        return redirect()->route('two-factor.verify');
    }
}
