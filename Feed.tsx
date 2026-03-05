import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  getDocs,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Post as PostType } from '../types.ts';
import { PostCard } from './PostCard.tsx';
import { useInView } from 'react-intersection-observer';

interface FeedProps {
  campus: string;
}

export function Feed({ campus }: FeedProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const { ref: topRef, inView: topInView } = useInView();

  // Real-time listener for NEW posts (at the bottom)
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('campus', '==', campus),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const latestPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostType)).reverse();
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = latestPosts.filter(p => !existingIds.has(p.id));
        
        // If we have new posts, append them. 
        // Note: this assumes latestPosts are always the newest.
        // For a more robust solution, we'd sort by createdAt.
        const combined = [...prev, ...filteredNew].sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
        return combined;
      });
      
      if (isInitialLoad) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 20);
        setIsInitialLoad(false);
        setLoading(false);
        
        // Scroll to bottom on initial load
        setTimeout(() => {
          if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
          }
        }, 300);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [campus]);

  // Load more (older posts) when scrolling UP
  useEffect(() => {
    if (topInView && hasMore && !loading && lastDoc) {
      loadMore();
    }
  }, [topInView, hasMore, loading, lastDoc]);

  const loadMore = async () => {
    if (loading || !hasMore || !lastDoc) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('campus', '==', campus),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(10)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const olderPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostType));
        
        // Capture scroll height before update
        const scrollHeight = feedRef.current?.scrollHeight || 0;
        
        setPosts(prev => [...olderPosts.reverse(), ...prev]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 10);

        // Adjust scroll position to prevent jumping
        setTimeout(() => {
          if (feedRef.current) {
            const newScrollHeight = feedRef.current.scrollHeight;
            feedRef.current.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      ref={feedRef}
      className="h-full overflow-y-auto scroll-smooth flex flex-col p-4 space-y-6"
    >
      {/* Intersection observer at the top to trigger loading older posts */}
      {hasMore && <div ref={topRef} className="h-4 w-full flex justify-center py-4">
        {loading && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
      </div>}
      
      {posts.map((post: PostType) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {/* Newest posts appear here at the bottom */}
      <div className="h-4 w-full" />
    </div>
  );
}
