<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    public $payment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
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
        $invoice = $this->payment->invoice;
        
        return (new MailMessage)
                    ->subject(__('Payment Completed - :reference', ['reference' => $this->payment->payment_reference ?? $this->payment->reference]))
                    ->greeting(__('Hello :name!', ['name' => $notifiable->name]))
                    ->line(__('Your payment has been completed successfully.'))
                    ->line(__('Payment Reference: :reference', ['reference' => $this->payment->payment_reference ?? $this->payment->reference]))
                    ->line(__('Amount: $:amount', ['amount' => number_format($this->payment->amount, 2)]))
                    ->when($invoice, function ($mail) use ($invoice) {
                        return $mail->line(__('Invoice: :number', ['number' => $invoice->invoice_number]));
                    })
                    ->action(__('View Payment'), route('payments.show', $this->payment))
                    ->line(__('Thank you for using our application!'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        $invoice = $this->payment->invoice;
        
        return [
            'type' => 'payment_completed',
            'payment_id' => $this->payment->id,
            'payment_reference' => $this->payment->payment_reference ?? $this->payment->reference,
            'invoice_id' => $invoice?->id,
            'invoice_number' => $invoice?->invoice_number,
            'amount' => $this->payment->amount,
            'message' => __('Payment of $:amount has been completed', [
                'amount' => number_format($this->payment->amount, 2)
            ]),
            'action_url' => route('payments.show', $this->payment),
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
