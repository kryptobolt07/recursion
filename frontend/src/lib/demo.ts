import { channelStats } from "@/data/mockData";

const parseBooleanEnv = (value: string | undefined) => value?.toLowerCase() === "true";

export const isDemoMode = parseBooleanEnv(import.meta.env.VITE_DEMO_MODE);
export const creatorDataSourceLabel = isDemoMode ? "Mock creator channel" : "Live creator channel";
export const demoCreatorChannelId = "demo-techforge";

export const demoUser = {
  id: "demo-techforge",
  title: channelStats.name,
  thumbnail: "",
  subscriberCount: String(channelStats.subscribers),
};
