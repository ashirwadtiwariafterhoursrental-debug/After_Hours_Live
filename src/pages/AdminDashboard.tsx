import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Plus, Image as ImageIcon, CheckCircle, FileText, Loader2, ArrowRight, X } from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submit flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Route protection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin");
      } else {
        setCurrentUser(user);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetPhoto(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetPhoto(file);
    }
  };

  const validateAndSetPhoto = (file: File) => {
    setFormError("");
    if (!file.type.startsWith("image/")) {
      setFormError("Cover photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image file size must be less than 5MB.");
      return;
    }
    setCoverPhoto(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setCoverPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      navigate("/admin");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Please enter a blog title.");
      return;
    }
    if (!content.trim()) {
      setFormError("Please write some content to publish.");
      return;
    }
    if (!coverPhoto) {
      setFormError("Please upload a cover photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload cover photo to Firebase Storage
      const storagePath = `blogs/${Date.now()}_${coverPhoto.name}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, coverPhoto);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      // 2. Add document to Firestore 'blogs' collection
      const blogsPath = "blogs";
      try {
        await addDoc(collection(db, blogsPath), {
          title: title.trim(),
          content: content.trim(),
          coverPhotoUrl: downloadUrl,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        // Use standard error wrapper instructed in Firebase skill
        handleFirestoreError(firestoreError, OperationType.CREATE, blogsPath);
      }

      // Cleanup & success state
      setUploadSuccess(true);
      setTitle("");
      setContent("");
      setCoverPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Blog submission error:", err);
      setFormError(err.message || "Failed to publish blog post. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-afterhours-purple" />
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-black animate-pulse">
            Establishing Secured session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-view" className="min-h-screen bg-afterhours-black pt-28 pb-20 px-6">
      {/* Background radial soft light */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-afterhours-green animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 font-mono">
                Operator: {currentUser?.email}
              </span>
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Blog publisher
            </h1>
          </div>
          
          <button
            id="admin-logout-btn"
            onClick={handleLogOut}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-white/60 hover:text-afterhours-pink bg-white/5 hover:bg-afterhours-pink/15 px-4 py-2.5 rounded-xl border border-white/5 hover:border-afterhours-pink/30 cursor-pointer transition-all self-start sm:self-auto"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Upload Success Alert */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-black uppercase tracking-wider text-sm mb-1">Press Release Live!</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Blog post has been safely broadcasted. Cover photo was uploaded to cloud storage and metadata saved to Firestore collection.
                  </p>
                  <button
                    onClick={() => setUploadSuccess(false)}
                    className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Create Another Post</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Banner */}
        {formError && (
          <div className="mb-8 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <span className="text-sm">⚠️</span>
            <p className="text-xs font-mono text-rose-300 leading-relaxed">{formError}</p>
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
          <div className="space-y-6">
            
            {/* Field 1: Title */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                Article Title <span className="text-afterhours-purple">*</span>
              </label>
              <input
                id="blog-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. After Hours Brings Hyper-Reality VR Lounges to Gurugram"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 font-semibold transition-all"
              />
            </div>

            {/* Field 2: Content */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                Article Content <span className="text-afterhours-purple">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="blog-content-input"
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell the story. Express the premium pop-up arenas, Esports action, VR highlights, VIP responses..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 leading-relaxed transition-all resize-y min-h-[160px]"
                />
                <div className="absolute right-3 bottom-3 text-[10px] text-white/30 font-mono">
                  {content.length} characters
                </div>
              </div>
            </div>

            {/* Field 3: File Upload (Cover Photo) */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                Cover Photo Image <span className="text-afterhours-purple">*</span>
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                    : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={photoPreview}
                      alt="Cover Photo Preview"
                      className="max-h-60 w-full object-cover rounded-2xl border border-white/10 my-2"
                    />
                    <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg pointer-events-auto">
                      <button type="button" onClick={removePhoto}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center px-2 mt-3">
                      <span className="text-[10px] uppercase font-mono text-white/40">
                        {coverPhoto?.name} ({(coverPhoto!.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] uppercase font-bold text-afterhours-purple hover:text-white transition-colors"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-white/80 font-bold">
                        Drag and drop your cover photo here, or <span className="text-afterhours-purple">browse files</span>
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1.5 font-mono">
                        Supports JPEG, PNG, WEBP, GIF (Max size 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5 text-[10px] uppercase text-white/40 font-mono">
              <Plus size={12} className="text-afterhours-purple" />
              <span>Broadcasts are visible immediately on live feeds</span>
            </div>

            <button
              id="admin-publish-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.25em] italic rounded-2xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Cover Photo & Metadata...</span>
                </>
              ) : (
                <span>Publish Press Release ➔</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
