export type FeedPost = {
  id: string;
  photo_url: string;
  birra: string | null;
  luogo: string | null;
  created_at: string;
  user_id: string;
  nickname: string;
  avatar_color: string;
  avatar_url: string | null;
};

export type TopBeer = {
  name: string;
  pct: number;
};
