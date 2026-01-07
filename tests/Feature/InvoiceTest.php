<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\ServiceProvider;
use Spatie\Permission\Models\Role;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles and permissions
        $adminRole = Role::create(['name' => 'admin']);
        $providerRole = Role::create(['name' => 'service_provider']);
        $customerRole = Role::create(['name' => 'customer']);
        
        // Create and assign permissions
        $permissions = [
            'view invoices',
            'create invoices',
            'edit invoices',
            'delete invoices',
            'pay invoices',
            'download invoices',
            'archive invoices',
        ];
        
        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }
        
        // Assign all permissions to admin
        $adminRole->givePermissionTo(\Spatie\Permission\Models\Permission::all());
        
        // Assign permissions to customer
        $customerRole->givePermissionTo([
            'view invoices',
            'pay invoices',
            'download invoices',
        ]);
        
        // Assign permissions to service provider
        $providerRole->givePermissionTo([
            'view invoices',
            'create invoices',
            'edit invoices',
            'delete invoices',
        ]);
    }

    public function test_customer_can_view_their_invoices(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->get('/invoices');

        $response->assertStatus(200);
        $response->assertSee($invoice->invoice_number);
    }

    public function test_customer_cannot_view_other_invoices(): void
    {
        $customer1 = User::factory()->create();
        $customer1->assignRole('customer');
        
        $customer2 = User::factory()->create();
        $customer2->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer2->id]);

        $response = $this->actingAs($customer1)->get("/invoices/{$invoice->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_create_invoice(): void
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

    public function test_customer_can_download_their_invoice(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $invoice = Invoice::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->get("/invoices/{$invoice->id}/download");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_invoice_cannot_be_edited_when_paid(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $invoice = Invoice::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->put("/invoices/{$invoice->id}", [
            'title' => 'Updated Title',
            'amount' => 200.00,
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ]);

        // Controller checks and redirects with error for paid invoices
        $response->assertRedirect();
        $response->assertSessionHas('error');
    }
}

