# MAPA DAS CAMADAS — quem define o quê e quem ganha

> Gerado por `node mapa_camadas.js` (`npm run mapa`). **Nada é alterado: é só leitura.**
> A **ordem** é a do `bundle-manifest.json` — é a ordem em que o sistema carrega de verdade.
> **Quem ganha é sempre o último que carrega.** O arquivo que ficou por baixo continua no
> repositório, mas o que vale em execução é o de baixo — é aí que nasce o defeito difícil.
> Escrita **no carregamento** acontece quando o arquivo carrega; escrita **em uso** está
> dentro de uma função e só troca a global quando aquela função for chamada.

- Arquivos no bundle: **227**
- Nomes globais escritos: **1059**
- Escritas totais (contando as repetições): **2021**
- Nomes escritos em **2 ou mais** arquivos: **289**
- Análise sem parser (acorn)? **não**

## Os nomes mais disputados (quem ganha está na última linha)

| Nome | Vezes | Ganha (último a carregar) |
|---|---|---|
| `navigateTo` | 37 | ajustes_v6108_lembrar_tela_patch.js:238 (função, no carregamento) |
| `__vosIgnorarSair` | 32 | (só troca em uso) |
| `modalContext` | 24 | (só troca em uso) |
| `showApp` | 23 | navegacao_fiscal_barra_escuro_patch.js:494 (função, no carregamento) |
| `__lcChamFormAberto` | 20 | (só troca em uso) |
| `renderConfig` | 20 | ajustes_v52234_config_aviso_salvou_patch.js:55 (função, no carregamento) |
| `renderFinanceiro` | 20 | ajustes_v52245_financeiro_hist_datas_patch.js:155 (função, no carregamento) |
| `renderVendas` | 18 | ajustes_v5240_relatorio_grande_patch.js:162 (função, no carregamento) |
| `openModalChamadoCompleto` | 16 | ajustes_v5186_patch.js:273 (função, no carregamento) |
| `__lcChamDirty` | 15 | (só troca em uso) |
| `renderClientes` | 15 | ajustes_v5214_clientes_visiveis_patch.js:304 (função, no carregamento) |
| `closeModal` | 13 | ajustes_v52295_venda_volta_patch.js:94 (função, no carregamento) |
| `renderContratos` | 12 | ajustes_v52243_contratos_sort_patch.js:96 (função, no carregamento) |
| `__chamadoPecasTemp` | 11 | (só troca em uso) |
| `abrirChamadoAvulsoForm` | 11 | ajustes_v5186_patch.js:283 (função, no carregamento) |
| `abrirLeiturasContrato` | 11 | ajustes_v5250_leitura_overhaul_patch.js:231 (função, no carregamento) |
| `renderProdutos` | 11 | ajustes_v52224_cat_letra_uma_vez_patch.js:70 (função, no carregamento) |
| `vosGerarHtmlNotinha` | 11 | ajustes_v52239_print_escolha_patch.js:145 (função, no carregamento) |
| `abrirModalEquipamentoContrato` | 10 | ajustes_v52435_impressora_remanejo_final_patch.js:142 (função, no carregamento) |
| `openContratoCompleto` | 10 | ajustes_v52435_impressora_remanejo_final_patch.js:220 (função, no carregamento) |
| `openModal` | 10 | ajustes_v5250_leitura_overhaul_patch.js:328 (função, no carregamento) |
| `salvarChamadoCompleto` | 10 | ajustes_v51920_patch.js:116 (função, no carregamento) |
| `__vosDirty` | 9 | (só troca em uso) |
| `DIGICOPY_APP_VERSION` | 9 | ajustes_v52265_script_isolado_patch.js:57 (valor, no carregamento) |
| `historicoVenda` | 9 | permissoes_estorno_venda_patch.js:269 (alias, no carregamento) |
| `novaVenda` | 9 | ajustes_v52218_pix_prazo_print_venda_patch.js:87 (função, no carregamento) |
| `open` | 9 | ajustes_v52217_print_sem_rodape_patch.js:27 (função, no carregamento) |
| `salvarImpressoraContrato` | 9 | ajustes_v52435_impressora_remanejo_final_patch.js:159 (função, no carregamento) |
| `__vosPersistida` | 8 | (só troca em uso) |
| `abrirTelaOrcamento` | 8 | ajustes_v5240_relatorio_grande_patch.js:179 (função, no carregamento) |
| `autoPreencherDadosChamado` | 8 | ajustes_v5177_patch.js:110 (função, no carregamento) |
| `showVenda` | 8 | ajustes_v51916_patch.js:22 (função, no carregamento) |
| `__esSt` | 7 | (só troca em uso) |
| `__ORC_ST` | 7 | ajustes_v52237_orcamentos_menu_patch.js:101 (valor, no carregamento) |
| `abrirEditorMenus` | 7 | ajustes_v52223_menus_arraste_patch.js:87 (função, no carregamento) |
| `aprovarOrcamentoInterno` | 7 | ajustes_v52262_orcamento_uma_vez_loop_patch.js:37 (função, no carregamento) |
| `buildNav` | 7 | ajustes_v5250_leitura_overhaul_patch.js:343 (função, no carregamento) |
| `conferirNfe` | 7 | fiscal_guard_patch.js:185 (função, no carregamento) |
| `DIGICOPY_LOGO` | 7 | ajustes_v5189_patch.js:246 (valor, no carregamento) |
| `imprimirNotinha` | 7 | ajustes_v52245_venda_salvar_print_patch.js:76 (função, no carregamento) |
| `pintarMenus` | 7 | ajustes_v52243_menu_versao_boleto_patch.js:98 (função, no carregamento) |
| `renderModalContrato` | 7 | fluxo_contrato_leitura_corrigido_patch.js:75 (função, no carregamento) |
| `renderOrcamentos` | 7 | ajustes_v52289_orcamento_carimbo_autocura_patch.js:87 (função, no carregamento) |
| `renderOs` | 7 | automacoes_caixa_chat_auxiliares_patch.js:261 (função, no carregamento) |
| `salvarChamadoAvulso` | 7 | ajustes_v51920_patch.js:125 (função, no carregamento) |
| `vosConcluirFaturamento` | 7 | ajustes_v52245_venda_salvar_print_patch.js:85 (função, no carregamento) |
| `__cliEditSnapshot` | 6 | (só troca em uso) |
| `abrirCloudflareNuvem` | 6 | ajustes_v52296_backups_nuvem_patch.js:680 (função, no carregamento) |
| `doLoginUser` | 6 | ajustes_v52253_login_tela_branca_patch.js:161 (função, no carregamento) |
| `renderDashboard` | 6 | ajustes_v52213_menus_atalhos_patch.js:329 (função, no carregamento) |
| `renderLeituras` | 6 | ajustes_v5250_leitura_overhaul_patch.js:323 (função, no carregamento) |
| `renderUsuarios` | 6 | permissoes_override_menus_fiscais_patch.js:152 (alias, no carregamento) |
| `salvarOrcamentoTela` | 6 | ajustes_v52260_orcamento_trava_venda_atalho_patch.js:684 (função, no carregamento) |
| `saveDB` | 6 | cloudflare_data_sync_patch.js:2364 (função, no carregamento) |
| `vosSalvarVenda` | 6 | ajustes_v52245_venda_salvar_print_patch.js:58 (função, no carregamento) |
| `__CHAMADO_AVULSO` | 5 | chamados_avulsos_aberto_patch.js:49 (valor, no carregamento) |
| `__cliEditId` | 5 | (só troca em uso) |
| `__cliFoiFiltrado` | 5 | (só troca em uso) |
| `__digicopySincronizarVersao` | 5 | ajustes_v52258_orcamento_os_revalidar_patch.js:850 (alias, no carregamento) |
| `__lcChamPersistida` | 5 | (só troca em uso) |

## A lista completa dos repetidos

### `navigateTo` — 37 escritas

- sobrepõe: app.js:546 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:726 — função, no carregamento
- sobrepõe: notinha_patch.js:817 — função, no carregamento
- sobrepõe: interface_patch.js:204 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:227 — função, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:73 — função, no carregamento
- sobrepõe: etiqueta_busca_patch.js:126 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:87 — função, no carregamento
- sobrepõe: ajustes_v5197_patch.js:90 — função, no carregamento
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:147 — função, no carregamento
- sobrepõe: ajustes_v52243_menu_versao_boleto_patch.js:88 — função, no carregamento
- sobrepõe: ajustes_v52244_financeiro_datas_patch.js:83 — função, no carregamento
- sobrepõe: ajustes_v52245_rodape_versao_patch.js:90 — função, no carregamento
- sobrepõe: ajustes_v52246_nuvem_nao_autorizar_patch.js:33 — função, no carregamento
- sobrepõe: ajustes_v52247_exe_atualiza_patch.js:20 — função, no carregamento
- sobrepõe: ajustes_v52248_exe_cache_patch.js:15 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:310 — função, no carregamento
- sobrepõe: ajustes_v52250_exe_bundle_patch.js:35 — função, no carregamento
- sobrepõe: ajustes_v52251_exe_resiliencia_patch.js:104 — função, no carregamento
- sobrepõe: ajustes_v52252_resolucao_loop_patch.js:76 — função, no carregamento
- sobrepõe: ajustes_v52254_orcamentos_pages_patch.js:125 — função, no carregamento
- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:300 — função, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:418 — função, no carregamento
- sobrepõe: ajustes_v52257_orcamento_sync_total_patch.js:337 — função, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:864 — função, no carregamento
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:484 — função, no carregamento
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:803 — função, no carregamento
- sobrepõe: ajustes_v52261_orcamento_nao_volta_patch.js:279 — função, no carregamento
- sobrepõe: ajustes_v52263_exe_completo_patch.js:57 — função, no carregamento
- sobrepõe: painel_gerente_patch.js:159 — função, no carregamento
- sobrepõe: autocura_empresa_central_nf_tela_patch.js:245 — função, no carregamento
- sobrepõe: menus_fiscais_separados_patch.js:205 — alias, no carregamento
- sobrepõe: permissoes_override_menus_fiscais_patch.js:288 — alias, no carregamento
- sobrepõe: seis_submenus_velho_patch.js:569 — alias, no carregamento
- sobrepõe: navegacao_fiscal_barra_escuro_patch.js:442 — função, no carregamento
- sobrepõe: navegador_embutido_patch.js:508 — função, no carregamento
- **GANHA →** ajustes_v6108_lembrar_tela_patch.js:238 — função, no carregamento

### `__vosIgnorarSair` — 32 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:629 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:661 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:707 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:712 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:716 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:732 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:43 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:69 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:74 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:80 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:147 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:151 — valor, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:519 — valor, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:521 — valor, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:549 — valor, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:551 — valor, em uso
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:181 — valor, em uso
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:184 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:22 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:25 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:33 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:58 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:60 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:66 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:72 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:74 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:43 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:46 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:53 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:124 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:127 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:134 — valor, em uso

### `modalContext` — 24 escritas

- sobrepõe: app.js:966 — valor, em uso
- sobrepõe: app.js:1011 — valor, em uso
- sobrepõe: app.js:1419 — valor, em uso
- sobrepõe: app.js:1435 — valor, em uso
- sobrepõe: app.js:1450 — valor, em uso
- sobrepõe: app.js:1464 — valor, em uso
- sobrepõe: vendas_patch.js:452 — valor, em uso
- sobrepõe: vendas_os_patch.js:320 — valor, em uso
- sobrepõe: locacao_contratos_patch.js:296 — valor, em uso
- sobrepõe: locacao_contratos_patch.js:558 — valor, em uso
- sobrepõe: ajustes_pos_final_patch.js:114 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:50 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:396 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:164 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:282 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:242 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:310 — valor, em uso
- sobrepõe: ajustes_v5196_patch.js:165 — valor, em uso
- sobrepõe: ajustes_v5196_patch.js:268 — valor, em uso
- sobrepõe: ajustes_v5196_patch.js:281 — valor, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:445 — valor, em uso
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:642 — valor, em uso
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:380 — valor, em uso
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:621 — valor, em uso

### `showApp` — 23 escritas

- sobrepõe: app.js:476 — função de topo, no carregamento
- sobrepõe: login_otimizacao_patch.js:147 — função, no carregamento
- sobrepõe: contratos_final_patch.js:543 — função, no carregamento
- sobrepõe: automacoes_triggers_patch.js:144 — função, no carregamento
- sobrepõe: automacoes_financeiro_estoque_patch.js:263 — função, no carregamento
- sobrepõe: automacoes_locacao_visitas_patch.js:197 — função, no carregamento
- sobrepõe: automacoes_contratos_caixa_fiscal_patch.js:265 — função, no carregamento
- sobrepõe: automacoes_fiscal_cartuchos_patch.js:304 — função, no carregamento
- sobrepõe: automacoes_vendas_compras_cadastros_patch.js:251 — função, no carregamento
- sobrepõe: automacoes_orcamentos_clientes_auxiliares_patch.js:245 — função, no carregamento
- sobrepõe: automacoes_pix_contadores_auxiliares_patch.js:198 — função, no carregamento
- sobrepõe: automacoes_vendas_fiscal_auxiliares_patch.js:451 — função, no carregamento
- sobrepõe: automacoes_compras_recebimentos_contadores_patch.js:416 — função, no carregamento
- sobrepõe: automacoes_caixa_chat_auxiliares_patch.js:257 — função, no carregamento
- sobrepõe: automacoes_finais_locacao_auxiliares_patch.js:388 — função, no carregamento
- sobrepõe: automacoes_procedures_operacionais_patch.js:311 — função, no carregamento
- sobrepõe: cadastros_nomes_patch.js:137 — função, no carregamento
- sobrepõe: patch_relatorio.js:15 — função, no carregamento
- sobrepõe: ajustes_v5188_patch.js:26 — função, no carregamento
- sobrepõe: cloudflare_sync_patch.js:136 — função, no carregamento
- sobrepõe: ajustes_v52217_menus_arrastar_visibilidade_patch.js:167 — função, no carregamento
- sobrepõe: ajustes_v52239_menus_imediato_patch.js:87 — função, no carregamento
- **GANHA →** navegacao_fiscal_barra_escuro_patch.js:494 — função, no carregamento

### `__lcChamFormAberto` — 20 escritas

- sobrepõe: locacao_chamados_fix_patch.js:395 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:510 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:520 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:589 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:596 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:651 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:161 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:199 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:293 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:104 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:114 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:280 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:314 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:325 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:359 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:240 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:301 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:309 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:372 — valor, em uso
- sobrepõe: ajustes_v5181_patch.js:169 — valor, em uso

### `renderConfig` — 20 escritas

- sobrepõe: app.js:1376 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:362 — função, no carregamento
- sobrepõe: pix_patch.js:300 — função, no carregamento
- sobrepõe: contratos_rtf_template_patch.js:253 — função, no carregamento
- sobrepõe: automacoes_pix_contadores_auxiliares_patch.js:200 — função, no carregamento
- sobrepõe: automacoes_caixa_chat_auxiliares_patch.js:265 — função, no carregamento
- sobrepõe: automacoes_finais_locacao_auxiliares_patch.js:394 — função, no carregamento
- sobrepõe: cartuchos_etiquetas_config_patch.js:221 — função, no carregamento
- sobrepõe: sistema_clientes_loja_patch.js:170 — função, no carregamento
- sobrepõe: ajustes_v5189_patch.js:251 — função, no carregamento
- sobrepõe: ajustes_v5215_cnpj_inteligente_patch.js:207 — função, no carregamento
- sobrepõe: ajustes_v5220_nfe_config_patch.js:119 — função, no carregamento
- sobrepõe: ajustes_v5221_nfe_emissao_patch.js:556 — função, no carregamento
- sobrepõe: ajustes_v52217_cert_nuvem_patch.js:116 — função, no carregamento
- sobrepõe: ajustes_v52221_menus_dispositivo_patch.js:155 — função, no carregamento
- sobrepõe: ajustes_v52221_cert_nuvem_a1_patch.js:89 — função, no carregamento
- sobrepõe: ajustes_v52228_a1_nuvem_lupa_ncm_patch.js:140 — função, no carregamento
- sobrepõe: ajustes_v52229_nfe_ie_im_cnae_patch.js:165 — função, no carregamento
- sobrepõe: ajustes_v52230_modo_escuro_dispositivo_patch.js:112 — função, no carregamento
- **GANHA →** ajustes_v52234_config_aviso_salvou_patch.js:55 — função, no carregamento

