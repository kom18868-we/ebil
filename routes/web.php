<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Language Routes
Route::get('/language/switch', [LanguageController::class, 'switch'])->name('language.switch');
Route::post('/language/switch', [LanguageController::class, 'switch'])->name('language.switch.post');
Route::get('/language/current', [LanguageController::class, 'getCurrentLocale'])->name('language.current');
Route::get('/language/available', [LanguageController::class, 'getAvailableLocales'])->name('language.available');

// Dashboard Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/profile/security', [ProfileController::class, 'security'])->name('profile.security');
    Route::get('/profile/preferences', [ProfileController::class, 'preferences'])->name('profile.preferences');

    // Invoice Routes
    Route::resource('invoices', InvoiceController::class);
    Route::get('/invoices/{invoice}/download', [InvoiceController::class, 'download'])->name('invoices.download');
    Route::post('/invoices/{invoice}/mark-as-paid', [InvoiceController::class, 'markAsPaid'])->name('invoices.mark-as-paid');
    Route::post('/invoices/archive', [InvoiceController::class, 'archive'])->name('invoices.archive');

    // Payment Routes
    Route::resource('payments', PaymentController::class)->except(['edit', 'update']);
    Route::get('/payments/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');

    // Payment Method Routes
    Route::resource('payment-methods', PaymentMethodController::class)->except(['show']);
    Route::post('/payment-methods/{paymentMethod}/make-default', [PaymentMethodController::class, 'makeDefault'])->name('payment-methods.make-default');

    // Support Ticket Routes
    Route::resource('tickets', SupportTicketController::class);
    Route::post('/tickets/{ticket}/replies', [SupportTicketController::class, 'reply'])->name('tickets.reply');
    Route::post('/tickets/{ticket}/close', [SupportTicketController::class, 'close'])->name('tickets.close');
    Route::post('/tickets/{ticket}/rate', [SupportTicketController::class, 'rate'])->name('tickets.rate');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // User Management
    Route::resource('users', AdminUserController::class);
    Route::post('/users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::post('/users/{user}/assign-role', [AdminUserController::class, 'assignRole'])->name('users.assign-role');
    
    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/invoices', [ReportController::class, 'invoices'])->name('reports.invoices');
    Route::get('/reports/payments', [ReportController::class, 'payments'])->name('reports.payments');
    Route::get('/reports/users', [ReportController::class, 'users'])->name('reports.users');
    Route::post('/reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::post('/reports/schedule', [ReportController::class, 'schedule'])->name('reports.schedule');
});

// Language Switching
Route::get('/lang/{locale}', function ($locale) {
    if (in_array($locale, ['en', 'ar'])) {
        session(['locale' => $locale]);
        if (auth()->check()) {
            auth()->user()->update(['preferred_language' => $locale]);
        }
    }
    return redirect()->back();
})->name('lang.switch');

require __DIR__.'/auth.php';
