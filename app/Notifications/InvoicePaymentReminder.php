<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class InvoicePaymentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public $invoice;
    public $daysUntilDue;

    /**
     * Create a new notification instance.
     */
    public function __construct(Invoice $invoice, int $daysUntilDue)
    {
        $this->invoice = $invoice;
        $this->daysUntilDue = $daysUntilDue;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        
        // Only send email if user has reminders enabled for this type
        $daysKey = $this->daysUntilDue === 7 ? '7_days' : ($this->daysUntilDue === 3 ? '3_days' : '1_day');
        if ($notifiable->reminderEnabled($daysKey)) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $daysText = $this->daysUntilDue === 1 ? 'tomorrow' : "in {$this->daysUntilDue} days";
        
        return (new MailMessage)
                    ->subject(__('Payment Reminder - Invoice :number', ['number' => $this->invoice->invoice_number]))
                    ->greeting(__('Hello :name!', ['name' => $notifiable->name]))
                    ->line(__('This is a friendly reminder that your invoice payment is due :days.', [
                        'days' => $daysText
                    ]))
                    ->line(__('Invoice Number: :number', ['number' => $this->invoice->invoice_number]))
                    ->line(__('Title: :title', ['title' => $this->invoice->title]))
                    ->line(__('Amount Due: $:amount', ['amount' => number_format($this->invoice->total_amount, 2)]))
                    ->line(__('Due Date: :date', ['date' => $this->invoice->due_date->format('M d, Y')]))
                    ->action(__('Pay Now'), $this->getInvoiceUrl())
                    ->line(__('Please make sure to pay before the due date to avoid any late fees.'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        $daysText = $this->daysUntilDue === 1 ? 'tomorrow' : "in {$this->daysUntilDue} days";
        
        return [
            'type' => 'invoice_payment_reminder',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->total_amount,
            'due_date' => $this->invoice->due_date,
            'days_until_due' => $this->daysUntilDue,
            'title' => $this->invoice->title,
            'message' => __('Payment reminder: Invoice :number is due :days', [
                'number' => $this->invoice->invoice_number,
                'days' => $daysText
            ]),
            'action_url' => $this->getInvoiceUrl(),
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }

    /**
     * Get the invoice URL (preferring frontend URL if available)
     */
    private function getInvoiceUrl(): string
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL'));
        if ($frontendUrl) {
            return rtrim($frontendUrl, '/') . "/invoices/{$this->invoice->id}";
        }
        
        // Fallback to web route
        return route('invoices.show', $this->invoice);
    }
}

