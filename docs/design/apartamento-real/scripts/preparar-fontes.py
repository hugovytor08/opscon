from pathlib import Path
import csv, json, hashlib, shutil
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TEMP = Path(r'C:\Users\hugov\AppData\Local\Temp')
DOWN = Path(r'C:\Users\hugov\Downloads')
SOURCES = [
 ('IMG-001','2b83cfc2-0674-4f26-b518-637d00d58080','sala','Janela à esquerda; abertura da cozinha à direita'),
 ('IMG-002','01012d0c-d355-4f58-8cef-19e985ca29d8','sala','Vista oposta: sofá à esquerda, janela à direita'),
 ('IMG-003','39b94193-c9a3-44c6-9f9e-3111f09b27d2','sala','Vista longitudinal; janela à esquerda; cozinha à direita'),
 ('IMG-004','04d203c1-963e-45a6-9d39-0b4f8d780a34','banheiro','Da porta para o box; chuveiro ausente nesta imagem'),
 ('IMG-005','04061d3d-7493-4e5a-965e-d5d39df7232b','banheiro','Da porta para o box; chuveiro instalado'),
 ('IMG-006','969c790b-8e0d-4048-9bdb-92b8331b5a62','quarto-3','Da porta para a janela coberta por tecido'),
 ('IMG-007','7c92a15a-014d-4d04-b35e-d1ce5179f66b','quarto-3','Vista inversa para porta; colchão e mesa'),
 ('IMG-008','ad668e04-795e-49a6-91d6-61a5365a966c','quarto-1','Da entrada: janela à esquerda, cama à direita'),
 ('IMG-009','9ac8a84f-fd82-4790-ab66-40233152e933','quarto-1','Da janela para porta; tapete e cama parcial'),
 ('IMG-010','f09b4309-9ca9-4e4f-8dda-b1c92c8dc57e','banheiro','Do box para porta: pia, espelho e vaso'),
 ('IMG-011','6ccbb0b1-0280-4c75-a7b5-600331c0daab','cozinha','Entrada voltada para fogão e bancada'),
 ('IMG-012','66c6f7d3-32a0-4b8b-a1b5-229c61a32f1a','cozinha','Vista longitudinal lateral da bancada'),
 ('IMG-013','ba53776f-1c59-4df1-83a0-3ee4fddb1eaf','cozinha;area-servico','Da bancada para geladeira e passagem da área de serviço'),
 ('IMG-014','6f62b138-3596-43ce-acdf-32a7d72d6656','quarto-2','Da porta para a janela; peças e banquetas'),
 ('IMG-015','c7aaea34-87c3-4a8a-8318-872a0d2bae04','quarto-2','Vista inversa para porta; objetos móveis'),
 ('IMG-016','2ea4a760-84eb-4e32-82ab-89b56efde75a','planta;todos','Documento fotografado: quadro de áreas e planta superior'),
]
for directory in ['evidencias/originais','evidencias/quadros','evidencias/contatos','previews']:
 (ROOT/directory).mkdir(parents=True,exist_ok=True)
font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',20)
small = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',16)
rows=[]
for ident, suffix, room, angle in SOURCES:
 src=TEMP/f'codex-clipboard-{suffix}.jpg'
 dest=ROOT/'evidencias/originais'/f'{ident}--{src.name}'
 shutil.copy2(src,dest)
 digest=hashlib.sha256(src.read_bytes()).hexdigest()
 im=Image.open(src)
 rows.append(dict(id=ident,nome_original=src.name,tipo='foto-planta' if room.startswith('planta') else 'foto',comodos=room,ponto_de_vista=angle,data='desconhecida',fonte_data='sem EXIF de captura confirmado',confianca_identificacao='alta: indicação explícita do usuário',grupo_duplicatas='',observacoes=f'{im.width}x{im.height}; versões temporais desconhecidas',origem=str(src),copia=str(dest.relative_to(ROOT)).replace('\\','/'),sha256=digest))
for ident,name,room in [('VID-001','WhatsApp Video 2026-10-12 at 21.20.13.mp4','quarto-1'),('VID-002','WhatsApp Video 2026-10-12 at 21.32.18.mp4','todos;circulacao;area-servico')]:
 src=DOWN/name; dest=ROOT/'evidencias/originais'/f'{ident}--{name}'; shutil.copy2(src,dest)
 rows.append(dict(id=ident,nome_original=name,tipo='video',comodos=room,ponto_de_vista='pendente de decodificação',data='2026-10-12 '+('21:20:13' if ident=='VID-001' else '21:32:18'),fonte_data='nome do arquivo; data de captura não comprovada',confianca_identificacao='indicação do usuário; conteúdo a conferir',grupo_duplicatas='',observacoes='cronologia da cena não inferida do nome',origem=str(src),copia=str(dest.relative_to(ROOT)).replace('\\','/'),sha256=hashlib.sha256(src.read_bytes()).hexdigest()))
by_hash={}
for row in rows: by_hash.setdefault(row['sha256'],[]).append(row)
for i,group in enumerate(g for g in by_hash.values() if len(g)>1):
 for row in group: row['grupo_duplicatas']=f'DUP-{i+1:03d}'
with (ROOT/'inventario.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
(ROOT/'evidencias/fontes.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
groups={}
for row in rows:
 if not row['id'].startswith('IMG'): continue
 room=row['comodos'].split(';')[0]; groups.setdefault(room,[]).append(row)
for room,items in groups.items():
 cols=2; w,h=490,410
 sheet=Image.new('RGB',(cols*w,70+((len(items)+1)//2)*h),'#f5f2eb'); d=ImageDraw.Draw(sheet)
 d.text((20,20),f'{room.upper()} • vistas complementares',font=font,fill='#172427')
 for i,row in enumerate(items):
  x=(i%cols)*w; y=70+(i//cols)*h
  im=ImageOps.exif_transpose(Image.open(ROOT/row['copia'])); im.thumbnail((w-24,h-75))
  sheet.paste(im,(x+(w-im.width)//2,y))
  d.text((x+15,y+h-65),row['id'],font=font,fill='#134835')
  text=row['ponto_de_vista']; d.text((x+15,y+h-36),text[:55],font=small,fill='#172427')
 sheet.save(ROOT/f'evidencias/contatos/{room}.jpg',quality=90)
print(json.dumps({'originais':len(rows),'duplicatas_exatas':sum(len(g)-1 for g in by_hash.values() if len(g)>1),'contatos':list(groups)},ensure_ascii=False))
