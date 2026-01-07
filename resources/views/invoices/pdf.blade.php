<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number ?? 'N/A' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .invoice-number {
            font-size: 14px;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .two-columns {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .column {
            width: 48%;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 3px;
        }
        .info-value {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #4F46E5;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 300px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        .total-row:last-child {
            border-bottom: 2px solid #333;
            font-weight: bold;
            font-size: 16px;
            margin-top: 10px;
            padding-top: 15px;
        }
        .total-label {
            font-weight: bold;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #FEF3C7;
            color: #92400E;
        }
        .status-paid {
            background-color: #D1FAE5;
            color: #065F46;
        }
        .status-overdue {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9fafb;
            border-left: 4px solid #4F46E5;
        }
        .notes-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div>
                <div class="logo">E-Bill Payment Platform</div>
                <div style="margin-top: 10px; color: #666;">
                    Invoice Management System
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#{{ $invoice->invoice_number ?? 'N/A' }}</div>
            </div>
        </div>

        <!-- Invoice Details -->
        <div class="section">
            <div class="two-columns">
                <div class="column">
                    <div class="section-title">Bill To</div>
                    <div class="info-row">
                        <div class="info-label">Customer Name:</div>
                        <div class="info-value">{{ $invoice->user->name ?? 'N/A' }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email:</div>
                        <div class="info-value">{{ $invoice->user->email ?? 'N/A' }}</div>
                    </div>
                </div>
                <div class="column">
                    <div class="section-title">Service Provider</div>
                    <div class="info-row">
                        <div class="info-label">Company:</div>
                        <div class="info-value">{{ $invoice->serviceProvider->company_name ?? $invoice->serviceProvider->name ?? 'N/A' }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Contact:</div>
                        <div class="info-value">{{ $invoice->serviceProvider->contact_email ?? 'N/A' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Information -->
        <div class="section">
            <div class="two-columns">
                <div class="column">
                    <div class="info-row">
                        <div class="info-label">Invoice Date:</div>
                        <div class="info-value">{{ $invoice->issue_date ? $invoice->issue_date->format('F d, Y') : 'N/A' }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Due Date:</div>
                        <div class="info-value">{{ $invoice->due_date ? $invoice->due_date->format('F d, Y') : 'N/A' }}</div>
                    </div>
                </div>
                <div class="column">
                    <div class="info-row">
                        <div class="info-label">Status:</div>
                        <div class="info-value">
                            <span class="status-badge status-{{ strtolower($invoice->status ?? 'pending') }}">
                                {{ ucfirst($invoice->status ?? 'Pending') }}
                            </span>
                        </div>
                    </div>
                    @if($invoice->paid_date)
                    <div class="info-row">
                        <div class="info-label">Paid Date:</div>
                        <div class="info-value">{{ $invoice->paid_date->format('F d, Y') }}</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Invoice Items -->
        <div class="section">
            <div class="section-title">Invoice Details</div>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Amount</th>
                        <th class="text-right">Tax</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{{ $invoice->title ?? 'Invoice Item' }}</strong>
                            @if($invoice->description)
                            <div style="margin-top: 5px; color: #666; font-size: 11px;">
                                {{ $invoice->description }}
                            </div>
                            @endif
                        </td>
                        <td class="text-right">${{ number_format($invoice->amount ?? 0, 2) }}</td>
                        <td class="text-right">${{ number_format($invoice->tax_amount ?? 0, 2) }}</td>
                        <td class="text-right"><strong>${{ number_format($invoice->total_amount ?? 0, 2) }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span>${{ number_format($invoice->amount ?? 0, 2) }}</span>
            </div>
            @if($invoice->tax_amount && $invoice->tax_amount > 0)
            <div class="total-row">
                <span class="total-label">Tax:</span>
                <span>${{ number_format($invoice->tax_amount ?? 0, 2) }}</span>
            </div>
            @endif
            <div class="total-row">
                <span class="total-label">Total Amount:</span>
                <span>${{ number_format($invoice->total_amount ?? 0, 2) }}</span>
            </div>
            @if($invoice->payments && $invoice->payments->count() > 0)
            <div class="total-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <span class="total-label">Total Paid:</span>
                <span style="color: #059669;">${{ number_format($invoice->payments->where('status', 'completed')->sum('amount'), 2) }}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Remaining Balance:</span>
                <span style="color: #DC2626;">${{ number_format($invoice->total_amount - $invoice->payments->where('status', 'completed')->sum('amount'), 2) }}</span>
            </div>
            @endif
        </div>

        @if($invoice->description)
        <div class="notes">
            <div class="notes-title">Notes:</div>
            <div>{{ $invoice->description }}</div>
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <div>Thank you for your business!</div>
            <div style="margin-top: 5px;">This is an automated invoice generated by E-Bill Payment Platform</div>
            <div style="margin-top: 5px;">Generated on: {{ now()->format('F d, Y \a\t g:i A') }}</div>
        </div>
    </div>
</body>
</html>
