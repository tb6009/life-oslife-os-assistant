import type { ScheduleItem, DayData } from "@/lib/types/briefing";

function BlockLabel({ label }: { label: string }) {
  return (
    <div className="font-heading text-[0.7rem] font-medium uppercase tracking-[0.1em] mb-1" style={{ color: "#6B7280", marginTop: "24px" }}>
      {label}
    </div>
  );
}

export function TodayBlock({ data }: { data: DayData }) {
  return (
    <div className="mb-6">
      <BlockLabel label="Today" />
      <div className="text-[0.84rem] leading-[1.45]">
        <div className="text-black font-medium" style={{ fontSize: "1.26rem" }}>{data.summary}</div>
        {data.note && <div className="text-gray-50">{data.note}</div>}
        {data.items?.map((item, i) => (
          <div
            key={i}
            className={item.done ? "text-gray-30 line-through" : "text-gray-80"}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TomorrowBlock({ data }: { data: DayData }) {
  return (
    <div className="mb-6">
      <BlockLabel label="Tomorrow" />
      <div className="text-[0.84rem] leading-[1.45]">
        <div className="text-gray-80">{data.summary}</div>
        {data.note && <div className="text-gray-50">{data.note}</div>}
        {data.items?.map((item, i) => (
          <div key={i} className="text-gray-50">
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function YesterdayBlock({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="mb-6">
      <BlockLabel label="Yesterday" />
      <div className="text-[0.84rem] leading-[1.45]">
        {items.map((item, i) =>
          item.done ? (
            <div key={i} className="text-gray-30 line-through">
              {item.text}
            </div>
          ) : (
            <div key={i} className="text-black font-medium">
              {item.text}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function RecommendBlock({
  text,
  accentColor,
}: {
  text: string;
  accentColor: string;
}) {
  return (
    <div className="mb-6">
      <BlockLabel label="Recommendation" />
      <div
        className="text-[0.84rem] text-gray-80 leading-[1.65] pl-3.5 border-l-2 transition-colors duration-600"
        style={{ borderColor: accentColor }}
      >
        {text}
      </div>
    </div>
  );
}
