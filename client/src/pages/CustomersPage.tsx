import * as React from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCustomers } from '@/hooks/use-customers';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneDisplay, formatRelativeTime, getInitials } from '@/lib/utils';
import type { Customer } from '@/types';

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

function CustomerAvatar({ name, phone }: { name: string | null; phone: string }) {
  const label = name ?? phone;
  const initials = getInitials(label);
  const colorIndex = phone.charCodeAt(phone.length - 1) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];

  return (
    <div
      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}
    >
      {initials}
    </div>
  );
}

// ── Customer Form ─────────────────────────────────────────────────────────────

interface CustomerFormData {
  phone: string;
  name: string;
  email: string;
  city: string;
  tags: string;
}

const EMPTY_FORM: CustomerFormData = { phone: '', name: '', email: '', city: '', tags: '' };

interface CustomerFormProps {
  initial?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
}

function CustomerForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitLabel, loading }: CustomerFormProps) {
  const [form, setForm] = React.useState<CustomerFormData>(initial);
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
          disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Mumbai"
          value={form.city}
          onChange={handleChange('city')}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="vip, repeat-buyer, wholesale"
          value={form.tags}
          onChange={handleChange('tags')}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Comma-separated tags</p>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function customerToFormData(customer: Customer): CustomerFormData {
  return {
    phone: customer.phone,
    name: customer.name ?? '',
    email: customer.email ?? '',
    city: customer.city ?? '',
    tags: customer.tags.join(', '),
  };
}

function formDataToApiInput(data: CustomerFormData) {
  return {
    phone: data.phone.trim(),
    name: data.name.trim() || undefined,
    email: data.email.trim() || undefined,
    city: data.city.trim() || undefined,
    tags: data.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const {
    customers,
    meta,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    syncFromShopify,
    refetch,
  } = useCustomers();

  const { toast } = useToast();

  // Dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null);

  // Form submission loading
  const [formLoading, setFormLoading] = React.useState(false);

  // Sync loading
  const [syncing, setSyncing] = React.useState(false);

  // Per-row delete confirmation: stores customerId that is pending delete
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // ── Handlers ────────────────────────────────────────────────

  const handleCreate = async (data: CustomerFormData) => {
    setFormLoading(true);
    try {
      await createCustomer(formDataToApiInput(data));
      setAddOpen(false);
      toast({ title: 'Customer added', description: `${data.name || data.phone} was added.` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to add customer',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CustomerFormData) => {
    if (!editCustomer) return;
    setFormLoading(true);
    try {
      const { phone: _phone, ...updateFields } = formDataToApiInput(data);
      await updateCustomer(editCustomer.id, updateFields);
      setEditCustomer(null);
      toast({ title: 'Customer updated' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to update customer',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteCustomer(id);
      setPendingDeleteId(null);
      toast({ title: 'Customer deleted' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete customer',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncFromShopify();
      toast({
        title: 'Sync complete',
        description: `${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setSyncing(false);
    }
  };

  // ── Pagination helpers ───────────────────────────────────────

  const startRow = meta.total === 0 ? 0 : (page - 1) * meta.limit + 1;
  const endRow = Math.min(page * meta.limit, meta.total);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? 'Loading...'
              : `${meta.total.toLocaleString()} customer${meta.total !== 1 ? 's' : ''} total`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search name, phone, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Sync */}
          <Button variant="outline" onClick={() => void handleSync()} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync from Shopify'}
          </Button>

          {/* Add */}
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading customers</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch} className="ml-4 flex-shrink-0">
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-lg border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 min-w-[160px]">Customer</TableHead>
                <TableHead className="min-w-[140px]">Phone</TableHead>
                <TableHead className="min-w-[180px]">Email</TableHead>
                <TableHead className="min-w-[100px]">City</TableHead>
                <TableHead className="min-w-[120px]">Tags</TableHead>
                <TableHead className="min-w-[90px]">Source</TableHead>
                <TableHead className="min-w-[100px]">Added</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableSkeleton />}

              {!loading && customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    {search ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <Search className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">
                          No customers found for &ldquo;{search}&rdquo;
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-base font-medium text-foreground">No customers yet</p>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          Add your first customer manually or sync from your Shopify store.
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" onClick={() => setAddOpen(true)}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add Customer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleSync()}
                            disabled={syncing}
                          >
                            <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sync from Shopify
                          </Button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    {/* Avatar + Name */}
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={customer.name} phone={customer.phone} />
                        <span className="text-sm font-medium text-foreground">
                          {customer.name ?? <span className="text-muted-foreground italic">No name</span>}
                        </span>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <span className="font-mono text-xs text-foreground">
                        {formatPhoneDisplay(customer.phone)}
                      </span>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {customer.email ?? <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>

                    {/* City */}
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {customer.city ?? <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>

                    {/* Tags */}
                    <TableCell>
                      {customer.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      <Badge variant={customer.source === 'SHOPIFY' ? 'default' : 'outline'}>
                        {customer.source === 'SHOPIFY' ? 'Shopify' : 'Manual'}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(customer.createdAt)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      {pendingDeleteId === customer.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs px-2"
                            disabled={deleting}
                            onClick={() => void handleDelete(customer.id)}
                          >
                            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            disabled={deleting}
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditCustomer(customer)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setPendingDeleteId(customer.id)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!error && !loading && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {startRow}–{endRow} of {meta.total.toLocaleString()} customers
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2 text-foreground font-medium">
              {page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Add a new customer contact to your WhatsApp list.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreate}
            onCancel={() => setAddOpen(false)}
            submitLabel="Add Customer"
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => { if (!open) setEditCustomer(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer&apos;s details.
            </DialogDescription>
          </DialogHeader>
          {editCustomer && (
            <CustomerForm
              initial={customerToFormData(editCustomer)}
              onSubmit={handleUpdate}
              onCancel={() => setEditCustomer(null)}
              submitLabel="Save Changes"
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
