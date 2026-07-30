// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO FIREBASE (Google) — DIGICOPY ERP v4.4.0
// ═══════════════════════════════════════════════════════════════════════════
//
// COMO PREENCHER (resumo — o passo a passo completo está no GUIA_FIREBASE.md):
//   1. Crie o projeto no https://console.firebase.google.com
//   2. Ative o "Firestore Database" em MODO DE TESTE
//   3. Registre um app Web (ícone </>) e copie o objeto "firebaseConfig" que
//      o site mostra
//   4. Cole os valores abaixo, no lugar dos textos "COLE_AQUI_..."
//   5. Salve, recarregue o sistema e pronto: a nuvem passa a ser o Google
//
// Enquanto os valores estiverem com "COLE_AQUI_...", o sistema continua
// usando o Supabase normalmente — nada quebra.
//
// ⚠️ ATENÇÃO: só os campos apiKey e projectId são OBRIGATÓRIOS para a nuvem.
// ═══════════════════════════════════════════════════════════════════════════
window.FIREBASE_CONFIG = {
  apiKey:            "COLE_AQUI_A_API_KEY",
  projectId:         "COLE_AQUI_O_ID_DO_PROJETO",
  // Os campos abaixo aparecem no firebaseConfig do Google, mas a nuvem do
  // sistema só precisa dos dois de cima. Pode colar tudo mesmo assim.
  authDomain:        "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             ""
};
