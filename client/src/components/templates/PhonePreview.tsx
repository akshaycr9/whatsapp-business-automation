import React from 'react';
import { ExternalLink, Phone, CornerDownLeft, Copy } from 'lucide-react';

export interface PhoneButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'COPY_CODE';
  text: string;
}

interface PhonePreviewProps {
  header?: string;
  body: string;
  footer?: string;
  buttons?: PhoneButton[];
  bodyContent?: React.ReactNode;
}

function ButtonIcon({ type }: { type: PhoneButton['type'] }) {
  const style = { width: 11, height: 11, flexShrink: 0 } as const;
  if (type === 'URL') return <ExternalLink style={style} />;
  if (type === 'PHONE_NUMBER') return <Phone style={style} />;
  if (type === 'COPY_CODE') return <Copy style={style} />;
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
    <div
      className="w-[280px] mx-auto rounded-[36px] p-[10px] shadow-lg"
      style={{ background: '#0a0a0a' }}
    >
      <div
        className="rounded-[28px] overflow-hidden flex flex-col"
        style={{
          background: '#e3dcd0',
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='%23d7cfc0' opacity='0.55'><circle cx='10' cy='10' r='1.2'/><circle cx='40' cy='20' r='1'/><circle cx='66' cy='8' r='1.5'/><circle cx='22' cy='40' r='1.2'/><circle cx='55' cy='45' r='1'/><circle cx='14' cy='66' r='1.3'/><circle cx='45' cy='70' r='1'/><circle cx='70' cy='60' r='1.2'/></g></svg>\")",
          minHeight: '510px',
        }}
      >
        {/* Status bar */}
        <div
          className="h-[26px] flex items-center justify-between px-4 text-white"
          style={{ background: '#0b5d54', fontSize: 11, fontWeight: 700 }}
        >
          <span>9:41</span>
          <span>● ● ●</span>
        </div>

        {/* Chat header */}
        <div
          className="flex items-center gap-2.5 px-3 pb-2.5 pt-1.5 text-white"
          style={{ background: '#0b5d54' }}
        >
          <span className="text-[18px] leading-none">‹</span>
          <div
            className="w-[30px] h-[30px] rounded-full grid place-items-center font-bold text-[11px] flex-shrink-0"
            style={{
              background: 'repeating-linear-gradient(45deg,#2a1f16,#2a1f16 4px,#3a2d22 4px,#3a2d22 8px)',
              color: '#e7d8c5',
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
            className="max-w-[85%] self-end rounded-[8px] relative"
            style={{
              background: '#dcf8c6',
              fontSize: 12,
              lineHeight: 1.4,
              color: '#111',
              boxShadow: '0 1px 0.5px rgba(0,0,0,0.08)',
              wordBreak: 'break-word',
            }}
          >
            {/* Message content */}
            <div style={{ padding: '6px 8px 5px' }}>
              {header && (
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{header}</div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {bodyContent ?? (body || 'Your template body appears here.')}
              </div>
              {footer && (
                <div style={{ color: '#8a948f', fontSize: 10.5, marginTop: 4 }}>
                  {footer}
                </div>
              )}
              <div
                style={{
                  fontSize: 9.5,
                  color: '#7b8480',
                  textAlign: 'right',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  justifyContent: 'flex-end',
                }}
              >
                <span>9:41 AM</span>
                <span style={{ color: '#53bdeb', fontWeight: 700, letterSpacing: -3 }}>✓✓</span>
              </div>
            </div>

            {/* Buttons */}
            {hasButtons && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                {buttons.map((btn, i) => (
                  <div
                    key={i}
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.08)' : undefined,
                      padding: '7px 8px',
                      textAlign: 'center',
                      color: '#0a7cff',
                      fontWeight: 600,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
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
          <div
            className="flex-1 rounded-[22px] py-[7px] px-3"
            style={{ background: '#fff', fontSize: 11, color: '#8a948f' }}
          >
            Type a message
          </div>
          <div
            className="w-[34px] h-[34px] rounded-full grid place-items-center flex-shrink-0"
            style={{ background: '#128c7e' }}
          >
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