### `renderFinanceiro` — 20 escritas

- sobrepõe: app.js:1320 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:342 — função, no carregamento
- sobrepõe: notinha_patch.js:582 — função, no carregamento
- sobrepõe: automacoes_financeiro_estoque_patch.js:265 — função, no carregamento
- sobrepõe: automacoes_contratos_caixa_fiscal_patch.js:271 — função, no carregamento
- sobrepõe: automacoes_fiscal_cartuchos_patch.js:310 — função, no carregamento
- sobrepõe: automacoes_orcamentos_clientes_auxiliares_patch.js:251 — função, no carregamento
- sobrepõe: automacoes_pix_contadores_auxiliares_patch.js:202 — função, no carregamento
- sobrepõe: automacoes_vendas_fiscal_auxiliares_patch.js:457 — função, no carregamento
- sobrepõe: automacoes_compras_recebimentos_contadores_patch.js:422 — função, no carregamento
- sobrepõe: automacoes_caixa_chat_auxiliares_patch.js:259 — função, no carregamento
- sobrepõe: automacoes_finais_locacao_auxiliares_patch.js:392 — função, no carregamento
- sobrepõe: ajustes_v52023_patch.js:206 — alias, no carregamento
- sobrepõe: ajustes_v52024_patch.js:59 — alias, no carregamento
- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:295 — alias, no carregamento
- sobrepõe: ajustes_v52217_financeiro_recibo_patch.js:204 — função, no carregamento
- sobrepõe: ajustes_v52243_financeiro_filtros_patch.js:151 — função, no carregamento
- sobrepõe: ajustes_v52244_financeiro_datas_patch.js:94 — função, no carregamento
- **GANHA →** ajustes_v52245_financeiro_hist_datas_patch.js:155 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:266 — função, em uso

### `renderVendas` — 18 escritas

- sobrepõe: app.js:1292 — função de topo, no carregamento
- sobrepõe: evolucao_patch.js:198 — função, no carregamento
- sobrepõe: notinha_patch.js:51 — função, no carregamento
- sobrepõe: notinha_patch.js:223 — função, no carregamento
- sobrepõe: notinha_patch.js:472 — função, no carregamento
- sobrepõe: vendas_os_patch.js:1283 — função, no carregamento
- sobrepõe: vendas_otimizacao_patch.js:131 — função, no carregamento
- sobrepõe: automacoes_triggers_patch.js:146 — função, no carregamento
- sobrepõe: automacoes_fiscal_cartuchos_patch.js:308 — função, no carregamento
- sobrepõe: automacoes_vendas_compras_cadastros_patch.js:253 — função, no carregamento
- sobrepõe: automacoes_orcamentos_clientes_auxiliares_patch.js:249 — função, no carregamento
- sobrepõe: automacoes_vendas_fiscal_auxiliares_patch.js:453 — função, no carregamento
- sobrepõe: automacoes_compras_recebimentos_contadores_patch.js:418 — função, no carregamento
- sobrepõe: correcoes_uso_diario_patch.js:150 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:433 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:1234 — função, no carregamento
- sobrepõe: ajustes_v52218_pix_prazo_print_venda_patch.js:98 — função, no carregamento
- **GANHA →** ajustes_v5240_relatorio_grande_patch.js:162 — função, no carregamento

### `openModalChamadoCompleto` — 16 escritas

- sobrepõe: locacao_contratos_patch.js:1078 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1370 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:452 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:392 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:160 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:279 — função, no carregamento
- sobrepõe: ajustes_v5174_patch.js:210 — função, no carregamento
- sobrepõe: ajustes_v5175_patch.js:232 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:214 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:126 — função, no carregamento
- sobrepõe: ajustes_v5181_patch.js:119 — função, no carregamento
- sobrepõe: ajustes_v5182_patch.js:166 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:100 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:121 — função, no carregamento
- sobrepõe: ajustes_v5185_patch.js:91 — função, no carregamento
- **GANHA →** ajustes_v5186_patch.js:273 — função, no carregamento

### `__lcChamDirty` — 15 escritas

- sobrepõe: locacao_chamados_fix_patch.js:393 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:419 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:509 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:522 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:590 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:651 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:82 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:86 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:162 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:200 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:294 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:105 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:281 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:326 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:241 — valor, em uso

### `renderClientes` — 15 escritas

- sobrepõe: app.js:1032 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:175 — função, no carregamento
- sobrepõe: notinha_patch.js:281 — função, no carregamento
- sobrepõe: clientes_patch.js:321 — função, no carregamento
- sobrepõe: interface_patch.js:86 — função, no carregamento
- sobrepõe: automacoes_orcamentos_clientes_auxiliares_patch.js:247 — função, no carregamento
- sobrepõe: automacoes_vendas_fiscal_auxiliares_patch.js:459 — função, no carregamento
- sobrepõe: automacoes_caixa_chat_auxiliares_patch.js:263 — função, no carregamento
- sobrepõe: cadastros_nomes_patch.js:143 — função, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:106 — função, no carregamento
- sobrepõe: sistema_clientes_loja_patch.js:173 — função, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:125 — função, no carregamento
- sobrepõe: ajustes_v52023_patch.js:201 — alias, no carregamento
- sobrepõe: ajustes_v5214_clientes_visiveis_patch.js:151 — função, no carregamento
- **GANHA →** ajustes_v5214_clientes_visiveis_patch.js:304 — função, no carregamento

### `closeModal` — 13 escritas

- sobrepõe: app.js:537 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:166 — função, no carregamento
- sobrepõe: vendas_otimizacao_patch.js:314 — função, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:62 — função, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:98 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:485 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:576 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:357 — função, no carregamento
- sobrepõe: ajustes_v5193_patch.js:70 — função, no carregamento
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:161 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:209 — função, no carregamento
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:50 — função, no carregamento
- **GANHA →** ajustes_v52295_venda_volta_patch.js:94 — função, no carregamento

### `renderContratos` — 12 escritas

- sobrepõe: app.js:1205 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:318 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:737 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:245 — função, no carregamento
- sobrepõe: contratos_final_patch.js:435 — função, no carregamento
- sobrepõe: contratos_visitas_vinculo_patch.js:111 — função, no carregamento
- sobrepõe: automacoes_locacao_visitas_patch.js:199 — função, no carregamento
- sobrepõe: automacoes_contratos_caixa_fiscal_patch.js:267 — função, no carregamento
- sobrepõe: automacoes_compras_recebimentos_contadores_patch.js:424 — função, no carregamento
- sobrepõe: automacoes_finais_locacao_auxiliares_patch.js:390 — função, no carregamento
- sobrepõe: ajustes_v52237_contratos_filtros_patch.js:245 — função, no carregamento
- **GANHA →** ajustes_v52243_contratos_sort_patch.js:96 — função, no carregamento

### `__chamadoPecasTemp` — 11 escritas

- sobrepõe: fluxos_operacionais_patch.js:1342 — valor, em uso
- sobrepõe: fluxos_operacionais_patch.js:1378 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:220 — valor, em uso
- sobrepõe: ajustes_v5174_patch.js:189 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:86 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:243 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:315 — valor, em uso
- sobrepõe: ajustes_v5176_patch.js:180 — valor, em uso
- sobrepõe: ajustes_v5177_patch.js:77 — valor, em uso
- sobrepõe: ajustes_v5181_patch.js:35 — valor, em uso
- sobrepõe: ajustes_v5182_patch.js:100 — valor, em uso

### `abrirChamadoAvulsoForm` — 11 escritas

- sobrepõe: locacao_chamados_fix_patch.js:519 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:198 — função, no carregamento
- sobrepõe: ajustes_v5175_patch.js:308 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:231 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:135 — função, no carregamento
- sobrepõe: ajustes_v5179_patch.js:103 — função, no carregamento
- sobrepõe: ajustes_v5181_patch.js:127 — função, no carregamento
- sobrepõe: ajustes_v5182_patch.js:175 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:56 — função, no carregamento
- sobrepõe: ajustes_v5185_patch.js:100 — função, no carregamento
- **GANHA →** ajustes_v5186_patch.js:283 — função, no carregamento

### `abrirLeiturasContrato` — 11 escritas

- sobrepõe: locacao_contratos_patch.js:791 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1140 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:369 — função, no carregamento
- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:118 — função, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:62 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:60 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:603 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:663 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:303 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:395 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:231 — função, no carregamento

### `renderProdutos` — 11 escritas

- sobrepõe: app.js:1044 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:305 — função, no carregamento
- sobrepõe: locacao_contratos_patch.js:95 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:471 — função, no carregamento
- sobrepõe: automacoes_contratos_caixa_fiscal_patch.js:269 — função, no carregamento
- sobrepõe: automacoes_fiscal_cartuchos_patch.js:306 — função, no carregamento
- sobrepõe: automacoes_vendas_compras_cadastros_patch.js:255 — função, no carregamento
- sobrepõe: automacoes_vendas_fiscal_auxiliares_patch.js:455 — função, no carregamento
- sobrepõe: ajustes_pos_final_patch.js:70 — função, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:211 — função, no carregamento
- **GANHA →** ajustes_v52224_cat_letra_uma_vez_patch.js:70 — função, no carregamento

### `vosGerarHtmlNotinha` — 11 escritas

- sobrepõe: vendas_os_patch.js:990 — função, no carregamento
- sobrepõe: pix_patch.js:211 — função, no carregamento
- sobrepõe: pix_comprovante_manual_patch.js:67 — função, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:150 — função, no carregamento
- sobrepõe: ajustes_pos_final_patch.js:96 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:894 — função, no carregamento
- sobrepõe: ajustes_v52217_print_sem_rodape_patch.js:49 — função, no carregamento
- sobrepõe: ajustes_v52235_codigo_sem_sku_patch.js:58 — função, no carregamento
- sobrepõe: ajustes_v52237_vendas_os_visual_patch.js:218 — função, no carregamento
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:145 — função, no carregamento
- **GANHA →** ajustes_v52239_print_escolha_patch.js:145 — função, no carregamento

### `abrirModalEquipamentoContrato` — 10 escritas

- sobrepõe: locacao_contratos_patch.js:607 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1013 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:310 — função, no carregamento
- sobrepõe: contratos_leituras_definitivo_patch.js:90 — função, no carregamento
- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:90 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:48 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:72 — função, em uso
- sobrepõe: ajustes_v52243_impressora_remanejar_patch.js:115 — função, no carregamento
- sobrepõe: ajustes_v52245_impressora_serial_ocultar_patch.js:160 — função, no carregamento
- **GANHA →** ajustes_v52435_impressora_remanejo_final_patch.js:142 — função, no carregamento

### `openContratoCompleto` — 10 escritas

- sobrepõe: locacao_contratos_patch.js:366 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:900 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:286 — função, no carregamento
- sobrepõe: contratos_final_patch.js:454 — função, no carregamento
- sobrepõe: contratos_visitas_vinculo_patch.js:113 — função, no carregamento
- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:85 — função, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:55 — função, no carregamento
- sobrepõe: ajustes_v52243_impressora_remanejar_patch.js:225 — função, no carregamento
- sobrepõe: ajustes_v52245_impressora_serial_ocultar_patch.js:325 — função, no carregamento
- **GANHA →** ajustes_v52435_impressora_remanejo_final_patch.js:220 — função, no carregamento

### `openModal` — 10 escritas

- sobrepõe: app.js:1462 — função, no carregamento
- sobrepõe: app.js:964 — função de topo, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1512 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:601 — função, no carregamento
- sobrepõe: chamados_avulsos_aberto_patch.js:166 — função, no carregamento
- sobrepõe: ajustes_pos_final_patch.js:100 — função, no carregamento
- sobrepõe: ajustes_v52227_ncm_origem_patch.js:149 — função, no carregamento
- sobrepõe: ajustes_v52228_a1_nuvem_lupa_ncm_patch.js:161 — função, no carregamento
- sobrepõe: ajustes_v52295_venda_volta_patch.js:80 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:328 — função, no carregamento

### `salvarChamadoCompleto` — 10 escritas

- sobrepõe: locacao_contratos_patch.js:1217 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1428 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:512 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:293 — função, no carregamento
- sobrepõe: ajustes_v5175_patch.js:353 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:135 — valor, no carregamento
- sobrepõe: ajustes_v5181_patch.js:187 — função, no carregamento
- sobrepõe: ajustes_v5182_patch.js:186 — função, no carregamento
- sobrepõe: ajustes_v5192_patch.js:74 — função, no carregamento
- **GANHA →** ajustes_v51920_patch.js:116 — função, no carregamento

### `__vosDirty` — 9 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:66 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:100 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:447 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:464 — valor, em uso
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:182 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:29 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:70 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:50 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:131 — valor, em uso

### `DIGICOPY_APP_VERSION` — 9 escritas

- sobrepõe: ajustes_v52254_orcamentos_pages_patch.js:7 — valor, no carregamento
- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:7 — valor, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:7 — valor, no carregamento
- sobrepõe: ajustes_v52257_orcamento_sync_total_patch.js:7 — valor, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:10 — valor, no carregamento
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:11 — valor, no carregamento
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:10 — valor, no carregamento
- sobrepõe: ajustes_v52264_exe_numero_novo_patch.js:44 — valor, no carregamento
- **GANHA →** ajustes_v52265_script_isolado_patch.js:57 — valor, no carregamento

### `historicoVenda` — 9 escritas

- sobrepõe: notinha_patch.js:552 — função, no carregamento
- sobrepõe: vendas_os_patch.js:1458 — função, no carregamento
- sobrepõe: vendas_extra_patch.js:61 — função, no carregamento
- sobrepõe: vendas_otimizacao_patch.js:289 — função, no carregamento
- sobrepõe: correcoes_uso_diario_patch.js:183 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:85 — valor, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:830 — função, no carregamento
- sobrepõe: ajustes_v51916_patch.js:22 — valor, no carregamento
- **GANHA →** permissoes_estorno_venda_patch.js:269 — alias, no carregamento

### `novaVenda` — 9 escritas

- sobrepõe: vendas_patch.js:68 — função, no carregamento
- sobrepõe: notinha_patch.js:103 — função, no carregamento
- sobrepõe: notinha_patch.js:248 — função, no carregamento
- sobrepõe: notinha_patch.js:373 — função, no carregamento
- sobrepõe: vendas_os_patch.js:107 — função, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:166 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:444 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:1208 — função, no carregamento
- **GANHA →** ajustes_v52218_pix_prazo_print_venda_patch.js:87 — função, no carregamento

### `open` — 9 escritas

- sobrepõe: ajustes_pos_final_patch.js:85 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:265 — função, em uso
- sobrepõe: ajustes_v5171_patch.js:274 — alias, em uso
- sobrepõe: ajustes_v52211_logo_impressao_unica_patch.js:43 — função, no carregamento
- sobrepõe: ajustes_v52211_logo_impressao_unica_patch.js:60 — função, em uso
- sobrepõe: ajustes_v52211_logo_impressao_unica_patch.js:66 — alias, em uso
- **GANHA →** ajustes_v52217_print_sem_rodape_patch.js:27 — função, no carregamento
- sobrepõe: ajustes_v5264_chamado_data_grande_patch.js:44 — função, em uso
- sobrepõe: ajustes_v5264_chamado_data_grande_patch.js:55 — alias, em uso

### `salvarImpressoraContrato` — 9 escritas

