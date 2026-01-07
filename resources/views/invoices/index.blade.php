@extends('layouts.app')

@section('title', __('Invoices'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Invoices') }}</h1>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <p>{{ __('Total Invoices: :count', ['count' => $invoices->total() ?? 0]) }}</p>
        
        @if(isset($invoices) && $invoices->count() > 0)
        <div class="mt-4 space-y-2">
            @foreach($invoices as $invoice)
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p class="font-medium">{{ $invoice->invoice_number }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ $invoice->title }}</p>
            </div>
            @endforeach
        </div>
        @endif
    </div>
</div>
@endsection

