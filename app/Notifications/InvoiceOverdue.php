<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class InvoiceOverdue extends Notification implements ShouldQueue
{
    use Queueable;

    public $invoice;

    /**
     * Create a new notification instance.
     */
    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        
        // Only send email if user has overdue reminders enabled
        if ($notifiable->reminderEnabled('overdue')) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $daysOverdue = now()->diffInDays($this->invoice->due_date);
        
        return (new MailMessage)
                    ->subject(__('URGENT: Overdue Invoice - :number', ['number' => $this->invoice->invoice_number]))
                    ->greeting(__('Hello :name!', ['name' => $notifiable->name]))
                    ->line(__('This is an urgent reminder that your invoice payment is overdue.'))
                    ->line(__('Invoice Number: :number', ['number' => $this->invoice->invoice_number]))
                    ->line(__('Title: :title', ['title' => $this->invoice->title]))
                    ->line(__('Amount Due: $:amount', ['amount' => number_format($this->invoice->total_amount, 2)]))
                    ->line(__('Due Date: :date', ['date' => $this->invoice->due_date->format('M d, Y')]))
                    ->line(__('Days Overdue: :days', ['days' => $daysOverdue]))
                    ->action(__('Pay Now'), $this->getInvoiceUrl())
                    ->line(__('Please make payment immediately to avoid any additional late fees or service interruptions.'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        $daysOverdue = now()->diffInDays($this->invoice->due_date);
        
        return [
            'type' => 'invoice_overdue',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->total_amount,
            'due_date' => $this->invoice->due_date,
            'days_overdue' => $daysOverdue,
            'title' => $this->invoice->title,
            'message' => __('URGENT: Invoice :number is :days days overdue', [
                'number' => $this->invoice->invoice_number,
                'days' => $daysOverdue
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