- sobrepõe: locacao_contratos_patch.js:721 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1086 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:345 — função, no carregamento
- sobrepõe: contratos_leituras_definitivo_patch.js:95 — função, no carregamento
- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:94 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:91 — função, em uso
- sobrepõe: ajustes_v52243_impressora_remanejar_patch.js:138 — função, no carregamento
- sobrepõe: ajustes_v52245_impressora_serial_ocultar_patch.js:195 — função, no carregamento
- **GANHA →** ajustes_v52435_impressora_remanejo_final_patch.js:159 — função, no carregamento

### `__vosPersistida` — 8 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:65 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:99 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:446 — valor, em uso
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:186 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:28 — valor, em uso
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:69 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:49 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:130 — valor, em uso

### `abrirTelaOrcamento` — 8 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:395 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:114 — função, no carregamento
- sobrepõe: ajustes_v52243_orcamentos_status_patch.js:86 — função, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:307 — função, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:463 — função, no carregamento
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:219 — função, no carregamento
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:454 — função, no carregamento
- **GANHA →** ajustes_v5240_relatorio_grande_patch.js:179 — função, no carregamento

### `autoPreencherDadosChamado` — 8 escritas

- sobrepõe: locacao_contratos_patch.js:1196 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1401 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:470 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:383 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:188 — função, no carregamento
- sobrepõe: ajustes_v5174_patch.js:58 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:146 — função, no carregamento
- **GANHA →** ajustes_v5177_patch.js:110 — função, no carregamento

### `showVenda` — 8 escritas

- sobrepõe: app.js:1297 — função de topo, no carregamento
- sobrepõe: vendas_patch.js:457 — função, no carregamento
- sobrepõe: notinha_patch.js:579 — função, no carregamento
- sobrepõe: vendas_os_patch.js:1536 — alias, no carregamento
- sobrepõe: patch_vendas_financeiro.js:14 — função, no carregamento
- sobrepõe: patch_vendas_financeiro.js:52 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:85 — função, no carregamento
- **GANHA →** ajustes_v51916_patch.js:22 — função, no carregamento

### `__esSt` — 7 escritas

- sobrepõe: buscador_escola_patch.js:129 — valor, em uso
- sobrepõe: buscador_escola_patch.js:133 — valor, em uso
- sobrepõe: buscador_escola_patch.js:147 — valor, em uso
- sobrepõe: buscador_escola_patch.js:151 — valor, em uso
- sobrepõe: buscador_escola_patch.js:168 — valor, em uso
- sobrepõe: buscador_escola_patch.js:189 — valor, em uso
- sobrepõe: buscador_escola_patch.js:192 — valor, em uso

### `__ORC_ST` — 7 escritas

- **GANHA →** ajustes_v52237_orcamentos_menu_patch.js:101 — valor, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:482 — valor, em uso
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:719 — valor, em uso
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:816 — valor, em uso
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:825 — valor, em uso
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:238 — valor, em uso
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:474 — valor, em uso

### `abrirEditorMenus` — 7 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:190 — função, no carregamento
- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:224 — alias, em uso
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:255 — função, no carregamento
- sobrepõe: ajustes_v52217_menus_arrastar_visibilidade_patch.js:100 — função, no carregamento
- sobrepõe: ajustes_v52221_menus_dispositivo_patch.js:96 — função, no carregamento
- sobrepõe: ajustes_v52222_menus_arrastar_patch.js:30 — função, no carregamento
- **GANHA →** ajustes_v52223_menus_arraste_patch.js:87 — função, no carregamento

### `aprovarOrcamentoInterno` — 7 escritas

- sobrepõe: ajustes_v52237_orcamentos_aprovacao_patch.js:143 — função, no carregamento
- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:222 — alias, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:220 — alias, no carregamento
- sobrepõe: ajustes_v52257_orcamento_sync_total_patch.js:220 — alias, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:449 — alias, no carregamento
- sobrepõe: ajustes_v52261_orcamento_nao_volta_patch.js:191 — função, no carregamento
- **GANHA →** ajustes_v52262_orcamento_uma_vez_loop_patch.js:37 — função, no carregamento

### `buildNav` — 7 escritas

- sobrepõe: app.js:591 — função de topo, no carregamento
- sobrepõe: correcoes_uso_diario_patch.js:51 — função, no carregamento
- sobrepõe: login_dados_automaticos_patch.js:192 — função, no carregamento
- sobrepõe: leitura_impressao_compacta_produtos_patch.js:94 — função, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:153 — função, no carregamento
- sobrepõe: ajustes_v5197_patch.js:102 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:343 — função, no carregamento

### `conferirNfe` — 7 escritas

- sobrepõe: ajustes_v5221_nfe_emissao_patch.js:465 — função, no carregamento
- sobrepõe: ajustes_v5228_nfe_assinatura_patch.js:137 — função, no carregamento
- sobrepõe: ajustes_v5229_nfe_atalho_historico_patch.js:130 — função, no carregamento
- sobrepõe: ajustes_v52212_celular_nuvem_patch.js:81 — função, em uso
- sobrepõe: ajustes_v52221_nfe_permissao_patch.js:121 — função, no carregamento
- sobrepõe: ajustes_v52228_a1_nuvem_lupa_ncm_patch.js:128 — função, no carregamento
- **GANHA →** fiscal_guard_patch.js:185 — função, no carregamento

### `DIGICOPY_LOGO` — 7 escritas

- sobrepõe: logo_data.js:3 — valor, no carregamento
- sobrepõe: ajustes_v5188_patch.js:21 — alias, em uso
- **GANHA →** ajustes_v5189_patch.js:246 — valor, no carregamento
- sobrepõe: ajustes_v5189_patch.js:253 — valor, em uso
- sobrepõe: ajustes_v5189_patch.js:257 — valor, em uso
- sobrepõe: ajustes_v5191_patch.js:25 — alias, em uso
- sobrepõe: ajustes_v5191_patch.js:26 — alias, em uso

### `imprimirNotinha` — 7 escritas

- sobrepõe: vendas_patch.js:472 — função, no carregamento
- sobrepõe: evolucao_patch.js:88 — função, no carregamento
- sobrepõe: notinha_patch.js:3 — função, no carregamento
- sobrepõe: vendas_os_patch.js:1166 — função, no carregamento
- sobrepõe: ajustes_v52239_print_escolha_patch.js:206 — função, no carregamento
- **GANHA →** ajustes_v52245_venda_salvar_print_patch.js:76 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:142 — função, em uso

### `pintarMenus` — 7 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:247 — alias, no carregamento
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:218 — função, no carregamento
- sobrepõe: ajustes_v52217_menus_arrastar_visibilidade_patch.js:58 — função, no carregamento
- sobrepõe: ajustes_v52221_menus_dispositivo_patch.js:78 — função, no carregamento
- sobrepõe: ajustes_v52239_menus_imediato_patch.js:49 — função, no carregamento
- sobrepõe: ajustes_v52243_financeiro_menu_patch.js:39 — função, no carregamento
- **GANHA →** ajustes_v52243_menu_versao_boleto_patch.js:98 — função, no carregamento

### `renderModalContrato` — 7 escritas

- sobrepõe: app.js:1214 — função de topo, no carregamento
- sobrepõe: evolucao_patch.js:235 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:814 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:268 — função, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:126 — função, no carregamento
- sobrepõe: contratos_leituras_definitivo_patch.js:79 — função, no carregamento
- **GANHA →** fluxo_contrato_leitura_corrigido_patch.js:75 — função, no carregamento

### `renderOrcamentos` — 7 escritas

- sobrepõe: evolucao_patch.js:253 — função de topo, no carregamento
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:171 — função, no carregamento
- sobrepõe: ajustes_v52243_orcamentos_status_patch.js:76 — função, no carregamento
- sobrepõe: ajustes_v52244_orcamentos_autorizar_patch.js:140 — função, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:710 — função, no carregamento
- **GANHA →** ajustes_v52289_orcamento_carimbo_autocura_patch.js:87 — função, no carregamento
- sobrepõe: ajustes_v52293_orcamento_guardiao_patch.js:76 — alias, em uso

### `renderOs` — 7 escritas

- sobrepõe: app.js:1261 — função de topo, no carregamento
- sobrepõe: evolucao_patch.js:118 — função, no carregamento
- sobrepõe: evolucao_patch.js:166 — função, no carregamento
- sobrepõe: notinha_patch.js:336 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:569 — função, no carregamento
- sobrepõe: automacoes_locacao_visitas_patch.js:201 — função, no carregamento
- **GANHA →** automacoes_caixa_chat_auxiliares_patch.js:261 — função, no carregamento

### `salvarChamadoAvulso` — 7 escritas

- sobrepõe: chamados_avulsos_aberto_patch.js:149 — função, no carregamento
- sobrepõe: ajustes_v5175_patch.js:377 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:139 — valor, no carregamento
- sobrepõe: ajustes_v5181_patch.js:200 — função, no carregamento
- sobrepõe: ajustes_v5182_patch.js:199 — função, no carregamento
- sobrepõe: ajustes_v5192_patch.js:83 — função, no carregamento
- **GANHA →** ajustes_v51920_patch.js:125 — função, no carregamento

### `vosConcluirFaturamento` — 7 escritas

- sobrepõe: vendas_os_patch.js:844 — função, no carregamento
- sobrepõe: pix_comprovante_manual_patch.js:42 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:313 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:1133 — função, no carregamento
- sobrepõe: ajustes_v52243_financeiro_filtros_patch.js:134 — função, no carregamento
- **GANHA →** ajustes_v52245_venda_salvar_print_patch.js:85 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:150 — função, em uso

### `__cliEditSnapshot` — 6 escritas

- sobrepõe: ajustes_v5193_patch.js:46 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:49 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:50 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:62 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:83 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:93 — valor, em uso

### `abrirCloudflareNuvem` — 6 escritas

- sobrepõe: cloudflare_sync_patch.js:425 — função, no carregamento
- sobrepõe: ajustes_v5227_nuvem_acompanhamento_patch.js:316 — função, no carregamento
- sobrepõe: ajustes_v5227_nuvem_acompanhamento_patch.js:397 — função, no carregamento
- sobrepõe: ajustes_v52212_celular_nuvem_patch.js:102 — função, no carregamento
- sobrepõe: ajustes_v52246_nuvem_nao_autorizar_patch.js:89 — função, no carregamento
- **GANHA →** ajustes_v52296_backups_nuvem_patch.js:680 — função, no carregamento

### `doLoginUser` — 6 escritas

- sobrepõe: app.js:461 — função de topo, no carregamento
- sobrepõe: login_otimizacao_patch.js:97 — função, no carregamento
- sobrepõe: login_dados_automaticos_patch.js:167 — função, no carregamento
- sobrepõe: sistema_clientes_loja_patch.js:147 — função, no carregamento
- sobrepõe: ajustes_v5186_patch.js:376 — função, no carregamento
- **GANHA →** ajustes_v52253_login_tela_branca_patch.js:161 — função, no carregamento

### `renderDashboard` — 6 escritas

- sobrepõe: app.js:1063 — função de topo, no carregamento
- sobrepõe: notificacoes_patch.js:223 — função, no carregamento
- sobrepõe: correcoes_uso_diario_patch.js:62 — função, no carregamento
- sobrepõe: etiqueta_busca_patch.js:122 — função, no carregamento
- **GANHA →** ajustes_v52213_menus_atalhos_patch.js:329 — função, no carregamento
- sobrepõe: dashboard_inicio_clicavel_patch.js:153 — alias, em uso

### `renderLeituras` — 6 escritas

- sobrepõe: app.js:1240 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:330 — função, no carregamento
- sobrepõe: automacoes_financeiro_estoque_patch.js:267 — função, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:144 — função, no carregamento
- sobrepõe: contratos_leituras_definitivo_patch.js:114 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:323 — função, no carregamento

### `renderUsuarios` — 6 escritas

- sobrepõe: app.js:1115 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:357 — função, no carregamento
- sobrepõe: ajustes_v5196_patch.js:109 — função, no carregamento
- sobrepõe: ajustes_v52221_nfe_permissao_patch.js:70 — função, no carregamento
- sobrepõe: permissoes_estorno_venda_patch.js:366 — alias, no carregamento
- **GANHA →** permissoes_override_menus_fiscais_patch.js:152 — alias, no carregamento

### `salvarOrcamentoTela` — 6 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:583 — função, no carregamento
- sobrepõe: ajustes_v52237_orcamentos_aprovacao_patch.js:246 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:188 — função, no carregamento
- sobrepõe: ajustes_v52244_orcamentos_autorizar_patch.js:112 — função, no carregamento
- sobrepõe: ajustes_v52258_orcamento_os_revalidar_patch.js:655 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:684 — função, no carregamento

### `saveDB` — 6 escritas

- sobrepõe: app.js:175 — função de topo, no carregamento
- sobrepõe: performance_patch.js:77 — função, no carregamento
- sobrepõe: indexeddb_persistence_patch.js:134 — função, no carregamento
- **GANHA →** cloudflare_data_sync_patch.js:2364 — função, no carregamento
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:426 — função, em uso
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:431 — alias, em uso

### `vosSalvarVenda` — 6 escritas

- sobrepõe: vendas_os_patch.js:716 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:96 — função, no carregamento
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:180 — função, no carregamento
- sobrepõe: ajustes_v52241_venda_salvar_fechar_patch.js:44 — função, no carregamento
- **GANHA →** ajustes_v52245_venda_salvar_print_patch.js:58 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:139 — função, em uso

### `__CHAMADO_AVULSO` — 5 escritas

- **GANHA →** chamados_avulsos_aberto_patch.js:49 — valor, no carregamento
- sobrepõe: chamados_avulsos_aberto_patch.js:120 — valor, em uso
- sobrepõe: ajustes_v5175_patch.js:356 — valor, em uso
- sobrepõe: ajustes_v5179_patch.js:69 — valor, em uso
- sobrepõe: ajustes_v5179_patch.js:83 — valor, em uso

### `__cliEditId` — 5 escritas

- sobrepõe: ajustes_v5193_patch.js:45 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:61 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:78 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:82 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:92 — valor, em uso

### `__cliFoiFiltrado` — 5 escritas

- sobrepõe: notinha_patch.js:210 — valor, em uso
- sobrepõe: notinha_patch.js:283 — valor, em uso
- sobrepõe: notinha_patch.js:289 — valor, em uso
- sobrepõe: notinha_patch.js:291 — valor, em uso
- sobrepõe: clientes_patch.js:360 — valor, em uso

### `__digicopySincronizarVersao` — 5 escritas

- sobrepõe: ajustes_v52254_orcamentos_pages_patch.js:120 — alias, no carregamento
- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:287 — alias, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:404 — alias, no carregamento
- sobrepõe: ajustes_v52257_orcamento_sync_total_patch.js:323 — alias, no carregamento
- **GANHA →** ajustes_v52258_orcamento_os_revalidar_patch.js:850 — alias, no carregamento

### `__lcChamPersistida` — 5 escritas

- sobrepõe: locacao_chamados_fix_patch.js:394 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:508 — valor, em uso
- sobrepõe: locacao_chamados_fix_patch.js:521 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:163 — valor, em uso
- sobrepõe: ajustes_v5171_patch.js:201 — valor, em uso

### `__orcDirty` — 5 escritas

- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:116 — valor, em uso
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:173 — valor, em uso
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:180 — valor, em uso
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:193 — valor, em uso
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:217 — valor, em uso

### `__vosItensAdicionadosTemp` — 5 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:101 — valor, em uso
- **GANHA →** vendas_notinhas_fix_patch.js:441 — valor, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:445 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:474 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:681 — valor, em uso

### `abrirChamadosContrato` — 5 escritas

- sobrepõe: locacao_contratos_patch.js:1026 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1295 — função, no carregamento
- sobrepõe: contratos_refino_patch.js:530 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:286 — função, no carregamento
- **GANHA →** ajustes_v5172_patch.js:103 — função, no carregamento

### `abrirLancamentoContador` — 5 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:130 — função, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:88 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:133 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:133 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:106 — função, no carregamento

### `db` — 5 escritas

