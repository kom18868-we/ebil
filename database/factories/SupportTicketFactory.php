<?php

namespace Database\Factories;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupportTicketFactory extends Factory
{
    protected $model = SupportTicket::class;

    public function definition(): array
    {
        return [
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => User::factory(),
            'assigned_to' => null,
            'subject' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'status' => fake()->randomElement(['open', 'in_progress', 'waiting_response', 'resolved', 'closed']),
            'category' => fake()->randomElement(['billing', 'technical', 'general', 'complaint', 'suggestion']),
            'rating' => null,
            'rating_comment' => null,
            'resolved_at' => null,
            'closed_at' => null,
            'metadata' => null,
        ];
    }

    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'open',
            'resolved_at' => null,
            'closed_at' => null,
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'resolved',
            'resolved_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
            'closed_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }
}

