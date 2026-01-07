@extends('layouts.app')

@section('title', __('Invoice Reports'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Invoice Reports') }}</h1>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <p>{{ __('Total Invoices: :count', ['count' => $invoices->total() ?? 0]) }}</p>
    </div>
</div>
@endsection

