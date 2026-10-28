import { FiFileText } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { Pagination } from "../../components/Pagination";
import { PostCard } from "../../components/PostCard";
import { PostListSkeleton } from "../../components/PostListSkeleton";
import { SearchForm } from "../../components/SearchForm";
import { useAuthValue } from "../../contexts/AuthContext";
import { usePaginatedDocuments } from "../../hooks/usePaginatedDocuments";
import { useSearchPost } from "../../hooks/useSearchPost";

const Home = () => {
  const navigate = useNavigate();
  const [_searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthValue() ?? {};

  const { posts, loading, currentPage, totalPages, goToPage, isLoadingPage } =
    usePaginatedDocuments("posts", null, null, 6);

  const { handleSubmit } = useSearchPost();

  const postsArray = (posts || []) as Array<{
    id: string;
    title: string;
    image: string;
    createdBy: string;
    tagsArray: string[];
    body?: string;
    description?: string;
    createdAt?: unknown;
    likes?: string[];
  }>;

  const handlePageChange = (page: number) => {
    if (page === 1) {
      setSearchParams({});
    } else {
      setSearchParams({ page: String(page) });
    }
    goToPage(page);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-xl">
          <h1 className="text-4xl font-bold font-heading tracking-tight">Os últimos posts</h1>
          <p className="text-muted-foreground text-lg">
            Textos sobre desenvolvimento, design e tecnologia.
          </p>
        </div>
        <PostListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-center gap-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight">
          Os últimos <span className="text-primary">posts</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg">
          Textos sobre desenvolvimento, design e tecnologia.
        </p>
      </div>

      <SearchForm handleSubmit={handleSubmit} />

      {postsArray.length === 0 ? (
        <EmptyState
          icon={<FiFileText />}
          title="Nenhum post ainda"
          description="Seja o primeiro a publicar algo incrível aqui."
          action={
            user?.isAuthor
              ? { label: "Criar primeiro post", onClick: () => navigate("/posts/create") }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsArray.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoadingPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
