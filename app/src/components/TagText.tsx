import { tokenize, getTagColor } from "@/lib/tags";

export default function TagText({ text }: { text: string }) {
  return (
    <>
      {tokenize(text).map((tok, i) => {
        if (tok.kind === "text") return <span key={i}>{tok.value}</span>;
        const c = getTagColor(tok.value);
        return (
          <span key={i} style={{
            display: "inline-block", fontSize: "0.7rem", fontWeight: 500,
            padding: "1px 7px", borderRadius: "10px",
            background: c.bg, color: c.text,
            margin: "0 1px", verticalAlign: "1px",
          }}>#{tok.value}</span>
        );
      })}
    </>
  );
}