- sobrepõe: app.js:266 — alias, no carregamento
- sobrepõe: app.js:265 — var de topo, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:95 — alias, em uso
- sobrepõe: leitura_busca_fluxo_patch.js:95 — alias, em uso
- **GANHA →** ajustes_v52253_login_tela_branca_patch.js:10 — alias, no carregamento

### `deleteLeituraContrato` — 5 escritas

- sobrepõe: locacao_contratos_patch.js:978 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1267 — função, no carregamento
- sobrepõe: automacoes_financeiro_estoque_patch.js:269 — função, no carregamento
- **GANHA →** ajustes_v52245_leitura_apagar_patch.js:26 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:172 — função, em uso

### `gerarHtmlOrcamento` — 5 escritas

- sobrepõe: ajustes_v52237_orcamentos_aprovacao_patch.js:170 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:230 — função, no carregamento
- sobrepõe: ajustes_v52240_orcamento_pages_patch.js:39 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:79 — função, em uso
- **GANHA →** ajustes_v52254_orcamentos_pages_patch.js:85 — função, no carregamento

### `lcAddPeca` — 5 escritas

- sobrepõe: ajustes_v5175_patch.js:83 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:176 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:73 — função, no carregamento
- sobrepõe: ajustes_v5181_patch.js:27 — função, no carregamento
- **GANHA →** ajustes_v5182_patch.js:115 — função, no carregamento

### `lcRenderPecas` — 5 escritas

- sobrepõe: ajustes_v5175_patch.js:100 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:95 — função, no carregamento
- sobrepõe: ajustes_v5178_patch.js:19 — função, no carregamento
- sobrepõe: ajustes_v5181_patch.js:57 — função, no carregamento
- **GANHA →** ajustes_v5182_patch.js:125 — função, no carregamento

### `renderEquipamentos` — 5 escritas

- sobrepõe: app.js:1192 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:312 — função, no carregamento
- sobrepõe: automacoes_pix_contadores_auxiliares_patch.js:204 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:110 — função, no carregamento
- **GANHA →** ajustes_v5171_patch.js:211 — função, no carregamento

### `renderModalCliente` — 5 escritas

- sobrepõe: app.js:979 — função de topo, no carregamento
- sobrepõe: evolucao_patch.js:44 — função, no carregamento
- sobrepõe: clientes_patch.js:159 — função, no carregamento
- sobrepõe: ajustes_v5193_patch.js:44 — função, no carregamento
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:506 — função, no carregamento

### `renderModalProduto` — 5 escritas

- sobrepõe: app.js:1134 — função de topo, no carregamento
- sobrepõe: locacao_contratos_patch.js:185 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:578 — função, no carregamento
- sobrepõe: ajustes_v52227_ncm_origem_patch.js:139 — função, no carregamento
- **GANHA →** ajustes_v52228_a1_nuvem_lupa_ncm_patch.js:151 — função, no carregamento

### `salvarEditorMenus` — 5 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:227 — função, no carregamento
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:292 — função, no carregamento
- sobrepõe: ajustes_v52217_menus_arrastar_visibilidade_patch.js:142 — função, no carregamento
- sobrepõe: ajustes_v52221_menus_dispositivo_patch.js:112 — função, no carregamento
- **GANHA →** ajustes_v52239_menus_imediato_patch.js:76 — função, no carregamento

### `salvarLancamentoContador` — 5 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:135 — função, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:93 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:141 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:142 — função, no carregamento
- **GANHA →** ajustes_v52436_leitura_uma_aberta_patch.js:85 — função, no carregamento

### `saveCliente` — 5 escritas

- sobrepõe: app.js:986 — função de topo, no carregamento
- sobrepõe: vendas_patch.js:574 — função, no carregamento
- sobrepõe: clientes_patch.js:249 — função, no carregamento
- sobrepõe: ajustes_v5193_patch.js:59 — função, no carregamento
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:517 — função, no carregamento

### `saveDBAgora` — 5 escritas

- sobrepõe: performance_patch.js:84 — função, no carregamento
- sobrepõe: indexeddb_persistence_patch.js:136 — função, no carregamento
- **GANHA →** cloudflare_data_sync_patch.js:2379 — função, no carregamento
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:426 — função, em uso
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:432 — alias, em uso

### `vendaSelecionadaId` — 5 escritas

- sobrepõe: notinha_patch.js:70 — alias, em uso
- sobrepõe: notinha_patch.js:99 — alias, em uso
- sobrepõe: notinha_patch.js:101 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:381 — valor, em uso
- sobrepõe: ajustes_v5240_relatorio_grande_patch.js:136 — valor, em uso

### `vosOnTipoItem` — 5 escritas

- sobrepõe: vendas_os_patch.js:400 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:1021 — função, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:267 — função, no carregamento
- sobrepõe: ajustes_v52218_etiqueta_recarga_venda_patch.js:151 — função, no carregamento
- **GANHA →** ajustes_v52219_filtros_busca_patch.js:349 — função, no carregamento

### `vosVendaSearchProd` — 5 escritas

- sobrepõe: vendas_os_patch.js:406 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:587 — função, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:258 — função, no carregamento
- sobrepõe: ajustes_v52218_etiqueta_recarga_venda_patch.js:71 — função, no carregamento
- **GANHA →** ajustes_v52219_filtros_busca_patch.js:314 — função, no carregamento

### `__abaAtualFinal` — 4 escritas

- **GANHA →** finalizacao_sistema_patch.js:70 — valor, no carregamento
- sobrepõe: finalizacao_sistema_patch.js:76 — alias, em uso
- sobrepõe: finalizacao_sistema_patch.js:86 — alias, em uso
- sobrepõe: finalizacao_sistema_patch.js:109 — alias, em uso

### `__bkRestaurar` — 4 escritas

- sobrepõe: ajustes_v52296_backups_nuvem_patch.js:466 — valor, em uso
- sobrepõe: ajustes_v52296_backups_nuvem_patch.js:467 — alias, em uso
- sobrepõe: ajustes_v52296_backups_nuvem_patch.js:475 — valor, em uso
- sobrepõe: ajustes_v52296_backups_nuvem_patch.js:492 — valor, em uso

### `__cliEditConfirmado` — 4 escritas

- sobrepõe: ajustes_v5193_patch.js:76 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:79 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:81 — valor, em uso
- sobrepõe: ajustes_v5193_patch.js:85 — valor, em uso

### `__esSync` — 4 escritas

- sobrepõe: buscador_escola_patch.js:124 — valor, em uso
- sobrepõe: buscador_escola_patch.js:193 — valor, em uso
- sobrepõe: buscador_escola_patch.js:307 — valor, em uso
- sobrepõe: buscador_escola_patch.js:308 — valor, em uso

### `__FIN_ST` — 4 escritas

- sobrepõe: ajustes_v52243_financeiro_filtros_patch.js:98 — valor, no carregamento
- sobrepõe: ajustes_v52244_financeiro_datas_patch.js:16 — valor, no carregamento
- **GANHA →** ajustes_v52245_financeiro_hist_datas_patch.js:61 — valor, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:221 — valor, em uso

### `__impPassoSerial` — 4 escritas

- sobrepõe: ajustes_v52243_impressora_remanejar_patch.js:108 — valor, em uso
- sobrepõe: ajustes_v52243_impressora_remanejar_patch.js:123 — valor, em uso
- sobrepõe: ajustes_v52245_impressora_serial_ocultar_patch.js:133 — valor, em uso
- sobrepõe: ajustes_v52245_impressora_serial_ocultar_patch.js:168 — valor, em uso

### `__lcLancAberto` — 4 escritas

- sobrepõe: ajustes_v5183_patch.js:134 — valor, em uso
- sobrepõe: ajustes_v5183_patch.js:143 — valor, em uso
- sobrepõe: ajustes_v5183_patch.js:154 — valor, em uso
- sobrepõe: ajustes_v5183_patch.js:166 — valor, em uso

### `__p609AutorizadoAte` — 4 escritas

- **GANHA →** permissoes_override_menus_fiscais_patch.js:62 — valor, no carregamento
- sobrepõe: permissoes_override_menus_fiscais_patch.js:116 — valor, em uso
- sobrepõe: permissoes_override_menus_fiscais_patch.js:230 — valor, em uso
- sobrepõe: seis_submenus_velho_patch.js:342 — valor, em uso

### `__v52239MenuSess` — 4 escritas

- sobrepõe: ajustes_v52239_menus_imediato_patch.js:43 — valor, em uso
- sobrepõe: ajustes_v52239_menus_imediato_patch.js:68 — alias, em uso
- sobrepõe: ajustes_v52239_menus_imediato_patch.js:77 — valor, em uso
- sobrepõe: ajustes_v52239_menus_imediato_patch.js:89 — valor, em uso

### `__v5250fatDaLista` — 4 escritas

- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:135 — valor, em uso
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:160 — valor, em uso
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:218 — valor, em uso
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:222 — valor, em uso

### `__vendasUsoFiltros` — 4 escritas

- sobrepõe: correcoes_uso_diario_patch.js:147 — valor, em uso
- sobrepõe: correcoes_uso_diario_patch.js:148 — valor, em uso
- sobrepõe: correcoes_uso_diario_patch.js:149 — valor, em uso
- sobrepõe: correcoes_uso_diario_patch.js:153 — valor, em uso

### `__vosFatSemPrint` — 4 escritas

- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:86 — valor, em uso
- sobrepõe: ajustes_v52245_venda_salvar_print_patch.js:89 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:151 — valor, em uso
- sobrepõe: ajustes_v52249_relatorio_patch.js:153 — valor, em uso

### `__vosPendenteReporEstoque` — 4 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:491 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:667 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:709 — alias, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:727 — valor, em uso

### `__vosPendenteVoltaVenda` — 4 escritas

- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:73 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:97 — valor, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:149 — alias, em uso
- sobrepõe: ajustes_v52237_estoque_zero_volta_patch.js:165 — alias, em uso

### `__vosPrintando` — 4 escritas

- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:146 — valor, em uso
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:149 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:149 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:163 — valor, em uso

### `__vosPrintOpts` — 4 escritas

- sobrepõe: ajustes_v52239_print_escolha_patch.js:197 — alias, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:199 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:208 — alias, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:210 — valor, em uso

### `abrirCentralNfe` — 4 escritas

- sobrepõe: ajustes_v52231_nfe_central_menu_patch.js:219 — alias, no carregamento
- sobrepõe: fiscal_guard_patch.js:194 — função, no carregamento
- sobrepõe: nf_transmissao_patch.js:449 — função, no carregamento
- **GANHA →** autocura_empresa_central_nf_tela_patch.js:279 — função, no carregamento

### `abrirLeituraContratoDetalhe` — 4 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:126 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:65 — função, no carregamento
- sobrepõe: ajustes_v5183_patch.js:150 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:278 — função, no carregamento

### `atualizarTiposLancamento` — 4 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:134 — função, no carregamento
- sobrepõe: leitura_busca_fluxo_patch.js:92 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:138 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:115 — função, no carregamento

### `estornarVenda` — 4 escritas

- sobrepõe: patch_vendas_financeiro.js:34 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:760 — função, no carregamento
- sobrepõe: ajustes_v52218_etiqueta_recarga_venda_patch.js:127 — função, no carregamento
- **GANHA →** ajustes_v5240_relatorio_grande_patch.js:95 — função, no carregamento

### `exportBackup` — 4 escritas

- sobrepõe: app.js:1385 — função de topo, no carregamento
- sobrepõe: ajustes_v52024_patch.js:37 — função, no carregamento
- sobrepõe: cloudflare_sync_patch.js:141 — função, no carregamento
- **GANHA →** ajustes_v52296_backups_nuvem_patch.js:600 — função, no carregamento

### `imprimirChamadoPDF` — 4 escritas

- sobrepõe: ajustes_v5186_patch.js:91 — função, no carregamento
- sobrepõe: ajustes_v5187_patch.js:79 — função, no carregamento
- **GANHA →** ajustes_v5189_patch.js:115 — função, no carregamento
- sobrepõe: ajustes_v5264_chamado_data_grande_patch.js:58 — alias, em uso

### `lcBuscarPeca` — 4 escritas

- sobrepõe: ajustes_v5175_patch.js:72 — função, no carregamento
- sobrepõe: ajustes_v5176_patch.js:162 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:57 — função, no carregamento
- **GANHA →** ajustes_v5182_patch.js:63 — função, no carregamento

### `lfbAlert` — 4 escritas

- sobrepõe: estoque_alert_patch.js:26 — alias, no carregamento
- sobrepõe: popup_sistema_patch.js:44 — função, no carregamento
- sobrepõe: ajustes_v52261_orcamento_nao_volta_patch.js:136 — função, no carregamento
- **GANHA →** ajustes_v52289_orcamento_carimbo_autocura_patch.js:55 — função, no carregamento

### `neoVendaSelecionada` — 4 escritas

- sobrepõe: notinha_patch.js:246 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:380 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:1228 — alias, em uso
- sobrepõe: ajustes_v5240_relatorio_grande_patch.js:136 — valor, em uso

### `orcBuscarProd` — 4 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:493 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:131 — função, no carregamento
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:215 — alias, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:371 — alias, no carregamento

### `renderModalUsuario` — 4 escritas

- sobrepõe: app.js:1004 — função de topo, no carregamento
- sobrepõe: ajustes_pos_final_patch.js:103 — função, no carregamento
- sobrepõe: ajustes_v5196_patch.js:168 — função, no carregamento
- **GANHA →** permissoes_estorno_venda_patch.js:148 — alias, no carregamento

### `renderModuloDinamico` — 4 escritas

- sobrepõe: app.js:699 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:654 — função, no carregamento
- **GANHA →** notinha_patch.js:836 — função, no carregamento
- sobrepõe: otimizacao_profunda_patch.js:165 — função, em uso

### `toast` — 4 escritas

- sobrepõe: app.js:289 — função de topo, no carregamento
- sobrepõe: interface_patch.js:57 — função, no carregamento
- sobrepõe: ajustes_v5171_patch.js:17 — função, no carregamento
- **GANHA →** ajustes_v52289_orcamento_carimbo_autocura_patch.js:65 — função, no carregamento

### `voltarNivelModal` — 4 escritas

- sobrepõe: navegacao_voltar_patch.js:72 — alias, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:511 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:640 — função, no carregamento
- **GANHA →** ajustes_v5172_patch.js:363 — função, no carregamento

### `vosAddItem` — 4 escritas

- sobrepõe: vendas_os_patch.js:445 — função, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:286 — função, no carregamento
- sobrepõe: ajustes_v52218_etiqueta_recarga_venda_patch.js:50 — função, no carregamento
- **GANHA →** ajustes_v52237_estoque_zero_volta_patch.js:114 — função, no carregamento

### `vosOsCompleta` — 4 escritas

- sobrepõe: ajustes_v52237_vendas_os_visual_patch.js:139 — função, no carregamento
- sobrepõe: ajustes_v52238_vendas_os_ajustes_patch.js:134 — função, no carregamento
- sobrepõe: ajustes_v52239_print_escolha_patch.js:135 — função, no carregamento
- **GANHA →** ajustes_v52239_patri_nao_obrigatorio_patch.js:34 — função, no carregamento

### `__confirmSistemaBypass` — 3 escritas

- **GANHA →** popup_sistema_patch.js:7 — valor, no carregamento
- sobrepõe: popup_sistema_patch.js:9 — valor, em uso
- sobrepõe: popup_sistema_patch.js:10 — valor, em uso

### `__CONTRATOS_FINAL_STATE__` — 3 escritas

- **GANHA →** contratos_final_patch.js:407 — valor, no carregamento
- sobrepõe: ajustes_v52214_ordenacao_patch.js:69 — valor, em uso
- sobrepõe: ajustes_v52243_contratos_sort_patch.js:39 — valor, em uso

### `__editandoVendaEstornadaId` — 3 escritas

- sobrepõe: permissoes_estorno_venda_patch.js:226 — alias, em uso
- sobrepõe: permissoes_estorno_venda_patch.js:281 — valor, em uso
- sobrepõe: permissoes_estorno_venda_patch.js:326 — valor, em uso

