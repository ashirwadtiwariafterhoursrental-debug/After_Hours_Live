import { useState, useEffect } from "react";
import { collection, getDocs, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, User, ArrowRight, X, Clock, Loader2, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverPhotoUrl: string;
  createdAt: any;
}

export function Blog() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      setError("");
      const blogsPath = "blogs";
      try {
        const querySnapshot = await getDocs(collection(db, blogsPath));
        const fetchedBlogs: BlogPost[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "",
          content: doc.data().content || "",
          coverPhotoUrl: doc.data().coverPhotoUrl || "https://picsum.photos/seed/placeholder/800/600",
          createdAt: doc.data().createdAt,
        }));

        // Robust client-side sort by date descending
        fetchedBlogs.sort((a, b) => {
          const dateA = a.createdAt?.seconds 
            ? a.createdAt.seconds * 1000 
            : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const dateB = b.createdAt?.seconds 
            ? b.createdAt.seconds * 1000 
            : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return dateB - dateA;
        });

        setBlogs(fetchedBlogs);
      } catch (err: any) {
        console.warn("Unable to fetch blogs from Cloud Firestore backend, switching to high-fidelity curated offline mode articles.", err);
        const fallbackBlogs: BlogPost[] = [
          {
            id: "fallback-blog-1",
            title: "Introducing PlaySafe: Noida's Elite Zero-Deposit Gaming Rig Deliveries Are Live!",
            content: `Gamers across Delhi NCR, rejoice! After Hours is proud to introduce PlaySafe, our brand-new service tailored for hassle-free, premium gaming setups delivered right to your doorstep. We are redefining the entertainment landscape by offering complete zero-deposit access to custom-built VR headgear, PlayStation 5 consoles, and dynamic racing simulation cockpits.\n\nWhether you're planning a weekend championship with roommates in Gurgaon or a late-night immersive escape in Noida, our premium at-home drops ensure you get the absolute best hardware—completely plug-and-play. Connect with our concierge desk today to secure your custom weekend gear catalog.`,
            coverPhotoUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop&q=70",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 2, nanoseconds: 0 }
          },
          {
            id: "fallback-blog-2",
            title: "How We Built Delhi NCR's Largest Premium At-Home Gaming Fleet",
            content: `Building high-performance corporate employee engagement solutions and private gaming rigs is no simple task. This long-form story chronicles After Hours' engineering journey, diving deep into our hardware standards, custom-configured thermal controls, and bespoke transportation logistics.\n\nWe select our rigs using military-grade flight cases and specialized anti-shock mounts. Each system is dynamically inspected prior to dispatch, ensuring absolute stability for high-intensity multi-hour campaigns. Read more to explore how corporate spaces in Noida are using our multiplayer setups to boost employee collaboration and culture.`,
            coverPhotoUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=70",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 5, nanoseconds: 0 }
          },
          {
            id: "fallback-blog-3",
            title: "The Ultimate Guide to Virtual Reality (VR) Activations for Your Corporate Office",
            content: `Virtual Reality has left the realm of novelty and settled firmly into a dynamic, highly productive framework for team building and employee appreciation. Our expert operator team shares essential checklists, game modes, space requirements, and sanitary measures to host an unforgettable immersive afternoon at your corporate headquarters.\n\nFrom high-velocity virtual rhythm challenges to collaborative architectural walkthroughs, discover the perfect premium VR experiences that match your brand identity and trigger unforgettable employee satisfaction. Get in touch with our NCR coordinators for custom package pricing.`,
            coverPhotoUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=70",
            createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 10, nanoseconds: 0 }
          }
        ];
        setBlogs(fallbackBlogs);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Recent Story";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getEstimatedReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // 200 wpm average
    return `${readingTime} min read`;
  };

  return (
    <div id="public-blog-view" className="min-h-screen bg-slate-50 text-slate-800 pt-32 pb-24 relative overflow-hidden selection:bg-blue-100 selection:text-[#003791]">
      {/* Background radial glowing decorations */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Page Title Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-xs uppercase tracking-[0.4em] text-[#003791] font-black block mb-4">
            Official Feed & Press Releases
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.9] tracking-tighter text-slate-800 mb-6">
            The After <br />
            <span className="text-[#003791]">Hours Chronicle</span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Stay in the loop with dynamic tournament updates, premium at-home product drops, and corporate employee activation trends across Delhi NCR.
          </p>
        </div>

        {/* Loading UI State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#003791]" />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-mono animate-pulse font-bold">
              Retrieving Broadcast Logs...
            </p>
          </div>
        )}

        {/* Error UI State */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 border border-red-200 text-center text-red-700">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-sm font-semibold mb-2">{error}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              If the error persists, there may be temporary network interference. Feel free to re-check.
            </p>
          </div>
        )}

        {/* Empty Collection State */}
        {!isLoading && !error && blogs.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-16 bg-white border border-slate-200 p-10 rounded-[40px] shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold uppercase italic text-slate-800 mb-2">No Stories Broadcaster Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Our operators are finalizing the initial logs. Click the operator gateway at the bottom of the page to author the first chronicle!
            </p>
          </div>
        )}

        {/* Dynamic Cards Grid */}
        {!isLoading && !error && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex flex-col bg-white border border-slate-200 hover:border-[#003791]/35 rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
              >
                {/* Cover Image Container */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={blog.coverPhotoUrl}
                    alt={blog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4 bg-[#003791] border border-[#003791] text-white font-mono uppercase text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest">
                    Chronicle Log
                  </div>
                </div>

                {/* Content Block */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Timestamp & Reading Time */}
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase font-mono mb-4">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Calendar size={12} className="text-[#003791]" />
                        {formatTimestamp(blog.createdAt)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock size={12} className="text-[#003791]" />
                        {getEstimatedReadingTime(blog.content)}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black uppercase italic leading-tight text-slate-800 mb-4 group-hover:text-[#003791] transition-colors">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-3">
                      {blog.content}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveBlog(blog)}
                    className="self-start text-[10px] font-black uppercase tracking-widest text-[#003791] hover:text-blue-900 transition-colors flex items-center gap-2 mt-4 cursor-pointer font-bold"
                  >
                    <span>Read Full Story</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Immersive Reading Modal Overlay */}
      <AnimatePresence>
        {activeBlog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9000] flex items-center justify-center p-4 md:p-6"
            onClick={() => setActiveBlog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 25 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white border border-slate-200 rounded-[36px] w-full max-w-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover Header Image */}
              <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden relative border-b border-slate-200">
                <img
                  src={activeBlog.coverPhotoUrl}
                  alt={activeBlog.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-80" />
                
                {/* Close Button Inside Cover */}
                <button
                  onClick={() => setActiveBlog(null)}
                  className="absolute top-6 right-6 bg-white hover:bg-slate-100 text-slate-800 hover:text-[#003791] p-2.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-lg z-20 hover:scale-105"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Writing details */}
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase font-mono mb-6 pb-4 border-b border-slate-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Calendar size={12} className="text-[#003791]" />
                    {formatTimestamp(activeBlog.createdAt)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 font-bold">
                    <Clock size={12} className="text-[#003791]" />
                    {getEstimatedReadingTime(activeBlog.content)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 animate-pulse bg-green-600" />
                  <span className="flex items-center gap-1.5 text-green-700 font-bold">
                    <User size={12} />
                    Verified Operator
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black italic uppercase leading-none tracking-tight mb-8 text-slate-800">
                  {activeBlog.title}
                </h2>

                <div className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap space-y-4 font-sans">
                  {activeBlog.content}
                </div>

                {/* Return button */}
                <div className="mt-12 pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setActiveBlog(null)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Return to Feed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
