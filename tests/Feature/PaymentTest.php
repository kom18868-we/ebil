<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Spatie\Permission\Models\Role;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles and permissions
        $adminRole = Role::create(['name' => 'admin']);
        $providerRole = Role::create(['name' => 'service_provider']);
        $customerRole = Role::create(['name' => 'customer']);
        
        // Create permissions
        $permissions = [
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices',
            'pay invoices', 'download invoices',
            'view payments', 'process payments',
            'view payment methods', 'manage payment methods',
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
        ]);
        
        // Assign permissions to service provider
        $providerRole->givePermissionTo([
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices',
            'view payments',
        ]);
    }

    public function test_customer_can_view_their_payments(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer->id]);
        $payment = Payment::factory()->create([
            'user_id' => $customer->id,
            'invoice_id' => $invoice->id,
        ]);

        $response = $this->actingAs($customer)->get('/payments');

        $response->assertStatus(200);
    }

    public function test_customer_can_create_payment(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);

        $paymentMethod = PaymentMethod::factory()->create([
            'user_id' => $customer->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($customer)->post('/payments', [
            'invoice_id' => $invoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => 100.00,
            'payment_type' => 'full',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'user_id' => $customer->id,
        ]);
    }

    public function test_payment_amount_cannot_exceed_invoice_remaining(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);

        $paymentMethod = PaymentMethod::factory()->create([
            'user_id' => $customer->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($customer)->post('/payments', [
            'invoice_id' => $invoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => 200.00,
            'payment_type' => 'partial',
        ]);

        $response->assertSessionHasErrors('amount');
    }

    public function test_customer_can_download_payment_receipt(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer->id]);
        $payment = Payment::factory()->create([
            'user_id' => $customer->id,
            'invoice_id' => $invoice->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($customer)->get("/payments/{$payment->id}/receipt");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_payment_marks_invoice_as_paid_when_fully_paid(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);

        $paymentMethod = PaymentMethod::factory()->create([
            'user_id' => $customer->id,
            'is_active' => true,
        ]);

        $this->actingAs($customer)->post('/payments', [
            'invoice_id' => $invoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => 100.00,
            'payment_type' => 'full',
        ]);

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
    }
}

