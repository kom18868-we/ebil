<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SupportTicketController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = SupportTicket::with(['user', 'assignedTo']);

        // Filter based on user role
        if ($user->hasRole('customer')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('support_agent') || $user->hasRole('admin')) {
            // Support agents and admins can see all tickets
            if ($request->filled('assigned_to')) {
                if ($request->assigned_to === 'me') {
                    $query->where('assigned_to', $user->id);
                } elseif ($request->assigned_to === 'unassigned') {
                    $query->whereNull('assigned_to');
                } else {
                    $query->where('assigned_to', $request->assigned_to);
                }
            }
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15);

        if ($request->expectsJson()) {
            return response()->json($tickets);
        }

        return view('tickets.index', compact('tickets'));
    }

    /**
     * API endpoint for listing tickets
     */
    public function apiIndex(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('tickets.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'subject' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'required|in:low,medium,high,urgent',
                'category' => 'required|in:billing,technical,general,complaint,suggestion',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        try {
            $validated['user_id'] = Auth::id();
            $validated['ticket_number'] = SupportTicket::generateTicketNumber();
            $validated['status'] = 'open';

            $ticket = SupportTicket::create($validated);
            $ticket->load(['user', 'assignedTo']);

            // Log activity
            try {
                ActivityLogService::logTicketCreated($ticket);
            } catch (\Exception $e) {
                \Log::error('Failed to log ticket creation activity', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }

            if ($request->expectsJson()) {
                return response()->json($ticket, 201);
            }

            return redirect()->route('tickets.show', $ticket)
                            ->with('success', __('Ticket created successfully.'));
        } catch (\Exception $e) {
            \Log::error('Failed to create support ticket', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $validated ?? [],
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to create ticket.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()
                           ->with('error', __('Failed to create ticket. Please try again.'));
        }
    }

    /**
     * API endpoint for creating ticket
     */
    public function apiStore(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Display the specified resource.
     */
    public function show(SupportTicket $ticket)
    {
        // Check authorization
        if (Auth::user()->hasRole('customer') && $ticket->user_id !== Auth::id()) {
            abort(403);
        }

        // Load replies ordered by creation date (oldest first for conversation flow)
        $ticket->load(['user', 'assignedTo', 'replies' => function($query) {
            $query->orderBy('created_at', 'asc')->with('user');
        }]);

        if (request()->expectsJson()) {
            return response()->json($ticket);
        }

        return view('tickets.show', compact('ticket'));
    }

    /**
     * API endpoint for showing ticket
     */
    public function apiShow(SupportTicket $ticket): JsonResponse
    {
        return $this->show($ticket);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SupportTicket $ticket)
    {
        // Only admins and support agents can edit tickets
        if (!Auth::user()->hasAnyRole(['admin', 'support_agent'])) {
            abort(403);
        }

        return view('tickets.edit', compact('ticket'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SupportTicket $ticket)
    {
        // Only admins and support agents can update tickets
        if (!Auth::user()->hasAnyRole(['admin', 'support_agent'])) {
            abort(403);
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|in:billing,technical,general,complaint,suggestion',
            'status' => 'required|in:open,in_progress,waiting_response,resolved,closed',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        // Handle assignment
        if ($request->filled('assigned_to') && $request->assigned_to !== $ticket->assigned_to) {
            $ticket->assignTo($request->assigned_to);
        }

        $ticket->update($validated);
        $ticket->load(['user', 'assignedTo']);

        if ($request->expectsJson()) {
            return response()->json($ticket);
        }

        return redirect()->route('tickets.show', $ticket)
                        ->with('success', __('Ticket updated successfully.'));
    }

    /**
     * API endpoint for updating ticket
     */
    public function apiUpdate(Request $request, SupportTicket $ticket): JsonResponse
    {
        return $this->update($request, $ticket);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SupportTicket $ticket)
    {
        // Only admins can delete tickets
        if (!Auth::user()->hasRole('admin')) {
            abort(403);
        }

        $ticket->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Ticket deleted successfully.']);
        }

        return redirect()->route('tickets.index')
                        ->with('success', __('Ticket deleted successfully.'));
    }

    /**
     * API endpoint for deleting ticket
     */
    public function apiDestroy(SupportTicket $ticket): JsonResponse
    {
        return $this->destroy($ticket);
    }

    /**
     * Add a reply to the ticket
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        // Check authorization
        if (Auth::user()->hasRole('customer') && $ticket->user_id !== Auth::id()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['ticket' => ['You do not have permission to reply to this ticket.']]
                ], 403);
            }
            abort(403);
        }

        // Check if ticket is closed
        if ($ticket->status === 'closed') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Cannot reply to a closed ticket.',
                    'errors' => ['ticket' => ['This ticket is closed and cannot be replied to.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Cannot reply to a closed ticket.'));
        }

        try {
            $validated = $request->validate([
                'message' => 'required|string|min:1',
                'is_internal' => 'nullable|boolean',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        try {
            $isStaff = Auth::user()->hasAnyRole(['admin', 'support_agent']);
            
            $validated['user_id'] = Auth::id();
            $validated['support_ticket_id'] = $ticket->id;
            $validated['is_internal'] = $request->filled('is_internal') && $isStaff ? 
                                       (bool)$request->input('is_internal') : false;

            $reply = TicketReply::create($validated);
            $reply->load('user');

            // Update ticket status based on who replied
            if ($ticket->status === 'resolved' || $ticket->status === 'closed') {
                $ticket->reopen();
            } elseif ($ticket->status === 'waiting_response') {
                if ($isStaff) {
                    $ticket->update(['status' => 'in_progress']);
                } else {
                    $ticket->update(['status' => 'open']);
                }
            } elseif ($ticket->status === 'open' && $isStaff) {
                // When support staff replies to an open ticket, mark as in progress
                $ticket->update(['status' => 'in_progress']);
            } elseif ($ticket->status === 'in_progress' && !$isStaff) {
                // When customer replies to in_progress ticket, mark as waiting for response
                $ticket->update(['status' => 'waiting_response']);
            }

            // Auto-assign ticket to support staff if unassigned and staff is replying
            if ($isStaff && !$ticket->assigned_to) {
                $ticket->update(['assigned_to' => Auth::id()]);
            }

            // Reload ticket to get updated status
            $ticket->refresh();
            $ticket->load(['user', 'assignedTo']);

            if ($request->expectsJson()) {
                return response()->json($reply, 201);
            }

            return redirect()->back()
                            ->with('success', __('Reply added successfully.'));
        } catch (\Exception $e) {
            \Log::error('Failed to add ticket reply', [
                'ticket_id' => $ticket->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to add reply.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()
                           ->with('error', __('Failed to add reply. Please try again.'));
        }
    }

    /**
     * API endpoint for replying to ticket
     */
    public function apiReply(Request $request, SupportTicket $ticket): JsonResponse
    {
        return $this->reply($request, $ticket);
    }

    /**
     * Close a ticket
     */
    public function close(Request $request, SupportTicket $ticket)
    {
        // Check authorization
        // Customers can only close their own tickets
        // Support staff and admins can close any ticket
        if (Auth::user()->hasRole('customer') && $ticket->user_id !== Auth::id()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['ticket' => ['You do not have permission to close this ticket.']]
                ], 403);
            }
            abort(403);
        }

        if ($ticket->status === 'closed') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Ticket is already closed.',
                    'errors' => ['ticket' => ['This ticket is already closed.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Ticket is already closed.'));
        }

        try {
            // If ticket is not resolved, mark it as resolved first, then close
            if ($ticket->status !== 'resolved') {
                $ticket->markAsResolved();
            }

            // Close the ticket
            $ticket->close();
            $ticket->load(['user', 'assignedTo']);

            if ($request->expectsJson()) {
                return response()->json($ticket);
            }

            return redirect()->back()
                            ->with('success', __('Ticket closed successfully.'));
        } catch (\Exception $e) {
            \Log::error('Failed to close ticket', [
                'ticket_id' => $ticket->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to close ticket.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()
                           ->with('error', __('Failed to close ticket. Please try again.'));
        }
    }

    /**
     * API endpoint for closing ticket
     */
    public function apiClose(Request $request, SupportTicket $ticket): JsonResponse
    {
        return $this->close($request, $ticket);
    }

    /**
     * Resolve a ticket
     */
    public function resolve(Request $request, SupportTicket $ticket)
    {
        // Check authorization - only support staff and admins can resolve tickets
        if (!Auth::user()->hasAnyRole(['admin', 'support_agent'])) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['ticket' => ['You do not have permission to resolve this ticket.']]
                ], 403);
            }
            abort(403);
        }

        if ($ticket->status === 'closed') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Cannot resolve a closed ticket.',
                    'errors' => ['ticket' => ['This ticket is already closed.']]
                ], 422);
            }
            return redirect()->back()->with('error', __('Cannot resolve a closed ticket.'));
        }

        try {
            $ticket->markAsResolved();
            $ticket->load(['user', 'assignedTo']);

            if ($request->expectsJson()) {
                return response()->json($ticket);
            }

            return redirect()->back()
                            ->with('success', __('Ticket marked as resolved.'));
        } catch (\Exception $e) {
            \Log::error('Failed to resolve ticket', [
                'ticket_id' => $ticket->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to resolve ticket.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()
                           ->with('error', __('Failed to resolve ticket. Please try again.'));
        }
    }

    /**
     * API endpoint for resolving ticket
     */
    public function apiResolve(Request $request, SupportTicket $ticket): JsonResponse
    {
        return $this->resolve($request, $ticket);
    }

    /**
     * Rate a ticket
     */
    public function rate(Request $request, SupportTicket $ticket)
    {
        // Only ticket owner can rate
        if ($ticket->user_id !== Auth::id()) {
            abort(403);
        }

        // Only resolved or closed tickets can be rated
        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return redirect()->back()->with('error', __('Only resolved or closed tickets can be rated.'));
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'rating_comment' => 'nullable|string|max:1000',
        ]);

        $ticket->rate($validated['rating'], $validated['rating_comment'] ?? null);
        $ticket->load(['user', 'assignedTo']);

        if ($request->expectsJson()) {
            return response()->json($ticket);
        }

        return redirect()->back()
                        ->with('success', __('Thank you for your feedback!'));
    }

    /**
     * API endpoint for rating ticket
     */
    public function apiRate(Request $request, SupportTicket $ticket): JsonResponse
    {
        return $this->rate($request, $ticket);
    }
}
