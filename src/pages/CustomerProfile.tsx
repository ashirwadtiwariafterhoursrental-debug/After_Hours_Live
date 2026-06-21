import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  MapPin, 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  LogOut, 
  Save, 
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  BookmarkCheck,
  Smartphone
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  kycUrl?: string;
  kycFileName?: string;
  kycStatus?: "unverified" | "pending" | "verified";
  updatedAt?: string;
}

export function CustomerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Profile data state
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    address: "",
    kycUrl: "",
    kycFileName: "",
    kycStatus: "unverified"
  });

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Authenticate user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthLoading(false);
        // Load additional details from Firestore 'users/{uid}'
        await fetchUserData(user.uid, user.email || "");
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
        navigate("/customer-login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (uid: string, fallbackEmail: string) => {
    setIsProfileLoading(true);
    setProfileError("");
    const userPath = `users/${uid}`;
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || auth.currentUser?.displayName || "",
          email: data.email || fallbackEmail,
          phone: data.phone || "",
          address: data.address || "",
          kycUrl: data.kycUrl || "",
          kycFileName: data.kycFileName || "",
          kycStatus: data.kycStatus || "unverified"
        });
      } else {
        // Document does not exist yet (e.g. Google sign up or missing registration init)
        setProfile({
          name: auth.currentUser?.displayName || "",
          email: fallbackEmail,
          phone: "",
          address: "",
          kycUrl: "",
          kycFileName: "",
          kycStatus: "unverified"
        });
      }
    } catch (err: any) {
      console.error("Error retrieving user profile info:", err);
      try {
        handleFirestoreError(err, OperationType.GET, userPath);
      } catch (wrappedErr: any) {
        setProfileError("Could not retrieve some account information securely.");
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSaving(true);
    setProfileSuccess("");
    setProfileError("");

    const userPath = `users/${currentUser.uid}`;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      // Save entire object with correct fields
      const updatedFields = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userRef, updatedFields, { merge: true });
      setProfileSuccess("Your profile details have been saved securely.");
      
      // Clear message after 4s
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err: any) {
      console.error("Failed to save profile user records:", err);
      setProfileError("Failure during record update. Please complete all fields.");
      try {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      } catch (wrappedErr) {
        // Soft error report
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Logic for KYC file (Storage + Firestore)
  const uploadKycFile = async (file: File) => {
    if (!currentUser) return;
    
    // Check file size limit (let's say 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size allowed is 8MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress(10); // initial tick

    try {
      // Create Storage Reference inside kyc_uploads/[UserUID]/[filename]
      const storagePath = `kyc_uploads/${currentUser.uid}/${file.name}`;
      const storageRef = ref(storage, storagePath);

      // Perform direct upload
      setUploadProgress(35);
      const uploadResult = await uploadBytes(storageRef, file);
      
      setUploadProgress(70);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      setUploadProgress(90);

      // Save reference to user document
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        kycUrl: downloadUrl,
        kycFileName: file.name,
        kycStatus: "pending",
        updatedAt: new Date().toISOString()
      });

      // Update local state smoothly
      setProfile(prev => ({
        ...prev,
        kycUrl: downloadUrl,
        kycFileName: file.name,
        kycStatus: "pending"
      }));

      setUploadProgress(100);
      setUploadSuccess("Your identification proof was uploaded successfully.");
      
      // Clear success feedback
      setTimeout(() => setUploadSuccess(""), 5000);
    } catch (err: any) {
      console.error("KYC File push failed:", err);
      setUploadError(err.message || "Failed to complete KYC attachment. Provide a PDF or image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadKycFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadKycFile(file);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/customer-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#003791]" />
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-mono animate-pulse">
          Validating Member Crypt...
        </p>
      </div>
    );
  }

  return (
    <div id="customer-profile-view" className="min-h-screen bg-slate-50 text-slate-800 pt-32 pb-24 relative overflow-hidden">
      {/* Dynamic graphic backgrounds */}
      <div className="absolute top-[10%] left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        
        {/* Profile Heading Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase tracking-[0.3em] text-[#003791] font-extrabold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Premium Club Membership
              </span>
              {profile.kycStatus === "unverified" && (
                <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert size={12} /> Unverified
                </span>
              )}
              {profile.kycStatus === "pending" && (
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-amber-600" /> Pending Review
                </span>
              )}
              {profile.kycStatus === "verified" && (
                <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="shrink-0 text-emerald-600" /> Verified Elite
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-800">
              My Profile Dashboard
            </h1>
            <p className="text-slate-600 text-xs md:text-sm mt-1 max-w-xl">
              Manage your delivery coordinates and verify accounts for quick, hassle-free gaming rig rentals.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-rose-600 transition-all cursor-pointer shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>

        {/* Informative KYC Status Panel */}
        <AnimatePresence>
          {profile.kycStatus === "unverified" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 p-6 bg-amber-50 rounded-3xl border border-amber-200 flex items-start gap-4 text-amber-800"
            >
              <ShieldAlert className="w-6 h-6 shrink-0 text-amber-600 mt-1" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider italic">ID Verification Required</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  To book our premium setups without standard high security cash deposits, we require a scan or photo or proof of your Corporate ID/Gov Card. Simply drop your credentials in Section B below!
                </p>
              </div>
            </motion.div>
          )}

          {profile.kycStatus === "pending" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-200 flex items-start gap-4 text-blue-800"
            >
              <Sparkles className="w-6 h-6 shrink-0 text-[#003791] mt-1 animate-pulse" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider italic">Verification Check in Progress</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Our system operator team has received your reference file <strong className="text-[#003791]">"{profile.kycFileName}"</strong>. We are matching credentials with standard directories within Delhi NCR. Once approved, your status will instantly transition to <strong className="text-[#003791] font-bold">Verified Elite</strong>.
                </p>
              </div>
            </motion.div>
          )}

          {profile.kycStatus === "verified" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-200 flex items-start gap-4 text-emerald-800"
            >
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 mt-1" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider italic">Elite Member Verified</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Host-ready verification completed! You now have fully unrestricted access to request premium setups (VR headgear, PlayStation 5 bundles, Racing Cockpits) with complete zero-deposit privileges.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Grid Panel Left: Form details */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[40px] p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-black uppercase italic text-slate-800 mb-6 flex items-center gap-2">
                <User size={18} className="text-[#003791]" />
                <span>Section A: Personal Coordinates</span>
              </h3>

              {profileSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs">
                  <BookmarkCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-mono">{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-mono">{profileError}</span>
                </div>
              )}

              {isProfileLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#003791]" />
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Fetching fields from DB...</span>
                </div>
              ) : (
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block ml-1 font-mono">
                      Full Registered Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="e.g. Raghav Sharma"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block ml-1 font-mono">
                        Primary Email (Static)
                      </label>
                      <div className="relative opacity-60">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                          <User size={16} />
                        </span>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block ml-1 font-mono">
                        WhatsApp Contact Phone
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                          <Phone size={16} />
                        </span>
                        <input
                          type="tel"
                          required
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="e.g. +91 99999 88888"
                          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-500 block ml-1 font-mono">
                      Default Delivery Physical Address (Noida, Delhi, Gurgaon)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 pt-4 flex items-start text-slate-400">
                        <MapPin size={16} />
                      </span>
                      <textarea
                        required
                        rows={3}
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Provide deep details: Apartment/Office floor block, building name, landmark, and pin code."
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-[#003791] hover:bg-blue-800 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#003791]" />
                        <span>Saving coordinates...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Update Personal Details</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Grid Panel Right: KYC Upload zone */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[40px] p-6 md:p-8 flex flex-col justify-between h-full shadow-sm">
              <div>
                <h3 className="text-lg font-black uppercase italic text-slate-800 mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#003791]" />
                  <span>Section B: KYC Upload</span>
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-mono">
                  VERIFY ID (UPLOAD CORPORATE / GOV PROOF)
                </p>

                {uploadSuccess && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-[11px] font-mono leading-relaxed">
                    {uploadSuccess}
                  </div>
                )}

                {uploadError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-[11px] font-mono leading-relaxed flex items-start gap-1.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* File Drop Drag Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${
                    dragActive 
                      ? "border-[#003791] bg-blue-50/50" 
                      : "border-slate-200 hover:border-[#003791]/50 bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="py-6 flex flex-col items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-[#003791] animate-spin" />
                        <span className="absolute text-[10px] font-extrabold font-mono text-[#003791]">
                          {uploadProgress}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
                        Pushing File...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-[#003791]/30 group-hover:bg-blue-50/20 transition-all">
                        <UploadCloud className="text-slate-400 group-hover:text-[#003791] transition-colors" size={28} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-[#003791] transition-colors">
                          Click or Drag File here
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed max-w-[180px] mx-auto">
                          Accepts PNG, JPG, PDF (Max file size 8MB).
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Display current KYC File reference */}
                {profile.kycUrl && (
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText size={16} className="text-[#003791] shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 uppercase truncate">
                          {profile.kycFileName || "Verification ID Doc"}
                        </p>
                        <a 
                          href={profile.kycUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-[#003791] hover:underline font-mono"
                        >
                          View Uploaded Proof
                        </a>
                      </div>
                    </div>
                    <div>
                      {profile.kycStatus === "pending" && (
                        <span className="text-[9px] uppercase font-bold text-amber-700 font-mono bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                          Reviewing
                        </span>
                      )}
                      {profile.kycStatus === "verified" && (
                        <span className="text-[9px] uppercase font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                          Approved
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 text-center bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest font-mono">
                  🛡️ GDPR Compliant & AES Encrypted Storage.
                </p>
                <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                  Uploaded files are only accessible to system operators for identity validation.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
