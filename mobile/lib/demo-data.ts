import type { Session } from "@supabase/supabase-js";
import type {
  DirectMessage,
  FriendRequest,
  FriendRequestStatus,
  GameSession,
  NewsItem,
  PlayerRating,
  Profile,
  SessionMessage,
  SessionRequest,
  SessionRequestStatus,
} from "./supabase";

function hoursFromNow(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

function daysFromNow(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString();
}

export const DEMO_USER_ID = "demo-me";
export const DEMO_REVEALED_CODE = "SW-0000-1111-2222";

export const DEMO_SESSION = {
  user: { id: DEMO_USER_ID, email: "demo@matesync.fr" },
} as unknown as Session;

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  console: "both",
  frequency: "weekly",
  favorite_games: [
    "Mario Kart World",
    "Splatoon 3",
    "Overcooked! 2",
    "Animal Crossing: New Horizons",
    "Rocket League",
  ],
  pseudo: "SamK",
  avatar_url: null,
  switch_friend_code: "SW-1234-5678-9012",
};

interface DemoPlayer {
  id: string;
  pseudo: string;
  avatar_url: string | null;
  console: string;
  frequency: string;
  favorite_games: string[];
}

const DEMO_PLAYERS: DemoPlayer[] = [
  {
    id: "demo-p1",
    pseudo: "LucasP",
    avatar_url: null,
    console: "switch2",
    frequency: "daily",
    favorite_games: ["Mario Kart World", "Super Smash Bros. Ultimate", "Splatoon 3"],
  },
  {
    id: "demo-p2",
    pseudo: "NoemieK",
    avatar_url: null,
    console: "both",
    frequency: "weekly",
    favorite_games: ["Splatoon 3", "Overcooked! 2", "Animal Crossing: New Horizons"],
  },
  {
    id: "demo-p3",
    pseudo: "MaxR",
    avatar_url: null,
    console: "switch1",
    frequency: "occasionally",
    favorite_games: ["Rocket League", "Mario Kart 8 Deluxe"],
  },
  {
    id: "demo-p4",
    pseudo: "SofiaGG",
    avatar_url: null,
    console: "switch2",
    frequency: "daily",
    favorite_games: ["Animal Crossing: New Horizons", "Stardew Valley"],
  },
  {
    id: "demo-p5",
    pseudo: "TomK",
    avatar_url: null,
    console: "both",
    frequency: "weekly",
    favorite_games: ["Overcooked! 2", "It Takes Two", "Mario Kart World"],
  },
];

export const DEMO_PUBLIC_PROFILES: Record<
  string,
  {
    pseudo: string;
    avatar_url: string | null;
    console: string;
    frequency: string;
    favorite_games: string[];
  }
> = Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, p]));

export const DEMO_GAME_COUNTS: Record<string, Record<string, number>> = {
  [DEMO_USER_ID]: { "Overcooked! 2": 3, "Mario Kart World": 5, "Splatoon 3": 2 },
  "demo-p1": { "Mario Kart World": 8, "Splatoon 3": 4 },
  "demo-p2": { "Splatoon 3": 6, "Overcooked! 2": 3 },
  "demo-p3": { "Rocket League": 5 },
  "demo-p4": { "Animal Crossing: New Horizons": 4 },
  "demo-p5": { "Overcooked! 2": 2, "It Takes Two": 3 },
};

const p = (id: string) => DEMO_PUBLIC_PROFILES[id];

