"use client";

import { useState, useEffect } from "react";
import ChatInput from "./ChatInput";
import { getJournalEntry, upsertJournalEntry } from "@/lib/supabase/api";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emotions = ["기쁨", "평온", "설렘", "감사", "무기력", "불안", "짜증", "슬픔", "피곤", "외로움"];

const maeumResponses: Record<string, string> = {
  힘들: "【⊡ _ ⊡】 힘드셨구나... 어떤 부분이 가장 무거웠어요?",
  피곤: "【⊡ _ ⊡】 몸이 피곤한 건지, 마음이 지친 건지... 어느 쪽이에요?",
  좋: "【⊡ ◡ ⊡】 오, 좋은 거네요! 뭐가 그렇게 좋았어요?",
  짜증: "【⊡ _ ⊡】 짜증이 났구나... 뭐가 건드렸어요?",
  고민: "【⊡ ᴗ ⊡】 고민이 있으시구나. 편하게 얘기해보세요.",
  외롭: "【⊡ _ ⊡】 외롭다는 감정, 솔직하게 꺼내주셔서 고마워요.",
  불안: "【⊡ _ ⊡】 불안감이 있으시군요. 언제부터 느끼셨어요?",
  감사: "【⊡ ◡ ⊡】 감사한 마음, 그런 순간을 알아차리는 것 자체가 좋은 거예요.",
  기분: "【⊡ ᴗ ⊡】 오늘 기분을 한 단어로 표현하면 뭘까요?",
};

function getMaeumReply(text: string): string {
  for (const [keyword, response] of Object.entries(maeumResponses)) {
    if (text.includes(keyword)) return response;
  }
  return "【⊡ ◡ ⊡】 네, 듣고 있어요. 오늘 가장 인상 깊었던 순간이 뭐였어요?";
}

export default function MaeumView({ accentColor }: { accentColor: string }) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  useEffect(() => {
    getJournalEntry(getToday()).then((data) => {
      if (data?.emotion) setSelectedEmotion(data.emotion);
    });
  }, []);

  async function handleEmotionSelect(emotion: string) {
    setSelectedEmotion(emotion);
    await upsertJournalEntry(getToday(), { emotion });
  }

  return (
    <div className="py-4" style={{ overflow: "hidden", width: "100%" }}>
      {/* 오늘의 감정 — 선택 + DB 저장 */}
      <div className="mb-5">
        <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: "#6B7280" }}>
          Today&apos;s Emotion
        </div>

        {selectedEmotion ? (
          <div className="text-center py-2">
            <div className="font-heading" style={{ fontSize: "1.4rem", color: "#000", fontWeight: 500 }}>
              {selectedEmotion}
            </div>
            <button
              onClick={() => setSelectedEmotion(null)}
              style={{ fontSize: "0.7rem", color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginTop: "4px" }}
            >
              변경
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {emotions.map((e) => (
              <button
                key={e}
                onClick={() => handleEmotionSelect(e)}
                style={{
                  fontSize: "0.78rem",
                  color: "#808080",
                  background: "#f8f8f8",
                  border: "1px solid #e6e6e6",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <ChatInput
        characterId="maeum"
        characterName="마음"
        accentColor={accentColor}
        initialGreeting={"【⊡ ◡ ⊡】 오늘 기분은 어떤가요?\n\n위에서 감정을 골라도 되고, 저한테 편하게 얘기해도 돼요."}
        fallbackReply={getMaeumReply}
      />
    </div>
  );
}
