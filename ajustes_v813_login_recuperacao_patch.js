// v8.1.5 — recuperação de acesso quando a sincronização antiga removeu o verificador.
// A senha antiga não pode ser reconstruída: o responsável pela nuvem confirma a
// identidade e cadastra novamente a senha (pode escolher a mesma). Senha em texto
// nunca vai para a nuvem; somente PBKDF2 + salt, necessários ao login nos outros PCs.
(function(){
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||window.__digiRecuperarSenhaV813)return;
  window.__digiRecuperarSenhaV813=true;

  function banco(){
    try{if(typeof db!=='undefined'&&db)return db;}catch(e){}
    return window.db||null;
  }
  function digitos(v){return String(v||'').replace(/\D/g,'');}
  function fold(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
  async function pedirSenhaSegura(texto,titulo){
    if(typeof window.pedirTextoSistema!=='function'){
      msg('O campo seguro de senha ainda está carregando. Recarregue a página e tente novamente.','error');
      return null;
    }
    return await window.pedirTextoSistema(texto,{mascara:true,titulo:titulo||'Confirme a senha'});
  }
  function msg(texto,tipo){
    try{if(typeof toast==='function'){toast(texto,tipo||'info');return;}}catch(e){}
    try{alert(texto);}catch(e){}
  }
  async function recuperar(){
    const b=banco();
    if(!b||!Array.isArray(b.usuarios)||!Array.isArray(b.empresas)){
      msg('Os dados da empresa ainda estão carregando. Aguarde alguns segundos e tente de novo.','error');return;
    }
    const campo=document.getElementById('login-user');
    const login=String((campo&&campo.value)||prompt('Digite o login da conta que deseja reativar:')||'').trim();
    if(!login){msg('Informe o login da conta.','error');return;}
    const user=b.usuarios.find(u=>u&&u.ativo&&
      (fold(u.login)===fold(login)||fold(u.nome)===fold(login)||fold(u.nome).split(/\s+/)[0]===fold(login)));
    if(!user){msg('Esse usuário não está na base sincronizada. Confira o login ou a conexão da nuvem.','error');return;}
    const emp=b.empresas.find(e=>e&&e.id===user.empresaId)||b.empresas.find(e=>e&&e.id);
    const aparelho=window.DIGICOPY_CLOUD&&typeof window.DIGICOPY_CLOUD.deviceInfo==='function'?window.DIGICOPY_CLOUD.deviceInfo():null;
    const cnpj=digitos((emp&&emp.cnpj)||(aparelho&&aparelho.cnpj)||'');
    if(cnpj.length!==14){msg('O CNPJ não consta no cadastro da empresa nem no aparelho conectado à nuvem. Reconecte este computador à nuvem.','error');return;}
    if(emp&&!digitos(emp.cnpj)){emp.cnpj=cnpj;emp.cnpjDigits=cnpj;}
    const api=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;
    if(typeof api!=='function'){msg('A conexão da nuvem ainda não está pronta. Recarregue a página e tente novamente.','error');return;}
    const senhaNuvem=await pedirSenhaSegura('Confirme a senha do GERENTE da nuvem. A senha de conexão comum não autoriza recuperar contas.','Confirmar gerente');
    if(senhaNuvem===null)return;
    const botao=document.getElementById('digi-recuperar-senha-v813');
    if(botao){botao.disabled=true;botao.textContent='Conferindo acesso...';}
    try{
      const prova=await api('/v1/check-pass',{method:'POST',body:JSON.stringify({cnpj,senha:senhaNuvem})});
      if(!prova||prova.ok!==true||prova.administrador!==true){
        msg('A senha do gerente não foi confirmada. A recuperação exige a senha do gerente, que cria aparelhos Administradores.','error');return;
      }
      const novaDigitada=await pedirSenhaSegura('Cadastre a senha do usuário. A senha antiga não foi guardada pela nuvem; você pode definir a mesma novamente.','Nova senha da conta');
      if(novaDigitada===null)return;
      const nova=String(novaDigitada||'').trim();
      if(nova.length<4){msg('A senha precisa ter pelo menos 4 caracteres.','error');return;}
      const repetida=await pedirSenhaSegura('Digite a senha do usuário novamente para confirmar:','Confirmar nova senha');
      if(repetida===null)return;
      const repetir=String(repetida||'').trim();
      if(nova!==repetir){msg('As senhas não são iguais. Nenhuma alteração foi feita.','error');return;}
      if(typeof window.senhaNovaSalt!=='function'||typeof window.senhaHash!=='function'){
        msg('O verificador seguro de senha não carregou. Recarregue o sistema e tente novamente.','error');return;
      }
      const salt=window.senhaNovaSalt();
      const hash=await window.senhaHash(nova,salt);
      if(!hash){msg('Não foi possível criar o verificador seguro. Tente em um navegador atualizado.','error');return;}
      user.senhaSalt=salt;
      user.senhaHash=hash;
      delete user.senha;
      user.senhaPadrao=false;
      if(typeof saveDB==='function')saveDB();
      else if(typeof window.saveDB==='function')window.saveDB();
      const sync=window.DIGICOPY_CLOUD_SYNC;
      if(sync&&typeof sync.tick==='function'){
        const enviado=await sync.tick('recuperacao-senha');
        if(enviado===false)msg('Senha cadastrada neste aparelho. A nuvem ainda não confirmou a sincronização; mantenha a página aberta e verifique a conexão.','error');
        else msg('Senha cadastrada com segurança. Agora entre com esse usuário e senha.','success');
      }else msg('Senha cadastrada neste aparelho. A sincronização da nuvem ainda não está disponível.','error');
    }catch(e){
      msg(String(e&&e.message||'Não foi possível conferir a nuvem agora. Tente novamente.'),'error');
    }finally{
      if(botao){botao.disabled=false;botao.textContent='Recuperar acesso';}
    }
  }
  function instalar(){
    const zona=document.querySelector('#login-step-user .space-y-4');
    if(!zona||document.getElementById('digi-recuperar-senha-v813'))return;
    const b=document.createElement('button');
    b.id='digi-recuperar-senha-v813';b.type='button';b.textContent='Recuperar acesso';
    b.style.cssText='width:100%;min-height:40px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;font-weight:700;font-size:12px;cursor:pointer';
    b.addEventListener('click',recuperar);
    zona.appendChild(b);
  }
  instalar();
  let tent=0;
  const timer=setInterval(function(){instalar();if(++tent>=40||document.getElementById('digi-recuperar-senha-v813'))clearInterval(timer);},250);
})();
