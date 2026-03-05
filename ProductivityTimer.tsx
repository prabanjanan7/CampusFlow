import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils.ts';

interface ProductivityTimerProps {
  timeLeft: number;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  onClose: () => void;
}

export function ProductivityTimer({ timeLeft, setTimeLeft, onClose }: ProductivityTimerProps) {
  const [status, setStatus] = useState<'active' | 'warning' | 'countdown' | 'complete'>('active');

  useEffect(() => {
    if (timeLeft <= 0) {
      setStatus('complete');
    } else if (timeLeft <= 60) {
      setStatus('countdown');
    } else if (timeLeft <= 300) {
      setStatus('warning');
    } else {
      setStatus('active');
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-[100] pointer-events-none">
        {/* Floating Timer Badge */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-2xl pointer-events-auto"
        >
          <Clock size={14} className={cn(
            status === 'active' ? "text-violet-500" : 
            status === 'warning' ? "text-amber-500" : "text-rose-500"
          )} />
          <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
          <button onClick={onClose} className="ml-2 text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        </motion.div>

        {/* Warning Overlays */}
        {status === 'warning' && timeLeft > 295 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-zinc-900 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4 max-w-xs shadow-2xl shadow-amber-500/10">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold">Mindful Usage</h3>
              <p className="text-zinc-400 text-sm">
                You have 5 minutes left in this session. Take a moment to breathe.
              </p>
              <button 
                onClick={() => setStatus('active')}
                className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}

        {status === 'complete' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto bg-black/90 backdrop-blur-md"
          >
            <div className="bg-zinc-900 border border-violet-500/30 p-8 rounded-3xl text-center space-y-6 max-w-xs shadow-2xl shadow-violet-500/10">
              <div className="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-violet-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Session Complete</h3>
                <p className="text-zinc-400 text-sm">
                  Great job staying mindful! Ready to wrap up or need a bit more time?
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20"
                >
                  Finish Session
                </button>
                <button 
                  onClick={() => {
                    setTimeLeft(15 * 60);
                    setStatus('active');
                  }}
                  className="w-full py-3 text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  Add 15 minutes
                </button>
                <button 
                  onClick={() => {
                    setTimeLeft(25 * 60);
                    setStatus('active');
                  }}
                  className="w-full py-2 text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
                >
                  Reset to 25m
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