const INITIAL_SESSIONS: GameSession[] = [
  {
    id: "demo-session-1",
    creator_id: "demo-p1",
    creator_pseudo: p("demo-p1").pseudo,
    creator_avatar_url: null,
    game: "Mario Kart World",
    description: "Coupe 200cc entre potes, ambiance détendue.",
    scheduled_at: hoursFromNow(3),
    slots_total: 4,
    created_at: hoursFromNow(-5),
    expires_at: daysFromNow(3),
  },
  {
    id: "demo-session-2",
    creator_id: "demo-p2",
    creator_pseudo: p("demo-p2").pseudo,
    creator_avatar_url: null,
    game: "Splatoon 3",
    description: "Salmon Run direct en arrivant, débutants bienvenus.",
    scheduled_at: daysFromNow(1),
    slots_total: 4,
    created_at: hoursFromNow(-8),
    expires_at: daysFromNow(3),
  },
  {
    id: "demo-session-3",
    creator_id: "demo-p4",
    creator_pseudo: p("demo-p4").pseudo,
    creator_avatar_url: null,
    game: "Animal Crossing: New Horizons",
    description: "Visite d'îles et échange de navets.",
    scheduled_at: null,
    slots_total: 4,
    created_at: hoursFromNow(-1),
    expires_at: daysFromNow(2),
  },
  {
    id: "demo-session-4",
    creator_id: "demo-p3",
    creator_pseudo: p("demo-p3").pseudo,
    creator_avatar_url: null,
    game: "Rocket League",
    description: "3v3 ranked, niveau intermédiaire.",
    scheduled_at: hoursFromNow(1),
    slots_total: 3,
    created_at: hoursFromNow(-2),
    expires_at: daysFromNow(2),
  },
  {
    id: "demo-session-5",
    creator_id: DEMO_USER_ID,
    creator_pseudo: DEMO_PROFILE.pseudo ?? "",
    creator_avatar_url: null,
    game: "Overcooked! 2",
    description: "Speedrun des niveaux difficiles, viens stresser avec moi en cuisine.",
    scheduled_at: hoursFromNow(4),
    slots_total: 4,
    created_at: hoursFromNow(-6),
    expires_at: daysFromNow(3),
  },
];

const INITIAL_SESSION_REQUESTS: SessionRequest[] = [
  {
    id: "demo-req-1",
    session_id: "demo-session-5",
    requester_id: "demo-p5",
    requester_pseudo: p("demo-p5").pseudo,
    requester_avatar_url: null,
    status: "pending",
    created_at: hoursFromNow(-1),
    decided_at: null,
  },
  {
    id: "demo-req-2",
    session_id: "demo-session-5",
    requester_id: "demo-p2",
    requester_pseudo: p("demo-p2").pseudo,
    requester_avatar_url: null,
    status: "accepted",
    created_at: hoursFromNow(-5),
    decided_at: hoursFromNow(-4),
  },
  {
    id: "demo-req-3",
    session_id: "demo-session-2",
    requester_id: DEMO_USER_ID,
    requester_pseudo: DEMO_PROFILE.pseudo ?? "",
    requester_avatar_url: null,
    status: "accepted",
    created_at: hoursFromNow(-7),
    decided_at: hoursFromNow(-6),
  },
];

const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "demo-fr-1",
    requester_id: "demo-p3",
    requester_pseudo: p("demo-p3").pseudo,
    requester_avatar_url: null,
    addressee_id: DEMO_USER_ID,
    addressee_pseudo: DEMO_PROFILE.pseudo ?? "",
    addressee_avatar_url: null,
    status: "pending",
    created_at: hoursFromNow(-2),
    decided_at: null,
  },
  {
    id: "demo-fr-2",
    requester_id: DEMO_USER_ID,
    requester_pseudo: DEMO_PROFILE.pseudo ?? "",
    requester_avatar_url: null,
    addressee_id: "demo-p5",
    addressee_pseudo: p("demo-p5").pseudo,
    addressee_avatar_url: null,
    status: "accepted",
    created_at: daysFromNow(-2),
    decided_at: daysFromNow(-2),
  },
];

const INITIAL_SESSION_MESSAGES: Record<string, SessionMessage[]> = {
  "demo-session-5": [
    {
      id: "demo-sm-1",
      session_id: "demo-session-5",
      sender_id: "demo-p2",
      sender_pseudo: p("demo-p2").pseudo,
      content: "Hâte d'essayer ce jeu avec vous, ça va être le bazar 😄",
      created_at: hoursFromNow(-4),
    },
  ],
  "demo-session-2": [
    {
      id: "demo-sm-2",
      session_id: "demo-session-2",
      sender_id: "demo-p2",
      sender_pseudo: p("demo-p2").pseudo,
      content: "Salmon Run direct en arrivant, ça te va ?",
      created_at: hoursFromNow(-6),
    },
  ],
};

