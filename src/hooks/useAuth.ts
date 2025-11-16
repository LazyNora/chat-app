import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getUserProfile } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, userProfile, loading, setUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]);

  return { user, userProfile, loading };
}

