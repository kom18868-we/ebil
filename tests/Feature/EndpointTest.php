<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\SupportTicket;
use App\Models\ServiceProvider;
use Spatie\Permission\Models\Role;

class EndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles and permissions
        $adminRole = Role::create(['name' => 'admin']);
        $providerRole = Role::create(['name' => 'service_provider']);
        $customerRole = Role::create(['name' => 'customer']);
        $supportRole = Role::create(['name' => 'support_agent']);
        
        // Create all permissions
        $permissions = [
            'view users', 'create users', 'edit users', 'delete users', 'manage user roles',
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices', 
            'pay invoices', 'download invoices', 'archive invoices',
            'view payments', 'process payments', 'refund payments',
            'view payment methods', 'manage payment methods',
            'view service providers', 'create service providers', 'edit service providers',
            'view tickets', 'create tickets', 'edit tickets', 'assign tickets', 'close tickets', 'rate tickets',
            'view admin dashboard', 'view reports', 'export reports', 'schedule reports',
            'view profile', 'edit profile', 'change password',
        ];
        
        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }
        
        // Assign all permissions to admin
        $adminRole->givePermissionTo(\Spatie\Permission\Models\Permission::all());
        
        // Assign permissions to customer
        $customerRole->givePermissionTo([
            'view invoices', 'pay invoices', 'download invoices',
            'view payments', 'view payment methods', 'manage payment methods',
            'view tickets', 'create tickets', 'rate tickets',
            'view profile', 'edit profile', 'change password',
        ]);
        
        // Assign permissions to service provider
        $providerRole->givePermissionTo([
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices',
            'view payments', 'view tickets', 'create tickets', 'edit tickets',
            'view profile', 'edit profile', 'change password',
        ]);
        
        // Assign permissions to support agent
        $supportRole->givePermissionTo([
            'view tickets', 'create tickets', 'edit tickets', 'assign tickets', 'close tickets',
            'view profile', 'edit profile', 'change password',
        ]);
    }

    // ==================== DASHBOARD ENDPOINTS ====================

    public function test_dashboard_endpoint_requires_authentication(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    public function test_dashboard_endpoint_works_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_admin_dashboard_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/dashboard');
        $response->assertStatus(200);
    }

    // ==================== PROFILE ENDPOINTS ====================

    public function test_profile_edit_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);
    }

    public function test_profile_update_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->patch('/profile', [
            'name' => 'Updated Name',
            'email' => $user->email,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_profile_security_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/profile/security');
        $response->assertStatus(200);
    }

    public function test_profile_preferences_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/profile/preferences');
        $response->assertStatus(200);
    }

    // ==================== INVOICE ENDPOINTS ====================

    public function test_invoices_index_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        Invoice::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/invoices');
        $response->assertStatus(200);
    }

    public function test_invoices_create_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/invoices/create');
        $response->assertStatus(200);
    }

    public function test_invoices_store_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $serviceProvider = ServiceProvider::factory()->create();

        $response = $this->actingAs($admin)->post('/invoices', [
            'user_id' => $customer->id,
            'service_provider_id' => $serviceProvider->id,
            'title' => 'Test Invoice',
            'description' => 'Test Description',
            'amount' => 100.00,
            'tax_amount' => 10.00,
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'issue_date' => now()->format('Y-m-d'),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invoices', [
            'title' => 'Test Invoice',
            'user_id' => $customer->id,
        ]);
    }

    public function test_invoices_show_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/invoices/{$invoice->id}");
        $response->assertStatus(200);
    }

    public function test_invoices_edit_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->get("/invoices/{$invoice->id}/edit");
        $response->assertStatus(200);
    }

    public function test_invoices_update_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->put("/invoices/{$invoice->id}", [
            'title' => 'Updated Invoice',
            'description' => 'Updated Description',
            'amount' => 200.00,
            'tax_amount' => 20.00,
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'title' => 'Updated Invoice',
        ]);
    }

    public function test_invoices_destroy_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->delete("/invoices/{$invoice->id}");
        $response->assertRedirect();
        // Check soft delete
        $this->assertSoftDeleted('invoices', ['id' => $invoice->id]);
    }

    public function test_invoices_download_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/invoices/{$invoice->id}/download");
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_invoices_mark_as_paid_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->post("/invoices/{$invoice->id}/mark-as-paid");
        $response->assertRedirect();
        
        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
    }

    public function test_invoices_archive_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Invoice::factory()->create([
            'status' => 'paid',
            'paid_date' => now()->subMonths(7),
        ]);

        $response = $this->actingAs($admin)->post('/invoices/archive');
        $response->assertRedirect();
    }

    // ==================== PAYMENT ENDPOINTS ====================

    public function test_payments_index_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);
        Payment::factory()->create([
            'user_id' => $user->id,
            'invoice_id' => $invoice->id,
        ]);

        $response = $this->actingAs($user)->get('/payments');
        $response->assertStatus(200);
    }

    public function test_payments_create_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->get("/payments/create?invoice_id={$invoice->id}");
        $response->assertStatus(200);
    }

    public function test_payments_store_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);

        $paymentMethod = PaymentMethod::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post('/payments', [
            'invoice_id' => $invoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => 100.00,
            'payment_type' => 'full',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_payments_show_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);
        $payment = Payment::factory()->create([
            'user_id' => $user->id,
            'invoice_id' => $invoice->id,
        ]);

        $response = $this->actingAs($user)->get("/payments/{$payment->id}");
        $response->assertStatus(200);
    }

    public function test_payments_destroy_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);
        $payment = Payment::factory()->create([
            'user_id' => $user->id,
            'invoice_id' => $invoice->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->delete("/payments/{$payment->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('payments', ['id' => $payment->id]);
    }

    public function test_payments_receipt_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $user->id]);
        $payment = Payment::factory()->create([
            'user_id' => $user->id,
            'invoice_id' => $invoice->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user)->get("/payments/{$payment->id}/receipt");
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    // ==================== PAYMENT METHOD ENDPOINTS ====================

    public function test_payment_methods_index_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        PaymentMethod::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/payment-methods');
        $response->assertStatus(200);
    }

    public function test_payment_methods_create_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/payment-methods/create');
        $response->assertStatus(200);
    }

    public function test_payment_methods_store_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->post('/payment-methods', [
            'type' => 'credit_card',
            'name' => 'My Credit Card',
            'last_four' => '1234',
            'brand' => 'Visa',
            'expires_at' => now()->addYear()->format('Y-m-d'),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'user_id' => $user->id,
            'type' => 'credit_card',
        ]);
    }

    public function test_payment_methods_update_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $paymentMethod = PaymentMethod::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->put("/payment-methods/{$paymentMethod->id}", [
            'name' => 'Updated Name',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'id' => $paymentMethod->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_payment_methods_destroy_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $paymentMethod = PaymentMethod::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete("/payment-methods/{$paymentMethod->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('payment_methods', ['id' => $paymentMethod->id]);
    }

    public function test_payment_methods_make_default_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $method1 = PaymentMethod::factory()->create([
            'user_id' => $user->id,
            'is_default' => true,
        ]);

        $method2 = PaymentMethod::factory()->create([
            'user_id' => $user->id,
            'is_default' => false,
        ]);

        $response = $this->actingAs($user)->post("/payment-methods/{$method2->id}/make-default");
        $response->assertRedirect();

        $method1->refresh();
        $method2->refresh();
        $this->assertFalse($method1->is_default);
        $this->assertTrue($method2->is_default);
    }

    // ==================== SUPPORT TICKET ENDPOINTS ====================

    public function test_tickets_index_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        SupportTicket::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/tickets');
        $response->assertStatus(200);
    }

    public function test_tickets_create_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/tickets/create');
        $response->assertStatus(200);
    }

    public function test_tickets_store_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->post('/tickets', [
            'subject' => 'Test Ticket',
            'description' => 'Test Description',
            'priority' => 'medium',
            'category' => 'technical',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $user->id,
            'subject' => 'Test Ticket',
        ]);
    }

    public function test_tickets_show_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $ticket = SupportTicket::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/tickets/{$ticket->id}");
        $response->assertStatus(200);
    }

    public function test_tickets_edit_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $ticket = SupportTicket::factory()->create();

        $response = $this->actingAs($admin)->get("/tickets/{$ticket->id}/edit");
        $response->assertStatus(200);
    }

    public function test_tickets_update_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $ticket = SupportTicket::factory()->create();

        $response = $this->actingAs($admin)->put("/tickets/{$ticket->id}", [
            'subject' => 'Updated Subject',
            'description' => 'Updated Description',
            'priority' => 'high',
            'category' => 'billing',
            'status' => 'in_progress',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('support_tickets', [
            'id' => $ticket->id,
            'subject' => 'Updated Subject',
        ]);
    }

    public function test_tickets_destroy_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $ticket = SupportTicket::factory()->create();

        $response = $this->actingAs($admin)->delete("/tickets/{$ticket->id}");
        $response->assertRedirect();
        // Check soft delete
        $this->assertSoftDeleted('support_tickets', ['id' => $ticket->id]);
    }

    public function test_tickets_reply_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $ticket = SupportTicket::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->post("/tickets/{$ticket->id}/replies", [
            'message' => 'This is a reply',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('ticket_replies', [
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_tickets_close_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $ticket = SupportTicket::factory()->create([
            'user_id' => $user->id,
            'status' => 'resolved',
        ]);

        $response = $this->actingAs($user)->post("/tickets/{$ticket->id}/close");
        $response->assertRedirect();

        $ticket->refresh();
        $this->assertEquals('closed', $ticket->status);
    }

    public function test_tickets_rate_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $ticket = SupportTicket::factory()->create([
            'user_id' => $user->id,
            'status' => 'resolved',
        ]);

        $response = $this->actingAs($user)->post("/tickets/{$ticket->id}/rate", [
            'rating' => 5,
            'rating_comment' => 'Great service!',
        ]);

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals(5, $ticket->rating);
    }

    // ==================== ADMIN USER ENDPOINTS ====================

    public function test_admin_users_index_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/users');
        $response->assertStatus(200);
    }

    public function test_admin_users_create_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/users/create');
        $response->assertStatus(200);
    }

    public function test_admin_users_store_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['customer'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    }

    public function test_admin_users_show_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}");
        $response->assertStatus(200);
    }

    public function test_admin_users_edit_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}/edit");
        $response->assertStatus(200);
    }

    public function test_admin_users_update_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($admin)->put("/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
            'roles' => ['customer'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_users_destroy_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin)->delete("/admin/users/{$user->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_users_toggle_status_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)->post("/admin/users/{$user->id}/toggle-status");
        $response->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->is_active);
    }

    public function test_admin_users_assign_role_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin)->post("/admin/users/{$user->id}/assign-role", [
            'role' => 'customer',
        ]);

        $response->assertRedirect();
        $this->assertTrue($user->hasRole('customer'));
    }

    // ==================== ADMIN REPORT ENDPOINTS ====================

    public function test_admin_reports_index_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/reports');
        $response->assertStatus(200);
    }

    public function test_admin_reports_invoices_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Invoice::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/reports/invoices');
        $response->assertStatus(200);
    }

    public function test_admin_reports_payments_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Payment::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/reports/payments');
        $response->assertStatus(200);
    }

    public function test_admin_reports_users_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        User::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/reports/users');
        $response->assertStatus(200);
    }

    public function test_admin_reports_export_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Invoice::factory()->count(5)->create();

        $response = $this->actingAs($admin)->post('/admin/reports/export', [
            'type' => 'invoices',
            'format' => 'excel',
        ]);

        $response->assertStatus(200);
    }

    public function test_admin_reports_schedule_endpoint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post('/admin/reports/schedule', [
            'type' => 'invoices',
            'frequency' => 'daily',
            'email' => 'admin@example.com',
            'format' => 'pdf',
        ]);

        $response->assertRedirect();
    }

    // ==================== LANGUAGE ENDPOINTS ====================

    public function test_language_switch_get_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->get('/language/switch?lang=ar');
        $response->assertRedirect();
    }

    public function test_language_switch_post_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $response = $this->actingAs($user)->post('/language/switch', [
            'lang' => 'ar',
        ]);

        $response->assertRedirect();
    }

    public function test_language_current_endpoint(): void
    {
        $response = $this->get('/language/current');
        $response->assertStatus(200);
        $response->assertJsonStructure(['current_locale', 'available_locales']);
    }

    public function test_language_available_endpoint(): void
    {
        $response = $this->get('/language/available');
        $response->assertStatus(200);
    }

    // ==================== AUTHORIZATION TESTS ====================

    public function test_customer_cannot_access_admin_endpoints(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)->get('/admin/dashboard');
        $response->assertStatus(403);
    }

    public function test_customer_cannot_access_other_users_invoices(): void
    {
        $customer1 = User::factory()->create();
        $customer1->assignRole('customer');

        $customer2 = User::factory()->create();
        $customer2->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer2->id]);

        $response = $this->actingAs($customer1)->get("/invoices/{$invoice->id}");
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_create_invoices(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)->get('/invoices/create');
        $response->assertStatus(403);
    }
}

