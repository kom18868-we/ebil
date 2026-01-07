<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_reference',
        'invoice_id',
        'user_id',
        'payment_method_id',
        'amount',
        'status',
        'payment_type',
        'gateway',
        'gateway_transaction_id',
        'gateway_response',
        'processed_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    public function getTotalRefundedAttribute()
    {
        return $this->refunds()->where('status', 'completed')->sum('amount');
    }

    public function getRefundableAmountAttribute()
    {
        return $this->amount - $this->total_refunded;
    }

    public function canBeRefunded()
    {
        return $this->status === 'completed' && $this->refundable_amount > 0;
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Accessors & Mutators
    public function getIsCompletedAttribute()
    {
        return $this->status === 'completed';
    }

    public function getIsPendingAttribute()
    {
        return $this->status === 'pending';
    }

    public function getIsFailedAttribute()
    {
        return $this->status === 'failed';
    }

    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2);
    }

    // Methods
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now(),
        ]);

        // Reload invoice with payments to calculate remaining amount correctly
        $invoice = $this->invoice()->with('payments')->first();
        
        if ($invoice) {
            // Calculate remaining amount
            $totalPaid = $invoice->payments()->where('status', 'completed')->sum('amount');
            $remainingAmount = $invoice->total_amount - $totalPaid;
            
            // Update invoice status if fully paid
            if ($remainingAmount <= 0) {
                $invoice->markAsPaid();
            }
        }
    }

    public function markAsFailed($reason = null)
    {
        $this->update([
            'status' => 'failed',
            'notes' => $reason,
        ]);
    }

    public static function generatePaymentReference()
    {
        $prefix = 'PAY-' . date('Ymd') . '-';
        $lastPayment = static::where('payment_reference', 'like', $prefix . '%')
                           ->orderBy('payment_reference', 'desc')
                           ->first();
        
        if ($lastPayment) {
            $lastNumber = (int) substr($lastPayment->payment_reference, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }
}
