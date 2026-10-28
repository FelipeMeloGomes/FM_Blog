import type { FirebaseApp } from "firebase/app";
import { ReCaptchaV3Provider, initializeAppCheck } from "firebase/app-check";

/**
 * Chave do reCAPTCHA v3 criada no console do Firebase
 * (App Check → Firestore → reCAPTCHA v3).
 *
 * Enquanto não existir, o App Check simplesmente não é inicializado — o app
 * funciona exatamente como antes. É de propósito: a exigência do token só
 * pode ser ligada depois que os clientes já estão enviando um.
 */
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

/**
 * Ativa o App Check com reCAPTCHA v3, se houver chave configurada.
 *
 * O token só passa a ser *exigido* pelo Firestore quando a exigência é ligada
 * no console. Ativar aqui é a primeira metade: a partir daí todo request leva
 * o token, e o console mostra a proporção de tráfego verificado antes de
 * qualquer bloqueio.
 *
 * @param app - Instância do Firebase já inicializada
 * @returns `true` se o App Check foi inicializado
 */
export const initAppCheck = (app: FirebaseApp): boolean => {
  if (!SITE_KEY) return false;

  if (import.meta.env.DEV) {
    // Sem isto, cada reload do dev server gera um token novo e o console
    // acumula tokens órfãos. O valor também pode vir de uma env, para ficar
    // o mesmo entre máquinas. Só existe em desenvolvimento: em produção o
    // bloco é removido no build.
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken || true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });

  return true;
};
