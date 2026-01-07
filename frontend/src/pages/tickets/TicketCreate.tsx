import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { ticketsApi } from '@/lib/api/tickets';

export default function TicketCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    
    if (!formData.subject.trim() || !formData.description.trim() || !formData.category) {
      const newErrors: Record<string, string> = {};
      if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.category) newErrors.category = 'Category is required';
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const ticketData = {
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        category: formData.category as 'billing' | 'technical' | 'general' | 'complaint' | 'suggestion',
      };
      
      // Log the data being sent for debugging
      console.log('Submitting ticket data:', ticketData);
      
      const response = await ticketsApi.create(ticketData);
      
      if (response.data) {
        toast.success('Support ticket created successfully! We\'ll get back to you soon.');
        navigate(`/tickets/${response.data.id}`);
      } else {
        toast.error(response.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      // Extract validation errors and display them
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const fieldErrors: Record<string, string> = {};
        
        // Map Laravel validation errors to field names
        Object.keys(validationErrors).forEach((field) => {
          const fieldMessages = validationErrors[field];
          if (Array.isArray(fieldMessages) && fieldMessages.length > 0) {
            fieldErrors[field] = fieldMessages[0];
          } else if (typeof fieldMessages === 'string') {
            fieldErrors[field] = fieldMessages;
          }
        });
        
        setErrors(fieldErrors);
        
        // Show a summary toast with all errors
        const errorCount = Object.keys(validationErrors).length;
        const errorMessages = Object.values(validationErrors).flat();
        
        // Create a more detailed error message
        if (errorCount > 1) {
          const allErrorTexts = errorMessages.slice(0, 3).join(', ');
          const remainingCount = errorCount - 3;
          if (remainingCount > 0) {
            toast.error(`${allErrorTexts} (and ${remainingCount} more error${remainingCount > 1 ? 's' : ''})`);
          } else {
            toast.error(`${allErrorTexts} (and ${errorCount - 3} more error${errorCount - 3 > 1 ? 's' : ''})`);
          }
        } else {
          toast.error(errorMessages[0] || 'Validation failed');
        }
        
        // Also log all errors for debugging
        console.error('All validation errors:', validationErrors);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create ticket. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">Tell us how we can help you</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief summary of your issue"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              className={errors.subject ? 'border-destructive' : ''}
              required
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category || undefined} 
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value });
                  if (errors.category) setErrors({ ...errors, category: '' });
                }}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing & Payments</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => {
                  setFormData({ ...formData, priority: value });
                  if (errors.priority) setErrors({ ...errors, priority: '' });
                }}
              >
                <SelectTrigger className={errors.priority ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General question</SelectItem>
                  <SelectItem value="medium">Medium - Need help soon</SelectItem>
                  <SelectItem value="high">High - Affecting my work</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe your issue in detail. Include any error messages or steps to reproduce the problem."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className={errors.description ? 'border-destructive' : ''}
              rows={6}
              required
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, PDF up to 10MB each
                </p>
              </label>
            </div>
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button 
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}
