const errorMessages: Record<string, string> = {
  // Senha
  Password: "A senha precisa conter pelo menos 6 caracteres.",
  "weak-password": "A senha precisa conter pelo menos 6 caracteres.",

  // Email
  "email-already": "E-mail já cadastrado.",
  "email-already-in-use": "E-mail já cadastrado.",
  "invalid-email": "E-mail inválido.",

  // Usuário
  "user-not-found": "Usuário não encontrado.",
  "user-disabled": "Esta conta foi desativada.",

  // Senha
  "wrong-password": "Senha incorreta.",
  // O Firebase passou a responder este código tanto para senha errada quanto
  // para e-mail inexistente. Mensagem única evita confirmar se a conta existe.
  "invalid-credential": "E-mail ou senha incorretos.",
  "invalid-login-credentials": "E-mail ou senha incorretos.",

  // Google / Popup
  "popup-closed-by-user": "Login cancelado. A janela foi fechada.",
  "cancelled-popup-request": "Login cancelado.",
  "popup-blocked": "O popup foi bloqueado pelo navegador. Permita popups e tente novamente.",
  "unauthorized-domain":
    "Este domínio não está autorizado no Firebase. Adicione-o no console do Firebase em Authentication > Settings > Authorized domains.",

  // Rede
  "network-request-failed": "Erro de conexão. Verifique sua internet.",
  "too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",

  // Genérico
  "internal-error": "Erro interno. Tente novamente.",
  "operation-not-allowed": "Operação não permitida.",
};

export { errorMessages };