### `__estoqueAba` — 3 escritas

- **GANHA →** ajustes_v52214_recargas_patch.js:46 — valor, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:59 — valor, em uso
- sobrepõe: ajustes_v52214_recargas_patch.js:64 — valor, em uso

### `__fechamentoUsuarioFinal` — 3 escritas

- sobrepõe: finalizacao_sistema_patch.js:91 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:95 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:99 — valor, em uso

### `__lcAskLock` — 3 escritas

- **GANHA →** ajustes_v5172_patch.js:323 — valor, no carregamento
- sobrepõe: ajustes_v5172_patch.js:343 — valor, em uso
- sobrepõe: ajustes_v5172_patch.js:345 — valor, em uso

### `__lcAtualizarColor` — 3 escritas

- sobrepõe: ajustes_v5171_patch.js:146 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:137 — função, no carregamento
- **GANHA →** ajustes_v5174_patch.js:97 — função, no carregamento

### `__lcMontarChamadoUI` — 3 escritas

- sobrepõe: ajustes_v5171_patch.js:56 — função, no carregamento
- sobrepõe: ajustes_v5172_patch.js:257 — função, no carregamento
- **GANHA →** ajustes_v5174_patch.js:199 — função, no carregamento

### `__lcPecaSel` — 3 escritas

- **GANHA →** ajustes_v5182_patch.js:22 — valor, no carregamento
- sobrepõe: ajustes_v5182_patch.js:83 — alias, em uso
- sobrepõe: ajustes_v5182_patch.js:106 — valor, em uso

### `__orcPendenteVolta` — 3 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:518 — alias, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:548 — alias, em uso
- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:617 — valor, em uso

### `__vosForm` — 3 escritas

- sobrepõe: vendas_os_patch.js:110 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:518 — valor, em uso
- sobrepõe: ajustes_v52295_venda_volta_patch.js:59 — alias, em uso

### `__vosSortV` — 3 escritas

- sobrepõe: vendas_os_patch.js:1278 — valor, em uso
- sobrepõe: vendas_os_patch.js:1345 — alias, em uso
- sobrepõe: migrados_print_patch.js:106 — valor, em uso

### `abrirEditorAtalhos` — 3 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:267 — função, no carregamento
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:365 — função, no carregamento
- **GANHA →** ajustes_v52221_menus_dispositivo_patch.js:104 — função, no carregamento

### `aprovarOrcamentoManual` — 3 escritas

- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:225 — função, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:262 — função, no carregamento
- **GANHA →** ajustes_v52257_orcamento_sync_total_patch.js:262 — função, no carregamento

### `buscarClientesChamadoAvulso` — 3 escritas

- sobrepõe: chamados_avulsos_aberto_patch.js:69 — alias, no carregamento
- sobrepõe: ajustes_v5179_patch.js:95 — função, no carregamento
- **GANHA →** ajustes_v52219_filtros_busca_patch.js:301 — função, no carregamento

### `buscarCNPJAutomatico` — 3 escritas

- sobrepõe: evolucao_patch.js:9 — função de topo, no carregamento
- sobrepõe: clientes_patch.js:91 — função, no carregamento
- **GANHA →** ajustes_v5215_cnpj_inteligente_patch.js:143 — função, no carregamento

### `calcImpressoesChamado` — 3 escritas

- sobrepõe: locacao_contratos_patch.js:1210 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1415 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:485 — função, no carregamento

### `clienteSelecionadoVenda` — 3 escritas

- sobrepõe: vendas_patch.js:183 — valor, em uso
- sobrepõe: vendas_patch.js:218 — alias, em uso
- sobrepõe: vendas_patch.js:227 — valor, em uso

### `cvProduto` — 3 escritas

- sobrepõe: notinha_patch.js:109 — valor, em uso
- sobrepõe: notinha_patch.js:146 — alias, em uso
- sobrepõe: notinha_patch.js:148 — valor, em uso

### `deleteProduto` — 3 escritas

- sobrepõe: app.js:1054 — função de topo, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:704 — função, no carregamento
- **GANHA →** ajustes_v51916_patch.js:55 — função, no carregamento

### `estornarNotinha` — 3 escritas

- sobrepõe: vendas_otimizacao_patch.js:162 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:760 — valor, no carregamento
- **GANHA →** ajustes_v52218_etiqueta_recarga_venda_patch.js:127 — valor, no carregamento

### `excluirOrcamentosMarcados` — 3 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:239 — função, no carregamento
- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:377 — alias, no carregamento
- **GANHA →** ajustes_v52261_orcamento_nao_volta_patch.js:239 — função, no carregamento

### `faturarLeituraContrato` — 3 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:136 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:143 — função, no carregamento
- **GANHA →** ajustes_v5250_leitura_overhaul_patch.js:130 — função, no carregamento

### `faturarVenda` — 3 escritas

- sobrepõe: app.js:1299 — função de topo, no carregamento
- sobrepõe: vendas_os_patch.js:733 — função, no carregamento
- **GANHA →** vendas_notinhas_fix_patch.js:293 — função, no carregamento

### `filtrarModuloDinamico` — 3 escritas

- sobrepõe: app.js:756 — função de topo, no carregamento
- **GANHA →** notinha_patch.js:715 — função, no carregamento
- sobrepõe: otimizacao_profunda_patch.js:174 — função, em uso

### `finModoV52243` — 3 escritas

- sobrepõe: ajustes_v52243_financeiro_filtros_patch.js:126 — função, no carregamento
- sobrepõe: ajustes_v52244_financeiro_datas_patch.js:18 — função, no carregamento
- **GANHA →** ajustes_v52245_financeiro_hist_datas_patch.js:63 — função, no carregamento

### `historicoLancamento` — 3 escritas

- sobrepõe: notinha_patch.js:619 — função, no carregamento
- **GANHA →** ajustes_v52245_financeiro_hist_datas_patch.js:165 — função, no carregamento
- sobrepõe: ajustes_v52249_relatorio_patch.js:275 — função, em uso

### `imprimirLeituraContrato` — 3 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:137 — função, no carregamento
- sobrepõe: leitura_detalhada_departamentos_patch.js:144 — função, no carregamento
- **GANHA →** leitura_impressao_compacta_produtos_patch.js:76 — função, no carregamento

### `imprimirRelatorioLeiturasPDF` — 3 escritas

- sobrepõe: locacao_contratos_patch.js:988 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1275 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:549 — função, no carregamento

### `lcBuscarImpressoraChamado` — 3 escritas

- sobrepõe: ajustes_v5172_patch.js:166 — função, no carregamento
- sobrepõe: ajustes_v5174_patch.js:124 — função, no carregamento
- **GANHA →** ajustes_v5175_patch.js:207 — função, no carregamento

### `lcCalcColor` — 3 escritas

- sobrepõe: ajustes_v5172_patch.js:128 — função, no carregamento
- sobrepõe: ajustes_v5174_patch.js:90 — função, no carregamento
- **GANHA →** ajustes_v5175_patch.js:51 — função, no carregamento

### `lcRemoverPeca` — 3 escritas

- sobrepõe: ajustes_v5175_patch.js:94 — função, no carregamento
- sobrepõe: ajustes_v5177_patch.js:86 — função, no carregamento
- **GANHA →** ajustes_v5178_patch.js:31 — função, no carregamento

### `neoVendaProduto` — 3 escritas

- sobrepõe: notinha_patch.js:250 — valor, em uso
- sobrepõe: notinha_patch.js:273 — alias, em uso
- sobrepõe: notinha_patch.js:274 — valor, em uso

### `orcAddItem` — 3 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:537 — função, no carregamento
- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:178 — função, no carregamento
- **GANHA →** ajustes_v52259_orcamento_filtros_item_patch.js:398 — função, no carregamento

### `orcBuscarCliente` — 3 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:469 — função, no carregamento
- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:214 — alias, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:358 — alias, no carregamento

### `pintarAtalhos` — 3 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:325 — alias, no carregamento
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:335 — função, no carregamento
- **GANHA →** ajustes_v52221_menus_dispositivo_patch.js:88 — função, no carregamento

### `reconhecerImpressoraContrato` — 3 escritas

- sobrepõe: locacao_contratos_patch.js:700 — função, no carregamento
- sobrepõe: fluxos_operacionais_patch.js:1063 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:323 — função, no carregamento

### `recusarOrcamentoManual` — 3 escritas

- sobrepõe: ajustes_v52255_orcamento_aprovacao_venda_patch.js:247 — função, no carregamento
- sobrepõe: ajustes_v52256_orcamento_venda_limpa_patch.js:283 — função, no carregamento
- **GANHA →** ajustes_v52257_orcamento_sync_total_patch.js:283 — função, no carregamento

### `renderAuditoria` — 3 escritas

- sobrepõe: app.js:1124 — função de topo, no carregamento
- sobrepõe: notinha_patch.js:352 — função, no carregamento
- **GANHA →** ajustes_v5197_patch.js:68 — alias, no carregamento

### `renderCentralNf` — 3 escritas

- sobrepõe: autocura_empresa_central_nf_tela_patch.js:240 — alias, no carregamento
- sobrepõe: fiscal_menu_completo_patch.js:462 — alias, no carregamento
- **GANHA →** menus_fiscais_separados_patch.js:190 — alias, no carregamento

### `salvarEditorAtalhos` — 3 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:305 — função, no carregamento
- sobrepõe: ajustes_v52216_menus_submenus_patch.js:418 — função, no carregamento
- **GANHA →** ajustes_v52221_menus_dispositivo_patch.js:126 — função, no carregamento

### `saveUsuario` — 3 escritas

- sobrepõe: app.js:1012 — função de topo, no carregamento
- sobrepõe: ajustes_v5196_patch.js:258 — função, no carregamento
- **GANHA →** permissoes_estorno_venda_patch.js:188 — alias, no carregamento

### `seedData` — 3 escritas

- sobrepõe: app.js:315 — função de topo, no carregamento
- sobrepõe: vendas_patch.js:20 — função, no carregamento
- **GANHA →** ajustes_v5214_clientes_visiveis_patch.js:141 — função, no carregamento

### `selecionarClienteChamadoAvulso` — 3 escritas

- sobrepõe: chamados_avulsos_aberto_patch.js:71 — função, no carregamento
- sobrepõe: locacao_chamados_fix_patch.js:534 — função, no carregamento
- **GANHA →** ajustes_v5179_patch.js:80 — função, no carregamento

### `showLogin` — 3 escritas

- sobrepõe: app.js:498 — função de topo, no carregamento
- sobrepõe: vendas_patch.js:38 — função, no carregamento
- **GANHA →** login_dados_automaticos_patch.js:164 — função, no carregamento

### `vosAbrirRecebimento` — 3 escritas

- sobrepõe: vendas_os_patch.js:741 — função, no carregamento
- sobrepõe: vendas_notinhas_fix_patch.js:256 — função, no carregamento
- **GANHA →** ajustes_v52243_menu_versao_boleto_patch.js:175 — função, no carregamento

### `vosEscolherForma` — 3 escritas

- sobrepõe: vendas_os_patch.js:808 — função, no carregamento
- sobrepõe: pix_patch.js:171 — função, no carregamento
- **GANHA →** ajustes_v52218_pix_prazo_print_venda_patch.js:24 — função, no carregamento

### `vosOsRuleHint` — 3 escritas

- sobrepõe: vendas_os_patch.js:538 — função, no carregamento
- sobrepõe: ajustes_v52237_vendas_os_visual_patch.js:196 — função, no carregamento
- **GANHA →** ajustes_v52239_patri_nao_obrigatorio_patch.js:48 — função, no carregamento

### `vosVendaSearchCliente` — 3 escritas

- sobrepõe: vendas_os_patch.js:365 — função, no carregamento
- sobrepõe: ajustes_v52219_filtros_busca_patch.js:242 — função, no carregamento
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:559 — função, no carregamento

### `__abaHistFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:71 — valor, no carregamento
- **GANHA →** navegacao_voltar_patch.js:14 — valor, no carregamento

### `__cfgAvisoSalvouLock` — 2 escritas

- sobrepõe: ajustes_v52234_config_aviso_salvou_patch.js:20 — valor, em uso
- sobrepõe: ajustes_v52234_config_aviso_salvou_patch.js:21 — valor, em uso

### `__clientesBuscaFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:120 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:121 — valor, em uso

### `__clientesCampoFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:120 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:121 — valor, em uso

### `__clientesSortFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:117 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:121 — valor, em uso

### `__clientesTodosFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:120 — valor, em uso
- sobrepõe: finalizacao_sistema_patch.js:121 — valor, em uso

### `__dbPersistidoOk` — 2 escritas

- sobrepõe: app.js:222 — valor, em uso
- sobrepõe: indexeddb_persistence_patch.js:69 — valor, em uso

### `__esFim` — 2 escritas

- sobrepõe: buscador_escola_patch.js:310 — valor, em uso
- sobrepõe: buscador_escola_patch.js:311 — valor, em uso

### `__esLogs` — 2 escritas

- sobrepõe: buscador_escola_patch.js:125 — valor, em uso
- sobrepõe: buscador_escola_patch.js:309 — valor, em uso

### `__finNovoCli` — 2 escritas

- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:182 — valor, em uso
- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:230 — alias, em uso

### `__indexedDbPersistAtivo` — 2 escritas

- **GANHA →** indexeddb_persistence_patch.js:14 — valor, no carregamento
- sobrepõe: indexeddb_persistence_patch.js:98 — valor, em uso

### `__KAUAN_REFINO_STATE__` — 2 escritas

- **GANHA →** contratos_refino_patch.js:195 — valor, no carregamento
- sobrepõe: ajustes_v52243_contratos_sort_patch.js:42 — valor, em uso

### `__KAUAN_STATE__` — 2 escritas

- **GANHA →** fluxos_operacionais_patch.js:287 — valor, no carregamento
- sobrepõe: ajustes_v52214_ordenacao_patch.js:48 — valor, em uso

### `__krPecasChamado` — 2 escritas

- sobrepõe: contratos_refino_patch.js:446 — valor, em uso
- sobrepõe: contratos_refino_patch.js:458 — valor, em uso

### `__lcChamFiltro` — 2 escritas

- sobrepõe: locacao_chamados_fix_patch.js:132 — valor, no carregamento
- **GANHA →** ajustes_v5172_patch.js:30 — valor, no carregamento

### `__lcDelLock` — 2 escritas

- sobrepõe: ajustes_v5178_patch.js:34 — valor, em uso
- sobrepõe: ajustes_v5178_patch.js:40 — valor, em uso

### `__modalStackOperacional` — 2 escritas

- **GANHA →** ajustes_relatorio_pai_patch.js:32 — valor, no carregamento
- sobrepõe: ajustes_relatorio_pai_patch.js:64 — valor, em uso

### `__nfxHistAlvo` — 2 escritas

- sobrepõe: autocura_empresa_central_nf_tela_patch.js:237 — valor, em uso
- sobrepõe: permissoes_override_menus_fiscais_patch.js:173 — valor, em uso

### `__prodSortDir` — 2 escritas

- sobrepõe: locacao_contratos_patch.js:176 — valor, em uso
- sobrepõe: locacao_contratos_patch.js:179 — valor, em uso

### `__recargasBusca` — 2 escritas

- **GANHA →** ajustes_v52214_recargas_patch.js:48 — valor, no carregamento
- sobrepõe: ajustes_v52214_recargas_patch.js:71 — valor, em uso

### `__saveDBDrainSync` — 2 escritas

- sobrepõe: app.js:249 — alias, no carregamento
- **GANHA →** app.js:243 — função de topo, no carregamento

### `__v5250leituraXBypass` — 2 escritas

- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:292 — valor, em uso
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:299 — valor, em uso

### `__vosAdvF` — 2 escritas

- sobrepõe: vendas_os_patch.js:1293 — valor, em uso
- sobrepõe: vendas_os_patch.js:1450 — valor, em uso

