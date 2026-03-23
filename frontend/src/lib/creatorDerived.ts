import { niches } from "@/data/mockData";

const CREATOR_NICHE_ALIASES: Record<string, string[]> = {
  linux: ["linux", "linux os", "linux & os", "operating systems", "windows", "nixos", "arch"],
  hardware: ["hardware", "hardware reviews", "mini pc", "laptop", "desktop", "monitor", "keyboard"],
  devtools: ["dev tools", "developer tools", "dev tools workflow", "dev tools & workflow", "workflow", "coding"],
  privacy: ["privacy", "privacy security", "privacy & security", "security", "degoogle", "grapheneos"],
  ai: ["ai", "ai machine learning", "ai & machine learning", "llm", "gpt", "agent", "model"],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenize = (value: string) => normalize(value).split(/\s+/).filter(Boolean);

const scoreTokens = (source: string, target: string) => {
  const sourceTokens = new Set(tokenize(source));
  const targetTokens = new Set(tokenize(target));
  let score = 0;
  sourceTokens.forEach((token) => {
    if (targetTokens.has(token)) score += 1;
  });
  return score;
};

export const findCreatorNiche = ({
  nicheId,
  nicheName,
  title,
}: {
  nicheId?: string;
  nicheName?: string;
  title?: string;
}) => {
  if (nicheId) {
    const exactId = niches.find((niche) => niche.id === nicheId);
    if (exactId) return exactId;
  }

  const candidates = [nicheId || "", nicheName || "", title || ""]
    .map(normalize)
    .filter(Boolean);

  for (const niche of niches) {
    const normalizedName = normalize(niche.name);
    if (candidates.some((candidate) => candidate === normalizedName || candidate.includes(normalizedName))) {
      return niche;
    }
  }

  for (const niche of niches) {
    const aliases = CREATOR_NICHE_ALIASES[niche.id] || [];
    if (candidates.some((candidate) => aliases.some((alias) => candidate.includes(normalize(alias))))) {
      return niche;
    }
  }

  let bestMatch = niches[0];
  let bestScore = -1;
  for (const niche of niches) {
    const aliases = [niche.name, ...(CREATOR_NICHE_ALIASES[niche.id] || [])];
    const score = Math.max(
      ...aliases.flatMap((alias) =>
        candidates.map((candidate) => scoreTokens(alias, candidate)),
      ),
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = niche;
    }
  }

  return bestMatch;
};

export const findCreatorVideoMatch = ({
  nicheId,
  nicheName,
  title,
}: {
  nicheId?: string;
  nicheName?: string;
  title: string;
}) => {
  const niche = findCreatorNiche({ nicheId, nicheName, title });
  const ranked = [...niche.topVideos]
    .map((video) => ({
      video,
      score: scoreTokens(video.title, title) + scoreTokens(title, niche.name),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.video.views - left.video.views;
    });

  return ranked[0]?.video || niche.topVideos[0] || null;
};
