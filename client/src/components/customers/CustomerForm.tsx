import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

export interface CustomerFormData {
  phone: string;
  name: string;
  email: string;
  city: string;
  tags: string;
}

const EMPTY_FORM: CustomerFormData = { phone: '', name: '', email: '', city: '', tags: '' };

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}: CustomerFormProps) {
  const [form, setForm] = React.useState<CustomerFormData>({
    ...EMPTY_FORM,
    ...initialValues,
  });
  const [phoneError, setPhoneError] = React.useState('');

  const handleChange = (field: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'phone') setPhoneError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          placeholder="919876543210"
          value={form.phone}
          onChange={handleChange('phone')}
          disabled={isSubmitting}
        />
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
        <p className="text-xs text-muted-foreground">E.164 format without + (e.g. 919876543210)</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Rahul Sharma"
          value={form.name}
          onChange={handleChange('name')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="rahul@example.com"
          value={form.email}
          onChange={handleChange('email')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Mumbai"
          value={form.city}
          onChange={handleChange('city')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="vip, repeat-buyer, wholesale"
          value={form.tags}
          onChange={handleChange('tags')}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">Comma-separated tags</p>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
