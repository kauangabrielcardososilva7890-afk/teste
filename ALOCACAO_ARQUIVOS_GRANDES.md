# Como alocar o .RAR atualizado do sistema antigo

O `BANCO.FDB` que estava no repositório pode ficar como referência antiga, mas o **.RAR atualizado do sistema antigo não deve ser colocado direto no GitHub público** se tiver dados reais de clientes, vendas ou financeiro.

## Opção mais simples para agora

Use **Google Drive** ou **OneDrive**:

1. Compacte a pasta/banco atualizado em `.rar` ou `.zip`.
2. Envie para uma pasta no Google Drive/OneDrive.
3. Clique em compartilhar.
4. Escolha uma destas opções:
   - Melhor: acesso somente para quem tiver o link, mas sem indexar publicamente.
   - Se for dado sensível: envie com senha no arquivo compactado e me passe a senha por outro canal seguro, não no chat público.
5. Me mande aqui o link de download/compartilhamento.

> Se o arquivo for muito grande, prefira `.zip` ou `.7z`, porque geralmente é mais fácil extrair em servidores Linux do que `.rar`.

## Opção mais profissional para o ERP em nuvem

Para produção, recomendo usar storage próprio:

- **Supabase Storage**: bom se usarmos Supabase/PostgreSQL no ERP.
- **Cloudflare R2**: barato para guardar backups grandes.
- **AWS S3**: padrão de mercado, robusto.
- **Backblaze B2**: opção barata para backups.
- **VPS própria**: guardar em `/backups` com acesso SFTP/SSH.

## GitHub Release

Pode servir para arquivos grandes de teste, mas só recomendo se o repositório for privado e se não houver dados sensíveis.

Passos:

1. Entrar no GitHub do projeto.
2. Ir em **Releases**.
3. Criar release `backup-legado`.
4. Anexar o `.rar` como asset.
5. Enviar o link da release.

## Arquivos pequenos úteis para eu analisar

Além do `.rar` atualizado, se você conseguir enviar arquivos pequenos do sistema antigo, esses ajudam bastante:

- `Config.ini`
- `ConfigCNPJ.ini`
- `StartFirebird.bat`
- `PortugueseDev.ini`
- prints das telas principais: venda, orçamento, cliente, locação, OS e financeiro

Não precisa enviar `.exe`, `.dll`, instalador do Firebird, WinRAR ou pastas enormes de imagem/som/update, a menos que você queira copiar algo visual específico.
