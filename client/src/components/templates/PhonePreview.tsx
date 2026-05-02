import React from 'react';
import { ExternalLink, Phone, CornerDownLeft, Copy } from 'lucide-react';
import { TemplateButtonType } from '@/types';

export interface PhoneButton {
  type: TemplateButtonType;
  text: string;
}

interface PhonePreviewProps {
  header?: string;
  body: string;
  footer?: string;
  buttons?: PhoneButton[];
  bodyContent?: React.ReactNode;
}

function ButtonIcon({ type }: { type: TemplateButtonType }) {
  const style = { width: 11, height: 11, flexShrink: 0 } as const;
  if (type === TemplateButtonType.URL) return <ExternalLink style={style} />;
  if (type === TemplateButtonType.PHONE_NUMBER) return <Phone style={style} />;
  if (type === TemplateButtonType.COPY_CODE) return <Copy style={style} />;
  return <CornerDownLeft style={style} />;
}

export const PhonePreview = React.memo(function PhonePreview({
  header,
  body,
  footer,
  buttons,
  bodyContent,
}: PhonePreviewProps) {
  const hasButtons = buttons && buttons.length > 0;

  return (
    <div className="w-[280px] mx-auto rounded-[36px] p-[10px] shadow-lg bg-whatsapp-bezel">
      <div
        className="rounded-[28px] overflow-hidden flex flex-col bg-whatsapp-chat-bg"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='%23d7cfc0' opacity='0.55'><circle cx='10' cy='10' r='1.2'/><circle cx='40' cy='20' r='1'/><circle cx='66' cy='8' r='1.5'/><circle cx='22' cy='40' r='1.2'/><circle cx='55' cy='45' r='1'/><circle cx='14' cy='66' r='1.3'/><circle cx='45' cy='70' r='1'/><circle cx='70' cy='60' r='1.2'/></g></svg>\")",
          minHeight: '510px',
        }}
      >
        {/* Status bar */}
        <div className="h-[26px] flex items-center justify-between px-4 text-white bg-brand-800 text-[11px] font-bold">
          <span>9:41</span>
          <span>● ● ●</span>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-1.5 text-white bg-brand-800">
          <span className="text-[18px] leading-none">‹</span>
          <div
            className="w-[30px] h-[30px] rounded-full grid place-items-center font-bold text-[11px] flex-shrink-0 text-whatsapp-avatar-text"
            style={{
              background: 'repeating-linear-gradient(45deg,#2a1f16,#2a1f16 4px,#3a2d22 4px,#3a2d22 8px)',
            }}
          >
            Q
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">Qwertees</div>
            <div className="text-[10.5px] opacity-75">Business · online</div>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 px-2.5 py-3.5 flex flex-col gap-1.5 overflow-y-auto">
          <div
            className="max-w-[85%] self-end rounded-[8px] relative bg-whatsapp-bubble text-sm leading-[1.4] text-black shadow-sm"
            style={{
              wordBreak: 'break-word',
            }}
          >
            {/* Message content */}
            <div className="px-2 py-[6px] pb-[5px]">
              {header && (
                <div className="font-bold mb-0.75">{header}</div>
              )}
              <div className="whitespace-pre-wrap">
                {bodyContent ?? (body || 'Your template body appears here.')}
              </div>
              {footer && (
                <div className="text-ink-400 text-[10.5px] mt-1">
                  {footer}
                </div>
              )}
              <div className="text-[9.5px] text-whatsapp-timestamp text-right mt-0.5 flex items-center gap-0.75 justify-end">
                <span>9:41 AM</span>
                <span className="text-whatsapp-read-tick font-bold" style={{ letterSpacing: -3 }}>✓✓</span>
              </div>
            </div>

            {/* Buttons */}
            {hasButtons && (
              <div className="border-t border-black/10">
                {buttons.map((btn, i) => (
                  <div
                    key={i}
                    className={`py-[7px] px-2 text-center text-blue-600 font-semibold text-sm flex items-center justify-center gap-1.25 ${
                      i > 0 ? 'border-t border-black/10' : ''
                    }`}
                  >
                    <ButtonIcon type={btn.type} />
                    {btn.text || '—'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-1.5 p-1.5">
          <div className="flex-1 rounded-[22px] py-[7px] px-3 bg-white text-[11px] text-ink-400">
            Type a message
          </div>
          <div className="w-[34px] h-[34px] rounded-full grid place-items-center flex-shrink-0 bg-brand-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});
