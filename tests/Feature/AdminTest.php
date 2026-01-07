<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Payment;
use Spatie\Permission\Models\Role;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles and permissions
        $adminRole = Role::create(['name' => 'admin']);
        $customerRole = Role::create(['name' => 'customer']);
        
        // Create permissions
        $permissions = [
            'view users', 'create users', 'edit users', 'delete users', 'manage user roles',
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices',
            'view payments', 'view reports', 'export reports', 'schedule reports',
            'view admin dashboard',
        ];
        
        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }
        
        // Assign all permissions to admin
        $adminRole->givePermissionTo(\Spatie\Permission\Models\Permission::all());
        
        // Assign basic permissions to customer
        $customerRole->givePermissionTo(['view invoices', 'view payments']);
    }

    public function test_admin_can_access_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_admin_can_view_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['customer'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $customer = User::factory()->create([
            'is_active' => true,
        ]);
        $customer->assignRole('customer');

        $response = $this->actingAs($admin)->post("/admin/users/{$customer->id}/toggle-status");

        $response->assertRedirect();
        $customer->refresh();
        $this->assertFalse($customer->is_active);
    }

    public function test_admin_can_view_reports(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/reports');

        $response->assertStatus(200);
    }

    public function test_admin_can_view_invoice_reports(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Invoice::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/reports/invoices');

        $response->assertStatus(200);
    }

    public function test_admin_can_view_payment_reports(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Payment::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/reports/payments');

        $response->assertStatus(200);
    }
}

