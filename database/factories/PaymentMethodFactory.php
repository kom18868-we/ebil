<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['credit_card', 'debit_card', 'bank_account', 'digital_wallet']);
        
        return [
            'user_id' => User::factory(),
            'type' => $type,
            'name' => fake()->words(3, true),
            'last_four' => $type === 'credit_card' || $type === 'debit_card' 
                ? fake()->numerify('####') 
                : null,
            'brand' => $type === 'credit_card' || $type === 'debit_card'
                ? fake()->randomElement(['Visa', 'MasterCard', 'American Express'])
                : null,
            'gateway_token' => fake()->uuid(),
            'expires_at' => $type === 'credit_card' || $type === 'debit_card'
                ? fake()->dateTimeBetween('now', '+5 years')
                : null,
            'is_default' => false,
            'is_active' => true,
            'metadata' => null,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}

