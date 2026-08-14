export type FeedPost = {
  id: string;
  photo_url: string;
  birra: string | null;
  luogo: string | null;
  created_at: string;
  nickname: string;
  avatar_color: string;
};

export type TopBeer = {
  name: string;
  total: number;
};
