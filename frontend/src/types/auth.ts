export interface UserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
}
