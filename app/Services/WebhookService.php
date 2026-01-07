<?php

namespace App\Services;

use App\Models\ServiceProvider;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    /**
     * Dispatch webhook for invoice events
     */
    public function dispatchInvoiceEvent(string $event, Invoice $invoice): void
    {
        $serviceProvider = $invoice->serviceProvider;
        
        if (!$serviceProvider) {
            return;
        }

        $settings = $serviceProvider->settings ?? [];
        $webhooks = $settings['webhooks'] ?? [];

        foreach ($webhooks as $webhook) {
            if (!($webhook['active'] ?? false)) {
                continue;
            }

            $events = $webhook['events'] ?? [];
            if (!in_array($event, $events)) {
                continue;
            }

            $this->sendWebhook($webhook, $event, [
                'event' => $event,
                'invoice' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'title' => $invoice->title,
                    'amount' => $invoice->amount,
                    'tax_amount' => $invoice->tax_amount,
                    'total_amount' => $invoice->total_amount,
                    'status' => $invoice->status,
                    'due_date' => $invoice->due_date?->toIso8601String(),
                    'issue_date' => $invoice->issue_date?->toIso8601String(),
                    'customer' => [
                        'id' => $invoice->user->id,
                        'name' => $invoice->user->name,
                        'email' => $invoice->user->email,
                    ],
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        }
    }

    /**
     * Dispatch webhook for payment events
     */
    public function dispatchPaymentEvent(string $event, Payment $payment): void
    {
        $invoice = $payment->invoice;
        if (!$invoice) {
            return;
        }

        $serviceProvider = $invoice->serviceProvider;
        
        if (!$serviceProvider) {
            return;
        }

        $settings = $serviceProvider->settings ?? [];
        $webhooks = $settings['webhooks'] ?? [];

        foreach ($webhooks as $webhook) {
            if (!($webhook['active'] ?? false)) {
                continue;
            }

            $events = $webhook['events'] ?? [];
            if (!in_array($event, $events)) {
                continue;
            }

            $this->sendWebhook($webhook, $event, [
                'event' => $event,
                'payment' => [
                    'id' => $payment->id,
                    'reference' => $payment->reference,
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'method' => $payment->paymentMethod?->type,
                    'created_at' => $payment->created_at?->toIso8601String(),
                ],
                'invoice' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'title' => $invoice->title,
                    'total_amount' => $invoice->total_amount,
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        }
    }

    /**
     * Send webhook request
     */
    private function sendWebhook(array $webhook, string $event, array $payload): void
    {
        try {
            $url = $webhook['url'];
            $secret = $webhook['secret'] ?? null;

            // Add signature if secret is provided
            $headers = [
                'Content-Type' => 'application/json',
                'X-Webhook-Event' => $event,
            ];

            if ($secret) {
                $signature = hash_hmac('sha256', json_encode($payload), $secret);
                $headers['X-Webhook-Signature'] = $signature;
            }

            $response = Http::timeout(10)
                ->withHeaders($headers)
                ->post($url, $payload);

            if (!$response->successful()) {
                Log::warning('Webhook failed', [
                    'url' => $url,
                    'event' => $event,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Webhook error', [
                'url' => $webhook['url'] ?? null,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

