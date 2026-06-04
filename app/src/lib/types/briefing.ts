export interface ScheduleItem {
  text: string;
  done: boolean;
}

export interface DayData {
  summary: string;
  note?: string;
  items?: ScheduleItem[];
}

export interface WeatherData {
  temperature: string;
  condition: string;
  range: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  source: "manual" | "calendar";
}

export interface BriefingData {
  date: string;
  today: DayData;
  tomorrow: DayData;
  yesterday: ScheduleItem[];
  recommendation: string;
  weather: WeatherData;
  todos: TodoItem[];
}

export type Character = "jin" | "momi" | "maeum";

export interface CharacterInfo {
  id: Character;
  name: string;
  role: string;
}

export const characters: CharacterInfo[] = [
  { id: "jin", name: "진", role: "Butler" },
  { id: "momi", name: "모미", role: "Trainer" },
  { id: "maeum", name: "마음", role: "Coach" },
];
