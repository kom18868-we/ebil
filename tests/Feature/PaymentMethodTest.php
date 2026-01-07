<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\PaymentMethod;
use Spatie\Permission\Models\Role;

class PaymentMethodTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create role and permissions
        $customerRole = Role::create(['name' => 'customer']);
        
        // Create permissions
        $permissions = [
            'view payment methods', 'manage payment methods',
        ];
        
        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }
        
        // Assign permissions to customer
        $customerRole->givePermissionTo($permissions);
    }

    public function test_customer_can_view_their_payment_methods(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $paymentMethod = PaymentMethod::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->get('/payment-methods');

        $response->assertStatus(200);
    }

    public function test_customer_can_create_payment_method(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)->post('/payment-methods', [
            'type' => 'credit_card',
            'name' => 'My Credit Card',
            'last_four' => '1234',
            'brand' => 'Visa',
            'expires_at' => now()->addYear()->format('Y-m-d'),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'user_id' => $customer->id,
            'type' => 'credit_card',
            'name' => 'My Credit Card',
        ]);
    }

    public function test_first_payment_method_is_set_as_default(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)->post('/payment-methods', [
            'type' => 'credit_card',
            'name' => 'My Credit Card',
            'last_four' => '1234',
            'brand' => 'Visa',
        ]);

        $paymentMethod = PaymentMethod::where('user_id', $customer->id)->first();
        $this->assertTrue($paymentMethod->is_default);
    }

    public function test_customer_can_set_payment_method_as_default(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $method1 = PaymentMethod::factory()->create([
            'user_id' => $customer->id,
            'is_default' => true,
        ]);

        $method2 = PaymentMethod::factory()->create([
            'user_id' => $customer->id,
            'is_default' => false,
        ]);

        $response = $this->actingAs($customer)->post("/payment-methods/{$method2->id}/make-default");

        $response->assertRedirect();
        
        $method1->refresh();
        $method2->refresh();
        
        $this->assertFalse($method1->is_default);
        $this->assertTrue($method2->is_default);
    }

    public function test_customer_can_delete_payment_method(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $paymentMethod = PaymentMethod::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->delete("/payment-methods/{$paymentMethod->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('payment_methods', ['id' => $paymentMethod->id]);
    }
}

