import React from 'react';
import { CheckCheck } from 'lucide-react';

interface MessagePreviewBubbleProps {
  message: string;
}

/**
 * WhatsApp-style message preview bubble — green background (#dcf8c6),
 * read ticks, timestamp. Matches the Stitch modal design.
 */
export const MessagePreviewBubble = React.memo(function MessagePreviewBubble({
  message,
}: MessagePreviewBubbleProps): React.ReactElement {
  return (
    <div className="rounded-lg bg-stitch-surface-lowest p-0">
      <div className="bg-[#dcf8c6] p-3 rounded-lg relative shadow-sm w-full">
        <p className="text-[13px] leading-relaxed text-slate-800">{message}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-500">10:45 AM</span>
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>
    </div>
  );
});
