<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Notifications\InvoiceOverdue;
use App\Services\WebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendOverdueInvoiceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:send-overdue-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminders for overdue invoices';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for overdue invoices...');

        // Get invoices that are past due date and not paid
        $overdueInvoices = Invoice::where('status', 'pending')
                                 ->where('due_date', '<', now())
                                 ->with(['user'])
                                 ->get();

        if ($overdueInvoices->isEmpty()) {
            $this->info('No overdue invoices found.');
            return;
        }

        $count = 0;
        $webhookService = app(WebhookService::class);
        
        foreach ($overdueInvoices as $invoice) {
            // Check if user has overdue reminders enabled
            if (!$invoice->user->reminderEnabled('overdue')) {
                $this->line("Skipping invoice #{$invoice->invoice_number} - user has overdue reminders disabled");
                // Still update status to overdue even if reminder is disabled
                $invoice->update(['status' => 'overdue']);
                // Dispatch webhook even if reminder is disabled
                if ($invoice->serviceProvider) {
                    $webhookService->dispatchInvoiceEvent('invoice.overdue', $invoice);
                }
                continue;
            }

            // Update invoice status to overdue
            $invoice->update(['status' => 'overdue']);

            // Send notification to the customer
            $invoice->user->notify(new InvoiceOverdue($invoice));

            // Dispatch webhook for invoice overdue
            if ($invoice->serviceProvider) {
                $webhookService->dispatchInvoiceEvent('invoice.overdue', $invoice);
            }

            $count++;
            $this->line("Sent reminder for invoice #{$invoice->invoice_number} to {$invoice->user->email}");
        }

        $this->info("Successfully sent {$count} overdue invoice reminders.");
    }
}
