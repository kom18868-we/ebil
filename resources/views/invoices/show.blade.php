@extends('layouts.app')

@section('title', __('Invoice Details'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Invoice Details') }}</h1>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <p>{{ __('Invoice: :number', ['number' => $invoice->invoice_number ?? 'N/A']) }}</p>
    </div>
</div>
@endsection

