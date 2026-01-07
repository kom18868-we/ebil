@extends('layouts.app')

@section('title', __('Admin Dashboard'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Admin Dashboard') }}</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <p class="text-sm text-gray-500">{{ __('Total Users') }}</p>
            <p class="text-2xl font-bold">{{ isset($stats) && isset($stats['total_users']) ? $stats['total_users'] : 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <p class="text-sm text-gray-500">{{ __('Total Invoices') }}</p>
            <p class="text-2xl font-bold">{{ isset($stats) && isset($stats['total_invoices']) ? $stats['total_invoices'] : 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <p class="text-sm text-gray-500">{{ __('Total Revenue') }}</p>
            <p class="text-2xl font-bold">${{ number_format(isset($stats) && isset($stats['total_revenue']) ? $stats['total_revenue'] : 0, 2) }}</p>
        </div>
    </div>
    
    @if(isset($recentInvoices))
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">{{ __('Recent Invoices') }}</h2>
        <p class="text-sm text-gray-500">{{ __('Count: :count', ['count' => $recentInvoices->count() ?? 0]) }}</p>
    </div>
    @endif
    
    @if(isset($recentPayments))
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">{{ __('Recent Payments') }}</h2>
        <p class="text-sm text-gray-500">{{ __('Count: :count', ['count' => $recentPayments->count() ?? 0]) }}</p>
    </div>
    @endif
    
    @if(isset($recentTickets))
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">{{ __('Recent Tickets') }}</h2>
        <p class="text-sm text-gray-500">{{ __('Count: :count', ['count' => $recentTickets->count() ?? 0]) }}</p>
    </div>
    @endif
</div>
@endsection

