/**
 * Blog topics: a handful of reader-facing groups built from post tags. The blog
 * index shows these as tabs instead of a raw tag list, and each card and
 * article shows one topic pill.
 */

import type { BlogPost } from "@/types/blog";

export interface BlogTopic {
  /** Value of the `?tag=` search param that selects this topic */
  id: string;
  label: string;
  /** Tags that make a post about this topic (and can pick its pill) */
  tags: string[];
  /** Tags that only include a post when filtering, like product names */
  related?: string[];
}

/** Listed in tab order. */
export const BLOG_TOPICS: BlogTopic[] = [
  {
    id: "ai",
    label: "AI & MCP",
    tags: ["ai", "mcp", "claude", "chatgpt", "ai-scheduling", "api"],
  },
  {
    id: "open-source",
    label: "Open source & self-hosting",
    tags: ["open-source", "self-hosted", "docker", "privacy", "developers"],
  },
  {
    id: "alternatives",
    label: "Alternatives & comparisons",
    tags: ["comparison", "alternatives", "migration", "review"],
    related: ["sunsama", "motion", "akiflow", "reclaim", "todoist", "notion"],
  },
  {
    id: "time-blocking",
    label: "Time blocking",
    tags: [
      "time-blocking",
      "calendar",
      "scheduling",
      "maker-schedule",
      "google-calendar",
    ],
  },
  {
    id: "focus",
    label: "Focus & habits",
    tags: [
      "focus",
      "deep-work",
      "deep-focus",
      "habits",
      "procrastination",
      "burnout",
      "wellness",
      "psychology",
      "concentration",
      "pomodoro",
      "single-tasking",
      "motivation",
      "work-life-balance",
      "mental-health",
      "overwhelm",
    ],
  },
  {
    id: "daily-planning",
    label: "Daily planning",
    tags: [
      "daily-planning",
      "planning",
      "daily-planner",
      "task-management",
      "time-management",
      "routine",
      "morning-routine",
      "evening-routine",
      "weekly-review",
      "goals",
      "goal-setting",
      "prioritization",
      "to-do-lists",
      "to-do-list",
      "methods",
      "gtd",
    ],
  },
];

const lower = (tags: string[]) => tags.map((t) => t.toLowerCase());

export function findTopic(id: string | undefined): BlogTopic | undefined {
  if (!id) return undefined;
  return BLOG_TOPICS.find((topic) => topic.id === id.toLowerCase());
}

export function postInTopic(post: BlogPost, topic: BlogTopic): boolean {
  const tags = lower(post.tags);
  return [...topic.tags, ...(topic.related ?? [])].some((t) =>
    tags.includes(t)
  );
}

/**
 * The one topic shown on a post's card and article header: the topic of the
 * earliest tag in the post's own list, since authors put the main tag first.
 */
export function primaryTopic(post: BlogPost): BlogTopic | undefined {
  for (const tag of lower(post.tags)) {
    const topic = BLOG_TOPICS.find((t) => t.tags.includes(tag));
    if (topic) return topic;
  }
  return BLOG_TOPICS.find((topic) => postInTopic(post, topic));
}

/**
 * Posts matching a `?tag=` value: a topic id selects the whole topic, any
 * other value filters by that exact tag (old links keep working).
 */
export function filterByTagParam(
  posts: BlogPost[],
  tag: string | undefined
): BlogPost[] {
  if (!tag) return posts;
  const topic = findTopic(tag);
  if (topic) return posts.filter((post) => postInTopic(post, topic));
  const wanted = tag.toLowerCase();
  return posts.filter((post) => lower(post.tags).includes(wanted));
}
