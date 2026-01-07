<!DOCTYPE html>
<html>
<head>
    <title>Receipt {{ $payment->payment_reference ?? 'N/A' }}</title>
</head>
<body>
    <h1>Payment Receipt</h1>
    <p>Reference: {{ $payment->payment_reference ?? 'N/A' }}</p>
    <p>Amount: ${{ number_format($payment->amount ?? 0, 2) }}</p>
</body>
</html>

