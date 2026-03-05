import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase.ts';
import { UserProfile } from './types.ts';
import { Feed } from './components/Feed.tsx';
import { Profile } from './components/Profile.tsx';
import { CreatePost } from './components/CreatePost.tsx';
import { Search } from './components/Search.tsx';
import { ProductivityTimer } from './components/ProductivityTimer.tsx';
import { 
  Home, 
  Search as SearchIcon, 
  PlusSquare, 
  User as UserIcon, 
  LogOut,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [view, setView] = useState<'feed' | 'profile' | 'create' | 'search'>('feed');
  const [productivityMode, setProductivityMode] = useState(false);
  const [sessionTime, setSessionTime] = useState(25); // Default 25 mins
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('campusflow_timer');
    return saved ? parseInt(saved, 10) : 25 * 60;
  });

  useEffect(() => {
    localStorage.setItem('campusflow_timer', timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (productivityMode && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [productivityMode, timeLeft]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create new profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              campus: 'Main Campus', // Default
              followersCount: 0,
              followingCount: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed', error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError('Login request cancelled. Please try again.');
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-20 h-20 bg-violet-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Home size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">CampusFlow</h1>
          <p className="text-zinc-400 text-lg">
            The social network for students. Fresh perspective, upward scrolling.
          </p>
          <button 
            onClick={login}
            disabled={isLoggingIn}
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Continue with Google
              </>
            )}
          </button>
          {loginError && (
            <p className="text-rose-500 text-sm font-medium animate-pulse">
              {loginError}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight text-violet-500">CampusFlow</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (productivityMode && timeLeft <= 0) {
                setTimeLeft(25 * 60);
              }
              setProductivityMode(!productivityMode);
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              productivityMode ? "bg-violet-500 text-white" : "text-zinc-400 hover:bg-white/5"
            )}
          >
            <Clock size={20} />
          </button>
          <button onClick={logout} className="text-zinc-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'feed' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <Feed campus={profile?.campus || 'Main Campus'} />
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto"
            >
              <Profile profile={profile!} onUpdate={(p) => setProfile(p)} />
            </motion.div>
          )}
          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
            >
              <Search />
            </motion.div>
          )}
          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full overflow-y-auto"
            >
              <CreatePost profile={profile!} onComplete={() => setView('feed')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Productivity Timer Overlay */}
      {productivityMode && (
        <ProductivityTimer 
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onClose={() => setProductivityMode(false)} 
        />
      )}

      {/* Navigation */}
      <nav className="p-4 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-around sticky bottom-0 z-50">
        <button 
          onClick={() => setView('feed')}
          className={cn("p-2 transition-colors", view === 'feed' ? "text-violet-500" : "text-zinc-500 hover:text-white")}
        >
          <Home size={24} />
        </button>
        <button 
          onClick={() => setView('search')}
          className={cn("p-2 transition-colors", view === 'search' ? "text-violet-500" : "text-zinc-500 hover:text-white")}
        >
          <SearchIcon size={24} />
        </button>
        <button 
          onClick={() => setView('create')}
          className={cn("p-4 -mt-10 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/40 text-white transition-transform hover:scale-110 active:scale-95")}
        >
          <PlusSquare size={28} />
        </button>
        <div className="w-12 h-12 flex items-center justify-center">
          {/* Placeholder for spacing */}
        </div>
        <button 
          onClick={() => setView('profile')}
          className={cn("p-2 transition-colors", view === 'profile' ? "text-violet-500" : "text-zinc-500 hover:text-white")}
        >
          <UserIcon size={24} />
        </button>
      </nav>
    </div>
  );
}
