<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Notifications\InvoicePaymentReminder;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendPaymentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:send-payment-reminders {--days=3 : Number of days before due date to send reminder}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send payment reminders before invoice due dates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $daysBefore = (int) $this->option('days');
        $this->info("Checking for invoices due in {$daysBefore} days...");

        // Calculate the target date
        $targetDate = Carbon::now()->addDays($daysBefore)->format('Y-m-d');
        
        // Get pending invoices that are due on the target date
        $invoices = Invoice::where('status', 'pending')
                          ->whereDate('due_date', $targetDate)
                          ->with(['user'])
                          ->get();

        if ($invoices->isEmpty()) {
            $this->info("No invoices found due in {$daysBefore} days.");
            return;
        }

        $count = 0;
        foreach ($invoices as $invoice) {
            // Check if user has reminders enabled
            $reminderType = $daysBefore === 7 ? '7_days' : ($daysBefore === 3 ? '3_days' : '1_day');
            if (!$invoice->user->reminderEnabled($reminderType)) {
                $this->line("Skipping invoice #{$invoice->invoice_number} - user has {$reminderType} reminders disabled");
                continue;
            }

            // Check if reminder was already sent for this invoice and days before
            $metadata = $invoice->metadata ?? [];
            $reminderKey = "reminder_sent_{$daysBefore}_days";
            
            if (isset($metadata[$reminderKey]) && $metadata[$reminderKey]) {
                $this->line("Skipping invoice #{$invoice->invoice_number} - reminder already sent");
                continue;
            }

            // Send notification to the customer
            $invoice->user->notify(new InvoicePaymentReminder($invoice, $daysBefore));

            // Mark reminder as sent in metadata
            $metadata[$reminderKey] = now()->toIso8601String();
            $invoice->update(['metadata' => $metadata]);

            $count++;
            $this->line("Sent {$daysBefore}-day reminder for invoice #{$invoice->invoice_number} to {$invoice->user->email}");
        }

        $this->info("Successfully sent {$count} payment reminders.");
    }
}

