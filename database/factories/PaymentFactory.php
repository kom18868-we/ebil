<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Invoice;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;
    
    private static $paymentCounter = 0;

    public function definition(): array
    {
        self::$paymentCounter++;
        $prefix = 'PAY-' . date('Ymd') . '-';
        $uniqueNumber = str_pad(self::$paymentCounter, 6, '0', STR_PAD_LEFT);
        $paymentReference = $prefix . $uniqueNumber;
        
        // Ensure uniqueness by checking database
        while (Payment::where('payment_reference', $paymentReference)->exists()) {
            self::$paymentCounter++;
            $uniqueNumber = str_pad(self::$paymentCounter, 6, '0', STR_PAD_LEFT);
            $paymentReference = $prefix . $uniqueNumber;
        }
        
        return [
            'payment_reference' => $paymentReference,
            'invoice_id' => Invoice::factory(),
            'user_id' => User::factory(),
            'payment_method_id' => PaymentMethod::factory(),
            'amount' => fake()->randomFloat(2, 10, 1000),
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'failed']),
            'payment_type' => fake()->randomElement(['full', 'partial']),
            'gateway' => fake()->randomElement(['stripe', 'paypal', 'manual']),
            'gateway_transaction_id' => fake()->uuid(),
            'gateway_response' => null,
            'processed_at' => null,
            'notes' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'processed_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'processed_at' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'notes' => fake()->sentence(),
        ]);
    }
}

