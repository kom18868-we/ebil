import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ArrowLeft, Send, CheckCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi, Ticket, TicketReply } from '@/lib/api/tickets';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await ticketsApi.getById(Number(id));
      if (response.data) {
        setTicket(response.data);
        setReplies(response.data.replies || []);
      } else {
        toast.error('Ticket not found');
        navigate('/tickets');
      }
    } catch (error: any) {
      console.error('Error loading ticket:', error);
      toast.error(error?.message || 'Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = user?.roles?.some((r: any) => ['admin', 'support_agent'].includes(r.name)) || false;

  const handleSendReply = async () => {
    if (!reply.trim() || !id) return;
    
    try {
      setSending(true);
      const response = await ticketsApi.reply(Number(id), { message: reply });
      if (response.data) {
        toast.success(isStaff ? 'Response sent successfully!' : 'Reply sent successfully!');
        setReply('');
        loadTicket(); // Reload to get updated ticket and replies
      } else {
        toast.error(response.message || 'Failed to send reply');
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      // Extract validation errors
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(errorMessage || 'Validation failed');
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send reply';
        toast.error(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!id) return;

    try {
      setResolving(true);
      const response = await ticketsApi.resolve(Number(id));
      if (response.data) {
        toast.success('Ticket marked as resolved!');
        setTicket(response.data);
        loadTicket();
      } else {
        toast.error(response.message || 'Failed to resolve ticket');
      }
    } catch (error: any) {
      console.error('Error resolving ticket:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to resolve ticket';
      toast.error(errorMessage);
    } finally {
      setResolving(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!id) return;

    // Confirm before closing
    if (!confirm('Are you sure you want to close this ticket? This action cannot be undone, but you can reopen it if needed.')) {
      return;
    }

    try {
      setClosing(true);
      const response = await ticketsApi.close(Number(id));
      if (response.data) {
        toast.success('Ticket closed successfully!');
        setTicket(response.data); // Update ticket status
        loadTicket(); // Reload to get updated status
      } else {
        toast.error(response.message || 'Failed to close ticket');
      }
    } catch (error: any) {
      console.error('Error closing ticket:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      // Extract validation errors
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(errorMessage || 'Validation failed');
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to close ticket';
        toast.error(errorMessage);
      }
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Ticket not found</h2>
        <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tickets')}>Go back to tickets</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm text-muted-foreground">{ticket.ticket_number}</span>
              <StatusBadge status={ticket.status} />
              <StatusBadge status={ticket.priority} />
            </div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          </div>
        </div>
        {ticket.status !== 'closed' && (
          <div className="flex gap-2">
            {isStaff && ticket.status !== 'resolved' && (
              <Button 
                variant="outline" 
                onClick={handleResolveTicket} 
                disabled={resolving}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {resolving ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleCloseTicket} 
              disabled={closing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {closing ? 'Closing...' : 'Close Ticket'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {ticket.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{ticket.user?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies.map((replyItem) => {
            const replyIsStaff = replyItem.user?.roles?.some((r: any) => ['admin', 'support_agent'].includes(r.name)) || false;
            return (
              <div 
                key={replyItem.id}
                className={`rounded-xl border p-6 ${
                  replyIsStaff 
                    ? 'border-primary/30 bg-primary-light' 
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={replyIsStaff ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {replyItem.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{replyItem.user?.name || 'User'}</span>
                      {replyIsStaff && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Support
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(replyItem.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{replyItem.message}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">
                {isStaff ? 'Add Response' : 'Add Reply'}
              </h3>
              {isStaff && (
                <p className="text-sm text-muted-foreground mb-4">
                  Your response will be visible to the customer and will update the ticket status.
                </p>
              )}
              <Textarea
                placeholder={isStaff ? "Type your response to the customer..." : "Type your message here..."}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <div className="flex justify-end">
                <Button onClick={handleSendReply} disabled={!reply.trim() || sending}>
                  {sending ? 'Sending...' : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {isStaff ? 'Send Response' : 'Send Reply'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Ticket Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={ticket.status} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <StatusBadge status={ticket.priority} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{ticket.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update</span>
                <span>{format(new Date(ticket.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Assigned Agent */}
          {ticket.assignedTo && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Assigned To</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {ticket.assignedTo?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket.assignedTo?.name || 'Unassigned'}</p>
                  <p className="text-sm text-muted-foreground">Support Agent</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-success-light flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="w-px h-full bg-border" />
                </div>
                <div>
                  <p className="font-medium text-sm">Ticket Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              {ticket.status !== 'open' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-info-light flex items-center justify-center">
                      <User className="h-4 w-4 text-info" />
                    </div>
                    <div className="w-px h-full bg-border" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Assigned to Agent</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.updated_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )}
              {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-success-light flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Resolved</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.closed_at || ticket.updated_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-warning-light flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Awaiting Response</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
