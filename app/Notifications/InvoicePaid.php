<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements ShouldQueue
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
        
        // Always send database notifications, email only if enabled
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
                    ->subject(__('Invoice Paid - :number', ['number' => $this->invoice->invoice_number]))
                    ->greeting(__('Hello :name!', ['name' => $notifiable->name]))
                    ->line(__('Your invoice has been marked as paid.'))
                    ->line(__('Invoice Number: :number', ['number' => $this->invoice->invoice_number]))
                    ->line(__('Amount: $:amount', ['amount' => number_format($this->invoice->total_amount, 2)]))
                    ->when($this->invoice->paid_date, function ($mail) {
                        return $mail->line(__('Paid Date: :date', ['date' => $this->invoice->paid_date->format('M d, Y')]));
                    })
                    ->action(__('View Invoice'), route('invoices.show', $this->invoice))
                    ->line(__('Thank you for using our application!'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'invoice_paid',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->total_amount,
            'title' => $this->invoice->title,
            'message' => __('Invoice :number has been paid', [
                'number' => $this->invoice->invoice_number
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
