from pathlib import Path
import csv,json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
font=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',20)
small=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',16)
videos=json.loads((ROOT/'evidencias/videos.json').read_text(encoding='utf-8'))
def classify(video,t):
 if video=='VID-001': return 'quarto-1','alta'
 if t<2: return 'sala','alta'
 if t<6: return 'cozinha;sala' if t<3 else 'cozinha','alta'
 if t<12: return 'area-servico;cozinha','alta'
 if t<15: return 'sala;circulacao','alta'
 if t<18: return 'circulacao','alta'
 if t<21: return 'banheiro;circulacao','alta'
 if t<24: return 'quarto-2','media: associação pelo percurso'
 if t<27: return 'quarto-1','media: associação pelo percurso'
 return 'quarto-3;circulacao','media: associação pelo percurso'
for v in videos:
 v['method']='Chrome HTMLVideoElement, sem áudio: amostragem a cada 2 s e final; VID-002 inclui transições 13,15,17,19,21,23,25,27,29 s'
 for f in v['frames']: f['rooms'],f['associationConfidence']=classify(v['id'],f['timeSeconds'])
 for part in range((len(v['frames'])+8)//9):
  frames=v['frames'][part*9:(part+1)*9];sheet=Image.new('RGB',(960,80+((len(frames)+2)//3)*445),'#f5f2eb');d=ImageDraw.Draw(sheet)
  d.text((16,15),f"{v['id']} • {v['duration']:.3f} s • parte {part+1}",font=font,fill='#173e31')
  for i,f in enumerate(frames):
   im=Image.open(ROOT/f['file']);im.thumbnail((300,360));x=(i%3)*320;y=80+(i//3)*445
   sheet.paste(im,(x+(320-im.width)//2,y));d.text((x+10,y+370),f"{f['id']} • {f['timeLabel']}",font=small,fill='#173e31');d.text((x+10,y+395),f['rooms'][:38],font=small,fill='#435849')
  sheet.save(ROOT/f'evidencias/contatos/{v["id"]}-{part+1}.jpg',quality=92)
(ROOT/'evidencias/videos.json').write_text(json.dumps(videos,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
rows=json.loads((ROOT/'evidencias/fontes.json').read_text(encoding='utf-8'))
for row in rows:
 if row['tipo']=='video':
  v=next(v for v in videos if v['id']==row['id'])
  row['ponto_de_vista']='Quarto 1: janela, cama, tapete, entrada' if row['id']=='VID-001' else 'Sala→cozinha→serviço→sala→circulação→banheiro→quartos; ver videos.json'
  row['confianca_identificacao']='alta' if row['id']=='VID-001' else 'alta para sala/cozinha/serviço/circulação/banheiro; média para quartos no percurso'
  row['observacoes']=f"{v['duration']:.6f} s; {v['width']}x{v['height']}; {len(v['frames'])} quadros; estado temporal não confirmado; nome não comprova data de captura"
 else: row['fonte_data']='EXIF DateTimeOriginal ausente; data de captura desconhecida'
with (ROOT/'inventario.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
(ROOT/'evidencias/fontes.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
params=json.loads((ROOT/'evidencias/retificacao.json').read_text(encoding='utf-8'))
original=Image.open(ROOT/next(r['copia'] for r in rows if r['id']=='IMG-016'))
image=original.transform(tuple(params['targetSize']),Image.Transform.PERSPECTIVE,tuple(params['coefficientsOutputToInput']),Image.Resampling.BICUBIC)
image.save(ROOT/'evidencias/planta-retificada.png')
g=json.loads((ROOT/'geometria.json').read_text(encoding='utf-8'))
overlay=Image.blend(image.convert('RGB'),Image.new('RGB',image.size,'white'),.58);d=ImageDraw.Draw(overlay)
for r in g['rooms']:
 poly=[tuple(p) for p in r['polygon']];d.line(poly+[poly[0]],fill='#245c48',width=3);x,y=r['labelAnchor'];d.text((x-20,y),str(r['number']),font=font,fill='#173e31')
for o in g['openings']: d.line([tuple(o['a']),tuple(o['b'])],fill='#a4540b',width=5)
overlay.save(ROOT/'evidencias/planta-sobreposta.png')
print(f'18 fontes catalogadas; {sum(len(v["frames"]) for v in videos)} quadros; contatos e sobreposição atualizados')
