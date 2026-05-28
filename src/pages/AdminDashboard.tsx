import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db, storage, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Plus, Image as ImageIcon, CheckCircle, FileText, Loader2, ArrowRight, X, FolderKanban, Sliders, Trash2, UploadCloud, Gamepad2, ShoppingBag, BellRing, Heart, Layers, AlertCircle, Eye } from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states - Homepage Slider Manager
  const [slidePhoto, setSlidePhoto] = useState<File | null>(null);
  const [slidePhotoPreview, setSlidePhotoPreview] = useState<string | null>(null);
  const [isSlideSubmitting, setIsSlideSubmitting] = useState(false);
  const [slideDragActive, setSlideDragActive] = useState(false);
  const [slideFormError, setSlideFormError] = useState("");
  const [slideUploadSuccess, setSlideUploadSuccess] = useState(false);
  const [activeSlides, setActiveSlides] = useState<any[]>([]);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

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
  const [assetCategory, setAssetCategory] = useState<"Combos" | "Individual Gears">("Combos");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("combo-theatre");
  const [assetPhoto, setAssetPhoto] = useState<File | null>(null);
  const [assetPhotoPreview, setAssetPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (assetCategory === "Combos") {
      setSelectedAssetId("combo-theatre");
    } else {
      setSelectedAssetId("hw-ps5");
    }
  }, [assetCategory]);

  // Submit flow states - Assets
  const [isAssetSubmitting, setIsAssetSubmitting] = useState(false);
  const [assetDragActive, setAssetDragActive] = useState(false);
  const [assetFormError, setAssetFormError] = useState("");
  const [assetUploadSuccess, setAssetUploadSuccess] = useState(false);

  // Form states - Premium Games Manager
  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const [gameTitle, setGameTitle] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [gameCover, setGameCover] = useState<File | null>(null);
  const [gameCoverPreview, setGameCoverPreview] = useState<string | null>(null);
  const [isGameSubmitting, setIsGameSubmitting] = useState(false);
  const [gameDragActive, setGameDragActive] = useState(false);
  const [gameFormError, setGameFormError] = useState("");
  const [gameUploadSuccess, setGameUploadSuccess] = useState(false);
  const [premiumGames, setPremiumGames] = useState<any[]>([]);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

  // Form states - Gear Media Manager
  const gearFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGearId, setSelectedGearId] = useState("hw-ps5");
  const [gearMediaFile, setGearMediaFile] = useState<File | null>(null);
  const [gearMediaPreview, setGearMediaPreview] = useState<string | null>(null);
  const [gearMediaType, setGearMediaType] = useState<"image" | "video">("image");
  const [isGearSubmitting, setIsGearSubmitting] = useState(false);
  const [gearDragActive, setGearDragActive] = useState(false);
  const [gearFormError, setGearFormError] = useState("");
  const [gearUploadSuccess, setGearUploadSuccess] = useState(false);
  const [gearCatalogList, setGearCatalogList] = useState<any[]>([]);
  const [deletingGearMediaId, setDeletingGearMediaId] = useState<string | null>(null);

  const ADMIN_GEARS = [
    { id: "hw-ps5", name: "Play Station 5 ( PS5 console)" },
    { id: "hw-speaker", name: "JBL Party Speaker" },
    { id: "hw-projector", name: "Full HD Projector" },
    { id: "hw-vr2", name: "Sony PlayStation VR2" },
    { id: "hw-wheel", name: "Logitech G29 Racing Wheel" }
  ];

  // Route protection, layout tabs, & operational states
  const [activeTab, setActiveTab] = useState<"orders" | "waitlist" | "content">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [waitlistItems, setWaitlistItems] = useState<any[]>([]);
  const [kycModalUrl, setKycModalUrl] = useState<string | null>(null);
  const [updatingOrderStatusId, setUpdatingOrderStatusId] = useState<string | null>(null);

  useEffect(() => {
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
    if (!isAdminAuthenticated) {
      navigate("/admin");
    } else {
      const storedEmail = localStorage.getItem("adminEmail") || "afterhoursrental@gmail.com";
      setCurrentUser({
        email: storedEmail,
        displayName: storedEmail === "afterhoursrental@gmail.com" ? "After Hours Rental Admin" : "Arjun Tiwari"
      });
    }
    setAuthLoading(false);
  }, [navigate]);

  // Fetch orders in real-time
  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort: latest orders first
      list.sort((a, b) => {
        const dateA = a["Order Date"] ? new Date(a["Order Date"]).getTime() : 0;
        const dateB = b["Order Date"] ? new Date(b["Order Date"]).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(list);
    }, (err) => {
      console.error("Error subscribing to orders collection:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch waitlist entries in real-time
  useEffect(() => {
    const waitlistRef = collection(db, "inventory_waitlist");
    const unsubscribe = onSnapshot(waitlistRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by Requested Date (planDate) so admin can see heavy request periods
      list.sort((a, b) => {
        const dateA = a.planDate ? new Date(a.planDate).getTime() : 0;
        const dateB = b.planDate ? new Date(b.planDate).getTime() : 0;
        return dateA - dateB;
      });
      setWaitlistItems(list);
    }, (err) => {
      console.error("Error subscribing to waitlist collection:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch active slides in real-time
  useEffect(() => {
    const slidesRef = collection(db, "homepage_slides");
    const q = query(slidesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setActiveSlides(list);
    }, (err) => {
      console.error("Error subscribing to homepage slides:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch premium games in real-time
  useEffect(() => {
    const gamesRef = collection(db, "premium_games");
    const q = query(gamesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPremiumGames(list);
    }, (err) => {
      console.error("Error subscribing to premium games:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch gear catalog dynamically in real-time
  useEffect(() => {
    const q = query(collection(db, "gear_catalog"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setGearCatalogList(list);
    }, (err) => {
      console.error("Error subscribing to gear catalog collection:", err);
    });
    return () => unsubscribe();
  }, []);

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
      localStorage.removeItem("isAdminAuthenticated");
      localStorage.removeItem("adminEmail");
      await signOut(auth).catch(() => {});
      navigate("/admin");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderStatusId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        Status: newStatus
      });
    } catch (err: any) {
      console.error("Failed to update status for order:", orderId, err);
      alert("Permission denied or failed to update: " + err.message);
    } finally {
      setUpdatingOrderStatusId(null);
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

  const getProductNameById = (id: string) => {
    const allProducts = [
      { id: "combo-theatre", name: "Gaming Theatre" },
      { id: "combo-party", name: "Full Party Setup" },
      { id: "combo-racing", name: "PS5 Mega Racing Combo" },
      { id: "hw-ps5", name: "Play Station 5 ( PS5 console)" },
      { id: "hw-speaker", name: "JBL Party Speaker" },
      { id: "hw-projector", name: "Full HD Projector" },
      { id: "hw-vr2", name: "Sony PlayStation VR2" },
      { id: "hw-wheel", name: "Logitech G29 Racing Wheel" }
    ];
    return allProducts.find(p => p.id === id)?.name || id;
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

      // 2. Add document to Firestore 'site_images' collection (historical backup if needed)
      const siteImagesPath = "site_images";
      try {
        await addDoc(collection(db, siteImagesPath), {
          url: downloadUrl,
          category: assetCategory,
          productId: selectedAssetId,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn("Soft warning: site_images backup failed:", firestoreError);
      }

      // 3. Directly tie the image to the specific product in 'gear_catalog'!
      await setDoc(doc(db, "gear_catalog", selectedAssetId), {
        gearId: selectedAssetId,
        gearName: getProductNameById(selectedAssetId),
        mediaUrl: downloadUrl,
        mediaType: "image",
        storagePath,
        updatedAt: serverTimestamp()
      });

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

  // --- Homepage Slider Manager Handlers ---
  const handleSlideDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(true);
  };

  const handleSlideDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(false);
  };

  const handleSlideDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetSlidePhoto(file);
    }
  };

  const handleSlideFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetSlidePhoto(file);
    }
  };

  const validateAndSetSlidePhoto = (file: File) => {
    setSlideFormError("");
    if (!file.type.startsWith("image/")) {
      setSlideFormError("Slide photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSlideFormError("Image file size must be less than 5MB.");
      return;
    }
    setSlidePhoto(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlidePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSlidePhoto = () => {
    setSlidePhoto(null);
    setSlidePhotoPreview(null);
    if (slideFileInputRef.current) {
      slideFileInputRef.current.value = "";
    }
  };

  const handleSlideSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSlideFormError("");
    setSlideUploadSuccess(false);

    if (!slidePhoto) {
      setSlideFormError("Please upload a slide image.");
      return;
    }

    setIsSlideSubmitting(true);

    try {
      const fileName = `${Date.now()}_${slidePhoto.name}`;
      const storagePath = `homepage_slides/${fileName}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, slidePhoto);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      const homepageSlidesPath = "homepage_slides";
      try {
        await addDoc(collection(db, homepageSlidesPath), {
          url: downloadUrl,
          storagePath: storagePath,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, homepageSlidesPath);
      }

      setSlideUploadSuccess(true);
      setSlidePhoto(null);
      setSlidePhotoPreview(null);
      if (slideFileInputRef.current) {
        slideFileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Slide upload failure:", err);
      setSlideFormError(err.message || "Failed to upload slide image. Try again.");
    } finally {
      setIsSlideSubmitting(false);
    }
  };

  const handleDeleteSlide = async (slide: any) => {
    setDeletingSlideId(slide.id);
    try {
      if (slide.storagePath) {
        const imageRef = ref(storage, slide.storagePath);
        await deleteObject(imageRef).catch(err => {
          console.warn("Could not delete file from Cloud storage:", err);
        });
      }
      await deleteDoc(doc(db, "homepage_slides", slide.id));
    } catch (err: any) {
      console.error("Failed to delete slide:", err);
      setSlideFormError("Deletion error: " + err.message);
    } finally {
      setDeletingSlideId(null);
    }
  };

  // --- Premium Games Manager Handlers ---
  const handleGameDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(true);
  };

  const handleGameDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(false);
  };

  const handleGameDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetGameCover(file);
    }
  };

  const handleGameFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetGameCover(file);
    }
  };

  const validateAndSetGameCover = (file: File) => {
    setGameFormError("");
    if (!file.type.startsWith("image/")) {
      setGameFormError("Cover photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGameFormError("Image file size must be less than 5MB.");
      return;
    }
    setGameCover(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setGameCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeGameCover = () => {
    setGameCover(null);
    setGameCoverPreview(null);
    if (gameFileInputRef.current) {
      gameFileInputRef.current.value = "";
    }
  };

  const handleGameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGameFormError("");
    setGameUploadSuccess(false);

    if (!gameTitle.trim()) {
      setGameFormError("Please enter a Game Title.");
      return;
    }
    if (!gameLink.trim()) {
      setGameFormError("Please enter a PS Store Preview Link.");
      return;
    }
    if (!gameCover) {
      setGameFormError("Please upload a game cover image.");
      return;
    }

    setIsGameSubmitting(true);

    try {
      const fileName = `${Date.now()}_${gameCover.name}`;
      const storagePath = `game_covers/${fileName}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, gameCover);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      const premiumGamesPath = "premium_games";
      try {
        await addDoc(collection(db, premiumGamesPath), {
          title: gameTitle.trim(),
          link: gameLink.trim(),
          coverUrl: downloadUrl,
          storagePath: storagePath,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, premiumGamesPath);
      }

      setGameUploadSuccess(true);
      setGameTitle("");
      setGameLink("");
      setGameCover(null);
      setGameCoverPreview(null);
      if (gameFileInputRef.current) {
        gameFileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Game upload failure:", err);
      setGameFormError(err.message || "Failed to upload premium game. Try again.");
    } finally {
      setIsGameSubmitting(false);
    }
  };

  const handleDeleteGame = async (game: any) => {
    setDeletingGameId(game.id);
    try {
      if (game.storagePath) {
        const imageRef = ref(storage, game.storagePath);
        await deleteObject(imageRef).catch(err => {
          console.warn("Could not delete file from Cloud storage:", err);
        });
      }
      await deleteDoc(doc(db, "premium_games", game.id));
    } catch (err: any) {
      console.error("Failed to delete game:", err);
      setGameFormError("Deletion error: " + err.message);
    } finally {
      setDeletingGameId(null);
    }
  };

  // Gear Media Manager Handlers
  const handleGearFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGearMediaFile(file);
      setGearMediaType(file.type.startsWith("video") ? "video" : "image");
      const previewUrl = URL.createObjectURL(file);
      setGearMediaPreview(previewUrl);
      setGearUploadSuccess(false);
      setGearFormError("");
    }
  };

  const handleGearDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(true);
  };

  const handleGearDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(false);
  };

  const handleGearDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setGearFormError("Unsupported file type. Please upload an image or video.");
        return;
      }
      setGearMediaFile(file);
      setGearMediaType(file.type.startsWith("video") ? "video" : "image");
      const previewUrl = URL.createObjectURL(file);
      setGearMediaPreview(previewUrl);
      setGearUploadSuccess(false);
      setGearFormError("");
    }
  };

  const removeGearMedia = () => {
    setGearMediaFile(null);
    setGearMediaPreview(null);
    if (gearFileInputRef.current) {
      gearFileInputRef.current.value = "";
    }
  };

  const handleGearSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gearMediaFile) {
      setGearFormError("Please choose or drop a photo or video file.");
      return;
    }
    setIsGearSubmitting(true);
    setGearFormError("");
    setGearUploadSuccess(false);

    try {
      const fileExt = gearMediaFile.name.split('.').pop();
      const storagePath = `gear_media/${selectedGearId}_${Date.now()}.${fileExt}`;
      const fileRef = ref(storage, storagePath);
      
      const uploadResult = await uploadBytes(fileRef, gearMediaFile);
      const mediaUrl = await getDownloadURL(uploadResult.ref);
      
      await setDoc(doc(db, "gear_catalog", selectedGearId), {
        gearId: selectedGearId,
        gearName: ADMIN_GEARS.find(g => g.id === selectedGearId)?.name || selectedGearId,
        mediaUrl,
        mediaType: gearMediaType,
        storagePath,
        updatedAt: serverTimestamp()
      });

      setGearMediaFile(null);
      setGearMediaPreview(null);
      if (gearFileInputRef.current) {
        gearFileInputRef.current.value = "";
      }
      setGearUploadSuccess(true);
    } catch (err: any) {
      console.error("Error updating gear media:", err);
      setGearFormError(err.message || "Failed to upload gear media.");
    } finally {
      setIsGearSubmitting(false);
    }
  };

  const handleDeleteGearMedia = async (gearDoc: any) => {
    setDeletingGearMediaId(gearDoc.id);
    try {
      if (gearDoc.storagePath) {
        const fileRef = ref(storage, gearDoc.storagePath);
        await deleteObject(fileRef).catch(e => console.warn("Storage item delete issue:", e));
      }
      await deleteDoc(doc(db, "gear_catalog", gearDoc.id));
    } catch (err) {
      console.error("Error resetting gear media entry:", err);
    } finally {
      setDeletingGearMediaId(null);
    }
  };

  const waitlistGrouped = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    waitlistItems.forEach((sub) => {
      const dateStr = sub.planDate || "No Requested Date";
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(sub);
    });
    return Object.keys(groups).sort().map((date) => ({
      date,
      items: groups[date]
    }));
  }, [waitlistItems]);

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
    <div id="admin-dashboard-view" className="min-h-screen bg-afterhours-black pt-28 pb-20 px-6 relative">
      {/* Background radial soft light */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className={`mx-auto space-y-16 transition-all duration-300 ${
        activeTab === "content" ? "max-w-4xl" : "max-w-7xl w-full"
      }`}>
        
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 pb-2 gap-2 md:gap-4 overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-afterhours-cyan/15 to-afterhours-purple/15 border-afterhours-cyan/60 text-afterhours-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <ShoppingBag size={13} />
            <span>Excel Order Matrix</span>
          </button>
          
          <button
            onClick={() => setActiveTab("waitlist")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "waitlist"
                ? "bg-gradient-to-r from-afterhours-pink/15 to-afterhours-purple/15 border-afterhours-pink/60 text-afterhours-pink shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <BellRing size={13} />
            <span>Waitlist & Demand</span>
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "content"
                ? "bg-white/5 border-afterhours-purple/60 text-afterhours-purple shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <Sliders size={13} />
            <span>Content Directors</span>
          </button>
        </div>

        {/* TAB 1: EXCEL ORDER MATRIX */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/25 p-2.5 rounded-xl text-afterhours-cyan">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white">Excel-Style Order Matrix</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Live customer orders synced with Cloud Firestore</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-white/45 bg-[#121215] border border-white/5 rounded-full px-3 py-1.5 self-start sm:self-auto uppercase tracking-wider">
                Total Orders: <strong className="text-afterhours-cyan font-bold">{orders.length}</strong>
              </div>
            </div>

            <div className="w-full overflow-x-auto bg-[#0a0a0c]/80 border border-white/5 rounded-3xl p-1 shadow-2xl relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Order ID</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Order Date</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Contact Number</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap max-w-[180px]">Assets</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Add-ons</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Start date</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">End date</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Paid Amt</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap font-mono">Remaining Amt</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Discount Applied</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 text-center whitespace-nowrap">KYC Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-20 text-xs font-mono text-white/30">
                        No customer orders stored in the orders collection.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-all border-b border-white/5">
                        {/* Order ID */}
                        <td className="px-4 py-4 text-[11px] font-mono font-bold text-afterhours-cyan whitespace-nowrap">
                          {order["Order ID"] || order.id}
                        </td>
                        {/* Order Date */}
                        <td className="px-4 py-4 text-[10px] font-mono text-white/50 whitespace-nowrap">
                          {order["Order Date"] ? new Date(order["Order Date"]).toLocaleString() : "N/A"}
                        </td>
                        {/* Name */}
                        <td className="px-4 py-4 text-xs font-black text-white uppercase whitespace-nowrap">
                          {order["Name"] || "Anonymous"}
                        </td>
                        {/* Contact Number */}
                        <td className="px-4 py-4 text-[11px] font-mono text-white/80 whitespace-nowrap">
                          {order["Contact number"] || "N/A"}
                        </td>
                        {/* Email */}
                        <td className="px-4 py-4 text-[11px] font-mono text-white/50 truncate max-w-[120px] whitespace-nowrap" title={order["Email id"]}>
                          {order["Email id"] || "N/A"}
                        </td>
                        {/* Assets */}
                        <td className="px-4 py-4 text-[11px] text-white/70 max-w-[200px] leading-relaxed whitespace-pre-wrap">
                          {order["Assets"] || "N/A"}
                        </td>
                        {/* Add-ons */}
                        <td className="px-4 py-4 text-[10px] font-mono text-white/50 whitespace-nowrap uppercase tracking-wider">
                          {order["Addon"] || "N/A"}
                        </td>
                        {/* Start Date */}
                        <td className="px-4 py-4 text-[10px] font-mono text-afterhours-cyan/80 whitespace-nowrap">
                          {order["Start date"] || "N/A"}
                        </td>
                        {/* End Date */}
                        <td className="px-4 py-4 text-[10px] font-mono text-afterhours-pink/80 whitespace-nowrap">
                          {order["End date"] || "N/A"}
                        </td>
                        {/* Paid Amt */}
                        <td className="px-4 py-4 text-[11px] font-mono font-bold text-afterhours-green whitespace-nowrap">
                          {order["Paid amt"] || "N/A"}
                        </td>
                        {/* Remaining Amt */}
                        <td className="px-4 py-4 text-[11px] font-mono text-white/80 whitespace-nowrap">
                          {order["Remaining amt"] || "N/A"}
                        </td>
                        {/* Discount Applied */}
                        <td className="px-4 py-4 text-[11px] font-mono text-white/40 whitespace-nowrap">
                          {order["Discount applied"] || "N/A"}
                        </td>
                        {/* Status dropdown */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <select
                            value={order.Status || "Pending"}
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            disabled={updatingOrderStatusId === order.id}
                            className={`bg-black text-[10px] font-black uppercase tracking-widest border rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-afterhours-purple transition-all cursor-pointer ${
                              (order.Status || "Pending") === "Pending" ? "border-yellow-500/20 text-yellow-500" :
                              (order.Status || "Pending") === "Active" ? "border-green-500/20 text-afterhours-green" :
                              "border-gray-500/25 text-white/50"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        {/* View KYC button */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {order["KYC Document URL"] ? (
                            <button
                              onClick={() => setKycModalUrl(order["KYC Document URL"])}
                              className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-afterhours-purple/10 text-afterhours-purple hover:bg-afterhours-purple hover:text-white border border-afterhours-purple/20 hover:border-afterhours-purple/80 rounded-lg transition-all cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <Eye size={10} />
                              <span>View KYC</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-white/20 italic uppercase tracking-wider block">No Document</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEMAND INTELLIGENCE HUB */}
        {activeTab === "waitlist" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-afterhours-pink/10 border border-afterhours-pink/25 p-2.5 rounded-xl text-afterhours-pink">
                  <BellRing size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white">Waitlist & Demand</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Watch out-of-stock item subscriptions sorted by requested target date</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-white/45 bg-[#121215] border border-white/5 rounded-full px-3 py-1.5 self-start sm:self-auto uppercase tracking-wider">
                Total Subscribers: <strong className="text-afterhours-pink font-bold">{waitlistItems.length}</strong>
              </div>
            </div>

            {waitlistGrouped.length === 0 ? (
              <div className="text-center py-20 bg-[#0a0a0c]/80 border border-white/5 rounded-3xl p-8 shadow-2xl">
                <p className="text-xs font-mono text-white/30">
                  No priority queue registrations logged in the inventory_waitlist collection.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {waitlistGrouped.map(({ date, items }) => (
                  <div key={date} className="relative p-6 rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-all space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-afterhours-pink animate-pulse" />
                        <h3 className="text-xs uppercase font-black tracking-[0.2em] text-white">
                          Requested Date: <span className="text-afterhours-pink font-mono">{date}</span>
                        </h3>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-afterhours-pink/10 border border-afterhours-pink/20 px-2.5 py-0.5 rounded-full text-afterhours-pink">
                        {items.length} {items.length === 1 ? "priority alert" : "priority alerts"}
                      </span>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-white/40">
                            <th className="pb-2">Target gear</th>
                            <th className="pb-2">Gear code</th>
                            <th className="pb-2">Contact Link</th>
                            <th className="pb-2 font-mono">Subscriber name</th>
                            <th className="pb-2 text-right">Registration time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-white/80 font-mono">
                          {items.map((sub, idx) => (
                            <tr key={sub.id || idx} className="hover:bg-white/[0.01] transition-all">
                              <td className="py-3 font-sans font-black text-white uppercase">{sub.itemName}</td>
                              <td className="py-3 text-[10px] text-white/40">{sub.itemId}</td>
                              <td className="py-3 text-afterhours-cyan font-bold">{sub.contact}</td>
                              <td className="py-3 font-sans font-bold uppercase text-white/90">{sub.name}</td>
                              <td className="py-3 text-right text-[10px] text-white/30">
                                {sub.createdAt?.seconds 
                                  ? new Date(sub.createdAt.seconds * 1000).toLocaleString() 
                                  : sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONTENT DIRECTORS */}
        {activeTab === "content" && (
          <div className="space-y-16">
            {/* SECTION 1: BLOG STORY PUBLISHER */}
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
              
              {/* Step 1 & Step 2 Selection Process */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                    Step 1: Select Category <span className="text-afterhours-cyan">*</span>
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as "Combos" | "Individual Gears")}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-afterhours-cyan transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <option value="Combos" className="bg-afterhours-charcoal text-white">Combos</option>
                    <option value="Individual Gears" className="bg-afterhours-charcoal text-white">Individual Gears</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                    Step 2: Select Specific Product <span className="text-afterhours-cyan">*</span>
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-afterhours-cyan transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    {assetCategory === "Combos" ? (
                      <>
                        <option value="combo-theatre" className="bg-afterhours-charcoal text-white">Gaming Theatre</option>
                        <option value="combo-party" className="bg-afterhours-charcoal text-white">Full Party Setup</option>
                        <option value="combo-racing" className="bg-afterhours-charcoal text-white">PS5 Mega Racing Combo</option>
                      </>
                    ) : (
                      <>
                        <option value="hw-ps5" className="bg-afterhours-charcoal text-white">Play Station 5 ( PS5 console)</option>
                        <option value="hw-speaker" className="bg-afterhours-charcoal text-white">JBL Party Speaker</option>
                        <option value="hw-projector" className="bg-afterhours-charcoal text-white">Full HD Projector</option>
                        <option value="hw-vr2" className="bg-afterhours-charcoal text-white">Sony PlayStation VR2</option>
                        <option value="hw-wheel" className="bg-afterhours-charcoal text-white">Logitech G29 Racing Wheel</option>
                      </>
                    )}
                  </select>
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

        {/* SECTION 3: HOMEPAGE SLIDER MANAGER */}
        <div id="homepage-slider-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-pink/10 border border-afterhours-pink/20 p-2.5 rounded-xl text-afterhours-pink">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Homepage Slider Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and remove full-screen images currently active in the homepage hero rotation</p>
            </div>
          </div>

          {/* Upload Success Alert - Slide */}
          <AnimatePresence>
            {slideUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Slide Image Safe!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Slide has been successfully saved to Storage (`homepage_slides/`) and registered in the Firestore database (`homepage_slides`). The home page will rotate into this slide automatically in real-time.
                    </p>
                    <button
                      onClick={() => setSlideUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Slide</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Slide */}
          {slideFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{slideFormError}</p>
            </div>
          )}

          {/* Upload Form - Slide */}
          <form onSubmit={handleSlideSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              {/* Drag & Drop Upload Block */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Select Slide Frame Image <span className="text-afterhours-pink">*</span>
                </label>
                
                <div
                  onDragOver={handleSlideDragOver}
                  onDragLeave={handleSlideDragLeave}
                  onDrop={handleSlideDrop}
                  onClick={() => slideFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    slideDragActive 
                      ? "border-afterhours-pink bg-afterhours-pink/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={slideFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSlideFileChange}
                    className="hidden"
                  />

                  {slidePhotoPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={slidePhotoPreview}
                        alt="Slide Preview"
                        className="max-h-60 w-full object-cover rounded-2xl border border-white/10 my-2"
                      />
                      <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeSlidePhoto}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag slide image here or <span className="text-afterhours-pink font-bold">browse files</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-pink" />
                Saves to Firebase Storage path `homepage_slides/`
              </span>
              <button
                type="submit"
                disabled={isSlideSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-pink to-afterhours-purple text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isSlideSubmitting ? "Uploading slide file..." : "Add Homepage Slide ➔"}
              </button>
            </div>
          </form>

          {/* Slides Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60">Active Slide Rotation Grid ({activeSlides.length})</h3>
            
            {activeSlides.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No custom slides uploaded. Currently rotating default placeholder images.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {activeSlides.map((slide) => (
                  <div key={slide.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 text-left flex flex-col justify-between">
                    <div className="aspect-[16/10] relative w-full overflow-hidden bg-black/40">
                      <img src={slide.url} alt="Active Slide" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    </div>
                    
                    <div className="p-4 flex items-center justify-between bg-black/20">
                      <span className="text-[8px] font-mono uppercase tracking-wider text-white/30 truncate max-w-[150px]">
                        ID: {slide.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide)}
                        disabled={deletingSlideId === slide.id}
                        className="px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingSlideId === slide.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Remove</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: PREMIUM GAMES MANAGER */}
        <div id="premium-games-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Premium Games Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Add and remove premium titles available for high-speed PS5 Deluxe bundles</p>
            </div>
          </div>

          {/* Upload Success Alert - Game */}
          <AnimatePresence>
            {gameUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Premium Game Registered!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your premium title was successfully saved and is live. Customers will see it instantly in the high-fidelity PS5 setups Addon drawer.
                    </p>
                    <button
                      onClick={() => setGameUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Premium Title</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Game */}
          {gameFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{gameFormError}</p>
            </div>
          )}

          {/* Upload Form - Game */}
          <form onSubmit={handleGameSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Game Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marvel's Spider-Man 2"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-afterhours-purple transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">PS Store Link</label>
                  <input
                    type="url"
                    required
                    placeholder="https://store.playstation.com/..."
                    value={gameLink}
                    onChange={(e) => setGameLink(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-white/80 focus:outline-none focus:border-afterhours-purple transition-all"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Block for Game Cover */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Cover Image File</label>
                
                <div
                  onDragOver={handleGameDragOver}
                  onDragLeave={handleGameDragLeave}
                  onDrop={handleGameDrop}
                  onClick={() => gameFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition-all ${
                    gameDragActive 
                      ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={gameFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGameFileChange}
                    className="hidden"
                  />

                  {gameCoverPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={gameCoverPreview}
                        alt="Game Cover Preview"
                        className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                      />
                      <div className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeGameCover}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag cover image or <span className="text-afterhours-purple font-bold">browse</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-purple" />
                Saves to Firebase Storage path `game_covers/`
              </span>
              <button
                type="submit"
                disabled={isGameSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isGameSubmitting ? "Uploading title cover..." : "Add Premium Game ➔"}
              </button>
            </div>
          </form>

          {/* Premium Games Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60 font-black">Active Premium Game Library ({premiumGames.length})</h3>
            
            {premiumGames.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No custom premium games uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {premiumGames.map((game) => (
                  <div key={game.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 p-4 text-left flex flex-col justify-between hover:border-white/10 transition-all">
                    <div className="aspect-[3/4] relative w-full overflow-hidden bg-black/40 rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                      <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white line-clamp-1 truncate">{game.title}</h4>
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-afterhours-purple hover:underline font-mono truncate block"
                      >
                        PS Store Link ➔
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteGame(game)}
                        disabled={deletingGameId === game.id}
                        className="w-full py-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingGameId === game.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Removing...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Delete Title</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* TASK 4: SECTION 5: GEAR MEDIA MANAGER */}
        <div id="gear-media-manager-section" className="space-y-6 pt-8 border-t border-white/5 font-sans">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Gear Media Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and configure premium photo or video background assets for Individual Gears</p>
            </div>
          </div>

          {/* Upload Success Alert - Gear */}
          <AnimatePresence>
            {gearUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Gear Media Activated!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your media asset has been uploaded and linked dynamically. Customers on the /rentals page will immediately see this new image/video for this gear.
                    </p>
                    <button
                      onClick={() => setGearUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload More Media</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Gear */}
          {gearFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{gearFormError}</p>
            </div>
          )}

          {/* Interactive Form - Gear */}
          <form onSubmit={handleGearSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                
                {/* Gear Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Select Individual Gear</label>
                  <select
                    value={selectedGearId}
                    onChange={(e) => setSelectedGearId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-afterhours-purple transition-all animate-none"
                  >
                    {ADMIN_GEARS.map((gear) => (
                      <option key={gear.id} value={gear.id} className="bg-[#121214] text-white">
                        {gear.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Detected File Type</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setGearMediaType("image")}
                      className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        gearMediaType === "image"
                          ? "bg-afterhours-purple/15 border-afterhours-purple text-afterhours-purple"
                          : "border-white/5 bg-black/20 text-white/40 hover:text-white"
                      }`}
                    >
                      🖼️ Image / Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setGearMediaType("video")}
                      className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        gearMediaType === "video"
                          ? "bg-afterhours-purple/15 border-afterhours-purple text-afterhours-purple"
                          : "border-white/5 bg-black/20 text-white/40 hover:text-white"
                      }`}
                    >
                      🎬 Video Clip
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Upload for Gear Media */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Upload Media File (Photo/Video)</label>
                
                <div
                  onDragOver={handleGearDragOver}
                  onDragLeave={handleGearDragLeave}
                  onDrop={handleGearDrop}
                  onClick={() => gearFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition-all ${
                    gearDragActive 
                      ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={gearFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleGearFileChange}
                    className="hidden"
                  />

                  {gearMediaPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      {gearMediaType === "video" ? (
                        <video
                          src={gearMediaPreview}
                          controls
                          className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                        />
                      ) : (
                        <img
                          src={gearMediaPreview}
                          alt="Gear Media Preview"
                          className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                        />
                      )}
                      <div className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeGearMedia}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag photo/video or <span className="text-afterhours-purple font-bold">browse</span></p>
                      <p className="text-[9px] text-white/40 uppercase font-mono">Image or MP4 supported</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5 flex-wrap">
                <Plus size={12} className="text-afterhours-purple" />
                Saves dynamically into the `gear_catalog` Firestore doc collection
              </span>
              <button
                type="submit"
                disabled={isGearSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isGearSubmitting ? "Activating gear media..." : "Update Gear Media ➔"}
              </button>
            </div>
          </form>

          {/* Active Gear Catalog Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60 font-black">Active Dynamic Gear Media ({gearCatalogList.length})</h3>
            
            {gearCatalogList.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No dynamic gear media uploaded yet. Default SVG icons will render.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 text-left">
                {gearCatalogList.map((gear) => (
                  <div key={gear.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 p-4 text-left flex flex-col justify-between hover:border-white/10 transition-all">
                    <div className="aspect-square relative w-full overflow-hidden bg-black/40 rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300 flex items-center justify-center">
                      {gear.mediaType === "video" ? (
                        <video src={gear.mediaUrl} className="w-full h-full object-cover rounded-lg" muted autoPlay loop playsInline />
                      ) : (
                        <img src={gear.mediaUrl} alt={gear.gearName} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-white line-clamp-1 truncate">{gear.gearName}</h4>
                      <p className="text-[9px] text-[#90e0d0] font-mono uppercase font-bold">{gear.mediaType === "video" ? "🎬 Video" : "🖼️ Image"}</p>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteGearMedia(gear)}
                        disabled={deletingGearMediaId === gear.id}
                        className="w-full py-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingGearMediaId === gear.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Reset to Default</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </div>
        )}

      </div>

      {/* KYC Lightbox Modal */}
      <AnimatePresence>
        {kycModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setKycModalUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-[#0e0e11] border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="text-xs uppercase font-serif font-black tracking-[0.25em] text-white/80 flex items-center gap-2">
                  <ImageIcon size={14} className="text-afterhours-cyan" />
                  <span>Customer KYC Document Vault</span>
                </h3>
                <button
                  onClick={() => setKycModalUrl(null)}
                  className="p-1.5 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all pointer-events-auto cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="aspect-[4/3] w-full relative overflow-hidden bg-black/60 rounded-2xl border border-white/5 flex items-center justify-center">
                <img
                  src={kycModalUrl}
                  alt="KYC Verification File"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <a
                  href={kycModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center"
                >
                  Open Original ➔
                </a>
                <button
                  onClick={() => setKycModalUrl(null)}
                  className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-afterhours-cyan text-black hover:scale-[1.01] active:scale-[0.99] rounded-xl transition-all cursor-pointer font-bold"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
