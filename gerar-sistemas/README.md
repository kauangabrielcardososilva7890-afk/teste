# Geradores dos 7 sistemas DIGICOPY v8.0.0

Execute os arquivos `.cmd` nesta pasta no Windows com Node.js, Electron Builder, Android SDK e Gradle configurados.

| Arquivo | Produto | Saída |
|---|---|---|
| `GERAR_00_TODOS_7_SISTEMAS.cmd` | Gera os sete produtos em sequência | `dist/` e `gerente-atualizacoes/dist/` |
| `01_PARTICULAR_NUVEM_EXE.cmd` | Particular conectado à nuvem | `dist/particular-exe/` |
| `02_PARTICULAR_NUVEM_APK.cmd` | Particular conectado à nuvem | `dist/apk/Digicopy-Particular.apk` |
| `03_COMERCIAL_NUVEM_EXE.cmd` | Comercial conectado à nuvem | `dist/commercial-exe/` |
| `04_COMERCIAL_NUVEM_APK.cmd` | Comercial conectado à nuvem | `dist/apk/Digicopy-Comercial.apk` |
| `05_COMERCIAL_LOCAL_SEM_NUVEM_EXE.cmd` | Comercial com armazenamento local | `dist/commercial-local-exe/` |
| `06_COMERCIAL_LOCAL_SEM_NUVEM_APK.cmd` | Comercial com armazenamento local | `dist/apk/Digicopy-Comercial-Local.apk` |
| `07_GERENTE_EXE.cmd` | Gerente de atualizações | `gerente-atualizacoes/dist/` |

O arquivo `GERAR_00_TODOS_7_SISTEMAS.cmd` interrompe o processo se algum produto falhar e mostra a etapa responsável.
