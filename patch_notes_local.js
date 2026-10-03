// ═══════════════════════════════════════════════════════════════════════════
// PATCH NOTES LOCAIS — aparecem depois da atualização, sem depender da nuvem.
// A chave inclui a versão e fica no armazenamento deste navegador/dispositivo.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
var NOTAS_POR_VERSAO={
  '7.3.11':[
    'A senha antiga não deve mais ser aceita quando o cadastro já tem uma senha protegida por hash.',
    'Desativar um usuário agora mostra a confirmação correta, sem avisar por engano que o cadastro não foi salvo.',
    'O indicador no canto agora se chama Nuvem. Clique nele para abrir um diagnóstico simples da sincronização.',
    'O diagnóstico mostra autorização, fila de envio, última sincronização e resposta do serviço; não altera nem envia registros.',
    'Em Usuários e permissões, removemos a frase técnica que aparecia logo abaixo do nome do menu.'
  ],
  '7.3.12':[
    'No menu Locação, voltaram os atalhos Máquinas nos clientes e Leituras.',
    'Máquinas nos clientes abre a tela unificada de Impressoras; Leituras leva a Contratos, onde cada leitura é feita dentro do contrato do cliente.'
  ],
  '7.3.13':[
    'A tela de Tributação mantém os dados do produto visíveis e organiza Importação, ICMS ST, FCP, Efetivo e os valores comercial e tributável.',
    'Os campos IBS/CBS continuam sem percentuais automáticos: preencha os códigos e alíquotas após conferir a orientação oficial e o responsável fiscal.',
    'As informações fiscais novas ficam no rascunho. Elas ainda não são calculadas nem foram ligadas ao XML de emissão; nada é transmitido automaticamente.',
    'Ao trocar de subaba ou aplicar CFOP aos itens, o sistema agora salva as alterações feitas antes da troca.'
  ],
  '7.3.14':[
    'Em Contratos, quando você apaga o texto da busca e escolhe Mostrar todos, o texto antigo não volta.',
    'Mostrar todos também limpa o filtro de situação e exibe novamente os contratos da empresa atual.'
  ],
  '7.3.15':[
    'Os registros de negócio não são mais gravados em armazenamento permanente do navegador: a nuvem é a cópia oficial.',
    'Uma alteração só aparece como salva depois da confirmação da nuvem. Se a conexão cair, ela fica apenas na memória desta sessão; mantenha a janela aberta até a confirmação.',
    'Uma fila antiga já existente nesta máquina é preservada apenas até a nuvem confirmar o envio, para evitar perder alterações pendentes.'
  ],
  '8.1.0':[
    'A versão 8.1.0 consolida as correções de segurança, tema global, autenticação e testes oficiais da linha 8.'
  ],
  '8.0.0':[
    'A versão 8.0.0 reúne a auditoria final do sistema, com menus e fluxos principais validados em testes automatizados.',
    'As telas estreitas agora deixam navegação, tabelas, comandos e modais rolarem sem cortar o conteúdo importante.',
    'Quando algo inesperado acontecer, o sistema avisa claramente que a operação não terminou como esperado e registra detalhes para diagnóstico, sem fingir que salvou.',
    'O Gerente de Atualizações também passou a registrar falhas inesperadas e avisar quando uma operação ou a janela do programa não conclui corretamente.'
  ]
};
function chave(v){return 'digicopy_patch_visto_'+String(v||'').replace(/[^0-9A-Za-z._-]/g,'_');}
function deveMostrar(v,valorSalvo){return !!NOTAS_POR_VERSAO[String(v||'')]&&!valorSalvo;}
try{window.DIGICOPY_PATCH_NOTES_PURE={notas:NOTAS_POR_VERSAO,chave:chave,deveMostrar:deveMostrar};}catch(e){}
if(typeof window==='undefined'||typeof document==='undefined')return;
var versao=String(window.DIGICOPY_APP_VERSION||'');
if(!deveMostrar(versao,''))return;
var jaMostrou=false;
try{jaMostrou=localStorage.getItem(chave(versao))==='1';}catch(e){}
if(jaMostrou)return;

function fechar(card){
  if(card&&card.parentNode)card.parentNode.removeChild(card);
  try{document.removeEventListener('keydown',tecla);}catch(e){}
}
function tecla(e){if(e.key==='Escape'){var card=document.getElementById('digicopy-patch-notes');if(card)fechar(card);}}
function appAberto(){
  try{
    var s=typeof getSession==='function'?getSession():null;
    var app=document.getElementById('app-shell');
    var modal=document.getElementById('modal-root');
    return !!(s&&app&&!app.classList.contains('hidden')&&(!modal||modal.classList.contains('hidden')));
  }catch(e){return false;}
}
function mostrar(){
  if(jaMostrou||!appAberto()||document.getElementById('digicopy-patch-notes'))return false;
  var notas=NOTAS_POR_VERSAO[versao];if(!notas||!notas.length)return false;
  var overlay=document.createElement('div');overlay.id='digicopy-patch-notes';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','digicopy-patch-notes-title');
  overlay.style.cssText='position:fixed;inset:0;z-index:100002;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
  var card=document.createElement('section');
  card.style.cssText='width:min(520px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.3);padding:24px;font-family:inherit;';
  var eyebrow=document.createElement('div');eyebrow.textContent='ATUALIZAÇÃO APLICADA';eyebrow.style.cssText='font-size:10px;font-weight:900;letter-spacing:.12em;color:#0a1e8a;';
  var title=document.createElement('h2');title.id='digicopy-patch-notes-title';title.textContent='O que mudou nesta versão';title.style.cssText='margin:7px 0 2px;font-size:21px;font-weight:900;color:#0f172a;';
  var subtitle=document.createElement('p');subtitle.textContent='Versão '+versao+' — resumo em linguagem simples.';subtitle.style.cssText='margin:0 0 14px;color:#64748b;font-size:12px;';
  var list=document.createElement('ul');list.style.cssText='margin:0;padding:14px 16px 14px 32px;border:1px solid #e2e8f0;border-radius:13px;background:#f8fafc;color:#334155;font-size:13px;line-height:1.55;';
  notas.forEach(function(n){var li=document.createElement('li');li.textContent=n;li.style.margin='0 0 7px';list.appendChild(li);});
  var footer=document.createElement('div');footer.style.cssText='display:flex;justify-content:flex-end;margin-top:16px;';
  var close=document.createElement('button');close.type='button';close.textContent='Entendi';close.style.cssText='border:0;border-radius:11px;background:#0a1e8a;color:#fff;padding:10px 20px;font-weight:900;cursor:pointer;';
  footer.appendChild(close);card.appendChild(eyebrow);card.appendChild(title);card.appendChild(subtitle);card.appendChild(list);card.appendChild(footer);overlay.appendChild(card);document.body.appendChild(overlay);
  // Marcar ao exibir: a nota não volta após passar o dia, desconectar a nuvem ou recarregar.
  try{localStorage.setItem(chave(versao),'1');}catch(e){}
  jaMostrou=true;close.onclick=function(){fechar(overlay);};
  overlay.addEventListener('click',function(e){if(e.target===overlay)fechar(overlay);});
  document.addEventListener('keydown',tecla);
  return true;
}
var timer=setInterval(function(){
  if(mostrar())clearInterval(timer);
},1000);
})();
