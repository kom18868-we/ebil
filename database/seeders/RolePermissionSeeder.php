<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage user roles',
            
            // Invoice management
            'view invoices',
            'create invoices',
            'edit invoices',
            'delete invoices',
            'pay invoices',
            'download invoices',
            'archive invoices',
            
            // Payment management
            'view payments',
            'process payments',
            'refund payments',
            'view payment methods',
            'manage payment methods',
            
            // Service provider management
            'view service providers',
            'create service providers',
            'edit service providers',
            'delete service providers',
            'manage provider status',
            
            // Support ticket management
            'view tickets',
            'create tickets',
            'edit tickets',
            'assign tickets',
            'close tickets',
            'rate tickets',
            
            // Admin features
            'view admin dashboard',
            'view reports',
            'export reports',
            'schedule reports',
            'view activity logs',
            'manage system settings',
            'manage notifications',
            
            // Profile management
            'view profile',
            'edit profile',
            'change password',
            'enable two factor',
            'manage sessions',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // Admin role - has all permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Service Provider role
        $providerRole = Role::firstOrCreate(['name' => 'service_provider']);
        $providerRole->givePermissionTo([
            'view invoices',
            'create invoices',
            'edit invoices',
            'delete invoices',
            'view payments',
            'view tickets',
            'create tickets',
            'edit tickets',
            'view profile',
            'edit profile',
            'change password',
            'enable two factor',
            'manage sessions',
        ]);

        // Customer role
        $customerRole = Role::firstOrCreate(['name' => 'customer']);
        $customerRole->givePermissionTo([
            'view invoices',
            'pay invoices',
            'download invoices',
            'view payments',
            'view payment methods',
            'manage payment methods',
            'view tickets',
            'create tickets',
            'rate tickets',
            'view profile',
            'edit profile',
            'change password',
            'enable two factor',
            'manage sessions',
        ]);

        // Support Agent role
        $supportRole = Role::firstOrCreate(['name' => 'support_agent']);
        $supportRole->givePermissionTo([
            'view users',
            'view invoices',
            'view payments',
            'view tickets',
            'edit tickets',
            'assign tickets',
            'close tickets',
            'view profile',
            'edit profile',
            'change password',
            'enable two factor',
            'manage sessions',
        ]);
    }
}
