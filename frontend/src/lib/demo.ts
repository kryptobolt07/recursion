import { channelStats } from "@/data/mockData";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";
export const demoCreatorChannelId = "demo-techforge";

export const demoUser = {
  id: "demo-techforge",
  title: channelStats.name,
  thumbnail: "",
  subscriberCount: String(channelStats.subscribers),
};
