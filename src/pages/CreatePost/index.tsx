import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog } from "../../components/Dialog";
import { Editor } from "../../components/Editor";
import { FormField } from "../../components/FormField";
import { type ImageFile, ImageUploader } from "../../components/ImageUploader";
import { Button } from "../../components/ui/button";
import { useAuthValue } from "../../contexts/AuthContext";
import { useInsertDocument } from "../../hooks/useInsertDocument";
import { transformCloudinaryUrl, uploadToCloudinary } from "../../lib/cloudinary";
import { type CreatePostFormData, createPostSchema } from "../../schemas";
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

const CreatePostContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthValue() || {};
  const [coverImage, setCoverImage] = useState<ImageFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { insertDocument, response } = useInsertDocument("posts");
  const { getContent } = useEditorContext();

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      tagsInput: "",
    },
  });

  const { watch } = form;
  const titleValue = watch("title");
  const tagsInputValue = watch("tagsInput");

  const hasUnsavedChanges =
    titleValue.trim() || coverImage || tagsInputValue.trim() || getContent().length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  const previewTags = useMemo(() => {
    return processTags(tagsInputValue);
  }, [tagsInputValue]);

  const titleLength = titleValue.trim().length;

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsOpen(true);
    } else {
      navigate("/");
    }
  };

  const onSubmit = async (data: CreatePostFormData) => {
    const content = getContent();
    const textContent = content.replace(/<[^>]*>/g, "").trim();

    if (!coverImage?.file) {
      toast.error("Imagem de capa obrigatória.");
      return;
    }

    if (textContent.length < 10) {
      toast.error("O conteúdo deve ter pelo menos 10 caracteres.");
      return;
    }

    const hasHeading = /<h[1-3][^>]*>/i.test(content);
    if (!hasHeading) {
      toast.error("O conteúdo deve ter pelo menos um título (H1, H2 ou H3).");
      return;
    }

    if (previewTags.length === 0) {
      toast.error("Tags são obrigatórias.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrl = await uploadToCloudinary(coverImage.file);
      const imageUrl = transformCloudinaryUrl(uploadedUrl);

      const formData = {
        title: data.title,
        titleLower: data.title.toLowerCase(),
        image: imageUrl,
        body: content,
        tagsArray: previewTags,
        uid: user?.uid || "",
        createdBy: user?.name || user?.email || "Anonymous",
        photoURL: user?.photoURL || "",
        likeCount: 0,
        likes: [],
      };

      await insertDocument(formData);
      toast.success("Post criado com sucesso!");
      navigate("/");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar post.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="hover:bg-muted/50">
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <header className="space-y-2 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
          Criar <span className="text-primary">post</span>
        </h1>
        <p className="text-muted-foreground">Compartilhe suas ideias com o mundo</p>
      </header>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]"
        aria-label="Formulário de criação de post"
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
            onImagesChange={(images) => setCoverImage(images[0] ?? null)}
          />
        </div>

        <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
          <p className="text-sm font-medium flex items-center gap-2">
            Conteúdo
            <span className="text-destructive">*</span>
          </p>
          <Editor />
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
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
          <Button type="button" variant="outline" onClick={handleCancel} className="rounded-xl">
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
                Publicando...
              </span>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </form>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Sair sem salvar?"
        description="Você tem alterações não salvas. Tem certeza que deseja sair?"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full rounded-xl">
            Continuar editando
          </Button>
          <Button
            variant="destructive"
            onClick={() => navigate("/")}
            className="w-full rounded-xl"
          >
            Sair
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

const CreatePost = () => {
  return (
    <EditorProvider>
      <CreatePostContent />
    </EditorProvider>
  );
};

export default CreatePost;
