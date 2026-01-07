@extends('layouts.app')

@section('title', __('Payment Details'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Payment Details') }}</h1>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <p>{{ __('Payment: :reference', ['reference' => $payment->payment_reference ?? 'N/A']) }}</p>
    </div>
</div>
@endsection

