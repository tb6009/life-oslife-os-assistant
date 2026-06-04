"use client";

import { useState, useEffect } from "react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("openai_api_key") ?? "";
    setApiKey(key);
  }, [open]);

  function handleSave() {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim());
    } else {
      localStorage.removeItem("openai_api_key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "28px 28px 40px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#000" }}>
            Settings
          </div>
          <button
            onClick={onClose}
            style={{ fontSize: "1.2rem", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: "20px" }}>
          <div className="font-heading" style={{ fontSize: "0.7rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
            ChatGPT API Key
          </div>
          <div style={{ fontSize: "0.75rem", color: "#808080", marginBottom: "12px", lineHeight: 1.5 }}>
            모미/마음 AI 대화에 사용됩니다. 키가 없으면 기본 응답이 표시됩니다.
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: "100%",
              fontSize: "0.85rem",
              color: "#333",
              background: "#f8f8f8",
              border: "1px solid #e6e6e6",
              borderRadius: "8px",
              padding: "10px 14px",
              outline: "none",
              fontFamily: "monospace",
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#fff",
            background: saved ? "#059669" : "#000",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {saved ? "저장 완료" : "저장"}
        </button>

        <div style={{ fontSize: "0.7rem", color: "#6B7280", marginTop: "12px", textAlign: "center" }}>
          키는 이 기기에만 저장됩니다 (서버 전송 안 됨)
        </div>
      </div>
    </div>
  );
}
