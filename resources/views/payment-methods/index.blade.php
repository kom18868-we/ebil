@extends('layouts.app')

@section('title', __('Payment Methods'))

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ __('Payment Methods') }}</h1>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <p>{{ __('Total Payment Methods: :count', ['count' => $paymentMethods->count() ?? 0]) }}</p>
    </div>
</div>
@endsection