### `__vosCliIdxBase` — 2 escritas

- **GANHA →** ajustes_v5243_cliente_abas_patch.js:558 — valor, no carregamento
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:566 — alias, em uso

### `__vosCliIdxFresco` — 2 escritas

- **GANHA →** ajustes_v5243_cliente_abas_patch.js:558 — valor, no carregamento
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:567 — valor, em uso

### `__vosForcarOS` — 2 escritas

- sobrepõe: ajustes_v52239_print_escolha_patch.js:147 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:161 — valor, em uso

### `__vosForcarVenda` — 2 escritas

- sobrepõe: ajustes_v52239_print_escolha_patch.js:148 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:162 — valor, em uso

### `__vosLegCache` — 2 escritas

- sobrepõe: vendas_os_patch.js:1262 — valor, em uso
- sobrepõe: vendas_otimizacao_patch.js:125 — valor, em uso

### `__vosLimiteVendas` — 2 escritas

- sobrepõe: vendas_os_patch.js:1280 — valor, em uso
- sobrepõe: vendas_os_patch.js:1445 — valor, em uso

### `__vosPermitirVendaVazia` — 2 escritas

- sobrepõe: ajustes_v52239_print_escolha_patch.js:182 — valor, em uso
- sobrepõe: ajustes_v52239_print_escolha_patch.js:193 — valor, em uso

### `__vosSalvoConfirmadoTemp` — 2 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:630 — valor, em uso
- sobrepõe: vendas_notinhas_fix_patch.js:632 — valor, em uso

### `__vosUltBusca` — 2 escritas

- **GANHA →** ajustes_v5243_cliente_abas_patch.js:556 — valor, no carregamento
- sobrepõe: ajustes_v5243_cliente_abas_patch.js:575 — valor, em uso

### `__vosUltimaListaVendas` — 2 escritas

- sobrepõe: vendas_os_patch.js:1370 — alias, em uso
- sobrepõe: correcoes_uso_diario_patch.js:170 — alias, em uso

### `__vosVendaPendente` — 2 escritas

- sobrepõe: ajustes_v52295_venda_volta_patch.js:56 — valor, em uso
- sobrepõe: ajustes_v52295_venda_volta_patch.js:83 — valor, em uso

### `_prevConfigEmpresa` — 2 escritas

- sobrepõe: evolucao_patch.js:101 — alias, em uso
- sobrepõe: evolucao_patch.js:109 — valor, em uso

### `abrirEditorLeituraContrato` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:1160 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:374 — função, no carregamento

### `abrirHistoricoChamadosGeral` — 2 escritas

- sobrepõe: locacao_chamados_fix_patch.js:229 — função, no carregamento
- **GANHA →** ajustes_v5172_patch.js:113 — função, no carregamento

### `abrirLancamentoContadorContrato` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:1208 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:389 — função, no carregamento

### `abrirListaImpressorasParaLeitura` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:1172 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:375 — função, no carregamento

### `avisoSistema` — 2 escritas

- sobrepõe: popup_sistema_patch.js:45 — função, no carregamento
- **GANHA →** ajustes_v52289_orcamento_carimbo_autocura_patch.js:60 — função, no carregamento

### `backToCNPJ` — 2 escritas

- sobrepõe: app.js:456 — função de topo, no carregamento
- **GANHA →** login_dados_automaticos_patch.js:166 — função, no carregamento

### `baixarContratoRTF` — 2 escritas

- sobrepõe: contratos_final_patch.js:527 — função, no carregamento
- **GANHA →** contratos_rtf_template_patch.js:202 — função, no carregamento

### `baixarCR` — 2 escritas

- sobrepõe: app.js:1351 — função de topo, no carregamento
- **GANHA →** notificacoes_patch.js:210 — função, no carregamento

### `buscarImpressorasLancamento` — 2 escritas

- sobrepõe: leitura_busca_fluxo_patch.js:80 — função, no carregamento
- **GANHA →** leitura_detalhada_departamentos_patch.js:117 — função, no carregamento

### `categoriaModulo` — 2 escritas

- sobrepõe: app.js:681 — função de topo, no carregamento
- **GANHA →** locacao_patch.js:467 — função, no carregamento

### `CLITAB_PURE` — 2 escritas

- sobrepõe: ajustes_v5243_cliente_abas_patch.js:79 — alias, no carregamento
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:33 — var de topo, no carregamento

### `contratosFinalBuscar` — 2 escritas

- sobrepõe: contratos_final_patch.js:433 — função, no carregamento
- **GANHA →** ajustes_v52237_contratos_filtros_patch.js:270 — função, no carregamento

### `contratosFinalSort` — 2 escritas

- sobrepõe: contratos_final_patch.js:434 — função, no carregamento
- **GANHA →** ajustes_v52243_contratos_sort_patch.js:74 — função, no carregamento

### `contratosSortRefino` — 2 escritas

- sobrepõe: contratos_refino_patch.js:244 — função, no carregamento
- **GANHA →** ajustes_v52243_contratos_sort_patch.js:87 — função, no carregamento

### `cvCliente` — 2 escritas

- sobrepõe: notinha_patch.js:109 — valor, em uso
- sobrepõe: notinha_patch.js:139 — alias, em uso

### `dataCriacaoCR` — 2 escritas

- sobrepõe: app.js:1318 — alias, no carregamento
- **GANHA →** app.js:1305 — função de topo, no carregamento

### `doLoginCNPJ` — 2 escritas

- sobrepõe: app.js:420 — função de topo, no carregamento
- **GANHA →** vendas_patch.js:59 — função, no carregamento

### `doLogout` — 2 escritas

- **GANHA →** app.js:510 — função de topo, no carregamento
- sobrepõe: popup_sistema_patch.js:74 — função, em uso

### `ehTecnicoDemo` — 2 escritas

- sobrepõe: app.js:58 — alias, no carregamento
- **GANHA →** app.js:51 — função de topo, no carregamento

### `estornarLeituraContrato` — 2 escritas

- **GANHA →** leitura_detalhada_departamentos_patch.js:142 — função, no carregamento
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:152 — função, em uso

### `estornarVendaParaEditar` — 2 escritas

- **GANHA →** ajustes_relatorio_pai_patch.js:170 — função, no carregamento
- sobrepõe: popup_sistema_patch.js:106 — função, em uso

### `excluirContratoOperacional` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:883 — função, no carregamento
- **GANHA →** ajustes_v51916_patch.js:92 — função, no carregamento

### `excluirOrcamento` — 2 escritas

- sobrepõe: ajustes_v52260_orcamento_trava_venda_atalho_patch.js:378 — alias, no carregamento
- **GANHA →** ajustes_v52261_orcamento_nao_volta_patch.js:250 — alias, no carregamento

### `excluirVendaUnificado` — 2 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:336 — função, no carregamento
- **GANHA →** ajustes_v52261_orcamento_nao_volta_patch.js:221 — função, no carregamento

### `fbImportToErp` — 2 escritas

- sobrepõe: app.js:2058 — função de topo, no carregamento
- **GANHA →** locacao_patch.js:458 — função, no carregamento

### `fecharModalOperacional` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:1496 — alias, no carregamento
- **GANHA →** contratos_refino_patch.js:211 — alias, no carregamento

### `finAcaoReceber` — 2 escritas

- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:106 — função, no carregamento
- **GANHA →** ajustes_v52243_menu_versao_boleto_patch.js:138 — função, no carregamento

### `finBuscarCliente` — 2 escritas

- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:210 — função, no carregamento
- **GANHA →** ajustes_v52219_filtros_busca_patch.js:253 — função, no carregamento

### `finConfirmarBaixa` — 2 escritas

- sobrepõe: ajustes_v52213_financeiro_receber_patch.js:159 — função, no carregamento
- **GANHA →** ajustes_v52243_menu_versao_boleto_patch.js:148 — função, no carregamento

### `finModoV52244` — 2 escritas

- sobrepõe: ajustes_v52244_financeiro_datas_patch.js:23 — alias, no carregamento
- **GANHA →** ajustes_v52245_financeiro_hist_datas_patch.js:67 — alias, no carregamento

### `gerarOrcamentoPDF` — 2 escritas

- sobrepõe: evolucao_patch.js:271 — função de topo, no carregamento
- **GANHA →** notinha_patch.js:10 — função, no carregamento

### `imprimirChamado` — 2 escritas

- sobrepõe: patch_chamados.js:155 — função, no carregamento
- **GANHA →** ajustes_v5180_patch.js:55 — função, no carregamento

### `imprimirContratoLocacaoOperacional` — 2 escritas

- sobrepõe: fluxos_operacionais_patch.js:1486 — função, no carregamento
- **GANHA →** contratos_refino_patch.js:557 — função, no carregamento

### `imprimirOrcamento` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_aprovacao_patch.js:156 — função, no carregamento
- **GANHA →** ajustes_v52244_orcamentos_autorizar_patch.js:126 — função, no carregamento

### `itensTemp` — 2 escritas

- sobrepõe: vendas_patch.js:182 — valor, em uso
- sobrepõe: permissoes_estorno_venda_patch.js:239 — valor, em uso

### `lcAddProdutoChamado` — 2 escritas

- sobrepõe: ajustes_v5172_patch.js:218 — função, no carregamento
- **GANHA →** ajustes_v5174_patch.js:178 — função, no carregamento

### `lcBuscarProdutoChamado` — 2 escritas

- sobrepõe: ajustes_v5172_patch.js:207 — função, no carregamento
- **GANHA →** ajustes_v5174_patch.js:167 — função, no carregamento

### `lcLeiturasTodos` — 2 escritas

- sobrepõe: ajustes_v5172_patch.js:388 — função, no carregamento
- **GANHA →** ajustes_v5174_patch.js:221 — função, no carregamento

### `lcUpdPeca` — 2 escritas

- sobrepõe: ajustes_v5181_patch.js:50 — função, no carregamento
- **GANHA →** ajustes_v5182_patch.js:119 — função, no carregamento

### `lockVendaFaturadaUI` — 2 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:120 — função, no carregamento
- **GANHA →** ajustes_v5221_nfe_emissao_patch.js:538 — função, no carregamento

### `LUPA_ALINHA_PURE` — 2 escritas

- sobrepõe: ajustes_v52220_lupa_alinha_patch.js:129 — valor, no carregamento
- **GANHA →** ajustes_v52220_lupa_alinha_patch.js:133 — valor, no carregamento

### `neoGerarOSVenda` — 2 escritas

- sobrepõe: notinha_patch.js:401 — valor, em uso
- sobrepõe: notinha_patch.js:435 — valor, em uso

### `neoSalvarVenda` — 2 escritas

- sobrepõe: notinha_patch.js:279 — função, no carregamento
- **GANHA →** notinha_patch.js:411 — função, no carregamento

### `neoSearchProdutoVenda` — 2 escritas

- sobrepõe: notinha_patch.js:272 — função, no carregamento
- **GANHA →** vendas_notinhas_fix_patch.js:597 — função, no carregamento

### `neoVendaCliente` — 2 escritas

- sobrepõe: notinha_patch.js:250 — valor, em uso
- sobrepõe: notinha_patch.js:271 — alias, em uso

### `novaLeituraContrato` — 2 escritas

- sobrepõe: fluxo_contrato_leitura_corrigido_patch.js:125 — função, no carregamento
- **GANHA →** leitura_detalhada_departamentos_patch.js:64 — função, no carregamento

### `openModalCriarUsuario` — 2 escritas

- sobrepõe: app.js:1011 — função de topo, no carregamento
- **GANHA →** ajustes_v5196_patch.js:162 — função, no carregamento

### `openModalProdutoFromVenda` — 2 escritas

- sobrepõe: vendas_patch.js:293 — função, em uso
- **GANHA →** fluxos_operacionais_patch.js:1499 — função, no carregamento

### `openQuickOS` — 2 escritas

- sobrepõe: app.js:1390 — função de topo, no carregamento
- **GANHA →** locacao_chamados_fix_patch.js:105 — função, no carregamento

### `orcBuscarEtiqueta` — 2 escritas

- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:216 — alias, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:374 — alias, no carregamento

### `orcLimparCliente` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:491 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:365 — função, no carregamento

### `orcMostrarTodos` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:233 — função, no carregamento
- **GANHA →** ajustes_v52258_orcamento_os_revalidar_patch.js:815 — função, no carregamento

### `orcOnTipoItem` — 2 escritas

- sobrepõe: ajustes_v52259_orcamento_filtros_item_patch.js:213 — alias, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:357 — alias, no carregamento

### `orcRenderItens` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:573 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:639 — função, no carregamento

### `orcSelCliente` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:483 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:359 — função, no carregamento

### `orcSelProd` — 2 escritas

- sobrepõe: ajustes_v52237_orcamentos_menu_patch.js:507 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:372 — alias, no carregamento

### `orcSelRecarga` — 2 escritas

- sobrepõe: ajustes_v52238_orcamentos_ajustes_patch.js:164 — função, no carregamento
- **GANHA →** ajustes_v52260_orcamento_trava_venda_atalho_patch.js:373 — alias, no carregamento

### `parseDataLocal` — 2 escritas

- sobrepõe: app.js:281 — alias, no carregamento
- **GANHA →** app.js:273 — função de topo, no carregamento

### `pixPagamentoUrl` — 2 escritas

- sobrepõe: pix_patch.js:187 — função, no carregamento
- **GANHA →** ajustes_v52219_pix_link_publico_patch.js:23 — função, no carregamento

### `pixRenderPainelFaturamento` — 2 escritas

- sobrepõe: pix_patch.js:122 — função, no carregamento
- **GANHA →** pix_comprovante_manual_patch.js:55 — função, no carregamento

### `removerLancamentoLeitura` — 2 escritas

- **GANHA →** leitura_detalhada_departamentos_patch.js:140 — função, no carregamento
- sobrepõe: ajustes_v5250_leitura_overhaul_patch.js:179 — função, em uso

### `renderModalOS` — 2 escritas

- sobrepõe: app.js:1273 — função de topo, no carregamento
- **GANHA →** patch_chamados.js:86 — função, no carregamento

### `renderParque` — 2 escritas

- sobrepõe: app.js:1233 — função de topo, no carregamento
- **GANHA →** notinha_patch.js:324 — função, no carregamento

### `saveConfig` — 2 escritas

- sobrepõe: app.js:1382 — função de topo, no carregamento
- **GANHA →** autocura_empresa_central_nf_tela_patch.js:291 — função, no carregamento

### `saveOS` — 2 escritas

- sobrepõe: app.js:1284 — função de topo, no carregamento
- **GANHA →** patch_chamados.js:26 — função, no carregamento

### `saveUsuarioFinal` — 2 escritas

- sobrepõe: ajustes_pos_final_patch.js:116 — função, no carregamento
- **GANHA →** ajustes_v5196_patch.js:205 — função, no carregamento

### `saveVendaNova` — 2 escritas

- sobrepõe: vendas_patch.js:398 — função, em uso
- **GANHA →** permissoes_estorno_venda_patch.js:332 — alias, no carregamento

### `scanEstoqueBaixo` — 2 escritas

- sobrepõe: locacao_contratos_patch.js:81 — função, no carregamento
- **GANHA →** fluxos_operacionais_patch.js:1522 — função, no carregamento

### `selecionarImpressoraChamadoAvulso` — 2 escritas

- sobrepõe: chamados_avulsos_aberto_patch.js:89 — função, no carregamento
- **GANHA →** ajustes_v5175_patch.js:342 — função, no carregamento

### `selectClienteVenda` — 2 escritas

- sobrepõe: vendas_patch.js:215 — função, em uso
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:537 — função, no carregamento

### `setNeoVendasTab` — 2 escritas

- sobrepõe: notinha_patch.js:245 — função, no carregamento
- **GANHA →** correcoes_uso_diario_patch.js:147 — função, no carregamento

### `setSession` — 2 escritas

- sobrepõe: app.js:299 — função de topo, no carregamento
- **GANHA →** perfis_nuvem_cura_sessao_patch.js:159 — alias, no carregamento

