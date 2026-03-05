import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';
import { Post } from '../types.ts';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../utils.ts';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase.ts';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);

  const handleLike = async () => {
    if (!auth.currentUser) return;
    
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);

    const postRef = doc(db, 'posts', post.id);
    try {
      await updateDoc(postRef, {
        likesCount: increment(newLiked ? 1 : -1)
      });
    } catch (error) {
      // Rollback local state on error
      setLiked(!newLiked);
      setLikes(prev => newLiked ? prev - 1 : prev + 1);
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm"
    >
      {/* Post Image */}
      <div className="aspect-square bg-zinc-800 relative group">
        <img 
          src={post.imageUrl} 
          alt={post.caption} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Post Content */}
      <div className="p-4 space-y-4">
        {post.caption && (
          <p className="text-zinc-200 text-sm leading-relaxed">
            {post.caption}
          </p>
        )}

        {/* Interaction Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                liked ? "text-rose-500" : "text-zinc-400 hover:text-white"
              )}
            >
              <Heart size={22} fill={liked ? "currentColor" : "none"} />
              <span className="text-xs font-medium">{likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <MessageCircle size={22} />
              <span className="text-xs font-medium">{post.commentsCount}</span>
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Share2 size={22} />
            </button>
          </div>
          <button className="text-zinc-500 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Author Info at Bottom */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
              <img 
                src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                alt={post.authorName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{post.authorName}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                {post.campus}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-600 font-medium">
            {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000)) : 'Just now'} ago
          </span>
        </div>
      </div>
    </motion.div>
  );
}
