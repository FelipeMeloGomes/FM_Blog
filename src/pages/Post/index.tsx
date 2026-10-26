import { FiArrowLeft, FiBookmark, FiEye } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { Comments } from "../../components/Comments";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { LikeButton } from "../../components/LikeButton";
import { PostDetailSkeleton } from "../../components/PostDetailSkeleton";
import { RelatedPosts } from "../../components/RelatedPosts";
import { ShareButton } from "../../components/ShareButton";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { useAuthValue } from "../../contexts/AuthContext";
import { usePostViews } from "../../hooks/usePostViews";
import { useRelatedPosts } from "../../hooks/useRelatedPosts";
import { useSavedPosts } from "../../hooks/useSavedPosts";
import { useViewCount } from "../../hooks/useViewCount";
import { usePost } from "../../lib/hooks/usePostsQuery";
import { handleShare } from "../../utils/ShareContent";
import type { Post as PostType } from "../../utils/ShareContent/types";
import { calculateReadTime, formatDate } from "../../utils/date";
import { sanitizeHtml } from "../../utils/sanitize";

const Post = () => {
  const { user } = useAuthValue() || {};
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id);

  usePostViews(id, user?.uid);
  const viewCount = useViewCount(id);
  const { isSaved, toggleSave } = useSavedPosts();
  const { relatedPosts, loading: relatedLoading } = useRelatedPosts(
    post?.id,
    post?.tagsArray || []
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PostDetailSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-300">
        <p className="text-muted-foreground">Post não encontrado</p>
      </div>
    );
  }

  const readTime = calculateReadTime(String(post.body || ""));
  const formattedDate = formatDate(post.createdAt);
  const isOwner = user?.uid === post.uid;

  return (
    <article className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
      <header className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-border/50">
            <AvatarImage src={post.photoURL} />
            <AvatarFallback className="text-base">
              {post.createdBy?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-base font-medium">{post.createdBy}</p>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
      </header>

      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted shadow-lg animate-in fade-in duration-500 delay-100">
        <ImageWithFallback
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div
        className="post-content prose prose-lg dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(post.body || "")) }}
      />

      {post.tagsArray && post.tagsArray.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center py-4 border-t border-b animate-in fade-in duration-300 delay-300">
          {post.tagsArray.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/80 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
            >
              {tag}
            </span>
          ))}
          <span className="text-sm text-muted-foreground ml-2">· {readTime} min de leitura</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 animate-in fade-in duration-300 delay-300">
        <div className="flex flex-wrap gap-2 md:gap-3">
          <LikeButton postId={post.id!} userId={user?.uid || ""} />
          <ShareButton post={post as PostType} onShare={handleShare} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSave(post.id!)}
            className={`gap-2 transition-colors ${isSaved(post.id!) ? "text-primary" : ""}`}
          >
            <FiBookmark className={`h-4 w-4 ${isSaved(post.id!) ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-2 rounded-lg bg-secondary/50">
            <FiEye className="h-4 w-4" />
            <span className="tabular-nums">{viewCount}</span>
          </div>
        </div>

        {isOwner && (
          <Button asChild variant="outline" size="sm">
            <Link to={`/posts/edit/${post.id}`}>Editar post</Link>
          </Button>
        )}
      </div>

      <section className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <Comments
          postId={post.id!}
          userId={user?.uid}
          userName={user?.name}
          userAvatar={user?.photoURL}
        />
      </section>

      {relatedPosts.length > 0 && (
        <section className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <RelatedPosts posts={relatedPosts} loading={relatedLoading} />
        </section>
      )}

      <div className="pt-6 border-t">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/">
            <FiArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>
        </Button>
      </div>
    </article>
  );
};

export default Post;
