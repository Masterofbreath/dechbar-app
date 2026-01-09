export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
