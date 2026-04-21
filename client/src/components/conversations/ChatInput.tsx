import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2, LayoutTemplate, Smile, Paperclip } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TemplateSendDialog } from './TemplateSendDialog';
import type { Message, ApiResponse } from '@/types';

interface Props {
  conversationId: string;
  isWithin24HourWindow: boolean;
  onMessageSent: (message: Message) => void;
}


export const ChatInput = React.memo(function ChatInput({
  conversationId,
  isWithin24HourWindow,
  onMessageSent,
}: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mediaTypeOpen, setMediaTypeOpen] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<
    'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | null
  >(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEmojiSelect = useCallback(
    (emoji: { native: string }) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        text.substring(0, start) + emoji.native + text.substring(end);

      setText(newText);
      setEmojiPickerOpen(false);

      setTimeout(() => {
        const newCursorPos = start + emoji.native.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }, 0);
    },
    [text],
  );

  const getMediaTypeAccept = (type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT') => {
    switch (type) {
      case 'IMAGE':
        return 'image/jpeg,image/png';
      case 'VIDEO':
        return 'video/mp4';
      case 'AUDIO':
        return 'audio/aac,audio/mp3,audio/mpeg,audio/ogg';
      case 'DOCUMENT':
        return 'application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return '';
    }
  };

  const handleMediaTypeSelect = useCallback(
    (type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT') => {
      setSelectedMediaType(type);
      if (mediaFileInputRef.current) {
        mediaFileInputRef.current.accept = getMediaTypeAccept(type);
        mediaFileInputRef.current.click();
      }
    },
    [],
  );

  const handleMediaFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedMediaType) return;

      // Validate file type
      const validMimeTypes: Record<string, string[]> = {
        IMAGE: ['image/jpeg', 'image/png'],
        VIDEO: ['video/mp4'],
        AUDIO: ['audio/aac', 'audio/mpeg', 'audio/ogg'],
        DOCUMENT: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      };

      if (!validMimeTypes[selectedMediaType]?.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `Please select a valid ${selectedMediaType.toLowerCase()} file`,
          variant: 'destructive',
        });
        return;
      }

      setUploadingMedia(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', selectedMediaType);

        const response = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const mediaId = response.data.data.mediaId;

        const messageResponse = await api.post<ApiResponse<Message>>(
          `/conversations/${conversationId}/messages`,
          {
            type: selectedMediaType,
            mediaId,
            caption: file.name,
          },
        );

        onMessageSent(messageResponse.data.data);
        setMediaTypeOpen(false);
        setSelectedMediaType(null);

        if (mediaFileInputRef.current) {
          mediaFileInputRef.current.value = '';
        }
      } catch (err) {
        toast({
          title: 'Failed to upload media',
          description: err instanceof Error ? err.message : 'Something went wrong',
          variant: 'destructive',
        });
      } finally {
        setUploadingMedia(false);
      }
    },
    [selectedMediaType, conversationId, onMessageSent],
  );


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
          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            {/* Emoji button */}
            <IconBtn
              title="Emoji"
              onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
            >
              <Smile style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
            </IconBtn>

            {/* Emoji picker */}
            {emojiPickerOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10,
                  }}
                  onClick={() => setEmojiPickerOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    zIndex: 20,
                    marginBottom: 8,
                  }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                  />
                </div>
              </>
            )}

            {/* Attachment button */}
            <IconBtn
              title="Send media"
              onClick={() => setMediaTypeOpen(!mediaTypeOpen)}
              disabled={uploadingMedia}
            >
              <Paperclip style={{ width: 17, height: 17, strokeWidth: 1.75 }} />
            </IconBtn>

            {/* Media type selection */}
            {mediaTypeOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10,
                  }}
                  onClick={() => setMediaTypeOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    zIndex: 20,
                    marginBottom: 8,
                    background: 'var(--cf-surface)',
                    border: '1px solid var(--cf-border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: 140,
                  }}
                >
                  {(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'] as const).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMediaTypeSelect(type)}
                        disabled={uploadingMedia}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--ink-900)',
                          background: 'none',
                          border: 'none',
                          cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                          opacity: uploadingMedia ? 0.5 : 1,
                          transition: 'background 0.12s',
                          borderBottom:
                            type !== 'DOCUMENT'
                              ? '1px solid var(--cf-border)'
                              : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!uploadingMedia) {
                            e.currentTarget.style.background =
                              'var(--cf-surface-sunken)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}

            {/* Hidden file input */}
            <input
              ref={mediaFileInputRef}
              type="file"
              onChange={handleMediaFileSelect}
              style={{ display: 'none' }}
            />

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
  disabled,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        color: disabled ? 'var(--ink-400)' : 'var(--ink-700)',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--cf-surface-sunken)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}
