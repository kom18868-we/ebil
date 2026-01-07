<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\User;
use App\Models\ServiceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;
    
    private static $invoiceCounter = 0;

    public function definition(): array
    {
        self::$invoiceCounter++;
        $prefix = 'INV-' . date('Y') . '-';
        $uniqueNumber = str_pad(self::$invoiceCounter, 6, '0', STR_PAD_LEFT);
        $invoiceNumber = $prefix . $uniqueNumber;
        
        // Ensure uniqueness by checking database
        while (Invoice::where('invoice_number', $invoiceNumber)->exists()) {
            self::$invoiceCounter++;
            $uniqueNumber = str_pad(self::$invoiceCounter, 6, '0', STR_PAD_LEFT);
            $invoiceNumber = $prefix . $uniqueNumber;
        }
        
        return [
            'invoice_number' => $invoiceNumber,
            'user_id' => User::factory(),
            'service_provider_id' => ServiceProvider::factory(),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'amount' => fake()->randomFloat(2, 10, 1000),
            'tax_amount' => fake()->randomFloat(2, 0, 100),
            'total_amount' => function (array $attributes) {
                return $attributes['amount'] + ($attributes['tax_amount'] ?? 0);
            },
            'status' => fake()->randomElement(['pending', 'paid', 'overdue']),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'issue_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'paid_date' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'paid_date' => null,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_date' => fake()->dateTimeBetween($attributes['issue_date'], 'now'),
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'overdue',
            'due_date' => fake()->dateTimeBetween('-30 days', '-1 day'),
            'paid_date' => null,
        ]);
    }
}

