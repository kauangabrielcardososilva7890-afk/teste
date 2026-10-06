#!/usr/bin/env python3
# Decodifica os .grd do sistema antigo (Delphi/DevExpress).
#
# Formato do stream (descoberto lendo os bytes):
#   TPF0 | 0f "TColumnsWrapper" 00 | 0e
#   07 "Columns" 0e            <- nome do objeto + marcador de lista
#   para cada coluna:
#     01                       <- começo da coluna
#     <len><NomeDaPropriedade> <- nome da propriedade (sem marcador)
#     <valor>                  <- 02=byte, 03=word, 04=dword, 06=texto(1), 14=texto(4),
#                                 08=falso, 09=verdadeiro
#     00                       <- fim da coluna
#   00 00                       <- fim da lista / fim do stream
#
# Os nomes de campo e os títulos das colunas são os nomes REAIS do sistema antigo.
import base64, json, re, sys
sys.path.insert(0, '/home/user/teste/_ref')
from grids_b64 import GRIDS

INI = {'Expanded', 'FieldName', 'Title.Caption', 'Width', 'Visible', 'Alignment',
       'SortOrder', 'SortIndex', 'GroupIndex', 'Options.Editing', 'Properties',
       'Tag', 'Hint', 'Caption', 'DataBinding', 'Name'}

def limpa(trecho):
    """Texto do stream: tira controles que o sistema antigo deixou no nome do campo."""
    return ''.join(ch if ch >= ' ' and ch != '\x7f' else ' ' for ch in
                   trecho.decode('utf-8', 'replace')).strip()


def imprimivel(trecho):
    return all(0x20 <= b < 0x7f or b >= 0x80 for b in trecho)

def parse(data):
    """Percorre o stream e devolve a lista de colunas (dicts de propriedades)."""
    i = data.index(b'Columns') + 7 + 1      # pula "Columns" + o marcador da lista
    cols, atual, pendente = [], None, None
    while i < len(data):
        b = data[i]
        if atual is None:                   # esperando começo (01) ou fim da lista (00)
            if b == 0x01:
                atual = {}
            i += 1
            continue
        if pendente is None:                # esperando NOME de propriedade
            if b == 0x00:                   # fim da coluna
                cols.append(atual)
                atual = None
                i += 1
                continue
            if 1 <= b <= 0x60 and i + 1 + b <= len(data) and imprimivel(data[i+1:i+1+b]):
                txt = limpa(data[i+1:i+1+b])
                if re.match(r'^[A-Za-z][A-Za-z0-9._]*$', txt.replace('Wisible', 'Visible')):
                    pendente = txt.replace('Wisible', 'Visible')
                    i += 1 + b
                    continue
            i += 1
            continue
        if b in (0x02, 0x03, 0x04):         # inteiro
            n = {0x02: 1, 0x03: 2, 0x04: 4}[b]
            atual[pendente] = int.from_bytes(data[i+1:i+1+n], 'little')
            i += 1 + n
        elif b in (0x06, 0x07):             # texto com tamanho de 1 byte
            L = data[i+1]
            atual[pendente] = limpa(data[i+2:i+2+L])
            i += 2 + L
        elif 0x14 <= b <= 0x1f:             # texto com tamanho de 4 bytes
            L = int.from_bytes(data[i+1:i+5], 'little')
            atual[pendente] = limpa(data[i+5:i+5+L])
            i += 5 + L
        elif 0x08 <= b <= 0x13:
            atual[pendente] = (b == 0x09)   # booleano: 09 = verdadeiro, o resto = falso
            i += 1
        else:
            i += 1
        pendente = None
    if atual:
        cols.append(atual)
    return cols

if __name__ == '__main__':
    tudo = {}
    for nome, b64 in GRIDS.items():
        cols = parse(base64.b64decode(b64))
        tudo[nome] = cols
        vis = [c for c in cols if c.get('Visible')]
        print('=' * 104)
        print(f"{nome} — {len(cols)} colunas ({len(vis)} visíveis)")
        for k, c in enumerate(cols, 1):
            larg = c.get('Width')
            print(f"  {k:2d} [{'x' if c.get('Visible') else ' '}] {str(c.get('FieldName')):<27}"
                  f"| {str(c.get('Title.Caption')):<29}| larg {larg}")
    json.dump(tudo, open('/home/user/teste/_ref/grids.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('\nsalvo _ref/grids.json')
