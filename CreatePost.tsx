import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase.ts';
import { UserProfile } from '../types.ts';
import { Image as ImageIcon, X, Send, Camera, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatePostProps {
  profile: UserProfile;
  onComplete: () => void;
}

export function CreatePost({ profile, onComplete }: CreatePostProps) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setError(null);
      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !auth.currentUser) return;

    setUploading(true);
    setError(null);
    try {
      // Upload Image
      const storageRef = ref(storage, `posts/${auth.currentUser.uid}/${Date.now()}_${image.name}`);
      const uploadResult = await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // Create Post Doc
      const postPath = 'posts';
      try {
        await addDoc(collection(db, postPath), {
          authorId: auth.currentUser.uid,
          authorName: profile.displayName,
          authorPhoto: profile.photoURL,
          imageUrl,
          caption,
          likesCount: 0,
          commentsCount: 0,
          campus: profile.campus,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, postPath);
      }

      onComplete();
    } catch (err: any) {
      console.error('Failed to create post', err);
      // If it's already a JSON error from handleFirestoreError, it will be caught by ErrorBoundary
      // but we are inside a try-catch here.
      if (err.message && err.message.startsWith('{')) {
        throw err; // Re-throw for ErrorBoundary
      }
      setError(err.message || 'Failed to upload post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">New Post</h2>
        <button onClick={onComplete} className="text-zinc-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div 
          className="aspect-square rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
          onClick={() => document.getElementById('image-input')?.click()}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={40} className="text-white" />
              </div>
            </>
          ) : (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon size={32} className="text-zinc-500" />
              </div>
              <p className="text-zinc-400 font-medium">Tap to upload image</p>
              <p className="text-zinc-600 text-xs">JPG, PNG or GIF</p>
            </div>
          )}
          <input 
            id="image-input"
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="hidden" 
          />
        </div>

        {/* Caption Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Caption</label>
          <textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening on campus?"
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none h-32"
          />
        </div>

        <button 
          type="submit"
          disabled={!image || uploading}
          className="w-full py-4 bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send size={20} />
              Share to {profile.campus}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
