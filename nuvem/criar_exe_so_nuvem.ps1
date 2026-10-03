# DIGICOPY NUVEM - gera o .exe leve que SO ABRE o sistema ligado na nuvem.
#
# O que ele faz: um programa de poucos KB, com o nome DIGICOPY-NUVEM.exe, que
# abre o sistema no navegador (Edge ou Chrome) numa janela limpa, ja apontado
# para a nuvem. Nao instala nada, nao copia o sistema, nao guarda dados.
#
# Por que e leve: o sistema inteiro mora na nuvem (site + motor no Cloudflare).
# O .exe do sistema antigo tinha 100 MB porque levava o programa e o banco
# Firebird dentro do PC. Aqui nao precisa: nada e baixado - o proprio Windows
# compila este lancador (Add-Type), sem internet e sem instalar nada.
#
# Uso: clique duas vezes em CRIAR_EXE_SO_NUVEM.cmd (na pasta do sistema).

$ErrorActionPreference = 'Stop'

$pasta   = $PSScriptRoot
$destino = Join-Path $pasta 'DIGICOPY-NUVEM.exe'
$vbs     = Join-Path $pasta 'abrir_digicopy.vbs'
$atalho  = Join-Path ([Environment]::GetFolderPath('Desktop')) 'DIGICOPY NUVEM.lnk'

Write-Host ''
Write-Host '=========================================================='
Write-Host ' DIGICOPY NUVEM - o .exe que so conecta na nuvem'
Write-Host '=========================================================='

$codigo = @'
using System;
using System.IO;
using System.Diagnostics;

public class AbrirDigicopy {
    const string Url = "https://teste-60f.pages.dev";

    static string[] Candidatos() {
        string pf   = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string lad  = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        return new string[] {
            pf   + @"\Microsoft\Edge\Application\msedge.exe",
            pf86 + @"\Microsoft\Edge\Application\msedge.exe",
            pf   + @"\Google\Chrome\Application\chrome.exe",
            pf86 + @"\Google\Chrome\Application\chrome.exe",
            lad  + @"\Google\Chrome\Application\chrome.exe"
        };
    }

    public static void Main() {
        foreach (string exe in Candidatos()) {
            try {
                if (File.Exists(exe)) {
                    Process.Start(new ProcessStartInfo(exe, "--app=" + Url + " --start-maximized") { UseShellExecute = true });
                    return;
                }
            } catch { }
        }
        try { Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true }); } catch { }
    }
}
'@

$compilou = $false
if ($PSVersionTable.PSVersion.Major -ge 6) {
    Write-Host ' Este PowerShell e o novo (sem compilador). Vou de atalho.'
} else {
    try {
        Add-Type -TypeDefinition $codigo -OutputAssembly $destino -OutputType WindowsApplication
        $compilou = (Test-Path $destino)
    } catch {
        Write-Host (' Nao consegui compilar: ' + $_.Exception.Message)
    }
}

if ($compilou) {
    Write-Host ''
    Write-Host (' PRONTO: ' + $destino)
} else {
    Write-Host ''
    Write-Host ' Sem problema: o atalho abaixo faz o mesmo, usando o abrir_digicopy.vbs.'
}

# Atalho na Area de Trabalho (o icone que o dono clica).
try {
    $ws  = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut($atalho)
    if ($compilou) {
        $lnk.TargetPath = $destino
    } else {
        $lnk.TargetPath = (Join-Path $env:SystemRoot 'System32\wscript.exe')
        $lnk.Arguments  = '"' + $vbs + '"'
    }
    $lnk.WorkingDirectory = $pasta
    $lnk.Description      = 'Abre o sistema Digicopy ja ligado na nuvem'
    $lnk.Save()
    Write-Host (' Atalho na Area de Trabalho: DIGICOPY NUVEM')
} catch {
    Write-Host (' Nao deu para criar o atalho: ' + $_.Exception.Message)
}

Write-Host '=========================================================='
Write-Host ' Como usar: clique duas vezes no atalho DIGICOPY NUVEM.'
Write-Host ' Nada fica guardado neste PC - os dados ficam na nuvem.'
Write-Host '=========================================================='
