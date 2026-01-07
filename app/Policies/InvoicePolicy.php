<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class InvoicePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view invoices');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        // Admin and support can view all invoices
        if ($user->hasAnyRole(['admin', 'support_agent'])) {
            return true;
        }

        // Service providers can view their own invoices
        if ($user->hasRole('service_provider') && $user->serviceProvider) {
            return $invoice->service_provider_id === $user->serviceProvider->id;
        }

        // Customers can view their own invoices
        if ($user->hasRole('customer')) {
            return $invoice->user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Admin and service providers can create invoices
        if ($user->hasAnyRole(['admin', 'service_provider'])) {
            return true;
        }
        
        // Also check permission for backward compatibility
        return $user->can('create invoices');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Invoice $invoice): bool
    {
        // Business logic (paid invoice check) is handled in controller
        // Policy only checks permissions

        // Admin can update all invoices
        if ($user->hasRole('admin')) {
            return true;
        }

        // Service providers can update their own invoices
        if ($user->hasRole('service_provider') && $user->serviceProvider) {
            return $invoice->service_provider_id === $user->serviceProvider->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        // Cannot delete paid invoices
        if ($invoice->status === 'paid') {
            return false;
        }

        // Admin can delete all invoices
        if ($user->hasRole('admin')) {
            return true;
        }

        // Service providers can delete their own unpaid invoices
        if ($user->hasRole('service_provider') && $user->serviceProvider) {
            return $invoice->service_provider_id === $user->serviceProvider->id;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can pay the invoice.
     */
    public function pay(User $user, Invoice $invoice): bool
    {
        // Only customers can pay their own invoices
        if ($user->hasRole('customer') && $invoice->user_id === $user->id) {
            return $invoice->status === 'pending' || $invoice->status === 'overdue';
        }

        return false;
    }

    /**
     * Determine whether the user can download the invoice.
     */
    public function download(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice);
    }

    /**
     * Determine whether the user can archive invoices.
     */
    public function archive(User $user): bool
    {
        return $user->can('archive invoices');
    }

    /**
     * Determine whether the user can cancel the invoice.
     */
    public function cancel(User $user, Invoice $invoice): bool
    {
        // Cannot cancel paid invoices
        if ($invoice->status === 'paid') {
            return false;
        }

        // Cannot cancel already cancelled invoices
        if ($invoice->status === 'cancelled') {
            return false;
        }

        // Admin can cancel all invoices
        if ($user->hasRole('admin')) {
            return true;
        }

        // Service providers can cancel their own invoices
        if ($user->hasRole('service_provider') && $user->serviceProvider) {
            return $invoice->service_provider_id === $user->serviceProvider->id;
        }

        // Customers can cancel their own invoices (if not paid)
        if ($user->hasRole('customer') && $invoice->user_id === $user->id) {
            return true;
        }

        return false;
    }
}
