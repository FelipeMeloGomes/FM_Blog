import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiBarChart,
  FiCheck,
  FiEdit,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiMoreVertical,
  FiTrash,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { Pagination } from "../../components/Pagination";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuthValue } from "../../contexts/AuthContext";
import { useDeleteDocument } from "../../hooks/useDeleteDocument";
import { useMetrics } from "../../hooks/useMetrics";
import { usePostsViews } from "../../hooks/usePostsViews";
import { useUserPosts } from "../../lib/hooks/usePostsQuery";
import { calculateReadTime, formatDateShort } from "../../utils/date";
import { useSessionStorage } from "../../hooks/useSessionStorage";

interface MenuDropdownProps {
  postId: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const MenuDropdown = ({ postId, isOpen, onToggle, onDelete }: MenuDropdownProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.right - 160,
    });
  }, []);

  const handleToggle = () => {
    updatePosition();
    onToggle();
  };

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        onToggle();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="p-2.5 hover:bg-secondary/80 rounded-lg transition-all duration-200 hover:scale-105"
        aria-label="Opções do post"
        onClick={handleToggle}
      >
        <FiMoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] py-1.5 min-w-[160px] bg-card rounded-xl border shadow-xl origin-top-right animate-in fade-in zoom-in-95 duration-150"
            style={{ top: position.top, left: position.left }}
          >
            <a
              href={`/posts/edit/${postId}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/80 transition-colors"
            >
              <FiEdit className="h-4 w-4 text-muted-foreground" />
              Editar
            </a>
            <a
              href={`/posts/${postId}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/80 transition-colors"
            >
              <FiEye className="h-4 w-4 text-muted-foreground" />
              Ver post
            </a>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-secondary/80 transition-colors"
            >
              <FiTrash className="h-4 w-4" />
              Deletar
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

const POSTS_PER_PAGE = 5;

type SortOption = "recent" | "oldest" | "mostLiked" | "titleAsc" | "titleDesc";

interface PostData {
  id: string;
  title: string;
  body: string;
  createdAt?: unknown;
  createdBy: string;
  image: string;
  likes?: string[];
  likeCount?: number;
  photoURL: string;
  tagsArray: string[];
  uid: string;
  views?: number;
}

const getDateSeconds = (timestamp: unknown): number => {
  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return (timestamp as { seconds: number }).seconds || 0;
  }
  return 0;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthValue() || {};
  const uid = user?.uid;
  const { data: posts, isLoading } = useUserPosts(uid, 100);
  const { metrics, loading: metricsLoading } = useMetrics(uid);
  const { deleteDocument } = useDeleteDocument("posts");

  const [searchQuery, setSearchQuery] = useSessionStorage("dashboard-search", "");
  const [sortBy, setSortBy] = useSessionStorage<SortOption>("dashboard-sort", "recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postTitleToDelete, setPostTitleToDelete] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const postsArray = useMemo(() => {
    return (posts || []) as PostData[];
  }, [posts]);

  const postIds = useMemo(() => postsArray.map((p) => p.id), [postsArray]);
  const { viewsMap } = usePostsViews(postIds);

  const filteredPosts = useMemo(() => {
    let result = [...postsArray];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const tagsMatch = post.tagsArray?.some((tag) => tag.toLowerCase().includes(query));
        return titleMatch || tagsMatch;
      });
    }

    result.sort((a, b) => {
      const dateA = getDateSeconds(a.createdAt);
      const dateB = getDateSeconds(b.createdAt);

      switch (sortBy) {
        case "recent":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "mostLiked":
          return (b.likeCount || 0) - (a.likeCount || 0);
        case "titleAsc":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [postsArray, searchQuery, sortBy]);

  const totalFilteredPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalFilteredPosts / POSTS_PER_PAGE);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = (postId: string, postTitle: string) => {
    setPostToDelete(postId);
    setPostTitleToDelete(postTitle);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedIds.size > 0) {
        await Promise.all([...selectedIds].map((id) => deleteDocument(id)));
      } else if (postToDelete) {
        await deleteDocument(postToDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["posts", "user", uid] });
    } catch (error) {
      console.error("Erro ao deletar post(s):", error);
    }

    setIsOpen(false);
    setPostToDelete(null);
    setPostTitleToDelete("");
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };

  const toggleSelect = (postId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPosts.map((p) => p.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPosts = postsArray.length;

  const getCountText = () => {
    if (searchQuery.trim()) {
      return `${totalFilteredPosts} de ${totalPosts} posts`;
    }
    return `${totalPosts} ${totalPosts === 1 ? "post publicado" : "posts publicados"}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {metrics && !metricsLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Posts" value={metrics.totalPosts} icon={FiBarChart} />
          <MetricCard title="Visualizações" value={metrics.totalViews} icon={FiEye} />
          <MetricCard title="Curtidas" value={metrics.totalLikes} icon={FiHeart} />
          <MetricCard title="Comentários" value={metrics.totalComments} icon={FiMessageCircle} />
        </div>
      )}

      {metricsLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Meus posts</h1>
          <p className="text-sm text-muted-foreground">{getCountText()}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isSelectMode ? (
            <Button
              onClick={toggleSelectMode}
              variant="ghost"
              size="sm"
              className="flex-1 sm:flex-initial gap-2"
            >
              <FiX className="h-4 w-4" />
              Cancelar
            </Button>
          ) : (
            <Button
              onClick={toggleSelectMode}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              Selecionar
            </Button>
          )}
          {user?.isAuthor && (
            <Button
              onClick={() => navigate("/posts/create")}
              size="sm"
              className="flex-1 sm:flex-initial gap-2"
            >
              <FiEdit className="h-4 w-4" />
              Novo post
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar nos meus posts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pr-10 h-11"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="h-11 px-4 rounded-lg border border-input bg-background text-sm w-full sm:w-[200px]"
        >
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="mostLiked">Mais curtidos</option>
          <option value="titleAsc">Título A → Z</option>
          <option value="titleDesc">Título Z → A</option>
        </select>
      </div>

      {totalPosts === 0 ? (
        <EmptyState
          icon={<FiEdit />}
          title="Você ainda não publicou nada"
          description="Seus posts aparecerão aqui depois que você publicar."
          action={
            user?.isAuthor
              ? { label: "Escrever primeiro post", onClick: () => navigate("/posts/create") }
              : undefined
          }
        />
      ) : totalFilteredPosts === 0 ? (
        <EmptyState
          icon={<FiEdit />}
          title="Nenhum resultado encontrado"
          description={`Não encontramos posts para "${searchQuery}".`}
          action={searchQuery ? { label: "Limpar busca", onClick: clearSearch } : undefined}
        />
      ) : (
        <>
          {isSelectMode && (
            <div className="flex items-center gap-4 py-3 px-4 bg-primary/5 border border-primary/20 rounded-xl">
              <Checkbox
                checked={selectedIds.size === paginatedPosts.length && paginatedPosts.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selecionado${selectedIds.size !== 1 ? "s" : ""}`
                  : "Selecionar todos"}
              </span>
              <Button
                onClick={() => setIsOpen(true)}
                size="sm"
                variant="destructive"
                disabled={selectedIds.size === 0}
                className="ml-auto gap-2"
              >
                <FiTrash className="h-4 w-4" />
                Deletar
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {paginatedPosts.map((post, index) => {
              const readTime = calculateReadTime(post.body);
              const formattedDate = formatDateShort(post.createdAt);
              const isSelected = selectedIds.has(post.id);

              return (
                <div
                  key={post.id}
                  onClick={() => isSelectMode && toggleSelect(post.id)}
                  onKeyDown={(e) =>
                    isSelectMode && (e.key === "Enter" || e.key === " ") && toggleSelect(post.id)
                  }
                  aria-selected={isSelectMode ? isSelected : undefined}
                  tabIndex={isSelectMode ? 0 : -1}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`group flex items-center gap-4 p-4 bg-card rounded-xl border border-transparent transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-border/50 hover:shadow-sm"
                  } ${isSelectMode ? "cursor-pointer" : ""}`}
                >
                  {isSelectMode && (
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                      }`}
                    >
                      {isSelected && <FiCheck className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  )}

                  <div className="relative flex-shrink-0">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-14 h-14 rounded-lg object-cover ring-1 ring-border/50"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <FiCheck className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <a
                      href={`/posts/${post.id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary truncate block transition-colors"
                      onClick={(e) => isSelectMode && e.preventDefault()}
                    >
                      {post.title}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formattedDate}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{readTime} min de leitura</span>
                      {post.tagsArray.length > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span className="truncate max-w-[100px]">{post.tagsArray[0]}</span>
                          {post.tagsArray.length > 1 && (
                            <span className="text-muted-foreground/60">
                              +{post.tagsArray.length - 1}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {!isSelectMode && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <FiEye className="h-3.5 w-3.5" />
                          {viewsMap[post.id] || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiHeart className="h-3.5 w-3.5" />
                          {post.likeCount || 0}
                        </span>
                      </div>
                      <MenuDropdown
                        postId={post.id}
                        isOpen={openMenuId === post.id}
                        onToggle={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                        onDelete={() => confirmDelete(post.id, post.title)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl p-6 max-w-md mx-4 shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-red-500/10">
                <FiTrash className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold">
                {selectedIds.size > 1 ? "Deletar posts" : "Deletar post"}
              </h2>
            </div>
            <div className="mb-6 space-y-1.5 text-muted-foreground">
              <p className="break-words">
                {selectedIds.size > 0 ? (
                  <>
                    Tem certeza que deseja deletar{" "}
                    <span className="font-semibold text-foreground">
                      {selectedIds.size} {selectedIds.size === 1 ? "post" : "posts"}
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Tem certeza que deseja deletar{" "}
                    <span className="font-semibold text-foreground">"{postTitleToDelete}"</span>?
                  </>
                )}
              </p>
              <p>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1 gap-2">
                <FiTrash className="h-4 w-4" />
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
