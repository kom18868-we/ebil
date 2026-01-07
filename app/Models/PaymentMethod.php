<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'name',
        'last_four',
        'brand',
        'gateway_token',
        'expires_at',
        'is_default',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'expires_at' => 'date',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Accessors & Mutators
    public function getIsExpiredAttribute()
    {
        return $this->expires_at && $this->expires_at < now();
    }

    public function getDisplayNameAttribute()
    {
        if ($this->type === 'credit_card' || $this->type === 'debit_card') {
            return $this->brand . ' **** ' . $this->last_four;
        }
        
        return $this->name;
    }

    public function getTypeDisplayAttribute()
    {
        return match($this->type) {
            'credit_card' => 'Credit Card',
            'debit_card' => 'Debit Card',
            'bank_account' => 'Bank Account',
            'digital_wallet' => 'Digital Wallet',
            default => ucfirst(str_replace('_', ' ', $this->type))
        };
    }

    // Methods
    public function makeDefault()
    {
        // Remove default from other payment methods
        static::where('user_id', $this->user_id)
              ->where('id', '!=', $this->id)
              ->update(['is_default' => false]);
        
        $this->update(['is_default' => true]);
    }

    public function deactivate()
    {
        $this->update(['is_active' => false]);
        
        // If this was the default, make another one default
        if ($this->is_default) {
            $newDefault = static::where('user_id', $this->user_id)
                               ->where('is_active', true)
                               ->first();
            
            if ($newDefault) {
                $newDefault->makeDefault();
            }
        }
    }
}