### `syncCarregarDaNuvem` — 2 escritas

- sobrepõe: ajustes_v5186_patch.js:359 — função, no carregamento
- **GANHA →** cloudflare_sync_patch.js:113 — função, no carregamento

### `TECNICOS_DEMO` — 2 escritas

- sobrepõe: app.js:59 — alias, no carregamento
- **GANHA →** app.js:46 — var de topo, no carregamento

### `uiAtalhoMover` — 2 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:294 — função, no carregamento
- **GANHA →** ajustes_v52216_menus_submenus_patch.js:403 — função, no carregamento

### `uiMenuMover` — 2 escritas

- sobrepõe: ajustes_v52213_menus_atalhos_patch.js:217 — função, no carregamento
- **GANHA →** ajustes_v52216_menus_submenus_patch.js:231 — função, no carregamento

### `uiSubMenuMover` — 2 escritas

- sobrepõe: ajustes_v52216_menus_submenus_patch.js:243 — função, no carregamento
- **GANHA →** ajustes_v52217_menus_arrastar_visibilidade_patch.js:125 — função, no carregamento

### `usuarioPodeApagar` — 2 escritas

- sobrepõe: permissoes_estorno_venda_patch.js:102 — função, no carregamento
- **GANHA →** permissoes_override_menus_fiscais_patch.js:137 — função, no carregamento

### `usuarioPodeEstornar` — 2 escritas

- sobrepõe: permissoes_estorno_venda_patch.js:103 — função, no carregamento
- **GANHA →** permissoes_override_menus_fiscais_patch.js:138 — função, no carregamento

### `verificarEstoqueBaixo` — 2 escritas

- sobrepõe: locacao_contratos_patch.js:73 — função, no carregamento
- **GANHA →** fluxos_operacionais_patch.js:1518 — função, no carregamento

### `visualizarRegistroDinamico` — 2 escritas

- sobrepõe: app.js:774 — função de topo, no carregamento
- **GANHA →** migrados_print_patch.js:89 — função, no carregamento

### `voltarAbaAnteriorFinal` — 2 escritas

- sobrepõe: finalizacao_sistema_patch.js:83 — função, no carregamento
- **GANHA →** navegacao_voltar_patch.js:13 — função, no carregamento

### `vosBuscarEtiquetaNaVenda` — 2 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:1057 — função, no carregamento
- **GANHA →** ajustes_v52218_etiqueta_recarga_venda_patch.js:90 — função, no carregamento

### `vosBuscarSerial` — 2 escritas

- sobrepõe: vendas_os_patch.js:559 — função, no carregamento
- **GANHA →** ajustes_v52237_vendas_os_visual_patch.js:156 — função, no carregamento

### `vosCadastrarEtiquetaRecarga` — 2 escritas

- sobrepõe: vendas_notinhas_fix_patch.js:1026 — função, no carregamento
- **GANHA →** ajustes_v52218_etiqueta_recarga_venda_patch.js:45 — função, no carregamento

### `vosColetarOS` — 2 escritas

- sobrepõe: ajustes_v52237_vendas_os_visual_patch.js:182 — função, em uso
- **GANHA →** ajustes_v52238_vendas_os_ajustes_patch.js:124 — função, no carregamento

### `vosGravarVenda` — 2 escritas

- sobrepõe: vendas_os_patch.js:715 — alias, no carregamento
- **GANHA →** ajustes_v52238_vendas_os_ajustes_patch.js:162 — função, no carregamento

### `vosLegadosVendas` — 2 escritas

- sobrepõe: vendas_otimizacao_patch.js:57 — função, no carregamento
- **GANHA →** correcoes_uso_diario_patch.js:136 — função, no carregamento

### `vosRemoveItem` — 2 escritas

- sobrepõe: vendas_os_patch.js:511 — função, no carregamento
- **GANHA →** vendas_notinhas_fix_patch.js:527 — função, no carregamento

### `vosRenderItens` — 2 escritas

- sobrepõe: vendas_os_patch.js:493 — função, no carregamento
- **GANHA →** vendas_notinhas_fix_patch.js:1143 — função, no carregamento

### `vosVendaSearchClienteDeb` — 2 escritas

- sobrepõe: vendas_os_patch.js:379 — valor, no carregamento
- **GANHA →** ajustes_relatorio_pai_patch.js:160 — função, no carregamento

### `vosVendaSearchProdDeb` — 2 escritas

- sobrepõe: vendas_os_patch.js:380 — valor, no carregamento
- **GANHA →** ajustes_relatorio_pai_patch.js:161 — função, no carregamento

### `vosVendaSelectCliente` — 2 escritas

- sobrepõe: vendas_os_patch.js:382 — função, no carregamento
- **GANHA →** ajustes_v5243_cliente_abas_patch.js:588 — função, no carregamento

### `vosVendaSelectProd` — 2 escritas

- sobrepõe: vendas_os_patch.js:419 — função, no carregamento
- **GANHA →** ajustes_v52237_estoque_zero_volta_patch.js:133 — função, no carregamento

## Nomes escritos em um lugar só

