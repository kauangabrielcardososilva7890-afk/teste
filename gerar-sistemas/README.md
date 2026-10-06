# Geradores dos 7 sistemas DIGICOPY

Abra no Windows o arquivo `.cmd` correspondente ao produto. Cada comando chama `build_profiles.js` pelo caminho da própria pasta, então funciona mesmo quando iniciado fora da pasta do repositório. O comando geral gera os sete produtos em sequência e para no primeiro erro.

Pré-requisitos: instale as dependências com `npm ci` na raiz e em `mobile`. Para APK, use JDK 17 e Android SDK configurados; o projeto inclui o wrapper do Gradle.

| Arquivo | Produto | Saída |
|---|---|---|
| `01_PARTICULAR_NUVEM_EXE.cmd` | Particular conectado à nuvem — EXE | `dist/particular-exe/` |
| `02_PARTICULAR_NUVEM_APK.cmd` | Particular conectado à nuvem — APK de teste | `dist/apk/Digicopy-Particular.apk` |
| `03_COMERCIAL_NUVEM_EXE.cmd` | Comercial conectado à nuvem — EXE | `dist/commercial-exe/` |
| `04_COMERCIAL_NUVEM_APK.cmd` | Comercial conectado à nuvem — APK de teste | `dist/apk/Digicopy-Comercial.apk` |
| `05_COMERCIAL_LOCAL_SEM_NUVEM_EXE.cmd` | Comercial com armazenamento local — EXE | `dist/commercial-local-exe/` |
| `06_COMERCIAL_LOCAL_SEM_NUVEM_APK.cmd` | Comercial com armazenamento local — APK de teste | `dist/apk/Digicopy-Comercial-Local.apk` |
| `07_GERENTE_EXE.cmd` | Gerente de atualizações — EXE | `gerente-atualizacoes/dist/` |
| `GERAR_00_TODOS_7_SISTEMAS.cmd` | Executa os sete comandos em sequência | Pastas acima |

Os APKs usam o build `debug`, assinado automaticamente pelo Android SDK para instalação e testes locais. Este projeto ainda não configura uma chave privada de release; esses APKs não são destinados à Play Store. Para publicação ou atualizações assinadas, é necessária a chave de release permanente do proprietário.

Cada arquivo mantém o código de saída do empacotamento e informa falha ou sucesso sem exibir os dois resultados ao mesmo tempo.
