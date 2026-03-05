export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  campus: string;
  followersCount: number;
  followingCount: number;
  createdAt: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  imageUrl: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  campus: string;
  createdAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

export interface Like {
  postId: string;
  userId: string;
  createdAt: any;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: any;
}
