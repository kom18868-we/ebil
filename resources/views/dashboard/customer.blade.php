@extends('layouts.app')

@section('title', __('Customer Dashboard'))

@section('content')
<div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
        <div class="p-6 text-gray-900 dark:text-gray-100">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        {{ __('Welcome back, :name!', ['name' => Auth::user()->name]) }}
                    </h1>
                    <p class="mt-1 text-gray-600 dark:text-gray-400">
                        {{ __('Here\'s an overview of your account activity.') }}
                    </p>
                </div>
                <div class="hidden sm:block">
                    <a href="{{ route('invoices.index') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                        {{ __('View All Invoices') }}
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Total Invoices -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                                <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Total Invoices') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ $stats['total_invoices'] }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Invoices -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Pending Invoices') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ $stats['pending_invoices'] }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overdue Invoices -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Overdue Invoices') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ $stats['overdue_invoices'] }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Paid -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Total Paid') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">${{ number_format($stats['total_paid'], 2) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Amount -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Pending Amount') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">${{ number_format($stats['pending_amount'], 2) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Paid Invoices -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4 {{ app()->getLocale() === 'ar' ? 'mr-4 ml-0' : '' }}">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ __('Paid Invoices') }}</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ $stats['paid_invoices'] }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Upcoming Due Dates -->
    @if($upcomingDueDates->count() > 0)
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
        <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {{ __('Upcoming Due Dates') }}
            </h3>
            <div class="space-y-3">
                @foreach($upcomingDueDates as $invoice)
                <div class="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ $invoice->title }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ __('Invoice #:number', ['number' => $invoice->invoice_number]) }}
                        </p>
                    </div>
                    <div class="text-right {{ app()->getLocale() === 'ar' ? 'text-left' : '' }}">
                        <p class="font-medium text-gray-900 dark:text-white">${{ $invoice->formatted_amount }}</p>
                        <p class="text-sm text-yellow-600 dark:text-yellow-400">
                            {{ __('Due :date', ['date' => $invoice->due_date->format('M d, Y')]) }}
                        </p>
                    </div>
                    <div>
                        <a href="{{ route('invoices.show', $invoice) }}" class="inline-flex items-center px-3 py-1 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                            {{ __('Pay Now') }}
                        </a>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    @endif

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Invoices -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ __('Recent Invoices') }}
                    </h3>
                    <a href="{{ route('invoices.index') }}" class="text-sm text-indigo-600 hover:text-indigo-500">
                        {{ __('View all') }}
                    </a>
                </div>
                <div class="space-y-3">
                    @forelse($recentInvoices as $invoice)
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white">{{ $invoice->title }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                {{ $invoice->serviceProvider->company_name }}
                            </p>
                        </div>
                        <div class="text-right {{ app()->getLocale() === 'ar' ? 'text-left' : '' }}">
                            <p class="font-medium text-gray-900 dark:text-white">${{ $invoice->formatted_amount }}</p>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                @if($invoice->status === 'paid') bg-green-100 text-green-800
                                @elseif($invoice->status === 'pending') bg-yellow-100 text-yellow-800
                                @elseif($invoice->status === 'overdue') bg-red-100 text-red-800
                                @else bg-gray-100 text-gray-800 @endif">
                                {{ ucfirst($invoice->status) }}
                            </span>
                        </div>
                    </div>
                    @empty
                    <p class="text-gray-500 dark:text-gray-400 text-center py-4">
                        {{ __('No invoices found.') }}
                    </p>
                    @endforelse
                </div>
            </div>
        </div>

        <!-- Recent Payments -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ __('Recent Payments') }}
                    </h3>
                    <a href="{{ route('payments.index') }}" class="text-sm text-indigo-600 hover:text-indigo-500">
                        {{ __('View all') }}
                    </a>
                </div>
                <div class="space-y-3">
                    @forelse($recentPayments as $payment)
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white">{{ $payment->invoice->title }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                {{ $payment->created_at->format('M d, Y') }}
                            </p>
                        </div>
                        <div class="text-right {{ app()->getLocale() === 'ar' ? 'text-left' : '' }}">
                            <p class="font-medium text-gray-900 dark:text-white">${{ $payment->formatted_amount }}</p>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {{ ucfirst($payment->status) }}
                            </span>
                        </div>
                    </div>
                    @empty
                    <p class="text-gray-500 dark:text-gray-400 text-center py-4">
                        {{ __('No payments found.') }}
                    </p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

