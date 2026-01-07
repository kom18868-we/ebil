<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ActivityLog;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users
        if ($request->user()) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    private function logActivity(Request $request, Response $response)
    {
        // Skip logging for certain routes
        $skipRoutes = [
            'debugbar.*',
            'horizon.*',
            'telescope.*',
            '_ignition.*',
        ];

        foreach ($skipRoutes as $pattern) {
            if ($request->routeIs($pattern)) {
                return;
            }
        }

        // Skip logging for asset requests
        if ($request->is('css/*') || $request->is('js/*') || $request->is('images/*')) {
            return;
        }

        // Determine action based on route and method
        $action = $this->determineAction($request);
        
        if (!$action) {
            return;
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'description' => $this->generateDescription($request, $action),
            'properties' => [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'route' => $request->route()?->getName(),
                'status_code' => $response->getStatusCode(),
                'user_agent' => $request->userAgent(),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function determineAction(Request $request): ?string
    {
        $route = $request->route()?->getName();
        $method = $request->method();

        // Map routes to actions
        $actionMap = [
            'login' => 'user_login',
            'logout' => 'user_logout',
            'register' => 'user_register',
            'password.reset' => 'password_reset',
            'profile.update' => 'profile_update',
            'invoices.create' => 'invoice_create',
            'invoices.update' => 'invoice_update',
            'invoices.destroy' => 'invoice_delete',
            'payments.store' => 'payment_create',
            'tickets.create' => 'ticket_create',
            'tickets.update' => 'ticket_update',
        ];

        if (isset($actionMap[$route])) {
            return $actionMap[$route];
        }

        // Generic actions based on method and route patterns
        if (str_contains($route, '.store') && $method === 'POST') {
            return 'create_' . $this->extractModelFromRoute($route);
        }

        if (str_contains($route, '.update') && in_array($method, ['PUT', 'PATCH'])) {
            return 'update_' . $this->extractModelFromRoute($route);
        }

        if (str_contains($route, '.destroy') && $method === 'DELETE') {
            return 'delete_' . $this->extractModelFromRoute($route);
        }

        return null;
    }

    private function extractModelFromRoute(string $route): string
    {
        $parts = explode('.', $route);
        return $parts[0] ?? 'unknown';
    }

    private function generateDescription(Request $request, string $action): string
    {
        $user = $request->user();
        $descriptions = [
            'user_login' => "User {$user->name} logged in",
            'user_logout' => "User {$user->name} logged out",
            'profile_update' => "User {$user->name} updated their profile",
            'invoice_create' => "User {$user->name} created a new invoice",
            'invoice_update' => "User {$user->name} updated an invoice",
            'invoice_delete' => "User {$user->name} deleted an invoice",
            'payment_create' => "User {$user->name} made a payment",
            'ticket_create' => "User {$user->name} created a support ticket",
            'ticket_update' => "User {$user->name} updated a support ticket",
        ];

        return $descriptions[$action] ?? "User {$user->name} performed action: {$action}";
    }
}
