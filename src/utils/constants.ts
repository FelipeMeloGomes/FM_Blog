export const CONSTANTS = {
  PAGINATION: {
    POSTS_PER_PAGE: 6,
    COMMENTS_PER_PAGE: 5,
  },

  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 100,
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 50,
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 200,
    BODY_MIN_LENGTH: 10,
    TAG_MAX_LENGTH: 30,
    TAGS_MAX_COUNT: 10,
    COMMENT_MAX_CHARS: 500,
  },

  IMAGE: {
    MAX_SIZE_MB: 5,
    MAX_FILES: 1,
    FALLBACK_PLACEHOLDER: "https://via.placeholder.com/640x360?text=Sem+imagem",
  },

  AUTH: {
    VIEW_LIMIT_WINDOW_MS: 24 * 60 * 60 * 1000,
  },

  READ_TIME: {
    WORDS_PER_MINUTE: 200,
  },

  SEARCH: {
    DEBOUNCE_MS: 300,
    MIN_CHARS_TO_SEARCH: 3,
  },

  DATE: {
    LOCALE: "pt-BR",
    DATE_FORMAT_OPTIONS: {
      day: "numeric",
      month: "long",
      year: "numeric",
    } as Intl.DateTimeFormatOptions,
    DATE_SHORT_FORMAT: {
      day: "numeric",
      month: "short",
      year: "numeric",
    } as Intl.DateTimeFormatOptions,
  },

  UI: {
    ANIMATION_DURATION: 200,
    TRANSITION_DURATION: 300,
  },
} as const;

export const MESSAGES = {
  ERRORS: {
    REQUIRED_FIELD: "Este campo é obrigatório",
    EMAIL_INVALID: "Email inválido",
    PASSWORD_TOO_WEAK: "A senha é muito fraca",
    PASSWORD_MISMATCH: "As senhas precisam ser iguais",
    TITLE_TOO_SHORT: "Título deve ter pelo menos 10 caracteres",
    BODY_TOO_SHORT: "O conteúdo deve ter pelo menos 10 caracteres",
    COMMON_PASSWORD: "Esta senha é muito comum. Escolha uma senha mais segura",
  },

  SUCCESS: {
    POST_CREATED: "Post criado com sucesso!",
    POST_UPDATED: "Post atualizado com sucesso!",
    POST_DELETED: "Post excluído com sucesso!",
    PROFILE_UPDATED: "Perfil atualizado com sucesso!",
    LOGIN_SUCCESS: "Login efetuado com sucesso.",
    LOGOUT_SUCCESS: "Logout efetuado com sucesso.",
    GOOGLE_LOGIN_SUCCESS: "Login efetuado com sucesso no Google.",
    PASSWORD_RESET_SENT: "E-mail de redefinição de senha enviado!",
  },

  PLACEHOLDERS: {
    SEARCH_PLACEHOLDER: "Título do post",
    TITLE_PLACEHOLDER: "Digite o título do seu post",
    BODY_PLACEHOLDER: "Escreva o conteúdo do seu post...",
    TAGS_PLACEHOLDER: "react, typescript, firebase",
    COMMENT_PLACEHOLDER: "Escreva um comentário...",
    REPLY_PLACEHOLDER: "Escreva uma resposta...",
  },

  LABELS: {
    BACK: "Voltar",
    CANCEL: "Cancelar",
    SUBMIT: "Enviar",
    SAVE: "Salvar",
    DELETE: "Excluir",
    EDIT: "Editar",
    LOGIN: "Entrar",
    REGISTER: "Cadastrar",
    LOGOUT: "Sair",
    LOADING: "Carregando...",
  },
} as const;
