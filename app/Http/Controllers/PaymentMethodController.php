<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PaymentMethodController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $paymentMethods = PaymentMethod::where('user_id', Auth::id())
                                     ->orderBy('is_default', 'desc')
                                     ->orderBy('created_at', 'desc')
                                     ->get();

        if (request()->expectsJson()) {
            return response()->json($paymentMethods);
        }

        return view('payment-methods.index', compact('paymentMethods'));
    }

    /**
     * API endpoint for listing payment methods
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return $this->index();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('payment-methods.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:credit_card,debit_card,bank_account,digital_wallet',
            'name' => 'required|string|max:255',
            'last_four' => 'nullable|string|max:4',
            'brand' => 'nullable|string|max:255',
            'gateway_token' => 'nullable|string|max:255',
            'expires_at' => 'nullable|date',
            'is_default' => 'boolean',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['is_active'] = true;

        // If this is set as default, remove default from others
        if ($request->filled('is_default') && $request->is_default) {
            PaymentMethod::where('user_id', Auth::id())
                        ->update(['is_default' => false]);
            $validated['is_default'] = true;
        } else {
            // If this is the first payment method, make it default
            $hasPaymentMethods = PaymentMethod::where('user_id', Auth::id())->exists();
            if (!$hasPaymentMethods) {
                $validated['is_default'] = true;
            } else {
                $validated['is_default'] = false;
            }
        }

        $paymentMethod = PaymentMethod::create($validated);

        if ($request->expectsJson()) {
            return response()->json($paymentMethod, 201);
        }

        return redirect()->route('payment-methods.index')
                        ->with('success', __('Payment method added successfully.'));
    }

    /**
     * API endpoint for creating payment method
     */
    public function apiStore(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        // Check authorization
        if ($paymentMethod->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $paymentMethod->update($validated);

        if ($request->expectsJson()) {
            return response()->json($paymentMethod);
        }

        return redirect()->route('payment-methods.index')
                        ->with('success', __('Payment method updated successfully.'));
    }

    /**
     * API endpoint for updating payment method
     */
    public function apiUpdate(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        return $this->update($request, $paymentMethod);
    }

    /**
     *  
     * Remove the specified resource from storage.
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        // Check authorization
        if ($paymentMethod->user_id !== Auth::id()) {
            abort(403);
        }

        // Check if payment method has active payments
        $hasPayments = $paymentMethod->payments()
                                    ->whereIn('status', ['pending', 'processing', 'completed'])
                                    ->exists();

        if ($hasPayments) {
            return redirect()->back()
                           ->with('error', __('Cannot delete payment method with active payments.'));
        }

        $wasDefault = $paymentMethod->is_default;
        $paymentMethod->delete();

        // If it was default, make another one default
        if ($wasDefault) {
            $newDefault = PaymentMethod::where('user_id', Auth::id())
                                      ->where('is_active', true)
                                      ->first();
            
            if ($newDefault) {
                $newDefault->makeDefault();
            }
        }

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Payment method deleted successfully.']);
        }

        return redirect()->route('payment-methods.index')
                        ->with('success', __('Payment method deleted successfully.'));
    }

    /**
     * API endpoint for deleting payment method
     */
    public function apiDestroy(PaymentMethod $paymentMethod): JsonResponse
    {
        return $this->destroy($paymentMethod);
    }

    /**
     * Make a payment method the default
     */
    public function makeDefault(PaymentMethod $paymentMethod)
    {
        // Check authorization
        if ($paymentMethod->user_id !== Auth::id()) {
            abort(403);
        }

        // Check if payment method is active
        if (!$paymentMethod->is_active) {
            return redirect()->back()
                           ->with('error', __('Cannot set inactive payment method as default.'));
        }

        $paymentMethod->makeDefault();

        if (request()->expectsJson()) {
            return response()->json($paymentMethod);
        }

        return redirect()->back()
                        ->with('success', __('Payment method set as default.'));
    }

    /**
     * API endpoint for making payment method default
     */
    public function apiMakeDefault(PaymentMethod $paymentMethod): JsonResponse
    {
        return $this->makeDefault($paymentMethod);
    }
}
