import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthValue } from "../contexts/AuthContext";
import { db } from "../firebase/config";

interface SavedPost {
  postId: string;
  userId: string;
  savedAt: Date;
}

interface UseSavedPostsResult {
  savedPostIds: string[];
  loading: boolean;
  isSaved: (postId: string) => boolean;
  toggleSave: (postId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar posts salvos/favoritos de um usuário.
 * Permite salvar e remover posts da lista de favoritos.
 *
 * @returns Funções e estado para gerenciar posts salvos
 *
 * @example
 * ```tsx
 * const { isSaved, toggleSave, savedPostIds } = useSavedPosts();
 *
 * <button onClick={() => toggleSave(postId)}>
 *   {isSaved(postId) ? "❤️" : "🤍"}
 * </button>
 * ```
 */
export const useSavedPosts = (): UseSavedPostsResult => {
  const { user } = useAuthValue() || {};
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPosts = useCallback(async () => {
    if (!user?.uid) {
      setSavedPostIds([]);
      setLoading(false);
      return;
    }

    try {
      const savedRef = collection(db, "savedPosts");
      const q = query(savedRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      const ids = snapshot.docs.map((doc) => {
        const data = doc.data() as SavedPost;
        return data.postId;
      });

      setSavedPostIds(ids);
    } catch (err) {
      console.error("Error fetching saved posts:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  const isSaved = useCallback(
    (postId: string): boolean => {
      return savedPostIds.includes(postId);
    },
    [savedPostIds]
  );

  const toggleSave = useCallback(
    async (postId: string) => {
      if (!user?.uid) {
        toast.error("Faça login para salvar posts");
        return;
      }

      try {
        const savedRef = collection(db, "savedPosts");
        const q = query(savedRef, where("postId", "==", postId), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          await deleteDoc(doc(db, "savedPosts", docId));
          setSavedPostIds((prev) => prev.filter((id) => id !== postId));
          toast.success("Post removido dos salvos");
        } else {
          const newDocRef = doc(savedRef);
          const { setDoc, serverTimestamp } = await import("firebase/firestore");
          await setDoc(newDocRef, {
            postId,
            userId: user.uid,
            savedAt: serverTimestamp(),
          });
          setSavedPostIds((prev) => [...prev, postId]);
          toast.success("Post salvo!");
        }
      } catch (err) {
        console.error("Error toggling save:", err);
        toast.error("Erro ao salvar post");
      }
    },
    [user?.uid]
  );

  return {
    savedPostIds,
    loading,
    isSaved,
    toggleSave,
    refetch: fetchSavedPosts,
  };
};
