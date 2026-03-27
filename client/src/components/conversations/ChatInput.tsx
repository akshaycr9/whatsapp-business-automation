import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TemplateSendDialog } from './TemplateSendDialog';
import type { Message, ApiResponse } from '@/types';

interface Props {
  conversationId: string;
  isWithin24HourWindow: boolean;
  onMessageSent: (message: Message) => void;
}

export function ChatInput({ conversationId, isWithin24HourWindow, onMessageSent }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const response = await api.post<ApiResponse<Message>>(
        `/conversations/${conversationId}/messages`,
        { text: trimmed },
      );
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onMessageSent(response.data.data);
    } catch (err) {
      toast({
        title: 'Failed to send message',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }, [text, sending, conversationId, onMessageSent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t bg-background">
      {isWithin24HourWindow ? (
        /* Inside 24h window: textarea + template button + send button */
        <div className="flex items-end gap-2 p-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-9 w-9"
            title="Send template"
            onClick={() => setTemplateDialogOpen(true)}
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            className="flex-shrink-0 h-9 w-9"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        /* Outside 24h window: template-only button */
        <div className="flex justify-center p-4">
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Send Template
          </Button>
        </div>
      )}

      <TemplateSendDialog
        conversationId={conversationId}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onMessageSent={onMessageSent}
      />
    </div>
  );
}
