import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, X, Image as ImageIcon, RefreshCw, Send, Heart, MessageCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const CommunityView = ({ user }) => {
  const [posts, setPosts] = useState([]);
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
      const fetchedPosts = snapshot.docs.map(doc => doc.data());
      fetchedPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(fetchedPosts);
    }, (err) => console.error("Erreur forum:", err));
    return () => unsubscribe();
  }, [user]);

  const handleImageSelect = (e) => { /* Logique de redimensionnement d'image */
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
      text: newText.trim(),
      imageUrl: newImage,
      timestamp: Date.now(),
      authorId: user?.uid || 'Anonyme',
      likes: [], comments: [] 
    };

    if (!db) {
      setPosts(prev => [newPost, ...prev]);
      setNewText(''); setNewImage(null);
      setIsSubmitting(false);
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', newPost.id), newPost);
      setNewText(''); setNewImage(null);
    } catch (err) { console.error("Erreur publication:", err); }
    finally { setIsSubmitting(false); }
  };

  const handleToggleLike = async (post) => {
    if (!user) return;
    if (!db) {
      setPosts(prev => prev.map(p => p.id === post.id ? {
        ...p,
        likes: p.likes && p.likes.includes(user.uid) ? p.likes.filter(uid => uid !== user.uid) : [...(p.likes || []), user.uid]
      } : p));
      return;
    }

    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id);
    const hasLiked = post.likes && post.likes.includes(user.uid);
    try {
      if (hasLiked) await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      else await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    } catch (err) { console.error("Erreur like:", err); }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !user) return;
    const newComment = { id: 'comment-' + Date.now(), text: commentText.trim(), authorId: user.uid, timestamp: Date.now() };

    if (!db) {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: [...(p.comments || []), newComment]
      } : p));
      setCommentText(''); setCommentingOn(null);
      return;
    }

    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', postId);
    try {
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setCommentText(''); setCommentingOn(null);
    } catch (err) { console.error("Erreur commentaire:", err); }
  };

  const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-32">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-gray-800">Forum Réseau</h2>
        <Users className="text-emerald-600" size={28} />
      </div>

      {isOfflineMode && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-3xl p-3 text-sm font-semibold">
          Mode hors ligne activé : les messages sont sauvegardés localement dans cette session.
        </div>
      )}

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <textarea 
          placeholder="Partagez une observation terrain..."
          value={newText} onChange={(e) => setNewText(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 resize-none min-h-[80px]"
        />
        {newImage && (
          <div className="relative rounded-xl overflow-hidden max-h-48">
            <img src={newImage} alt="Aperçu" className="w-full h-full object-cover" />
            <button onClick={() => setNewImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full"><X size={14} /></button>
          </div>
        )}
        <div className="flex justify-between pt-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 rounded-xl text-xs font-bold">
            <ImageIcon size={16} /> Photo
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || (!newText.trim() && !newImage)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} Publier
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => {
          const hasLiked = user && post.likes && post.likes.includes(user.uid);
          return (
            <div key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {post.authorId.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-gray-800">Vigneron_{post.authorId.substring(0, 4)}</span>
                    <span className="text-[10px] text-gray-400">{formatTime(post.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-snug">{post.text}</p>
                </div>
              </div>
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full h-auto max-h-80 object-cover border-t border-gray-50" />}
              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center gap-4">
                <button onClick={() => handleToggleLike(post)} className={`flex items-center gap-1.5 text-xs font-bold ${hasLiked ? 'text-red-500' : 'text-gray-500'}`}>
                  <Heart size={18} className={hasLiked ? "fill-current" : ""} /> {post.likes?.length || ''}
                </button>
                <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                  <MessageCircle size={18} /> {post.comments?.length || ''}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityView;