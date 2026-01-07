<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Payment;
use App\Models\Invoice;

class PaymentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_reference_generation(): void
    {
        $payment1 = Payment::factory()->create();
        $payment2 = Payment::factory()->create();

        $this->assertNotEquals($payment1->payment_reference, $payment2->payment_reference);
        $this->assertStringStartsWith('PAY-' . date('Ymd'), $payment1->payment_reference);
    }

    public function test_payment_can_be_marked_as_completed(): void
    {
        $invoice = Invoice::factory()->create(['total_amount' => 100.00]);
        $payment = Payment::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 100.00,
            'status' => 'pending',
        ]);

        $payment->markAsCompleted();

        $this->assertEquals('completed', $payment->status);
        $this->assertNotNull($payment->processed_at);
    }

    public function test_payment_can_be_marked_as_failed(): void
    {
        $payment = Payment::factory()->create(['status' => 'pending']);

        $payment->markAsFailed('Insufficient funds');

        $this->assertEquals('failed', $payment->status);
        $this->assertEquals('Insufficient funds', $payment->notes);
    }

    public function test_payment_marks_invoice_paid_when_fully_paid(): void
    {
        $invoice = Invoice::factory()->create([
            'total_amount' => 100.00,
            'status' => 'pending',
        ]);

        $payment = Payment::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 100.00,
            'status' => 'pending',
        ]);

        $payment->markAsCompleted();

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
    }
}

