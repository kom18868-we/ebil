<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use Spatie\Permission\Models\Role;

class SupportTicketTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles and permissions
        $adminRole = Role::create(['name' => 'admin']);
        $supportRole = Role::create(['name' => 'support_agent']);
        $customerRole = Role::create(['name' => 'customer']);
        
        // Create permissions
        $permissions = [
            'view tickets', 'create tickets', 'edit tickets', 'assign tickets', 
            'close tickets', 'rate tickets',
        ];
        
        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }
        
        // Assign all permissions to admin
        $adminRole->givePermissionTo(\Spatie\Permission\Models\Permission::all());
        
        // Assign permissions to customer
        $customerRole->givePermissionTo([
            'view tickets', 'create tickets', 'rate tickets',
        ]);
        
        // Assign permissions to support agent
        $supportRole->givePermissionTo([
            'view tickets', 'create tickets', 'edit tickets', 'assign tickets', 'close tickets',
        ]);
    }

    public function test_customer_can_create_ticket(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)->post('/tickets', [
            'subject' => 'Test Ticket',
            'description' => 'This is a test ticket',
            'priority' => 'medium',
            'category' => 'technical',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $customer->id,
            'subject' => 'Test Ticket',
            'status' => 'open',
        ]);
    }

    public function test_customer_can_view_their_tickets(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $ticket = SupportTicket::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->get('/tickets');

        $response->assertStatus(200);
    }

    public function test_customer_can_add_reply_to_ticket(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $ticket = SupportTicket::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer)->post("/tickets/{$ticket->id}/replies", [
            'message' => 'This is a reply',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('ticket_replies', [
            'support_ticket_id' => $ticket->id,
            'user_id' => $customer->id,
            'message' => 'This is a reply',
        ]);
    }

    public function test_customer_can_rate_ticket(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $ticket = SupportTicket::factory()->create([
            'user_id' => $customer->id,
            'status' => 'resolved',
        ]);

        $response = $this->actingAs($customer)->post("/tickets/{$ticket->id}/rate", [
            'rating' => 5,
            'rating_comment' => 'Great service!',
        ]);

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals(5, $ticket->rating);
    }

    public function test_support_agent_can_assign_ticket(): void
    {
        $agent = User::factory()->create();
        $agent->assignRole('support_agent');

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $ticket = SupportTicket::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($agent)->put("/tickets/{$ticket->id}", [
            'subject' => $ticket->subject,
            'description' => $ticket->description,
            'priority' => $ticket->priority,
            'category' => $ticket->category,
            'status' => 'in_progress',
            'assigned_to' => $agent->id,
        ]);

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals($agent->id, $ticket->assigned_to);
    }

    public function test_customer_can_close_ticket(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $ticket = SupportTicket::factory()->create([
            'user_id' => $customer->id,
            'status' => 'resolved',
        ]);

        $response = $this->actingAs($customer)->post("/tickets/{$ticket->id}/close");

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals('closed', $ticket->status);
    }
}

