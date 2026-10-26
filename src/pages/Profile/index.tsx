import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "../../components/FormField";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { useAuthValue } from "../../contexts/AuthContext";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { type ProfileFormData, profileSchema } from "../../schemas";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuthValue() || {};
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  const originalName = user?.name || "";

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreview(null);
  }, []);

  const hasChanges = form.watch("name").trim() !== originalName || photoFile !== null;

  const onSubmit = async (data: ProfileFormData) => {
    if (!hasChanges) {
      toast.info("Nenhuma alteração foi feita.");
      return;
    }

    setIsSaving(true);

    try {
      let photoURL: string | undefined = undefined;

      if (photoFile) {
        photoURL = await uploadToCloudinary(photoFile);
      }

      const authModule = await import("firebase/auth");
      const { updateProfile, getAuth } = authModule;

      const firebaseAuth = getAuth();
      const firebaseUser = firebaseAuth.currentUser;

      if (firebaseUser) {
        await updateProfile(firebaseUser, {
          displayName: data.name.trim(),
          ...(photoURL && { photoURL }),
        });
      }

      toast.success("Perfil atualizado com sucesso!");

      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex flex-col gap-10 max-w-md mx-auto py-8">
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

      <header className="text-center space-y-2 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground">
          Meu <span className="text-primary">Perfil</span>
        </h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </header>

      <div className="flex flex-col gap-6 items-center animate-slide-in-from-bottom-4 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
        <div className="relative group">
          <Avatar className="h-32 w-32 ring-4 ring-primary/10 ring-offset-4 ring-offset-background rounded-full transition-all group-hover:ring-primary/20">
            <AvatarImage src={photoPreview || user?.photoURL || undefined} />
            <AvatarFallback className="text-3xl">
              {form.watch("name")?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {photoPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">Preview</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoChange}
            id="photo-input"
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <label htmlFor="photo-input" className="cursor-pointer">
                {photoPreview ? "Trocar foto" : "Adicionar foto"}
              </label>
            </Button>
            {photoPreview && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemovePhoto}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 animate-slide-in-from-bottom-4 opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]"
      >
        <div className="bg-card rounded-2xl border p-6 space-y-5 shadow-sm">
          <FormField
            label="Nome completo"
            placeholder="Seu nome"
            error={form.formState.errors.name?.message}
            maxLength={55}
            {...form.register("name")}
          />

          <div className="space-y-2">
            <label htmlFor="email-display" className="text-sm font-medium">
              E-mail
            </label>
            <div className="relative">
              <input
                id="email-display"
                type="text"
                value={user?.email || ""}
                disabled
                className="flex h-11 w-full rounded-xl border border-input bg-muted/50 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  Bloqueado
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSaving || !hasChanges}
          className="rounded-xl w-full animate-slide-in-from-bottom-4 opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards]"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </form>
    </div>
  );
};

export default Profile;
