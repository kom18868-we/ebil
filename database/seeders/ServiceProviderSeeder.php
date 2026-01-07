<?php

namespace Database\Seeders;

use App\Models\ServiceProvider;
use Illuminate\Database\Seeder;

class ServiceProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create a provider user
        $user = \App\Models\User::whereHas('roles', function($q) {
            $q->where('name', 'service_provider');
        })->first();
        
        // If no provider user, use any user or create one
        if (!$user) {
            $user = \App\Models\User::first();
            if ($user && !$user->hasRole('service_provider')) {
                $user->assignRole('service_provider');
            }
        }
        
        if (!$user) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }
        
        ServiceProvider::firstOrCreate(
            ['company_name' => 'Default Services Inc.'],
            [
                'user_id' => $user->id,
                'company_name' => 'Default Services Inc.',
                'business_registration' => 'REG-12345',
                'tax_number' => 'TAX-67890',
                'description' => 'Default service provider for testing',
                'website' => 'https://example.com',
                'phone' => '+1234567890',
                'address' => '123 Main St',
                'city' => 'New York',
                'country' => 'USA',
                'postal_code' => '10001',
                'status' => 'active',
            ]
        );
        
        $this->command->info('Service provider created successfully!');
    }
}
