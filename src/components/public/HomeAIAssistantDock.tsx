"use client";

import { useMemo, useState } from "react";

export function HomeAIAssistantDock() {
  const [open, setOpen] = useState(false);
  const assistantUrl = useMemo(() => "https://www1.sztaxs.com/tax-ai/", []);

  return (
    <>
      <div className={`home-ai-dock ${open ? "is-open" : ""}`} aria-live="polite">
        <div className="home-ai-dock-header">
          <div className="home-ai-dock-brand">
            <div className="home-ai-dock-avatar" aria-hidden="true">
              <span>🤖</span>
            </div>
            <div className="home-ai-dock-title">
              <strong>AI 助手</strong>
              <small>TAXS Assistant</small>
            </div>
          </div>
          <button
            type="button"
            className="home-ai-dock-close"
            onClick={() => setOpen(false)}
            aria-label="关闭 AI 助手"
          >
            ⏻
          </button>
        </div>

        <div className="home-ai-dock-body">
          {open ? (
            <iframe
              title="TAXS AI Assistant"
              src={assistantUrl}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="clipboard-read; clipboard-write"
            />
          ) : null}
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          className="home-ai-dock-launcher"
          onClick={() => setOpen(true)}
          aria-label="打开 AI 助手"
        >
          <span aria-hidden="true">💬</span>
        </button>
      ) : null}
    </>
  );
}

