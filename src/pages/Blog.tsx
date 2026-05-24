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
        console.error("Error fetching blogs:", err);
        setError("Unable to load latest stories. Please try again later.");
        try {
          handleFirestoreError(err, OperationType.LIST, blogsPath);
        } catch (wrappedErr) {
          // Keep failure logged inside console
        }
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
    <div id="public-blog-view" className="min-h-screen bg-afterhours-black text-white pt-32 pb-24 relative overflow-hidden">
      {/* Background radial glowing decorations */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-afterhours-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Page Title Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-xs uppercase tracking-[0.4em] text-afterhours-purple font-black block mb-4">
            Official Feed & Press Releases
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.9] tracking-tighter mb-6">
            The After <br />
            <span className="text-afterhours-cyan">Hours Chronicle</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Stay in the loop with dynamic tournament updates, premium at-home product drops, and corporate employee activation trends across Delhi NCR.
          </p>
        </div>

        {/* Loading UI State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-afterhours-purple" />
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-mono animate-pulse">
              Retrieving Broadcast Logs...
            </p>
          </div>
        )}

        {/* Error UI State */}
        {!isLoading && error && (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-950/20 border border-red-500/20 text-center text-rose-300">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-sm font-semibold mb-2">{error}</p>
            <p className="text-xs text-white/40 leading-relaxed">
              If the error persists, there may be temporary network interference. Feel free to re-check.
            </p>
          </div>
        )}

        {/* Empty Collection State */}
        {!isLoading && !error && blogs.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-16 bg-white/[0.01] border border-white/5 p-10 rounded-[40px]">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-6" />
            <h3 className="text-xl font-bold uppercase italic text-white mb-2">No Stories Broadcaster Yet</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-6">
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
                className="group flex flex-col bg-afterhours-gray/30 border border-white/5 hover:border-afterhours-purple/20 backdrop-blur-md rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              >
                {/* Cover Image Container */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={blog.coverPhotoUrl}
                    alt={blog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-afterhours-black via-transparent to-transparent opacity-60" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md border border-white/10 text-white font-mono uppercase text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest">
                    Chronicle Log
                  </div>
                </div>

                {/* Content Block */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Timestamp & Reading Time */}
                    <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-mono mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-afterhours-purple" />
                        {formatTimestamp(blog.createdAt)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-afterhours-cyan" />
                        {getEstimatedReadingTime(blog.content)}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black uppercase italic leading-tight text-white mb-4 group-hover:text-afterhours-cyan transition-colors">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-white/50 leading-relaxed mb-6 line-clamp-3">
                      {blog.content}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveBlog(blog)}
                    className="self-start text-[10px] font-black uppercase tracking-widest text-[#90e0d0] hover:text-white transition-colors flex items-center gap-2 mt-4 cursor-pointer"
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
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9000] flex items-center justify-center p-4 md:p-6"
            onClick={() => setActiveBlog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 25 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-afterhours-black border border-white/10 rounded-[36px] w-full max-w-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover Header Image */}
              <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden relative border-b border-white/5">
                <img
                  src={activeBlog.coverPhotoUrl}
                  alt={activeBlog.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-afterhours-black via-transparent to-transparent opacity-80" />
                
                {/* Close Button Inside Cover */}
                <button
                  onClick={() => setActiveBlog(null)}
                  className="absolute top-6 right-6 bg-black/60 hover:bg-black text-white hover:text-afterhours-pink p-2.5 rounded-full border border-white/15 transition-colors cursor-pointer shadow-lg z-20 hover:scale-105"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Writing details */}
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-mono mb-6 pb-4 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-afterhours-purple" />
                    {formatTimestamp(activeBlog.createdAt)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-afterhours-cyan" />
                    {getEstimatedReadingTime(activeBlog.content)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20 animate-pulse bg-afterhours-green" />
                  <span className="flex items-center gap-1.5 text-afterhours-green font-bold">
                    <User size={12} />
                    Verified Operator
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black italic uppercase leading-none tracking-tight mb-8 text-white">
                  {activeBlog.title}
                </h2>

                <div className="text-sm text-white/70 leading-relaxed font-normal whitespace-pre-wrap space-y-4">
                  {activeBlog.content}
                </div>

                {/* Return button */}
                <div className="mt-12 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => setActiveBlog(null)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white/80 hover:text-white transition-all cursor-pointer"
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
