' DIGICOPY NUVEM - abre o sistema ja ligado na nuvem, numa janela limpa.
' Nao instala nada neste PC e nao guarda dados aqui (o sistema trabalha no modo
' SO NUVEM: o que o dono cria vai para a nuvem, o PC nao e deposito).
' Uso: clique duas vezes neste arquivo, ou use o atalho DIGICOPY NUVEM.
Option Explicit

Dim URL
URL = "https://teste-60f.pages.dev"

Dim sh, fso, lista, i, alvo
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Edge vem em todo Windows 10/11; o Chrome e o plano B (tambem na instalacao
' por usuario, dentro do AppData). Qualquer um dos dois abre sem barra de
' endereco com --app=, que e o que faz parecer o programa de antes.
lista = Array( _
  sh.ExpandEnvironmentStrings("%ProgramFiles%")       & "\Microsoft\Edge\Application\msedge.exe", _
  sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%")  & "\Microsoft\Edge\Application\msedge.exe", _
  sh.ExpandEnvironmentStrings("%ProgramFiles%")       & "\Google\Chrome\Application\chrome.exe", _
  sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%")  & "\Google\Chrome\Application\chrome.exe", _
  sh.ExpandEnvironmentStrings("%LocalAppData%")       & "\Google\Chrome\Application\chrome.exe" _
)

alvo = ""
For i = 0 To UBound(lista)
  If alvo = "" Then
    If fso.FileExists(lista(i)) Then alvo = lista(i)
  End If
Next

If alvo <> "" Then
  sh.Run """" & alvo & """ --app=" & URL & " --start-maximized", 1, False
Else
  ' Sem Edge nem Chrome: abre no navegador que o PC ja usa.
  CreateObject("Shell.Application").ShellExecute URL
End If
