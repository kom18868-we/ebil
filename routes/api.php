<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ServiceProviderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'apiLogin']);
Route::post('/register', [\App\Http\Controllers\Auth\RegisteredUserController::class, 'apiStore']);
Route::post('/forgot-password', [\App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [\App\Http\Controllers\Auth\NewPasswordController::class, 'store']);

// Sanctum CSRF cookie
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Logout
    Route::post('/logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'apiDestroy'])->name('api.logout');
    
    // User
    Route::get('/user', function (Request $request) {
        return response()->json($request->user()->load('roles', 'permissions'));
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'apiIndex'])->name('api.dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'apiShow'])->name('api.profile.show');
    Route::put('/profile', [ProfileController::class, 'apiUpdate'])->name('api.profile.update');
    Route::get('/profile/security', [ProfileController::class, 'apiSecurity'])->name('api.profile.security');
    Route::get('/profile/preferences', [ProfileController::class, 'apiPreferences'])->name('api.profile.preferences');
    Route::put('/profile/preferences', [ProfileController::class, 'apiUpdatePreferences'])->name('api.profile.update-preferences');
    Route::post('/profile/change-password', [ProfileController::class, 'apiChangePassword'])->name('api.profile.change-password');

    // Invoices
    Route::get('/invoices', [InvoiceController::class, 'apiIndex'])->name('api.invoices.index');
    Route::get('/invoices/customers', [InvoiceController::class, 'apiGetCustomers'])->name('api.invoices.customers');
    Route::post('/invoices', [InvoiceController::class, 'apiStore'])->name('api.invoices.store');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'apiShow'])->name('api.invoices.show');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'apiUpdate'])->name('api.invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'apiDestroy'])->name('api.invoices.destroy');
    Route::get('/invoices/{invoice}/download', [InvoiceController::class, 'apiDownload'])->name('api.invoices.download');
    Route::post('/invoices/{invoice}/mark-as-paid', [InvoiceController::class, 'apiMarkAsPaid'])->name('api.invoices.mark-as-paid');
    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'apiCancel'])->name('api.invoices.cancel');
    Route::post('/invoices/archive', [InvoiceController::class, 'apiArchive'])->name('api.invoices.archive');

    // Payments
    Route::get('/payments', [PaymentController::class, 'apiIndex'])->name('api.payments.index');
    Route::post('/payments', [PaymentController::class, 'apiStore'])->name('api.payments.store');
    Route::get('/payments/{payment}', [PaymentController::class, 'apiShow'])->name('api.payments.show');
    Route::delete('/payments/{payment}', [PaymentController::class, 'apiDestroy'])->name('api.payments.destroy');
    Route::get('/payments/{payment}/receipt', [PaymentController::class, 'apiReceipt'])->name('api.payments.receipt');

    // Refunds
    Route::get('/refunds', [\App\Http\Controllers\RefundController::class, 'index'])->name('api.refunds.index');
    Route::post('/refunds', [\App\Http\Controllers\RefundController::class, 'store'])->name('api.refunds.store');
    Route::get('/refunds/{refund}', [\App\Http\Controllers\RefundController::class, 'show'])->name('api.refunds.show');
    Route::post('/refunds/{refund}/cancel', [\App\Http\Controllers\RefundController::class, 'cancel'])->name('api.refunds.cancel');

    // Payment Methods
    Route::get('/payment-methods', [PaymentMethodController::class, 'apiIndex'])->name('api.payment-methods.index');
    Route::post('/payment-methods', [PaymentMethodController::class, 'apiStore'])->name('api.payment-methods.store');
    Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'apiUpdate'])->name('api.payment-methods.update');
    Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'apiDestroy'])->name('api.payment-methods.destroy');
    Route::post('/payment-methods/{paymentMethod}/make-default', [PaymentMethodController::class, 'apiMakeDefault'])->name('api.payment-methods.make-default');

    // Support Tickets
    Route::get('/tickets', [SupportTicketController::class, 'apiIndex'])->name('api.tickets.index');
    Route::post('/tickets', [SupportTicketController::class, 'apiStore'])->name('api.tickets.store');
    Route::get('/tickets/{ticket}', [SupportTicketController::class, 'apiShow'])->name('api.tickets.show');
    Route::put('/tickets/{ticket}', [SupportTicketController::class, 'apiUpdate'])->name('api.tickets.update');
    Route::delete('/tickets/{ticket}', [SupportTicketController::class, 'apiDestroy'])->name('api.tickets.destroy');
    Route::post('/tickets/{ticket}/replies', [SupportTicketController::class, 'apiReply'])->name('api.tickets.reply');
    Route::post('/tickets/{ticket}/resolve', [SupportTicketController::class, 'apiResolve'])->name('api.tickets.resolve');
    Route::post('/tickets/{ticket}/close', [SupportTicketController::class, 'apiClose'])->name('api.tickets.close');
    Route::post('/tickets/{ticket}/rate', [SupportTicketController::class, 'apiRate'])->name('api.tickets.rate');

    // Ratings
    Route::get('/service-providers/{serviceProvider}/ratings', [\App\Http\Controllers\RatingController::class, 'index'])->name('api.ratings.index');
    Route::post('/ratings', [\App\Http\Controllers\RatingController::class, 'store'])->name('api.ratings.store');
    Route::put('/ratings/{rating}', [\App\Http\Controllers\RatingController::class, 'update'])->name('api.ratings.update');
    Route::delete('/ratings/{rating}', [\App\Http\Controllers\RatingController::class, 'destroy'])->name('api.ratings.destroy');
    Route::get('/invoices/{invoice}/rating', [\App\Http\Controllers\RatingController::class, 'getByInvoice'])->name('api.ratings.by-invoice');
    Route::get('/my-ratings', [\App\Http\Controllers\RatingController::class, 'myRatings'])->name('api.ratings.my-ratings');

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('api.notifications.index');
    Route::get('/notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount'])->name('api.notifications.unread-count');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('api.notifications.mark-all-read');
    Route::delete('/notifications', [\App\Http\Controllers\NotificationController::class, 'destroyAll'])->name('api.notifications.destroy-all');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('api.notifications.mark-as-read');
    Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('api.notifications.destroy');

    // Service Provider Integration API
    Route::prefix('provider')->name('provider.')->group(function () {
        Route::get('/profile', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getProfile'])->name('profile');
        Route::put('/profile', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'updateProfile'])->name('profile.update');
        Route::get('/statistics', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getStatistics'])->name('statistics');
        Route::get('/invoices', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getInvoices'])->name('invoices');
        Route::post('/invoices', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'createInvoice'])->name('invoices.create');
        Route::get('/customers', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getCustomers'])->name('customers');
        Route::get('/api-keys', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getApiKeys'])->name('api-keys');
        Route::post('/api-keys', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'generateApiKey'])->name('api-keys.generate');
        Route::delete('/api-keys/{keyId}', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'revokeApiKey'])->name('api-keys.revoke');
        Route::get('/webhooks', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'getWebhooks'])->name('webhooks');
        Route::post('/webhooks', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'configureWebhook'])->name('webhooks.configure');
        Route::delete('/webhooks/{webhookId}', [\App\Http\Controllers\ServiceProviderIntegrationController::class, 'deleteWebhook'])->name('webhooks.delete');
    });

    // Admin Routes
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        // Admin Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'apiIndex'])->name('dashboard');

        // User Management
        Route::get('/users', [AdminUserController::class, 'apiIndex'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'apiStore'])->name('users.store');
        Route::get('/users/{user}', [AdminUserController::class, 'apiShow'])->name('users.show');
        Route::put('/users/{user}', [AdminUserController::class, 'apiUpdate'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'apiDestroy'])->name('users.destroy');
        Route::post('/users/{user}/toggle-status', [AdminUserController::class, 'apiToggleStatus'])->name('users.toggle-status');
        Route::post('/users/{user}/assign-role', [AdminUserController::class, 'apiAssignRole'])->name('users.assign-role');

        // Service Providers
        Route::get('/service-providers', [ServiceProviderController::class, 'apiIndex'])->name('service-providers.index');
        Route::get('/service-providers/available-users', [ServiceProviderController::class, 'apiGetAvailableUsers'])->name('service-providers.available-users');
        Route::post('/service-providers', [ServiceProviderController::class, 'apiStore'])->name('service-providers.store');
        Route::get('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'apiShow'])->name('service-providers.show');
        Route::put('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'apiUpdate'])->name('service-providers.update');
        Route::delete('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'apiDestroy'])->name('service-providers.destroy');
        Route::post('/service-providers/{serviceProvider}/toggle-status', [ServiceProviderController::class, 'apiToggleStatus'])->name('service-providers.toggle-status');

        // Reports
        Route::get('/reports', [ReportController::class, 'apiIndex'])->name('reports.index');
        Route::get('/reports/invoices', [ReportController::class, 'apiInvoices'])->name('reports.invoices');
        Route::get('/reports/payments', [ReportController::class, 'apiPayments'])->name('reports.payments');
        Route::get('/reports/users', [ReportController::class, 'apiUsers'])->name('reports.users');
        Route::get('/reports/financial', [ReportController::class, 'apiFinancial'])->name('reports.financial');
        Route::get('/reports/usage', [ReportController::class, 'apiUsage'])->name('reports.usage');
        Route::post('/reports/export', [ReportController::class, 'apiExport'])->name('reports.export');
        Route::post('/reports/schedule', [ReportController::class, 'apiSchedule'])->name('reports.schedule');

        // Roles
        Route::get('/roles', [\App\Http\Controllers\Admin\RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [\App\Http\Controllers\Admin\RoleController::class, 'store'])->name('roles.store');
        Route::get('/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'show'])->name('roles.show');
        Route::put('/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])->name('roles.destroy');
        Route::post('/roles/{role}/permissions', [\App\Http\Controllers\Admin\RoleController::class, 'assignPermissions'])->name('roles.assign-permissions');

        // Permissions
        Route::get('/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'index'])->name('permissions.index');
        Route::post('/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'store'])->name('permissions.store');
        Route::get('/permissions/{permission}', [\App\Http\Controllers\Admin\PermissionController::class, 'show'])->name('permissions.show');
        Route::put('/permissions/{permission}', [\App\Http\Controllers\Admin\PermissionController::class, 'update'])->name('permissions.update');
        Route::delete('/permissions/{permission}', [\App\Http\Controllers\Admin\PermissionController::class, 'destroy'])->name('permissions.destroy');
    });

    // Activity Logs
    Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');
    Route::get('/activity-logs/stats', [\App\Http\Controllers\ActivityLogController::class, 'stats'])->name('activity-logs.stats');
    Route::get('/activity-logs/{activityLog}', [\App\Http\Controllers\ActivityLogController::class, 'show'])->name('activity-logs.show');
});
