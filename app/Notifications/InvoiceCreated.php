<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class InvoiceCreated extends Notification
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
        
        // Only send email if user has email notifications enabled
        if ($notifiable->emailRemindersEnabled()) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject(__('New Invoice Created - :number', ['number' => $this->invoice->invoice_number]))
                    ->greeting(__('Hello :name!', ['name' => $notifiable->name]))
                    ->line(__('A new invoice has been created for you.'))
                    ->line(__('Invoice Number: :number', ['number' => $this->invoice->invoice_number]))
                    ->line(__('Amount: $:amount', ['amount' => number_format($this->invoice->total_amount, 2)]))
                    ->line(__('Due Date: :date', ['date' => $this->invoice->due_date->format('M d, Y')]))
                    ->action(__('View Invoice'), route('invoices.show', $this->invoice))
                    ->line(__('Thank you for using our application!'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'invoice_created',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->total_amount,
            'due_date' => $this->invoice->due_date,
            'title' => $this->invoice->title,
            'message' => __('New invoice :number has been created for $:amount', [
                'number' => $this->invoice->invoice_number,
                'amount' => number_format($this->invoice->total_amount, 2)
            ]),
            'action_url' => route('invoices.show', $this->invoice),
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
}
