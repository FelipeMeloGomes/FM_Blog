import { useMemo, useState } from "react";
import { FiBookmark, FiSearch } from "react-icons/fi";
import { EmptyState } from "../../components/EmptyState";
import { Pagination } from "../../components/Pagination";
import { PostCard } from "../../components/PostCard";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuthValue } from "../../contexts/AuthContext";
import { useFetchDocuments } from "../../hooks/useFetchDocuments";
import { useSavedPosts } from "../../hooks/useSavedPosts";

interface Post {
  id: string;
  title: string;
  image: string;
  createdBy: string;
  photoURL?: string;
  tagsArray: string[];
  body?: string;
  description?: string;
  createdAt?: unknown;
  likes?: string[];
}

const POSTS_PER_PAGE = 6;

const SavedPosts = () => {
  const { user } = useAuthValue() || {};
  const { savedPostIds, loading: savedLoading } = useSavedPosts();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { documents: allPosts, loading: postsLoading } = useFetchDocuments(
    "posts",
    null,
    null,
    100
  );

  const savedPosts: Post[] = (allPosts || [])
    .filter((post): post is Post => savedPostIds.includes(post.id!))
    .map((post) => ({
      id: post.id!,
      title: post.title || "",
      image: post.image || "",
      createdBy: post.createdBy || "",
      photoURL: post.photoURL,
      tagsArray: post.tagsArray || [],
      body: post.body,
      description: post.description,
      createdAt: post.createdAt,
      likes: post.likes,
    }));

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return savedPosts;

    const query = searchQuery.toLowerCase().trim();
    return savedPosts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const tagsMatch = post.tagsArray?.some((tag) => tag.toLowerCase().includes(query));
      return titleMatch || tagsMatch;
    });
  }, [savedPosts, searchQuery]);

  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (savedLoading || postsLoading) {
    return (
      <div className="flex flex-col gap-10 w-full">
        <div className="flex flex-col gap-2 animate-fade-in">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border">
              <Skeleton className="h-[200px] w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight">
          Posts <span className="text-primary">Salvos</span>
        </h1>
        <EmptyState
          icon={<FiBookmark />}
          title="Faça login para ver seus posts salvos"
          description="Salve posts para ler depois."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full">
      <header className="flex flex-col gap-1 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight">
          Posts <span className="text-primary">Salvos</span>
        </h1>
        <p className="text-muted-foreground">
          {searchQuery.trim()
            ? `${totalPosts} de ${savedPosts.length} posts`
            : `${totalPosts} ${totalPosts === 1 ? "post salvo" : "posts salvos"}`}
        </p>
      </header>

      {savedPosts.length > 0 && (
        <div className="max-w-[600px] mx-auto w-full animate-slide-in-from-bottom-4 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título ou tag..."
              aria-label="Buscar posts salvos"
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 pl-12 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
          </div>
        </div>
      )}

      {savedPosts.length === 0 ? (
        <EmptyState
          icon={<FiBookmark />}
          title="Nenhum post salvo"
          description="Salve posts para ler depois."
          action={{
            label: "Explorar posts",
            onClick: () => {
              window.location.href = "/";
            },
          }}
        />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={<FiSearch />}
          title="Nenhum resultado encontrado"
          description={`Não encontramos posts para "${searchQuery}"`}
          action={searchQuery ? { label: "Limpar busca", onClick: clearSearch } : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {paginatedPosts.map((post, index) => (
              <div
                key={post.id}
                className="animate-slide-in-from-bottom-4 opacity-0"
                style={{ animationDelay: `${(index + 3) * 100}ms`, animationFillMode: "forwards" }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SavedPosts;
