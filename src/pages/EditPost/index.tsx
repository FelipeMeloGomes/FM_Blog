import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Editor } from "../../components/Editor";
import { FormField } from "../../components/FormField";
import { type ImageFile, ImageUploader } from "../../components/ImageUploader";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuthValue } from "../../contexts/AuthContext";
import { useUpdateDocument } from "../../hooks/useUpdateDocument";
import { transformCloudinaryUrl, uploadToCloudinary } from "../../lib/cloudinary";
import { usePost } from "../../lib/hooks/usePostsQuery";
import { type EditPostFormData, editPostSchema } from "../../schemas";
import { EditorProvider, useEditorContext } from "../../utils/EditorContext";
import { sanitizeTag } from "../../utils/security";

const processTags = (input: string): string[] => {
  return input
    .split(",")
    .map((tag) => sanitizeTag(tag))
    .filter((tag) => tag.length > 0)
    .filter((tag, index, self) => self.indexOf(tag) === index)
    .slice(0, 10)
    .map((tag) => tag.slice(0, 30));
};

const EditorWithValue = ({ value }: { value: string }) => {
  const { setContent } = useEditorContext();

  useEffect(() => {
    if (value) {
      setContent(value);
    }
  }, [value, setContent]);

  return <Editor value={value} />;
};

const EditPostContent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthValue() || {};
  const { data: post, isLoading } = usePost(id);
  const { updateDocument, response } = useUpdateDocument("posts");
  const { getContent } = useEditorContext();

  const [coverImage, setCoverImage] = useState<ImageFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditPostFormData>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      title: "",
      tagsInput: "",
    },
  });

  const { watch, setValue } = form;
  const titleValue = watch("title");
  const tagsInputValue = watch("tagsInput");

  useEffect(() => {
    if (post) {
      setValue("title", post.title || "");
      setValue("tagsInput", post.tagsArray?.join(", ") || "");
      if (post.image) {
        setCoverImage({
          id: "initial",
          file: null,
          preview: post.image,
        });
      }
    }
  }, [post, setValue]);

  const previewTags = useMemo(() => {
    return processTags(tagsInputValue);
  }, [tagsInputValue]);

  const titleLength = titleValue.trim().length;

  const onSubmit = async (data: EditPostFormData) => {
    const content = getContent();
    const textContent = content.replace(/<[^>]*>/g, "").trim();

    if (!coverImage) {
      toast.error("Imagem de capa obrigatória.");
      return;
    }

    if (textContent.length < 10) {
      toast.error("O conteúdo deve ter pelo menos 10 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = post?.image || "";

      if (coverImage.file) {
        const uploadedUrl = await uploadToCloudinary(coverImage.file);
        imageUrl = transformCloudinaryUrl(uploadedUrl);
      }

      const formData = {
        title: data.title,
        titleLower: data.title.toLowerCase(),
        image: imageUrl,
        body: getContent(),
        tagsArray: previewTags,
        uid: user?.uid || post?.uid || "",
        createdBy: post?.createdBy || user?.name || user?.email || "Anonymous",
        photoURL: post?.photoURL || user?.photoURL || "",
        likeCount: post?.likeCount || 0,
        likes: post?.likes || [],
      };

      await updateDocument(id!, formData);
      toast.success("Post atualizado com sucesso!");
      navigate("/");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar post.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-24" />
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl border p-6 space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-muted-foreground">Post não encontrado</p>
      </div>
    );
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const parts = tagsInputValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const tagIndex = parts.findIndex((t) => t.toLowerCase() === tagToRemove);
    if (tagIndex !== -1) {
      parts.splice(tagIndex, 1);
      setValue("tagsInput", parts.join(", "));
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="hover:bg-muted/50"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <header className="space-y-2 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
          Editar <span className="text-primary">post</span>
        </h1>
        <p className="text-muted-foreground">Atualize as informações do seu post</p>
      </header>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]"
      >
        <div className="bg-card rounded-2xl border p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <FormField
              label="Título do post"
              placeholder="Digite o título do seu post"
              error={form.formState.errors.title?.message}
              required
              maxLength={220}
              {...form.register("title")}
            />
            <div className="flex justify-end">
              <p
                className={`text-xs tabular-nums ${titleLength > 200 ? "text-destructive font-medium" : "text-muted-foreground"}`}
              >
                {titleLength}/200
              </p>
            </div>
          </div>

          <ImageUploader
            label="Imagem de capa"
            required
            multiple={false}
            maxFiles={1}
            maxSizeMB={5}
            minWidth={640}
            minHeight={360}
            maxWidth={3840}
            maxHeight={2160}
            initialImageUrl={post.image}
            onImagesChange={(images) => {
              setCoverImage(images[0] ?? null);
            }}
          />
        </div>

        <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
          <p className="text-sm font-medium flex items-center gap-2">
            Conteúdo
            <span className="text-destructive">*</span>
          </p>
          <EditorWithValue value={post.body || ""} />
        </div>

        <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
          <FormField
            label="Tags (separadas por vírgula)"
            placeholder="react, typescript, firebase"
            error={form.formState.errors.tagsInput?.message}
            required
            {...form.register("tagsInput")}
          />

          {previewTags.length > 0 && (
            <div className="pt-2 animate-fade-in">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {previewTags.map((tag, index) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 group hover:bg-primary/20 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                      aria-label={`Remover tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !!response.loading}
            className="rounded-xl"
          >
            {isSubmitting || !!response.loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

const EditPost = () => {
  return (
    <EditorProvider>
      <EditPostContent />
    </EditorProvider>
  );
};

export default EditPost;
