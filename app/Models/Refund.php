<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasFactory;

    protected $fillable = [
        'refund_reference',
        'payment_id',
        'invoice_id',
        'user_id',
        'processed_by',
        'amount',
        'status',
        'refund_type',
        'reason',
        'notes',
        'gateway',
        'gateway_refund_id',
        'gateway_response',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
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

        // Ensure payment relationship is loaded
        if (!$this->relationLoaded('payment')) {
            $this->load('payment');
        }

        // Update payment status if full refund
        if ($this->refund_type === 'full' && $this->payment) {
            $this->payment->update(['status' => 'refunded']);
        }

        // Reload invoice with payments and refunds to recalculate remaining amount
        $invoice = $this->invoice()->with(['payments', 'refunds'])->first();
        
        if ($invoice) {
            // Recalculate invoice status based on payments and refunds
            $totalPaid = $invoice->payments()
                ->where('status', 'completed')
                ->sum('amount');
            
            $totalRefunded = $invoice->refunds()
                ->where('status', 'completed')
                ->sum('amount');
            
            $netPaid = $totalPaid - $totalRefunded;
            $remainingAmount = $invoice->total_amount - $netPaid;
            
            // Update invoice status
            if ($remainingAmount <= 0 && $invoice->status !== 'paid') {
                $invoice->markAsPaid();
            } elseif ($invoice->status === 'paid' && $remainingAmount > 0) {
                $invoice->update(['status' => 'pending']);
            }
        }
    }

    public function markAsFailed($reason = null)
    {
        $this->update([
            'status' => 'failed',
            'notes' => $reason ? ($this->notes . "\n" . $reason) : $this->notes,
        ]);
    }

    public static function generateRefundReference()
    {
        $prefix = 'REF-' . date('Ymd') . '-';
        $lastRefund = static::where('refund_reference', 'like', $prefix . '%')
                           ->orderBy('refund_reference', 'desc')
                           ->first();
        
        if ($lastRefund) {
            $lastNumber = (int) substr($lastRefund->refund_reference, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }
}

