<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\User;
use App\Models\ServiceProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users and service providers
        $users = User::all();
        $providers = ServiceProvider::all();
        
        if ($users->isEmpty() || $providers->isEmpty()) {
            $this->command->warn('No users or service providers found. Please run UserSeeder and ServiceProviderSeeder first.');
            return;
        }
        
        // Filter for customers or use any users
        $customers = $users->filter(function($user) {
            try {
                return $user->hasRole('customer');
            } catch (\Exception $e) {
                return false;
            }
        });
        
        // If no customers found, use any users
        if ($customers->isEmpty()) {
            $customers = $users;
        }
        
        // Create invoices for each customer (up to 5)
        $customerCount = min(5, $customers->count());
        foreach ($customers->take($customerCount) as $user) {
            $provider = $providers->random();
            
            // Create 2-4 invoices per user
            $invoiceCount = rand(2, 4);
            
            for ($i = 0; $i < $invoiceCount; $i++) {
                $amount = rand(100, 5000);
                $taxAmount = $amount * 0.1; // 10% tax
                $totalAmount = $amount + $taxAmount;
                
                $dueDate = Carbon::now()->addDays(rand(7, 60));
                $issueDate = Carbon::now()->subDays(rand(0, 30));
                
                // Determine status
                $status = 'pending';
                if (rand(1, 3) === 1) {
                    $status = 'paid';
                } elseif ($dueDate->isPast() && $status === 'pending') {
                    $status = 'overdue';
                }
                
                Invoice::create([
                    'invoice_number' => Invoice::generateInvoiceNumber(),
                    'user_id' => $user->id,
                    'service_provider_id' => $provider->id,
                    'title' => 'Invoice for Services - ' . $this->getRandomService(),
                    'description' => 'Payment for services rendered. Please pay by the due date.',
                    'amount' => $amount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'status' => $status,
                    'due_date' => $dueDate,
                    'issue_date' => $issueDate,
                    'paid_date' => $status === 'paid' ? $issueDate->copy()->addDays(rand(1, 10)) : null,
                ]);
            }
        }
        
        $this->command->info('Invoices created successfully!');
    }
    
    private function getRandomService(): string
    {
        $services = [
            'Internet Service',
            'Electricity Bill',
            'Water Bill',
            'Phone Service',
            'Cable TV',
            'Insurance Premium',
            'Maintenance Fee',
            'Subscription Service',
            'Professional Services',
            'Consulting Fee',
        ];
        
        return $services[array_rand($services)];
    }
}
