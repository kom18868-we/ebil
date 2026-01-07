<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Invoice;
use App\Models\User;
use App\Models\ServiceProvider;
use App\Models\Payment;

class InvoiceModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_number_generation(): void
    {
        $invoice1 = Invoice::factory()->create();
        $invoice2 = Invoice::factory()->create();

        $this->assertNotEquals($invoice1->invoice_number, $invoice2->invoice_number);
        $this->assertStringStartsWith('INV-' . date('Y'), $invoice1->invoice_number);
    }

    public function test_invoice_can_be_marked_as_paid(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $invoice->markAsPaid();

        $this->assertEquals('paid', $invoice->status);
        $this->assertNotNull($invoice->paid_date);
    }

    public function test_invoice_can_be_marked_as_overdue(): void
    {
        $invoice = Invoice::factory()->create([
            'status' => 'pending',
            'due_date' => now()->subDay(),
        ]);

        $invoice->markAsOverdue();

        $this->assertEquals('overdue', $invoice->status);
    }

    public function test_invoice_remaining_amount_calculation(): void
    {
        $invoice = Invoice::factory()->create(['total_amount' => 100.00]);

        $payment1 = Payment::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 30.00,
            'status' => 'completed',
        ]);

        $payment2 = Payment::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 20.00,
            'status' => 'completed',
        ]);

        $this->assertEquals(50.00, $invoice->remaining_amount);
    }

    public function test_invoice_is_overdue_scope(): void
    {
        $overdueInvoice = Invoice::factory()->create([
            'status' => 'pending',
            'due_date' => now()->subDay(),
        ]);

        $pendingInvoice = Invoice::factory()->create([
            'status' => 'pending',
            'due_date' => now()->addDay(),
        ]);

        $overdueInvoices = Invoice::overdue()->get();

        $this->assertTrue($overdueInvoices->contains($overdueInvoice));
        $this->assertFalse($overdueInvoices->contains($pendingInvoice));
    }
}

