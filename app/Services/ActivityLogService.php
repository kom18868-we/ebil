<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log a user activity
     */
    public static function log(
        string $action,
        string $description,
        ?Model $model = null,
        ?array $properties = null,
        ?int $userId = null
    ): ActivityLog {
        $userId = $userId ?? Auth::id();
        
        $data = [
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'properties' => $properties ?? [],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ];

        if ($model) {
            $data['model_type'] = get_class($model);
            $data['model_id'] = $model->id;
        }

        return ActivityLog::create($data);
    }

    /**
     * Log invoice creation
     */
    public static function logInvoiceCreated($invoice, $userId = null): ActivityLog
    {
        $user = $userId ? \App\Models\User::find($userId) : Auth::user();
        return self::log(
            'invoice_created',
            "User {$user->name} created invoice #{$invoice->invoice_number}",
            $invoice,
            [
                'invoice_number' => $invoice->invoice_number,
                'amount' => $invoice->total_amount,
                'customer_id' => $invoice->user_id,
            ],
            $userId
        );
    }

    /**
     * Log invoice update
     */
    public static function logInvoiceUpdated($invoice, $userId = null): ActivityLog
    {
        $user = $userId ? \App\Models\User::find($userId) : Auth::user();
        return self::log(
            'invoice_updated',
            "User {$user->name} updated invoice #{$invoice->invoice_number}",
            $invoice,
            [
                'invoice_number' => $invoice->invoice_number,
                'amount' => $invoice->total_amount,
            ],
            $userId
        );
    }

    /**
     * Log invoice deletion
     */
    public static function logInvoiceDeleted($invoice, $userId = null): ActivityLog
    {
        $user = $userId ? \App\Models\User::find($userId) : Auth::user();
        return self::log(
            'invoice_deleted',
            "User {$user->name} deleted invoice #{$invoice->invoice_number}",
            null,
            [
                'invoice_number' => $invoice->invoice_number,
                'amount' => $invoice->total_amount,
            ],
            $userId
        );
    }

    /**
     * Log payment creation
     */
    public static function logPaymentCreated($payment, $userId = null): ActivityLog
    {
        $user = $userId ? \App\Models\User::find($userId) : Auth::user();
        return self::log(
            'payment_created',
            "User {$user->name} made a payment of $" . number_format($payment->amount, 2),
            $payment,
            [
                'payment_reference' => $payment->reference,
                'amount' => $payment->amount,
                'invoice_id' => $payment->invoice_id,
            ],
            $userId
        );
    }

    /**
     * Log ticket creation
     */
    public static function logTicketCreated($ticket, $userId = null): ActivityLog
    {
        $user = $userId ? \App\Models\User::find($userId) : Auth::user();
        return self::log(
            'ticket_created',
            "User {$user->name} created support ticket #{$ticket->ticket_number}",
            $ticket,
            [
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'priority' => $ticket->priority,
            ],
            $userId
        );
    }

    /**
     * Log user login
     */
    public static function logUserLogin($user): ActivityLog
    {
        return self::log(
            'user_login',
            "User {$user->name} logged in",
            null,
            [],
            $user->id
        );
    }

    /**
     * Log user logout
     */
    public static function logUserLogout($user): ActivityLog
    {
        return self::log(
            'user_logout',
            "User {$user->name} logged out",
            null,
            [],
            $user->id
        );
    }
}

