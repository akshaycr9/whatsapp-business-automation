import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2, LayoutTemplate, Smile, Paperclip } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TemplateSendDialog } from './TemplateSendDialog';
import type { Message, ApiResponse } from '@/types';

interface Props {
  conversationId: string;
  isWithin24HourWindow: boolean;
  onMessageSent: (message: Message) => void;
}

const QUICK_REPLIES = [
  'Ships today 📦',
  'Thanks for your order!',
  'Tracking link inbound',
  'Yes, in stock',
  'Sorry, out of stock',
  'Send order details',
];

export const ChatInput = React.memo(function ChatInput({
  conversationId,
  isWithin24HourWindow,
  onMessageSent,
}: Props) {
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

  const handleQuickReply = (reply: string) => {
    setText(reply);
    textareaRef.current?.focus();
  };

  return (
    <div
      style={{
        background: 'var(--cf-surface)',
        borderTop: '1px solid var(--cf-border)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {isWithin24HourWindow ? (
        <>
          {/* Quick replies row */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleQuickReply(reply)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid var(--cf-border)',
                  borderRadius: 99,
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: 'var(--ink-700)',
                  background: 'var(--cf-surface-2)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--brand-500)';
                  el.style.color = 'var(--brand-800)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--cf-border)';
                  el.style.color = 'var(--ink-700)';
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Emoji button (no-op) */}
            <IconBtn title="Emoji (coming soon)">
              <Smile style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
            </IconBtn>

            {/* Attachment button (no-op) */}
            <IconBtn title="Attachment (coming soon)">
              <Paperclip style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
            </IconBtn>

            {/* Template button */}
            <IconBtn title="Send template" onClick={() => setTemplateDialogOpen(true)}>
              <LayoutTemplate style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
            </IconBtn>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Type a message… (use /t to insert a template)"
              rows={1}
              style={{
                flex: 1,
                background: 'var(--cf-surface-2)',
                border: '1px solid var(--cf-border)',
                borderRadius: 22,
                padding: '8px 14px',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                minHeight: 36,
                maxHeight: 120,
                overflow: 'hidden',
                lineHeight: 1.45,
                color: 'var(--ink-900)',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-500)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--cf-border)';
              }}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!text.trim() || sending}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: !text.trim() || sending ? 'var(--cf-border)' : 'var(--brand-700)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                cursor: !text.trim() || sending ? 'default' : 'pointer',
                flexShrink: 0,
                transition: 'background 0.12s',
              }}
            >
              {sending ? (
                <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
              ) : (
                <Send style={{ width: 15, height: 15 }} />
              )}
            </button>
          </div>
        </>
      ) : (
        /* Outside 24h window: template-only */
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <button
            type="button"
            onClick={() => setTemplateDialogOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid var(--cf-border)',
              background: 'var(--cf-surface)',
              color: 'var(--ink-900)',
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--cf-surface-sunken)';
              e.currentTarget.style.borderColor = 'var(--cf-border-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--cf-surface)';
              e.currentTarget.style.borderColor = 'var(--cf-border)';
            }}
          >
            <LayoutTemplate style={{ width: 14, height: 14, strokeWidth: 2 }} />
            Send Template
          </button>
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
});

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        color: 'var(--ink-700)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--cf-surface-sunken)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}
