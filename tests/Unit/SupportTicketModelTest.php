<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\TicketReply;

class SupportTicketModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_number_generation(): void
    {
        $ticket1 = SupportTicket::factory()->create();
        $ticket2 = SupportTicket::factory()->create();

        $this->assertNotEquals($ticket1->ticket_number, $ticket2->ticket_number);
        $this->assertStringStartsWith('TKT-' . date('Y'), $ticket1->ticket_number);
    }

    public function test_ticket_can_be_assigned(): void
    {
        $ticket = SupportTicket::factory()->create(['status' => 'open']);
        $agent = User::factory()->create();

        $ticket->assignTo($agent->id);

        $this->assertEquals($agent->id, $ticket->assigned_to);
        $this->assertEquals('in_progress', $ticket->status);
    }

    public function test_ticket_can_be_marked_as_resolved(): void
    {
        $ticket = SupportTicket::factory()->create(['status' => 'in_progress']);

        $ticket->markAsResolved();

        $this->assertEquals('resolved', $ticket->status);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_ticket_can_be_closed(): void
    {
        $ticket = SupportTicket::factory()->create(['status' => 'resolved']);

        $ticket->close();

        $this->assertEquals('closed', $ticket->status);
        $this->assertNotNull($ticket->closed_at);
    }

    public function test_ticket_can_be_rated(): void
    {
        $ticket = SupportTicket::factory()->create();

        $ticket->rate(5, 'Excellent service!');

        $this->assertEquals(5, $ticket->rating);
        $this->assertEquals('Excellent service!', $ticket->rating_comment);
    }

    public function test_ticket_has_replies_relationship(): void
    {
        $ticket = SupportTicket::factory()->create();
        $reply = TicketReply::factory()->create(['support_ticket_id' => $ticket->id]);

        $this->assertTrue($ticket->replies->contains($reply));
    }
}

