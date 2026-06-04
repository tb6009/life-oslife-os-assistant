import { greetings, briefingBy } from "@/lib/theme/timeColor";
import type { TimeOfDay } from "@/lib/theme/timeColor";

interface GreetingProps {
  timeOfDay: TimeOfDay;
  date: string;
}

export default function Greeting({ timeOfDay, date }: GreetingProps) {
  return (
    <div className="py-6 pb-7">
      <div className="font-heading text-[0.7rem] font-medium text-gray-30 uppercase tracking-[0.12em]">
        {date}
      </div>
      <div className="font-heading text-[1.7rem] font-bold text-black tracking-[-0.03em] leading-[1.2] mt-0.5">
        {greetings[timeOfDay]}
      </div>
      <div className="text-[0.78rem] text-gray-50 mt-1">
        {briefingBy[timeOfDay]}
      </div>
    </div>
  );
}