770 nomes: `A1_NUVEM_USO_PURE`, `AC602_PURE`, `AJUSTES_POS_FINAL_PURE`, `AJUSTES_RELATORIO_PAI_PURE`, `AJUSTES_V5183_PURE`, `AJUSTES_V5185_PURE`, `AJUSTES_V5186_PURE`, `AJUSTES_V5187_PURE`, `AJUSTES_V5189_PURE`, `AJUSTES_V51920_PURE`, `AJUSTES_V5196_PURE`, `AJUSTES_V52023_PURE`, `AJUSTES_V52024_PURE`, `AJUSTES_V52289_PURE`, `APP_VERSION`, `AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE`, `AUTOMACOES_COMPRAS_RECEBIMENTOS_CONTADORES_PURE`, `AUTOMACOES_CONTR_CAIXA_FISCAL_PURE`, `AUTOMACOES_FINAIS_LOCACAO_AUX_PURE`, `AUTOMACOES_FIN_ESTOQUE_PURE`, `AUTOMACOES_FISCAL_CARTUCHOS_PURE`, `AUTOMACOES_LOC_VISITAS_PURE`, `AUTOMACOES_ORC_CLIENTES_AUX_PURE`, `AUTOMACOES_PIX_CONTADORES_AUX_PURE`, `AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE`, `AUTOMACOES_TRIGGERS_PURE`, `AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE`, `AUTOMACOES_VENDAS_FISCAL_AUX_PURE`, `AVISOS_V52423_PURE`, `CADASTROS_NOMES_PURE`, `CARTUCHOS_ETIQUETAS_PURE`, `CAT_LETRA_PURE`, `CAT_LETRA_UMA_VEZ_PURE`, `CELULAR_NUVEM_PURE`, `CERT_A1_NUVEM_PURE`, `CERT_NUVEM_PURE`, `CHAMADOS_AVULSOS_PURE`, `CLIENTES_VISIVEIS_PURE`, `CLI_PURE`, `CNPJ_INTELIGENTE_PURE`, `CNPJ_V5260_PURE`, `CODIGO_CLIENTE_EXATO_PURE`, `CODIGO_SEM_SKU_PURE`, `CONFIG_AVISO_SALVOU_PURE`, `CONTRATOS_CURA_RELATORIO`, `CONTRATOS_FILTROS_PURE`, `CONTRATOS_FINAL_PURE`, `CONTRATOS_LEITURAS_CORRIGIDO_PURE`, `CONTRATOS_LEITURAS_DEFINITIVO_PURE`, `CONTRATOS_REFINO_PURE`, `CONTRATOS_SORT_V52243_PURE`, `CONTRATOS_VISITAS_PURE`, `CORRECOES_USO_DIARIO_PURE`, `DB_CHUNK_ITENS`, `DB_CHUNK_OBJ_MIN`, `DB_KEY`, `DB_MANIFEST_KEY`, `DB_PART_PREFIX`, `DC_chamarMedidorOficial`, `DESKTOP_OTIMIZACAO_PURE`, `DHC607_PURE`, `DIGICOPY_ABAS_FISCAIS`, `DIGICOPY_BACKUPS`, `DIGICOPY_CLOUD`, `DIGICOPY_CLOUD_PURE`, `DIGICOPY_CLOUD_SYNC`, `DIGICOPY_DB_READY`, `DIGICOPY_EH_CELULAR`, `DIGICOPY_EXCLUSAO_INTENCIONAL`, `DIGICOPY_EXCLUSOES_SEM_VIGIA`, `DIGICOPY_INDEXED_DB`, `DIGICOPY_MARCA_TELA_ATUAL`, `DIGICOPY_NUVEM_ACOMPANHAMENTO`, `DIGICOPY_PARA_VIGIA`, `DIGICOPY_RECUPERAR`, `DIGICOPY_SO_NUVEM`, `DIGI_TURBO`, `DIGI_TURBO_PURE`, `ESCURO_LOGIN_NUVEM_PURE`, `ETIQUETA_RECARGA_VENDA_PURE`, `EXE_ATUALIZA_V52247_PURE`, `EXE_BUNDLE_V52250_PURE`, `EXE_CACHE_V52248_PURE`, `EXE_COMPLETO_V52263_PURE`, `EXE_NUMERO_NOVO_V52264_PURE`, `EXE_RESILIENCIA_V52251_PURE`, `EXE_SCRIPT_ISOLADO_V52265_PURE`, `EXTRA_PURE`, `FE6108_PURE`, `FILTROS_BUSCA_PURE`, `FINALIZACAO_SISTEMA_PURE`, `FINANCEIRO_DATAS_V52244_PURE`, `FINANCEIRO_HIST_DATAS_V52245_PURE`, `FINANCEIRO_MENU_V52243_PURE`, `FINANCEIRO_RECEBER_PURE`, `FINANCEIRO_RECIBO_PURE`, `FINANCEIRO_V52243_PURE`, `FLUXOS_PURE`, `FMC606_PURE`, `IMPORT_DEL_PURE`, `IMPORT_PRODUTOS_PURE`, `IMPRESSORA_REMANEJAR_V52243_PURE`, `IMPRESSORA_REMANEJO_V52435_PURE`, `IMPRESSORA_SERIAL_OCULTAR_V52245_PURE`, `LEITURA_APAGAR_V52245_PURE`, `LEITURA_BUSCA_FLUXO_PURE`, `LEITURA_DETALHADA_DEPARTAMENTOS_PURE`, `LEITURA_IMPRESSAO_COMPACTA_PURE`, `LEITURA_OVERHAUL_V5250_PURE`, `LEITURA_UMA_ABERTA_V52436_PURE`, `LOC_PURE`, `LOGIN_DIRETO_LEGADO_PURE`, `LOGIN_TELA_BRANCA_V52253_PURE`, `LOGIN_V5262_PURE`, `LOGOPT_PURE`, `LOGO_IMPRESSAO_PURE`, `LT6108_PURE`, `LUPA_FILTRO_CLI_PURE`, `LZUTF16`, `MENUS_ARRASTAR_PURE`, `MENUS_ARRASTAR_SO_PURE`, `MENUS_ARRASTE_PURE`, `MENUS_ATALHOS_PURE`, `MENUS_DISPOSITIVO_PURE`, `MENUS_SUBMENUS_PURE`, `MENUS_TELA_PEQUENA_PURE`, `MENU_VERSAO_BOLETO_V52243_PURE`, `MFS608_PURE`, `MIGPRINT_PURE`, `MODO_ESCURO_PURE`, `NAV6107_PURE`, `NCM_IMPORT_PURE`, `NCM_ORIGEM_PURE`, `NCM_PRODUTO_EXISTENTE_PURE`, `NFE_ASSINATURA_UI`, `NFE_ATALHO_HISTORICO`, `NFE_CENTRAL_V52425`, `NFE_CENTRAL_V52426`, `NFE_CONFIG_PURE`, `NFE_EMISSAO_PURE`, `NFE_IE_IM_CNAE_PURE`, `NFE_LISTA_CHECKBOX`, `NFE_PERMISSAO_PURE`, `NFG_PURE`, `NFX_PURE`, `NOTIF_PURE`, `NUVEM_NAO_AUTORIZAR_V52246_PURE`, `ORCAMENTOS_APROVACAO_PURE`, `ORCAMENTOS_AUTORIZAR_V52244_PURE`, `ORCAMENTOS_PAGES_V52254_PURE`, `ORCAMENTOS_PURE`, `ORCAMENTOS_STATUS_V52243_PURE`, `ORCAMENTOS_V52238_PURE`, `ORCAMENTOS_V52240_PURE`, `ORCAMENTO_APROVACAO_V52255_PURE`, `ORCAMENTO_APROVACAO_V52256_PURE`, `ORCAMENTO_APROVACAO_V52257_PURE`, `ORCAMENTO_NAO_VOLTA_V52261_PURE`, `ORCAMENTO_UMA_VEZ_V52262_PURE`, `ORDENACAO_TITULO_PURE`, `P605_PURE`, `PARQUE_MONITOR_V52427`, `PENDING_CNPJ_KEY`, `PIX_LINK_PUBLICO_PURE`, `PIX_MANUAL_PURE`, `PIX_PAGAR_PUBLICO`, `PIX_PURE`, `PNC604_PURE`, `POM609_PURE`, `PONTE_ELECTRON_PURE`, `PRINT_SEM_RODAPE_PURE`, `RECARGAS_PURE`, `RELATORIO_V52249_PURE`, `RESOLUCAO_LOOP_V52252_PURE`, `RGATE_PURE`, `RODAPE_VERSAO_V52245_PURE`, `RTF_TEMPLATE_PURE`, `SESSION_KEY`, `SISTEMA_CLIENTES_LOJA_PURE`, `UI_PURE`, `V52237_ESTOQUE_ZERO_PURE`, `V52237_VENDAS_OS_PURE`, `V52238_VENDAS_PURE`, `V52239_ERRO_PURE`, `V52239_MENUS_PURE`, `V52239_PATRI_PURE`, `V52239_PRINT_PURE`, `V52241_VENDA_SALVAR_PURE`, `V52245_VENDA_PURE`, `V5240_RELATORIO_PURE`, `V5264_CH_DATA_PURE`, `VENDAS_FINANCEIRO_PENDENTE_PURE`, `VENDA_PRINT_PIX_PURE`, `VOTM_PURE`, `__CTR_FILTRO_V52237`, `__DIGICOPY_LOGO_ORIGINAL`, `__DIGICOPY_PONTES_ABERTAS`, `__DIGICOPY_PROMPT_NATIVO`, `__V52295_PURE`, `__avisouQuota`, `__cardPublicadorAgendado`, `__cfv`, `__checagemAtualizacaoFeita`, `__cliBuscaState`, `__cliDupGrupos`, `__cliIdxCache`, `__cliIdxGet`, `__cliSort`, `__clientesStatusFinal`, `__clitab`, `__clitabExtornarAgora`, `__ctrMexeuHoje`, `__dcUltPingMedidor`, `__esExc`, `__esExcPendingId`, `__esIni`, `__esReg`, `__esRes`, `__esTerm`, `__finBaixaIds`, `__finReciboTitulos`, `__finalizarSaveQ`, `__gravarParteCampo`, `__lastVoltarTs`, `__lcChamOrigem`, `__lcImpFiltro`, `__lcLancLeituraId`, `__lcLeiCtr`, `__lcListaContratoId`, `__limparPecasAntigas`, `__marcarImpAvulso`, `__migCat`, `__migCategorias`, `__modOrdem`, `__modUi`, `__navComErroVisivel`, `__navComMigrados`, `__nfeUltimoDoc`, `__orcResgates`, `__orcResumoUltimaBaixa`, `__orcUltimaLista`, `__origemFinanceiroVoltar`, `__p609ColunaMorta`, `__p8ScannerArmado`, `__perfPure`, `__pixUltimoPayload`, `__prodSortCol`, `__recargasSort`, `__saveDBSched`, `__saveQ`, `__saveTick`, `__sincronizarCamposChamado`, `__snapHash`, `__toastReal`, `__uiMenusRascunho`, `__uiSyncErro`, `__ultimaImportLocacao`, `__v52234salvoClick`, `__v52249_relatorio_loaded`, `__v52250_bundle_loaded`, `__v52251_resiliencia_loaded`, `__v52252_loop_fix_loaded`, `__v52253_login_guard_loaded`, `__v52254_pages_loaded`, `__v52263_exe_loaded`, `__v5242visMenus`, `__v5250LeiAtual`, `__v5250reimpEstorno`, `__v5260cn`, `__v5262ln`, `__v5264cd`, `__v5266pg`, `__v6000fg`, `__v60010sxv`, `__v60011sxvm`, `__v6001nfx`, `__v6002ac`, `__v6004pnc`, `__v6005pes`, `__v6006fmc`, `__v6007dhc`, `__v6008mfs`, `__v6009pom`, `__v6107nav`, `__v6108falta`, `__v6108lembra`, `__v612nes`, `__v7015nuvem`, `__vendasLegadasUsoDiario`, `__vosBT`, `__vosFatVendaId`, `__vosFormHtmlSalvo`, `__vosPure`, `__vosSaindoVenda`, `_jsonParaImportar`, `_nextCodigoCliente`, `_origOpenModal`, `_origRenderDashboard`, `_rawDataParaImportar`, `_ultimoCNPJData`, `_ultimoCepBuscado`, `abrirAbaProdutos`, `abrirAbaRecargas`, `abrirHubImpressora`, `abrirImpressaoLeitura`, `abrirLeituraDefinitiva`, `abrirLeituraDetalhada`, `abrirLeituraSelecionadaContrato`, `abrirModalEdicaoVendaRapida`, `abrirModalEmpilhado`, `abrirModalRecarga`, `abrirNotinhasAntigas`, `abrirOrcamento`, `abrirPerfilTributario`, `abrirTelaBackup`, `abrirVendaDeOrcamento`, `acForcarCura`, `addTecnico`, `adicionarPecaChamado`, `adicionarPecaRefino`, `agendarSnapshotLegado`, `alert`, `alterarClienteClassic`, `alterarQtdItem`, `alterarQtdPecaChamado`, `alterarQtdPecaRefino`, `alterarVendaSelecionada`, `alternarEstoqueInfinito`, `alternarEstoqueOperacional`, `alternarPodeEmitirNfe`, `aplicarBuscaChamadosOperacional`, `aplicarBuscaChamadosRefino`, `aplicarBuscaContratosOperacional`, `aplicarBuscaContratosRefino`, `aplicarBuscaLeituraRefino`, `aplicarBuscaListaLeituraOperacional`, `aplicarBuscaProdutosOperacional`, `aplicarBuscaRecargas`, `atualizarConfigCartuchosAntigos`, `atualizarImpressorasChamadoRefino`, `atualizarMedidorUI`, `atualizarMedidoresLeituraDefinitiva`, `avisoChamadoContrato`, `avisoEstoque`, `baixarCP`, `bkFecharTelaBackup`, `browseFdb`, `buscarCEPAutomatico`, `buscarCepContratoOperacional`, `buscarClienteContratoDefinitivo`, `buscarClienteContratoLeitura`, `buscarClienteContratoModal`, `buscarClientesFinal`, `buscarCnpjLoja`, `buscarContratoLeitura`, `buscarContratoLeituraDefinitiva`, `buscarEtiquetaFiltroVenda`, `buscarImpressorasChamadoAvulso`, `buscarNcmProduto`, `buscarVendasPorEtiqueta`, `caEditarImpressoraAvulso`, `calcChamadoAvulso`, `calcPreviewLeitura`, `carregarTiposMedidorLeitura`, `cartEtiquetasAtualizarFim`, `cfvEscolher`, `cfvFiltrar`, `chamadosSortOperacional`, `chamadosSortRefino`, `chartFinanceInst`, `chartFluxoInst`, `chartParqueInst`, `clearAllData`, `clearClienteVenda`, `clearSession`, `clienteDaVenda`, `clienteSelecionadoClassic`, `clientesDuplicadosAbrir`, `clientesDuplicadosContar`, `clientesDuplicadosUnir`, `clientesDuplicadosVincularContrato`, `clientesMostrarTodos`, `clitabAbrir`, `clitabAbrirClienteNaLista`, `clitabAbrirDireto`, `clitabAbrirLista`, `clitabAbrirRegistro`, `clitabExcluir`, `clitabExtornar`, `clitabRenderSoSelecionados`, `clitabSub`, `clitabToggleSel`, `confirm`, `confirmSistema`, `confirmarExcluirModulo`, `confirmarLancamentoLeituras`, `consultarCnpjInteligente`, `contratoCurarVinculos`, `contratoVincularCliente`, `contratosSortOperacional`, `converterOrcamentoMigradoEmVenda`, `copiarLinkOrcamentoModal`, `copiarSqlExportarTudo`, `criarLeituraDefinitiva`, `criarLeituraDetalhada`, `cvAddItem`, `cvItens`, `cvRemoveItem`, `cvRenderItens`, `cvSaveVenda`, `cvSearchCliente`, `cvSearchProduto`, `cvSelectCliente`, `cvSelectProduto`, `cvUpdateItemTotal`, `cvUpdateTotal`, `cvVendaSalva`, `dbFatiarEntidade`, `dbHashTexto`, `dbParteKey`, `dcCheckupNuvem`, `dcCheckupNuvemResumo`, `dcDiagnosticoInvisiveis`, `defaultData`, `deleteCR`, `deleteCliente`, `deleteUsuario`, `deleteVenda`, `destacarImpressoraLancamento`, `dhcAbrirOrigem`, `digicopyAbrirOuBaixarErroTxt`, `digicopyBaixarErroTxt`, `digicopyLogo`, `digicopyMandarErro`, `digicopyVerificarAtualizacaoAgora`, `editarEquipamentoChamado`, `editarImpressoraLancamento`, `editarLancamentoLeitura`, `editarNotinhaMigrada`, `ensureView`, `equipView`, `esAbrir`, `esClearLog`, `esExc`, `esExcConfirmar`, `esExcMotivo`, `esExcTog`, `esExcel`, `esLoginLocal`, `esMais`, `esRest`, `esSearch`, `esSync`, `esSyncTudo`, `escapeHtml`, `escolherImpressoraLancamento`, `escolherNcmProduto`, `estornarOrcamentosMarcados`, `estornarVendasSelecionadas`, `excluirChamadoV52422`, `excluirChamadosSelecionados`, `excluirClienteClassic`, `excluirClientesSelecionados`, `excluirContratoUnificado`, `excluirFinanceiroSelecionados`, `excluirProdutoUnificado`, `excluirRecarga`, `excluirTecnico`, `excluirUsuario`, `excluirVendaNeo`, `excluirVendaSelecionada`, `exportClientes`, `exportarBackupJSON`, `exportarModuloDinamico`, `faturarLeituraDefinitiva`, `faturarLeituraSelecionadaContrato`, `fbConnected`, `fbExportExtracted`, `fbExtractAll`, `fbExtractedData`, `fbImportLocacaoFamilia`, `fbListTables`, `fbMapNomeTabela`, `fbPreviewTable`, `fbSelectMigrationTables`, `fbSetStatus`, `fbTablesCache`, `fbTestConnection`, `fe6108Conferir`, `fecharModalChamadoAvulso`, `fetch`, `finAcaoImprimir`, `finAplicarFiltroV52421`, `finBuscarV52243`, `finEscolherCliente`, `finEscolherFormaBaixa`, `finImprimirRecibo`, `finModoV52245`, `finPreviewRepetir`, `finRemoverFiltroV52421`, `finSalvarNovoLancamento`, `finalizarChamadosSelecionados`, `findTable`, `fmtDate`, `fmtDateTime`, `fmtMoney`, `formatarLoginCNPJ`, `formatarNomeTabela`, `fxXmlCopiarEmail`, `garantirBotaoDadosMigrados`, `gerarFaturasPendentes`, `gerarRelatorio`, `getCurrentUser`, `getFbConfig`, `getFiltered`, `getPendingEmpresa`, `getSession`, `gravarSnapshotLegado`, `handleDatabaseUpload`, `handleGlobalSearch`, `handleMultipleUpload`, `handleRarUpload`, `handleTopSearchOperacional`, `impMedidorTrocar`, `impfTrocarMedidor`, `importBackup`, `importarJsonDBeaver`, `importarTudoDeUmaVez`, `imprimirChamadoAgoraV52422`, `imprimirEtiquetasCartucho`, `imprimirLeituraContratoExecutar`, `imprimirLeituraDefinitiva`, `imprimirLeituraDetalhada`, `imprimirRegistroMigrado`, `initTemplates`, `initials`, `lancarLeituraColetivaContrato`, `lcAddPecaManual`, `lcContadorAntigoChamado`, `lcCriarVendaDoChamado`, `lcEditarImpressoraChamado`, `lcEscolherImpressoraChamado`, `lcFiltroTodos`, `lcLimparClienteAvulso`, `lcMarcarImpressoraNaLista`, `lcPecaCalc`, `lcSelPeca`, `lerStatusImpressoraRede`, `lfbCornerToast`, `limparBuscaProdutosOperacional`, `limparTemplatesRTF`, `listUsuariosDemo`, `loadColetaForm`, `loadDB`, `logAction`, `lt6108Esquecer`, `mostrarTextoCopiar`, `mudarAbaChamado`, `mudarAbaChamadoOperacional`, `mudarAbaContrato`, `mudarAbaContratoOperacional`, `mudarAbaProd`, `mudarAbaProdutoOperacional`, `mudarMedidorImpressoraRefino`, `mudarModalidadePE`, `navegadorAbrir`, `navegadorAbrirSite`, `navegadorAdicionarSite`, `navegadorEditarSite`, `navegadorIrPara`, `navegadorRemoverSite`, `navegadorRestaurarPadrao`, `navegadorSites`, `neoAddItemVenda`, `neoRemoveItemVenda`, `neoRenderItensVenda`, `neoSearchClienteVenda`, `neoSelectClienteVenda`, `neoSelectProdutoVenda`, `neoSetFilter`, `neoToggleOSVenda`, `neoTogglePagamento`, `neoUpdateVendaTotal`, `neoVendaItens`, `nfAbrirDanfe`, `nfAuditarFiscal`, `nfBaixarXml`, `nfCancelarNota`, `nfCartaCorrecao`, `nfEmitirCompleta`, `nfInstalarCertificado`, `nfInutilizarFaixa`, `nfManifestarEvento`, `nfPacoteContador`, `nfProximoNumero`, `nfStatusServico`, `nfeEnviarCertNuvem`, `nfeLeituraSelecionada`, `nfeRemoverCertNuvem`, `nfgAlternarAmbiente`, `nfgRegistroNotas`, `nfxConfirmar`, `nfxPedirTexto`, `nfxRenderHistorico`, `normalizarNCMProdutoOperacional`, `normalizeDbShape`, `notificarEvento`, `novaLeituraCabecalho`, `novaLeituraDefinitiva`, `novaVendaComEtiqueta`, `novoChamadoAvulsoGuard`, `novoOrcamento`, `ntfAlternarPainel`, `ntfApagar`, `ntfAtualizarBadge`, `ntfFecharPainel`, `ntfMarcarLida`, `ntfMarcarTodasLidas`, `numeroVendaInt`, `onPagamentoChange`, `onStatusVendaChange`, `onTipoItemChange`, `onlyDigits`, `openContratoDetail`, `openModalClienteFromVenda`, `openModalCriarUsuarioPublic`, `openModalEditarTecnico`, `openModalNovoTecnico`, `openQuickReading`, `orcBuscar`, `orcBuscarSerial`, `orcCalcItem`, `orcDelItem`, `orcFiltroLista`, `orcRemoveItem`, `ordenarClientesFinal`, `ordenarModuloDinamico`, `osViewMode`, `pedirTextoSistema`, `permissoesAjuda`, `pixCopiarCodigo`, `pixLerCamposConfig`, `pixPreviewConfig`, `pixSalvarConfig`, `previewLancamentoContadorOperacional`, `previewLancamentoRefino`, `prodSort`, `produtosSortOperacional`, `prompt`, `proximoNumeroSimples`, `proximoNumeroVendaLimpo`, `puxarAprovacoesOrcamento`, `recargasSort`, `recusarOrcamentoInterno`, `registrarErroSistema`, `registrarNfeEmitida`, `removeTecnico`, `removerItemVenda`, `removerPecaChamado`, `removerPecaRefino`, `renderBanco`, `renderBuscadorEscola`, `renderCompras`, `renderFluxoChart`, `renderItensVenda`, `renderMigrados`, `renderModalContaPagar`, `renderModalContaReceber`, `renderModalEntrada`, `renderModalEquipamento`, `renderModalLeitura`, `renderOrcamentosView`, `renderPainelGerente`, `renderPecasChamado`, `renderRecargas`, `renderRelatorios`, `revalidarLinkOrcamento`, `salvarContratoCompleto`, `salvarContratoCompletoOperacional`, `salvarContratoDefinitivo`, `salvarContratoFullRefino`, `salvarContratoLeituraSimples`, `salvarContratoOperacional`, `salvarContratoRefino`, `salvarContratoRelatorio`, `salvarDadosLojaFinal`, `salvarEdicaoNotinhaMigrada`, `salvarItemLeitura`, `salvarItemLeituraDefinitiva`, `salvarLancamentoContadorOperacional`, `salvarLancamentoRefino`, `salvarProdutoModal`, `salvarProdutoOperacional`, `salvarRecarga`, `salvarTecnico`, `salvarTemplatesRTF`, `saveCP`, `saveCR`, `saveContrato`, `saveEntrada`, `saveEquipamento`, `saveLeitura`, `saveLeituraRapida`, `saveProduto`, `searchChamadosAvancada`, `searchClientesVenda`, `searchProdutosVenda`, `selecionarClienteContrato`, `selecionarClienteContratoDefinitivo`, `selecionarClienteContratoLeitura`, `selecionarContratoLeitura`, `selecionarContratoLeituraDefinitiva`, `selecionarEquipamentoChamado`, `selecionarVendaClassic`, `selectProdutoVenda`, `seqObter`, `setAbaOrcamento`, `setEquipView`, `setFinTab`, `setPageHeader`, `setPendingEmpresa`, `sincronizarVendasNoFinanceiro`, `statusPillFin`, `storageDecode`, `storageEncode`, `storageEncodeTexto`, `sugerirIcone`, `syncAutoChecar`, `syncAutoLigado`, `syncEnviarParaNuvem`, `toggleOsView`, `togglePass`, `toggleSidebar`, `uiAjustarHome`, `uid`, `unlockVendaFaturadaUI`, `updateVendaTotal`, `usuarioDaVenda`, `usuarioPodeEmitirNfe`, `v52023AtualizarBotaoExcluir`, `v52023MarcarTodos`, `v5262AbrirPortao`, `v7015ConferirNuvem`, `vendasUsoBuscar`, `vendasUsoLimpar`, `verProdutosBaixos`, `verTodosProdutos`, `voltarListaChamadoContrato`, `voltarModalOperacional`, `vosAbrirImpressaoESalvar`, `vosAtualizarBotaoItem`, `vosBuscaVendasDeb`, `vosCarregarVendaNaTela`, `vosEditarItem`, `vosExportarNotinhaWord`, `vosExportarVendasCSV`, `vosFaturarAtual`, `vosImprimirAtual`, `vosImprimirCarne`, `vosImprimirCarneDaTela`, `vosItemCalcTotal`, `vosNumeroVisivel`, `vosParcelasPreview`, `vosRefaturar`, `vosResumoVenda`, `vosSetAba`, `vosSortVendas`, `vosVendaClearCliente`, `vosVendaSelectRecarga`, `vosVoltarRecebimento`

---

_Este arquivo é gerado: não edite à mão. Rode `npm run mapa` para atualizar._
