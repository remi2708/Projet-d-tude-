import React, { useState, useEffect, useRef } from 'react';
import { Users, X, Image as ImageIcon, RefreshCw, Send, Heart, MessageCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const samplePosts = [
  {
    id: 'sample-1',
    authorName: 'Clara Dupont',
    authorId: 'clara.dupont@example.com',
    category: 'Bonnes pratiques',
    timestamp: Date.now() - 3600 * 1000 * 3,
    text: 'Ce matin, j’ai comparé l’humidité du sol entre deux parcelles enherbées et deux parcelles désherbées. Résultat : la couverture végétale limite bien l’évaporation et stabilise la température. À surveiller sur les prochaines semaines.',
    likes: ['user-1'],
    comments: [
      { id: 'comment-1', authorName: 'Jean Martin', authorId: 'jean.martin@example.com', text: 'Très intéressant, Clara ! Peux-tu partager la méthode de mesure utilisée ?', timestamp: Date.now() - 3600 * 1000 * 2 },
    ],
  },
  {
    id: 'sample-2',
    authorName: 'Pierre Leclerc',
    authorId: 'pierre.leclerc@example.com',
    category: 'Technique vigne',
    timestamp: Date.now() - 3600 * 1000 * 5,
    text: 'Je recommande de tailler légèrement plus haut sur les vignes sensibles au gel de printemps. Cela limite les dégâts sur la charpente et améliore le rendement l’année suivante.',
    likes: ['user-2', 'user-3'],
    comments: [
      { id: 'comment-2', authorName: 'Sophie Bernard', authorId: 'sophie.bernard@example.com', text: 'J’ai fait la même chose la semaine dernière, très bon retour sur la qualité du raisin.', timestamp: Date.now() - 3600 * 1000 * 1 },
    ],
  },
  {
    id: 'sample-3',
    authorName: 'Aline Marchand',
    authorId: 'aline.marchand@example.com',
    category: 'Conseils agricoles',
    timestamp: Date.now() - 3600 * 1000 * 8,
    text: 'Les nuits fraîches sont idéales pour renforcer le profil aromatique des blancs. Surveillez bien les températures et adaptez l’irrigation pour conserver une bonne humidité sans excès.',
    likes: [],
    comments: [],
  },
];

const CommunityView = ({ user }) => {
  const [posts, setPosts] = useState(samplePosts);
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!db) {
      setIsOfflineMode(true);
      return;
    }
    if (!user) return;

    const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts');
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => doc.data());
      const merged = [...samplePosts, ...fetchedPosts];
      merged.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(merged);
    }, (err) => console.error('Erreur forum:', err));

    return () => unsubscribe();
  }, [user]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewImage(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!newText.trim() && !newImage) return;
    setIsSubmitting(true);
    const newPost = {
      id: 'post-' + Date.now(),
      authorName: user?.displayName || user?.email || 'Utilisateur',
      authorId: user?.uid || user?.email || 'Anonyme',
      category: 'Partage de bonnes pratiques',
      timestamp: Date.now(),
      text: newText.trim(),
      imageUrl: newImage,
      likes: [],
      comments: [],
    };

    if (!db) {
      setPosts((prev) => [newPost, ...prev]);
      setNewText('');
      setNewImage(null);
      setIsSubmitting(false);
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', newPost.id), newPost);
      setNewText('');
      setNewImage(null);
    } catch (err) {
      console.error('Erreur publication:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (post) => {
    if (!user) return;
    const userId = user.uid || user.email || 'anonymous';

    if (!db) {
      setPosts((prev) => prev.map((p) => {
        if (p.id !== post.id) return p;
        const hasLiked = p.likes?.includes(userId);
        return {
          ...p,
          likes: hasLiked ? p.likes.filter((id) => id !== userId) : [...(p.likes || []), userId],
        };
      }));
      return;
    }

    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id);
    const hasLiked = post.likes && post.likes.includes(userId);
    try {
      if (hasLiked) await updateDoc(postRef, { likes: arrayRemove(userId) });
      else await updateDoc(postRef, { likes: arrayUnion(userId) });
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !user) return;
    const newComment = {
      id: 'comment-' + Date.now(),
      text: commentText.trim(),
      authorName: user?.displayName || user?.email || 'Utilisateur',
      authorId: user?.uid || user?.email || 'anonymous',
      timestamp: Date.now(),
    };

    if (!db) {
      setPosts((prev) => prev.map((p) => p.id === postId ? {
        ...p,
        comments: [...(p.comments || []), newComment],
      } : p));
      setCommentText('');
      setCommentingOn(null);
      return;
    }

    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', postId);
    try {
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setCommentText('');
      setCommentingOn(null);
    } catch (err) {
      console.error('Erreur commentaire:', err);
    }
  };

  const formatTime = (ts) => {
    const diffMinutes = Math.floor((Date.now() - ts) / 60000);
    if (diffMinutes < 1) return 'À l’instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${Math.floor(diffHours / 24)} j`;
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-32">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Forum des bonnes pratiques</h2>
          <p className="text-sm text-slate-500">Discussions techniques, conseils viticoles et retours terrain.</p>
        </div>
        <Users className="text-emerald-600" size={28} />
      </div>

      {isOfflineMode && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-3xl p-3 text-sm font-semibold">
          Mode hors ligne activé : le forum utilise des données locales de démonstration.
        </div>
      )}

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <textarea
          placeholder="Partagez une observation terrain, un conseil ou une question..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 resize-none min-h-[100px]"
        />
        {newImage && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200">
            <img src={newImage} alt="Aperçu" className="w-full object-cover" />
            <button onClick={() => setNewImage(null)} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full"><X size={16} /></button>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition">
              <ImageIcon size={16} /> Photo
            </button>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting || (!newText.trim() && !newImage)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50">
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} Publier
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const userId = user?.uid || user?.email || 'anonymous';
          const hasLiked = user && post.likes && post.likes.includes(userId);
          return (
            <div key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {post.authorName ? post.authorName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : 'UT'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-gray-800">{post.authorName}</span>
                        <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{post.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{formatTime(post.timestamp)}</p>
                    </div>
                    <span className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600">{post.comments?.length || 0} commentaires</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                </div>
              </div>
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full h-auto max-h-96 object-cover border-t border-gray-100" />}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleToggleLike(post)} className={`flex items-center gap-2 text-xs font-semibold ${hasLiked ? 'text-red-500' : 'text-slate-500'}`}>
                    <Heart size={18} className={hasLiked ? 'fill-current' : ''} /> {post.likes?.length || 0}
                  </button>
                  <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MessageCircle size={18} /> Commenter
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">Catégorie : {post.category}</span>
              </div>
              {commentingOn === post.id && (
                <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-gray-100 space-y-3">
                  <div className="space-y-3">
                    {post.comments?.map((comment) => (
                      <div key={comment.id} className="rounded-3xl bg-white border border-gray-100 p-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-xs font-semibold text-slate-700">{comment.authorName}</span>
                          <span className="text-[10px] text-slate-400">{formatTime(comment.timestamp)}</span>
                        </div>
                        <p className="text-sm text-slate-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Écrire un commentaire..."
                      className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none"
                    />
                    <button onClick={() => handleAddComment(post.id)} className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition">
                      Publier
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityView;
