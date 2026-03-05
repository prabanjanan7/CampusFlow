import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Post as PostType } from '../types.ts';
import { PostCard } from './PostCard.tsx';

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCampus, setActiveCampus] = useState<string | null>(null);

  const campuses = ['Main Campus', 'West Side', 'Tech Institute', 'Arts Academy'];

  useEffect(() => {
    if (!activeCampus && !searchTerm) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        let q;
        if (activeCampus) {
          q = query(
            collection(db, 'posts'),
            where('campus', '==', activeCampus),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        } else {
          // Simple search by campus name if activeCampus is not set
          q = query(
            collection(db, 'posts'),
            where('campus', '==', searchTerm),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        }

        const snapshot = await getDocs(q);
        setResults(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as PostType)));
      } catch (error) {
        // If query fails (e.g. no index), we just show empty
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeCampus]);

  return (
    <div className="p-6 space-y-6 pb-24">
      <h2 className="text-2xl font-bold">Discover</h2>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setActiveCampus(null);
          }}
          placeholder="Search campuses (e.g. Main Campus)"
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Campuses</h3>
        <div className="flex flex-wrap gap-2">
          {campuses.map(campus => (
            <button 
              key={campus} 
              onClick={() => {
                setActiveCampus(campus);
                setSearchTerm('');
              }}
              className={cn(
                "px-4 py-2 border rounded-full text-sm font-medium transition-colors",
                activeCampus === campus 
                  ? "bg-violet-600 border-violet-500 text-white" 
                  : "bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              {campus}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Results for {activeCampus || searchTerm}
            </h3>
            {results.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (activeCampus || searchTerm) ? (
          <div className="text-center py-12 text-zinc-500">
            No posts found for this campus.
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Helper for cn in this file
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
