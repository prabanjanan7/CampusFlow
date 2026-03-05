import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { 
  Settings, 
  Grid, 
  List, 
  MapPin, 
  Calendar,
  Edit3
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils.ts';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Post as PostType } from '../types.ts';
import { PostCard } from './PostCard.tsx';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

export function Profile({ profile, onUpdate }: ProfileProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.displayName);
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [editCampus, setEditCampus] = useState(profile.campus);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostType)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const updatedProfile = {
        ...profile,
        displayName: editName,
        bio: editBio,
        campus: editCampus
      };
      await updateDoc(userRef, {
        displayName: editName,
        bio: editBio,
        campus: editCampus
      });
      onUpdate(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-zinc-800 border-2 border-white/10 overflow-hidden shadow-xl">
              <img 
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-lg font-bold">{posts.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{profile.followersCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{profile.followingCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Following</div>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Display Name</label>
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Campus</label>
              <select 
                value={editCampus}
                onChange={(e) => setEditCampus(e.target.value)}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="Main Campus">Main Campus</option>
                <option value="West Side">West Side</option>
                <option value="Tech Institute">Tech Institute</option>
                <option value="Arts Academy">Arts Academy</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bio</label>
              <textarea 
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 h-24 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{profile.displayName}</h2>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <MapPin size={14} className="text-violet-500" />
                <span>{profile.campus}</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-zinc-300 text-sm leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 py-3 bg-zinc-900 border border-white/5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
              >
                Edit Profile
              </button>
              <button className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-white/5">
        <button 
          onClick={() => setViewMode('grid')}
          className={cn(
            "flex-1 py-4 flex items-center justify-center transition-colors",
            viewMode === 'grid' ? "text-violet-500 border-t-2 border-violet-500" : "text-zinc-500"
          )}
        >
          <Grid size={20} />
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={cn(
            "flex-1 py-4 flex items-center justify-center transition-colors",
            viewMode === 'list' ? "text-violet-500 border-t-2 border-violet-500" : "text-zinc-500"
          )}
        >
          <List size={20} />
        </button>
      </div>

      {/* Posts Content */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto text-zinc-700">
            <Grid size={32} />
          </div>
          <p className="text-zinc-500 font-medium">No posts yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map(post => (
            <div key={post.id} className="aspect-square bg-zinc-900 overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.caption} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {posts.map((post: PostType) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
