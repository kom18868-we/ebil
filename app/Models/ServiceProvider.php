<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceProvider extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_name',
        'business_registration',
        'tax_number',
        'description',
        'website',
        'phone',
        'address',
        'city',
        'country',
        'postal_code',
        'status',
        'settings',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'settings' => 'array',
    ];

    /**
     * Get the user that owns the service provider.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the invoices for the service provider.
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get the ratings for the service provider.
     */
    public function ratings()
    {
        return $this->hasMany(ServiceProviderRating::class);
    }

    /**
     * Get visible ratings for the service provider.
     */
    public function visibleRatings()
    {
        return $this->hasMany(ServiceProviderRating::class)->where('is_visible', true);
    }

    /**
     * Get the average rating for the service provider.
     */
    public function getAverageRatingAttribute()
    {
        return $this->visibleRatings()->avg('rating') ?? 0;
    }

    /**
     * Get the total number of ratings for the service provider.
     */
    public function getRatingsCountAttribute()
    {
        return $this->visibleRatings()->count();
    }

    /**
     * Scope a query to only include active service providers.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the total amount of invoices for this service provider.
     */
    public function getTotalInvoicesAmountAttribute()
    {
        return $this->invoices()->sum('total_amount');
    }

    /**
     * Get the count of pending invoices for this service provider.
     */
    public function getPendingInvoicesCountAttribute()
    {
        return $this->invoices()->where('status', 'pending')->count();
    }
}