const INITIAL_DIRECT_MESSAGES: Record<string, DirectMessage[]> = {
  "demo-p5": [
    {
      id: "demo-dm-1",
      user_a: DEMO_USER_ID,
      user_b: "demo-p5",
      sender_id: "demo-p5",
      content: "Hey, toujours chaud pour une game demain ?",
      created_at: daysFromNow(-1),
    },
    {
      id: "demo-dm-2",
      user_a: DEMO_USER_ID,
      user_b: "demo-p5",
      sender_id: DEMO_USER_ID,
      content: "Carrément, dispo après 19h !",
      created_at: hoursFromNow(-20),
    },
  ],
};

export const DEMO_NEWS: NewsItem[] = [
  {
    id: "demo-news-1",
    title: "Nouveaux amiibo compatibles",
    body: "Les derniers amiibo débloquent du contenu bonus dans plusieurs jeux multijoueur populaires.",
    created_at: hoursFromNow(-10),
  },
  {
    id: "demo-news-2",
    title: "Mise à jour Splatoon 3",
    body: "De nouvelles armes et une carte inédite ont rejoint la rotation en ligne.",
    created_at: daysFromNow(-1),
  },
  {
    id: "demo-news-3",
    title: "Soldes eShop en cours",
    body: "Plusieurs titres multijoueur cultes sont actuellement à prix réduit sur le Nintendo eShop.",
    created_at: daysFromNow(-2),
  },
];

export const demoStore = {
  sessions: [...INITIAL_SESSIONS],
  sessionRequests: [...INITIAL_SESSION_REQUESTS],
  friendRequests: [...INITIAL_FRIEND_REQUESTS],
  sessionMessages: Object.fromEntries(
    Object.entries(INITIAL_SESSION_MESSAGES).map(([k, v]) => [k, [...v]]),
  ) as Record<string, SessionMessage[]>,
  directMessages: Object.fromEntries(
    Object.entries(INITIAL_DIRECT_MESSAGES).map(([k, v]) => [k, [...v]]),
  ) as Record<string, DirectMessage[]>,
  playerRatings: [] as PlayerRating[],
};

export function addDemoSession(session: GameSession) {
  demoStore.sessions.unshift(session);
}

export function removeDemoSession(sessionId: string) {
  demoStore.sessions = demoStore.sessions.filter((s) => s.id !== sessionId);
}

export function addDemoSessionRequest(request: SessionRequest) {
  demoStore.sessionRequests.push(request);
}

export function updateDemoSessionRequestStatus(
  requestId: string,
  status: SessionRequestStatus,
) {
  demoStore.sessionRequests = demoStore.sessionRequests.map((r) =>
    r.id === requestId
      ? { ...r, status, decided_at: new Date().toISOString() }
      : r,
  );
}

export function addDemoFriendRequest(request: FriendRequest) {
  demoStore.friendRequests.push(request);
}

export function updateDemoFriendRequestStatus(
  requestId: string,
  status: FriendRequestStatus,
) {
  demoStore.friendRequests = demoStore.friendRequests.map((fr) =>
    fr.id === requestId
      ? { ...fr, status, decided_at: new Date().toISOString() }
      : fr,
  );
}

export function addDemoSessionMessage(sessionId: string, message: SessionMessage) {
  const list = demoStore.sessionMessages[sessionId] ?? [];
  demoStore.sessionMessages[sessionId] = [...list, message];
}

export function addDemoDirectMessage(otherId: string, message: DirectMessage) {
  const list = demoStore.directMessages[otherId] ?? [];
  demoStore.directMessages[otherId] = [...list, message];
}

export function setDemoPlayerRating(rating: PlayerRating) {
  demoStore.playerRatings = [
    ...demoStore.playerRatings.filter(
      (r) => !(r.rater_id === rating.rater_id && r.ratee_id === rating.ratee_id),
    ),
    rating,
  ];
}
