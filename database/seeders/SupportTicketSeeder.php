<?php

namespace Database\Seeders;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SupportTicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users
        $users = User::all();
        $customers = $users->filter(function($user) {
            try {
                return $user->hasRole('customer');
            } catch (\Exception $e) {
                return false;
            }
        });
        
        // If no customers, use any users
        if ($customers->isEmpty()) {
            $customers = $users->take(3);
        }
        
        $supportAgents = $users->filter(function($user) {
            try {
                return $user->hasRole('support_agent') || $user->hasRole('admin');
            } catch (\Exception $e) {
                return false;
            }
        });
        
        if ($customers->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }
        
        // Create tickets for each customer
        foreach ($customers->take(5) as $customer) {
            $ticketCount = rand(1, 3);
            
            for ($i = 0; $i < $ticketCount; $i++) {
                $categories = ['billing', 'technical', 'general', 'complaint', 'suggestion'];
                $priorities = ['low', 'medium', 'high', 'urgent'];
                $statuses = ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'];
                
                $category = $categories[array_rand($categories)];
                $priority = $priorities[array_rand($priorities)];
                
                // Weight statuses - more open/in_progress than closed
                $statusWeights = [
                    'open' => 3,
                    'in_progress' => 2,
                    'waiting_response' => 2,
                    'resolved' => 1,
                    'closed' => 1,
                ];
                $status = $this->weightedRandom($statusWeights);
                
                $createdAt = Carbon::now()->subDays(rand(0, 30));
                $resolvedAt = null;
                $closedAt = null;
                
                if ($status === 'resolved') {
                    $resolvedAt = $createdAt->copy()->addDays(rand(1, 5));
                } elseif ($status === 'closed') {
                    $closedAt = $createdAt->copy()->addDays(rand(2, 7));
                }
                
                $assignedTo = null;
                if (in_array($status, ['in_progress', 'resolved', 'closed']) && !$supportAgents->isEmpty()) {
                    $assignedTo = $supportAgents->random()->id;
                }
                
                SupportTicket::create([
                    'ticket_number' => SupportTicket::generateTicketNumber(),
                    'user_id' => $customer->id,
                    'assigned_to' => $assignedTo,
                    'subject' => $this->getRandomSubject($category),
                    'description' => $this->getRandomDescription($category),
                    'priority' => $priority,
                    'status' => $status,
                    'category' => $category,
                    'resolved_at' => $resolvedAt,
                    'closed_at' => $closedAt,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->copy()->addDays(rand(0, 5)),
                ]);
            }
        }
        
        $this->command->info('Support tickets created successfully!');
    }
    
    private function weightedRandom(array $weights): string
    {
        $total = array_sum($weights);
        $random = rand(1, $total);
        $current = 0;
        
        foreach ($weights as $key => $weight) {
            $current += $weight;
            if ($random <= $current) {
                return $key;
            }
        }
        
        return array_key_first($weights);
    }
    
    private function getRandomSubject(string $category): string
    {
        $subjects = [
            'billing' => [
                'Invoice payment issue',
                'Billing inquiry',
                'Payment method problem',
                'Refund request',
                'Invoice discrepancy',
            ],
            'technical' => [
                'Website not loading',
                'Login problem',
                'Feature not working',
                'System error',
                'Performance issue',
            ],
            'general' => [
                'General inquiry',
                'Account question',
                'Service information',
                'How to use feature',
                'Account settings',
            ],
            'complaint' => [
                'Service complaint',
                'Poor experience',
                'Issue with support',
                'Billing complaint',
                'Quality concern',
            ],
            'suggestion' => [
                'Feature suggestion',
                'Improvement idea',
                'UI enhancement',
                'New functionality',
                'User experience improvement',
            ],
        ];
        
        $categorySubjects = $subjects[$category] ?? $subjects['general'];
        return $categorySubjects[array_rand($categorySubjects)];
    }
    
    private function getRandomDescription(string $category): string
    {
        $descriptions = [
            'billing' => 'I have an issue with my billing. Please help me resolve this matter.',
            'technical' => 'I am experiencing a technical problem that needs immediate attention.',
            'general' => 'I have a question about the service and would like more information.',
            'complaint' => 'I am not satisfied with the service provided and would like to file a complaint.',
            'suggestion' => 'I have a suggestion that could improve the platform and user experience.',
        ];
        
        return $descriptions[$category] ?? $descriptions['general'];
    }
}

