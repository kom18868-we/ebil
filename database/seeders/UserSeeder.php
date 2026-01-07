<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@ebill.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'phone' => '+1234567890',
                'city' => 'New York',
                'country' => 'USA',
                'preferred_language' => 'en',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        // Create Service Provider User
        $provider = User::firstOrCreate(
            ['email' => 'provider@example.com'],
            [
                'name' => 'John Smith',
                'password' => Hash::make('password'),
                'phone' => '+1234567891',
                'city' => 'Los Angeles',
                'country' => 'USA',
                'preferred_language' => 'en',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$provider->hasRole('service_provider')) {
            $provider->assignRole('service_provider');
        }

        // Create Customer Users
        $customer1 = User::firstOrCreate(
            ['email' => 'ahmed@example.com'],
            [
                'name' => 'Ahmed Al-Rashid',
                'password' => Hash::make('password'),
                'phone' => '+966501234567',
                'city' => 'Riyadh',
                'country' => 'Saudi Arabia',
                'preferred_language' => 'ar',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$customer1->hasRole('customer')) {
            $customer1->assignRole('customer');
        }

        $customer2 = User::firstOrCreate(
            ['email' => 'sarah@example.com'],
            [
                'name' => 'Sarah Johnson',
                'password' => Hash::make('password'),
                'phone' => '+1234567892',
                'city' => 'Chicago',
                'country' => 'USA',
                'preferred_language' => 'en',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$customer2->hasRole('customer')) {
            $customer2->assignRole('customer');
        }

        // Create Support Agent
        $support = User::firstOrCreate(
            ['email' => 'support@ebill.com'],
            [
                'name' => 'Mike Wilson',
                'password' => Hash::make('password'),
                'phone' => '+1234567893',
                'city' => 'Austin',
                'country' => 'USA',
                'preferred_language' => 'en',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$support->hasRole('support_agent')) {
            $support->assignRole('support_agent');
        }
    }
}
