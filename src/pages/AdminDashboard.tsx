import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Plus, Image as ImageIcon, CheckCircle, FileText, Loader2, ArrowRight, X, FolderKanban } from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states - Blog post
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submit flow states - Blog
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states - Website Asset Manager
  const [assetCategory, setAssetCategory] = useState<"Combo" | "Asset">("Combo");
  const [assetPhoto, setAssetPhoto] = useState<File | null>(null);
  const [assetPhotoPreview, setAssetPhotoPreview] = useState<string | null>(null);

  // Submit flow states - Assets
  const [isAssetSubmitting, setIsAssetSubmitting] = useState(false);
  const [assetDragActive, setAssetDragActive] = useState(false);
  const [assetFormError, setAssetFormError] = useState("");
  const [assetUploadSuccess, setAssetUploadSuccess] = useState(false);

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

  // Website Asset Manager helpers
  const handleAssetDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(true);
  };

  const handleAssetDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(false);
  };

  const handleAssetDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetAssetPhoto(file);
    }
  };

  const handleAssetFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetAssetPhoto(file);
    }
  };

  const validateAndSetAssetPhoto = (file: File) => {
    setAssetFormError("");
    if (!file.type.startsWith("image/")) {
      setAssetFormError("Asset file must be an image (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAssetFormError("Image file size must be less than 5MB.");
      return;
    }
    setAssetPhoto(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAssetPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAssetPhoto = () => {
    setAssetPhoto(null);
    setAssetPhotoPreview(null);
    if (assetFileInputRef.current) {
      assetFileInputRef.current.value = "";
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
        handleFirestoreError(firestoreError, OperationType.CREATE, blogsPath);
      }

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

  const handleAssetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAssetFormError("");

    if (!assetPhoto) {
      setAssetFormError("Please upload a photo for the web asset.");
      return;
    }

    setIsAssetSubmitting(true);

    try {
      // 1. Upload to Firebase Storage
      const storagePath = `website_assets/${Date.now()}_${assetPhoto.name}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, assetPhoto);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      // 2. Add document to Firestore 'site_images' collection
      const siteImagesPath = "site_images";
      try {
        await addDoc(collection(db, siteImagesPath), {
          url: downloadUrl,
          category: assetCategory,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, siteImagesPath);
      }

      setAssetUploadSuccess(true);
      setAssetPhoto(null);
      setAssetPhotoPreview(null);
      if (assetFileInputRef.current) {
        assetFileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Asset upload failure:", err);
      setAssetFormError(err.message || "Failed to register new asset image. Try again.");
    } finally {
      setIsAssetSubmitting(false);
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
      
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-afterhours-green animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 font-mono">
                Operator: {currentUser?.email}
              </span>
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              System Admin Hub
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

        {/* SECTION 1: BLOG PUBLISHER */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Blog Story Publisher</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Publish new press releases & announcement stories</p>
            </div>
          </div>

          {/* Upload Success Alert - Blog */}
          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
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

          {/* Global Error Banner - Blog */}
          {formError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{formError}</p>
            </div>
          )}

          {/* Interactive Form - Blog */}
          <form onSubmit={handleSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              
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
                  placeholder="e.g. After Hours Brings Hyper-Reality VR Lounges"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 font-semibold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Article Content <span className="text-afterhours-purple">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="blog-content-input"
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tell the story..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 leading-relaxed transition-all resize-y min-h-[140px]"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-white/30 font-mono">
                    {content.length} characters
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Cover Photo Image <span className="text-afterhours-purple">*</span>
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
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
                      <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removePhoto}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag blog photo here or <span className="text-afterhours-purple font-bold">browse</span></p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-purple" />
                Visible on blog landing page instantly
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isSubmitting ? "Publishing story..." : "Publish Press Story ➔"}
              </button>
            </div>
          </form>
        </div>


        {/* TASK 4: SECTION 2: WEBSITE ASSET MANAGER */}
        <div id="website-asset-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/20 p-2.5 rounded-xl text-afterhours-cyan">
              <FolderKanban size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Website Asset Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and categorize photos for rental/combo items dynamically</p>
            </div>
          </div>

          {/* Upload Success Alert - Asset */}
          <AnimatePresence>
            {assetUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Asset Registered!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Photo has been successfully saved in Storage (`website_assets/`) and registered in the Firestore database (`site_images`) under the category **{assetCategory}**.
                    </p>
                    <button
                      onClick={() => setAssetUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Photo</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Asset */}
          {assetFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{assetFormError}</p>
            </div>
          )}

          {/* Interactive Form - Asset */}
          <form onSubmit={handleAssetSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              
              {/* Category selector */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Assign Category <span className="text-afterhours-cyan">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAssetCategory("Combo")}
                    className={`py-4 px-6 rounded-2xl border text-center transition-all cursor-pointer ${
                      assetCategory === "Combo"
                        ? "bg-afterhours-cyan/15 border-afterhours-cyan text-afterhours-cyan font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15 text-white/40 text-xs uppercase font-bold tracking-widest"
                    }`}
                  >
                    🚀 Combo Packet
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetCategory("Asset")}
                    className={`py-4 px-6 rounded-2xl border text-center transition-all cursor-pointer ${
                      assetCategory === "Asset"
                        ? "bg-afterhours-cyan/15 border-afterhours-cyan text-afterhours-cyan font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15 text-white/40 text-xs uppercase font-bold tracking-widest"
                    }`}
                  >
                    🎮 Gear / Asset
                  </button>
                </div>
              </div>

              {/* Drag & Drop Upload Block */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Upload Asset Photo <span className="text-afterhours-cyan">*</span>
                </label>
                
                <div
                  onDragOver={handleAssetDragOver}
                  onDragLeave={handleAssetDragLeave}
                  onDrop={handleAssetDrop}
                  onClick={() => assetFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    assetDragActive 
                      ? "border-afterhours-cyan bg-afterhours-cyan/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={assetFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAssetFileChange}
                    className="hidden"
                  />

                  {assetPhotoPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={assetPhotoPreview}
                        alt="Asset Preview"
                        className="max-h-60 w-full object-contain rounded-2xl border border-white/10 my-2"
                      />
                      <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeAssetPhoto}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag asset photo here or <span className="text-afterhours-cyan font-bold">browse</span></p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-cyan" />
                Will be registered in Firestore `site_images`
              </span>
              <button
                type="submit"
                disabled={isAssetSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-cyan to-afterhours-purple text-black font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isAssetSubmitting ? "Uploading asset photo..." : "Upload Site Asset Image ➔"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
