"""Recursos vetoriais verificáveis. Após a primeira execução, editar geometria.json.
Não aplica dimensões em metros, nem cadastra ambientes no aplicativo.
"""
from pathlib import Path
import json, math, html
ROOT=Path(__file__).resolve().parents[1]
INK='#173e31'; EDGE='#a5ada2'; IVORY='#fffefa'; BG='#f5f2eb'
PROJECTION={'matrix':[[0.78,-0.78,0],[0.45,0.45,-1]],'translation':[570,90],'viewBox':[0,0,1280,1080]}
def rect(x,y,w,h): return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
def evidence(id,region): return {'sourceId':id,'region':region}
def initial_model():
 rooms=[]
 specs=[
 ('vis-q1','Quarto 1',8.8,rect(46,37,290,390),[191,240],['IMG-008','IMG-009','VID-001'],1),
 ('vis-q2','Quarto 2',7.54,rect(336,37,348,278),[510,173],['IMG-014','IMG-015'],2),
 ('vis-q3','Quarto 3',8.10,rect(46,427,402,268),[237,552],['IMG-006','IMG-007'],3),
 ('vis-banho','Banheiro',3.26,rect(448,427,177,268),[536,552],['IMG-004','IMG-005','IMG-010'],4),
 ('vis-sala','Sala',16.32,[[625,315],[1136,315],[1136,797],[995,797],[995,695],[625,695]],[886,503],['IMG-001','IMG-002','IMG-003'],5),
 ('vis-cozinha','Cozinha',4.4,rect(752,695,243,255),[875,820],['IMG-011','IMG-012','IMG-013'],6),
 ('vis-servico','Área de serviço',2.2,rect(625,695,127,255),[688,820],['IMG-013','VID-002-006000','VID-002-008000'],7),
 ('vis-circulacao','Circulação',2.43,rect(336,315,289,112),[480,370],['VID-002-016000'],8),
 ]
 for id,name,area,polygon,label,sources,number in specs:
  rooms.append({'id':id,'name':name,'number':number,'appRoomId':None,'polygon':polygon,'labelAnchor':label,'geometryStatus':'estimado','topologyStatus':'observado_sem_medida','declaredArea':{'value':area,'unit':'m2','status':'transcrito_do_documento','fieldVerified':False,'evidence':[evidence('IMG-016','quadro de áreas e rótulo impresso')]},'sources':['IMG-016']+sources})
 walls=[]
 def wall(id,a,b,exterior=False):
  walls.append({'id':id,'a':a,'b':b,'thickness':14,'exterior':exterior,'geometryStatus':'estimado','observedStatus':'observado_sem_medida','evidence':[evidence('IMG-016','planta inferior: traçado da parede correspondente')],'renderHeight':72 if exterior and (a[1]==b[1] and a[1] in [37,315] or a[0]==b[0] and a[0]==46) else 26})
 outline=[[46,37],[684,37],[684,315],[1136,315],[1136,797],[995,797],[995,950],[625,950],[625,695],[46,695],[46,37]]
 for i,(a,b) in enumerate(zip(outline,outline[1:])): wall('wall-ext-'+str(i+1),a,b,True)
 for id,a,b in [('q1-leste',[336,37],[336,427]),('q2-sul',[336,315],[684,315]),('q3-norte',[46,427],[448,427]),('q3-leste',[448,427],[448,695]),('banho-norte',[448,427],[625,427]),('banho-leste',[625,427],[625,695]),('cozinha-norte',[625,695],[995,695]),('servico-leste',[752,695],[752,950])]: wall('wall-'+id,a,b)
 openings=[]
 def opening(id,kind,wall,a,b,connects,source,hinge=None,open_end=None):
  obj={'id':id,'kind':kind,'wallId':wall,'a':a,'b':b,'connects':connects,'geometryStatus':'estimado','existenceStatus':'observado_sem_medida','evidence':[evidence('IMG-016','símbolo da abertura'),evidence(source,'abertura visível nas fotos/quadros')],'confidence':'alta para existência; média para posição e largura'}
  if hinge: obj['swing']={'hinge':hinge,'openEnd':open_end,'status':'estimado','evidence':[evidence('IMG-016','arco de abertura; não calibra ângulo real da porta')]}
  openings.append(obj)
 opening('door-q1','door','wall-q1-leste',[336,333],[336,417],['vis-q1','vis-circulacao'],'IMG-009',[336,417],[252,417])
 opening('door-q2','door','wall-q2-sul',[356,315],[438,315],['vis-q2','vis-circulacao'],'IMG-015',[356,315],[356,233])
 opening('door-q3','door','wall-q3-norte',[351,427],[436,427],['vis-q3','vis-circulacao'],'IMG-007',[436,427],[436,512])
 opening('door-banho','door','wall-banho-norte',[470,427],[535,427],['vis-banho','vis-circulacao'],'IMG-010',[470,427],[470,492])
 opening('door-entrada','door','wall-ext-5',[1030,797],[1125,797],['vis-sala','exterior'],'IMG-016',[1125,797],[1125,702])
 opening('portal-cozinha','passage','wall-cozinha-norte',[859,695],[950,695],['vis-sala','vis-cozinha'],'IMG-001')
 opening('portal-servico','passage','wall-servico-leste',[752,782],[752,874],['vis-cozinha','vis-servico'],'IMG-013')
 openings.append({'id':'passagem-circulacao','kind':'open_connection','wallId':None,'a':[625,315],'b':[625,427],'connects':['vis-sala','vis-circulacao'],'geometryStatus':'estimado','existenceStatus':'observado_sem_medida','confidence':'alta','evidence':[evidence('IMG-016','sala ligada à circulação sem folha desenhada'),evidence('VID-002-016000','percurso pelo corredor')]})
 for id,wall,a,b,room,source in [
 ('q1','wall-ext-10',[46,160],[46,305],'vis-q1','IMG-008'),('q2','wall-ext-2',[684,95],[684,236],'vis-q2','IMG-014'),('q3','wall-ext-10',[46,488],[46,608],'vis-q3','IMG-006'),('sala','wall-ext-3',[757,315],[916,315],'vis-sala','IMG-002'),('banho','wall-ext-9',[479,695],[521,695],'vis-banho','IMG-005'),('servico','wall-ext-8',[625,748],[625,892],'vis-servico','VID-002-008000')]:
  opening('window-'+id,'window',wall,a,b,[room,'exterior'],source)
 fixed=[
 {'id':'fix-box','roomId':'vis-banho','kind':'shower-screen','polygon':rect(461,590,150,93),'height':34,'sources':['IMG-004','IMG-005','IMG-016'],'status':'observado_sem_medida'},
 {'id':'fix-vaso','roomId':'vis-banho','kind':'toilet','polygon':rect(563,449,48,59),'height':22,'sources':['IMG-004','IMG-010','IMG-016'],'status':'observado_sem_medida'},
 {'id':'fix-pia','roomId':'vis-banho','kind':'sink','polygon':rect(570,530,41,37),'height':34,'sources':['IMG-010','IMG-016'],'status':'observado_sem_medida'},
 {'id':'fix-bancada','roomId':'vis-cozinha','kind':'counter','polygon':rect(768,904,163,36),'height':38,'sources':['IMG-011','IMG-012','IMG-016'],'status':'observado_sem_medida'},
 {'id':'fix-tanque','roomId':'vis-servico','kind':'laundry-sink','polygon':rect(683,892,52,47),'height':35,'sources':['VID-002-006000','IMG-016'],'status':'observado_sem_medida'},
 ]
 furniture=[
 {'id':'ctx-cama-q1','roomId':'vis-q1','kind':'mattress','polygon':rect(69,63,83,235),'height':22,'sources':['IMG-008','IMG-009','VID-001-002000']},
 {'id':'ctx-tapete-q1','roomId':'vis-q1','kind':'rug','polygon':rect(158,70,143,305),'height':1,'sources':['IMG-008','IMG-009']},
 {'id':'ctx-colchao-q3','roomId':'vis-q3','kind':'mattress','polygon':rect(67,611,256,67),'height':6,'sources':['IMG-006','IMG-007']},
 {'id':'ctx-mesa-q3','roomId':'vis-q3','kind':'desk','polygon':rect(69,451,168,57),'height':34,'sources':['IMG-006','IMG-007']},
 {'id':'ctx-cadeira-q3','roomId':'vis-q3','kind':'chair','polygon':rect(196,539,46,42),'height':20,'sources':['IMG-006','IMG-007']},
 {'id':'ctx-sofa-sala','roomId':'vis-sala','kind':'sofa','polygon':rect(977,541,128,118),'height':24,'sources':['IMG-001','IMG-002']},
 {'id':'ctx-mesa-sala','roomId':'vis-sala','kind':'round-table','polygon':rect(1002,460,75,70),'height':34,'sources':['IMG-001','IMG-002']},
 {'id':'ctx-movel-rede','roomId':'vis-sala','kind':'cabinet','polygon':rect(663,335,60,58),'height':32,'sources':['IMG-001','IMG-002']},
 {'id':'ctx-geladeira','roomId':'vis-cozinha','kind':'fridge','polygon':rect(930,722,52,76),'height':62,'sources':['IMG-013']},
 {'id':'ctx-fogao','roomId':'vis-cozinha','kind':'stove','polygon':rect(937,886,48,54),'height':36,'sources':['IMG-011','IMG-012']},
 {'id':'ctx-banquetas-q2','roomId':'vis-q2','kind':'stored-stools','polygon':rect(438,185,90,62),'height':22,'sources':['IMG-014','IMG-015']},
 ]
 for obj in fixed+furniture: obj.update({'positionStatus':'estimado','sizeStatus':'estimado','confidence':'média; transposição das vistas para a planta'})
 return {'schemaVersion':1,'artifactStatus':'para_revisao','artifactDate':'2026-10-12','coordinateSystem':{'unit':'UR','meaning':'unidade relativa do traçado da imagem retificada; não é metro','scaleToMeters':None,'origin':'canto superior esquerdo da moldura retificada IMG-016','axes':{'x':'direita da planta impressa','y':'baixo da planta impressa'},'geographicNorth':None,'sourceRectification':'evidencias/retificacao.json'},'declaredTotalArea':{'value':53.05,'unit':'m2','sourceId':'IMG-016','fieldVerified':False},'confirmedLinearMeasurements':[],'projection':PROJECTION,'rooms':rooms,'perimeter':outline[:-1],'walls':walls,'openings':openings,'fixedElements':fixed,'contextFurniture':furniture,'representedState':{'structure':'planta impressa conferida com fotos e quadros; traçado relativo','furniture':'camada observada nas fotos; estado atual aguarda confirmação','contextVisibleByDefault':False},'unknowns':['cotas lineares e espessuras reais','pé-direito','posição/largura exatas das aberturas','estado temporal do mobiliário','sentido real da porta de entrada; somente símbolo impresso disponível'],'notObserved':['varanda','pilares separados','janela própria da cozinha'],'warnings':['Área do documento não calibra comprimento ou largura.','Alturas e cortes de parede são convenção visual, não medidas.','IDs visuais não são IDs cadastrados no app.']}

file=ROOT/'geometria.json'
if not file.exists(): file.write_text(json.dumps(initial_model(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
M=json.loads(file.read_text(encoding='utf-8'))
P=M['projection']; ox,oy=P['translation']; mat=P['matrix']
def project(p,z=0): return [round(mat[0][0]*p[0]+mat[0][1]*p[1]+mat[0][2]*z+ox,3),round(mat[1][0]*p[0]+mat[1][1]*p[1]+mat[1][2]*z+oy,3)]
def points(poly): return ' '.join(f'{x:g},{y:g}' for x,y in poly)
def tagpoly(poly,fill,stroke=EDGE,width=1,attrs=''): return f'<polygon points="{points(poly)}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {attrs}/>'
def line(a,b,color=INK,width=2,attrs=''): return f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{color}" stroke-width="{width}" {attrs}/>'
def shell(title,desc,viewbox,body,defs='',css=''):
 return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-labelledby="svg-title svg-desc">
<title id="svg-title">{title}</title><desc id="svg-desc">{desc}</desc>
<defs>{defs}</defs><style>.room-surface{{transition:fill .15s;}}.room.is-selected .room-surface{{fill:#b9d2bf;stroke:#134835;stroke-width:7;stroke-dasharray:13 5;}}{css}</style>{body}</svg>'''

def wall_parts(w):
 a,b=w['a'],w['b']; dx=b[0]-a[0];dy=b[1]-a[1]; length=math.hypot(dx,dy)
 def t(p): return ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length)
 openings=[o for o in M['openings'] if o.get('wallId')==w['id']]
 cuts=sorted((min(t(o['a']),t(o['b'])),max(t(o['a']),t(o['b']))) for o in openings)
 cursor=0; segments=[]
 for start,end in cuts:
  if start>cursor: segments.append((cursor,start))
  cursor=max(cursor,end)
 if cursor<1: segments.append((cursor,1))
 return [([a[0]+u*dx,a[1]+u*dy],[a[0]+v*dx,a[1]+v*dy]) for u,v in segments]
def footprint(a,b,thickness):
 dx=b[0]-a[0];dy=b[1]-a[1];ln=math.hypot(dx,dy);nx=-dy/ln*thickness/2;ny=dx/ln*thickness/2
 return [[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]
def cuboid(poly,height,color,top=None):
 result=[]
 # faces en ordre de profondeur puis couronnement
 faces=[]
 for i,a in enumerate(poly):
  b=poly[(i+1)%len(poly)]; depth=sum(a+b)
  faces.append((depth,tagpoly([project(a),project(b),project(b,height),project(a,height)],color,EDGE,1)))
 result.extend(text for depth,text in sorted(faces))
 result.append(tagpoly([project(p,height) for p in poly],top or color,EDGE,1.2))
 return ''.join(result)

def oval(cx,cy,rx,ry,z,color,stroke=EDGE):
 poly=[[cx+rx*math.cos(i*math.pi/12),cy+ry*math.sin(i*math.pi/12)] for i in range(24)]
 return tagpoly([project(p,z) for p in poly],color,stroke,1.1)

def context_shape(obj,color):
 poly=obj['polygon'];x,y=poly[0];w=poly[1][0]-x;d=poly[2][1]-y;h=obj['height'];kind=obj['kind']
 if kind=='round-table':
  out=''.join(line(project([x+w/2+dx,y+d/2+dy]),project([x+w/2+dx,y+d/2+dy],h),'#485348',2.5) for dx,dy in [(-12,-12),(12,-12),(12,12),(-12,12)])
  return out+oval(x+w/2,y+d/2,w/2,d/2,h,color)
 if kind=='stored-stools':
  out=''
  for cx,cy in [(x+18,y+18),(x+w-18,y+18),(x+w/2,y+d-16)]:
   out+=''.join(line(project([cx+dx,cy+dy]),project([cx+dx,cy+dy],h),'#485348',2) for dx,dy in [(-7,-7),(7,-7),(0,8)])
   out+=oval(cx,cy,13,12,h,color)
  return out
 if kind=='sofa':
  out=cuboid(poly,13,color)
  out+=cuboid(rect(x,y+d-18,w,18),38,color)
  out+=cuboid(rect(x,y,14,d),27,color)+cuboid(rect(x+w-14,y,14,d),27,color)
  out+=cuboid(rect(x+18,y+7,(w-42)/2,d-31),20,'#58664d')
  out+=cuboid(rect(x+24+(w-42)/2,y+7,(w-42)/2,d-31),20,'#58664d')
  return out
 if kind=='desk':
  legs=''.join(line(project(p),project(p,h),'#625949',4) for p in [[x+8,y+8],[x+w-8,y+8],[x+w-8,y+d-8],[x+8,y+d-8]])
  return legs+tagpoly([project(p,h) for p in poly],color,'#5d604f',1.2)
 if kind=='chair':
  out=line(project([x+w/2,y+d/2]),project([x+w/2,y+d/2],h),'#455447',3)
  out+=oval(x+w/2,y+d/2,w/2,d/2,h,color)
  out+=cuboid(rect(x+4,y+d-6,w-8,6),h+22,color)
  return out
 out=cuboid(poly,h,color)
 if kind=='mattress':
  out+=tagpoly([project(p,h+1) for p in rect(x+7,y+7,min(47,w-14),min(35,d-14))],'#f2f2e8',EDGE,1)
 elif kind=='stove':
  for dx,dy in [(12,14),(w-12,14),(12,d-14),(w-12,d-14)]:out+=oval(x+dx,y+dy,6,6,h+1,'#89958b','#253d2f')
 elif kind=='fridge':
  out+=line(project(poly[1],h*.5),project(poly[2],h*.5),'#98a193',1.5)
 elif kind=='rug':
  for i in range(4):out+=line(project([x+8,y+20+i*d/4],h+1),project([x+w-8,y+8+i*d/4],h+1),'#bcb7a6',5,'stroke-dasharray="11 13"')
 return out

# Vue supérieure d'abord : mêmes coordonnées que le modèle, sans cotation inventée.
b=['<rect width="1240" height="1180" fill="#f5f2eb"/>','<text x="46" y="1030" fill="#173e31" font-family="Arial,sans-serif" font-size="32">Planta para conferência · escala relativa</text>','<text x="46" y="1072" fill="#435849" font-family="Arial,sans-serif" font-size="22">Áreas transcritas do documento; nenhuma cota linear medida.</text>','<text x="46" y="1110" fill="#435849" font-family="Arial,sans-serif" font-size="22">Marfim: ambientes · sálvia: janelas · arco tracejado: abertura estimada</text>']
for r in M['rooms']:
 color='#e8eee4' if r['id'] in ['vis-circulacao','vis-servico'] else '#fffefa'
 b.append(f'<g id="plan-{r["id"]}" class="room" data-room-id="{r["id"]}"><title>{r["name"]}</title>'+tagpoly(r['polygon'],color,EDGE,1,'class="room-surface"')+'</g>')
b.append('<g id="plan-structure">')
for w in M['walls']:
 for a,c in wall_parts(w): b.append(line(a,c,INK,14,'stroke-linecap="square"'))
for o in M['openings']:
 if o['kind']=='window':
  a,c=o['a'],o['b']; b.append(line(a,c,'#578270',8)); b.append(line(a,c,IVORY,2))
 if 'swing' in o:
  h=o['swing']['hinge'];e=o['swing']['openEnd'];closed=o['a'] if o['b']==h else o['b'];rad=math.dist(h,e)
  b.append(line(h,e,'#627969',3)); b.append(f'<path d="M {closed[0]},{closed[1]} A {rad},{rad} 0 0 1 {e[0]},{e[1]}" fill="none" stroke="#627969" stroke-width="2" stroke-dasharray="7 5"/>')
b.append('</g><g id="plan-fixed">')
for obj in M['fixedElements']: b.append(tagpoly(obj['polygon'],'#d9e1db',INK,2,f'id="plan-{obj["id"]}"'))
b.append('</g>')
for o in M['openings']:
 if o.get('reportedMeasurement'):
  a,c=o['a'],o['b'];offset=-40
  b.append('<g id="plan-referencia-aproximada" fill="#8b4b13" font-family="Arial,sans-serif" font-size="20" text-anchor="middle">'+line([a[0],a[1]+offset],[c[0],c[1]+offset],'#8b4b13',2,'stroke-dasharray="5 4"')+f'<text x="{(a[0]+c[0])/2}" y="{a[1]+offset-12}">≈ 1,60 m · janela*</text></g>')
b.append('<g id="plan-labels" font-family="Arial,sans-serif" fill="#173e31" text-anchor="middle">')
for r in M['rooms']:
 x,y=r['labelAnchor']; size=34 if r['id'] not in ['vis-servico','vis-banho','vis-circulacao'] else 26
 name=r['name']; name='Serviço' if r['id']=='vis-servico' else 'Banho' if r['id']=='vis-banho' else name
 area_label=f'{r["declaredArea"]["value"]:.2f}'.replace('.',',')
 b.append(f'<g class="room-label"><text x="{x}" y="{y}" font-size="{size}" font-weight="600">{name}</text><text x="{x}" y="{y+32}" font-size="23">{area_label} m²*</text></g>')
b.append('</g>')
(ROOT/'planta-2d.svg').write_text(shell('Apartamento: planta superior para conferência','Oito ambientes, portas e janelas derivados da planta IMG-016. Sem norte geográfico, cotas lineares ou escala em metros. Áreas declaradas no documento.', '0 0 1240 1180',''.join(b)),encoding='utf-8')

# Isometria: projeção afim documentada, regiões e pisos derivados diretamente dos polígonos.
defs='<pattern id="tile" width="55" height="55" patternUnits="userSpaceOnUse"><path d="M55 0H0V55" fill="none" stroke="#c4cbc3" stroke-width="1.3"/></pattern>'
b=['<g id="iso-base" aria-hidden="true">'+tagpoly([project(p, -10) for p in M['perimeter']],'#deded4','#c9ccbf',2)+'</g>','<g id="iso-ambientes">']
for r in M['rooms']:
 b.append(f'<g id="iso-{r["id"]}" class="room" data-room-id="{r["id"]}"><title>{r["name"]}</title><desc>Traçado relativo; área declarada {r["declaredArea"]["value"]} metros quadrados, sem aferição física.</desc>'+tagpoly([project(p) for p in r['polygon']],'#f7f7f0' if r['id'] not in ['vis-circulacao','vis-servico'] else '#e5ebdf',EDGE,1,'class="room-surface"')+'</g>')
 transform=f'matrix({mat[0][0]} {mat[1][0]} {mat[0][1]} {mat[1][1]} {ox} {oy})'
 b.append(f'<polygon points="{points(r["polygon"])}" transform="{transform}" fill="url(#tile)" pointer-events="none" aria-hidden="true"/>')
b.append('</g><g id="iso-estrutura" aria-hidden="true" pointer-events="none">')
segments=[]
for w in M['walls']:
 for i,(a,c) in enumerate(wall_parts(w)):
  segments.append((sum(a+c),f'<g id="iso-{w["id"]}-{i}">'+cuboid(footprint(a,c,w['thickness']),w['renderHeight'],'#deded2',IVORY)+'</g>'))
b.extend(s for depth,s in sorted(segments))
for o in M['openings']:
 a,c=o['a'],o['b']
 if o['kind']=='window':
  b.append(f'<g id="iso-{o["id"]}">'+tagpoly([project(a,9),project(c,9),project(c,42),project(a,42)],'#c7dad5','#497762',1.8,'fill-opacity=".45"')+line(project(a,25),project(c,25),'#497762',2)+'</g>')
 if o['kind']=='door': b.append(line(project(a,1),project(c,1),'#5e7163',3,'stroke-dasharray="5 5"'))
b.append('</g><g id="iso-elementos-fixos" pointer-events="none">')
for obj in sorted(M['fixedElements'],key=lambda v:sum(sum(p) for p in v['polygon'])):
 poly=obj['polygon'];h=obj['height'];kind=obj['kind']; body=''
 if kind=='shower-screen':
  body=tagpoly([project(p) for p in poly],'#e5eee9','#6f9284',1.5,'fill-opacity=".6"')
  a,c=poly[0],poly[1];body+=tagpoly([project(a),project(c),project(c,h),project(a,h)],'#bfdbd0','#5d8473',1.5,'fill-opacity=".28"')
  body+=line(project(a,h),project(c,h),'#557361',3)
 elif kind=='counter':
  body=cuboid(poly,h,'#dbdaca','#384139');x,y=poly[0];body+=tagpoly([project(p,h+1) for p in rect(x+54,y+6,44,25)],'#cad5cc','#738675',1)
 elif kind=='toilet':
  x,y=poly[0];body=cuboid(rect(x+8,y+6,33,14),h+8,'#e0e3d8',IVORY)
  body+=cuboid(rect(x+10,y+20,27,31),h-5,'#e0e3d8',IVORY)
  body+=oval(x+24,y+38,20,23,h,IVORY)+oval(x+24,y+38,12,16,h+1,'#d5e0d7')
 elif kind=='sink':
  x,y=poly[0];body=oval(x+21,y+18,21,18,h,IVORY)+oval(x+21,y+18,14,11,h+1,'#d5e0d7')
 elif kind=='electric-shower':
  x,y=poly[0];body=tagpoly([project(p,h) for p in poly],IVORY,'#93a293',1.3)
  body+=line(project([x+12,y+14],h-6),project([x+12,y+14],h-24),'#738572',2)
  body+=line(project([x+12,y+14],h-4),project([x-11,y+14],h-4),'#738572',2.5)
 else:
  body=cuboid(poly,h,'#e0e3d8',IVORY);x,y=poly[0];body+=tagpoly([project(p,h+1) for p in rect(x+6,y+6,poly[1][0]-x-12,poly[2][1]-y-12)],'#d0ded6','#829c8b',1)
 b.append(f'<g id="iso-{obj["id"]}" data-room-id="{obj["roomId"]}"><title>{html.escape(kind)}: elemento observado, posição estimada</title>{body}</g>')
b.append('</g>')
visible=M['representedState'].get('contextVisibleByDefault',False)
b.append(f'<g id="iso-mobiliario-contextual" data-status="{M["representedState"].get("temporalStatus","pendente")}" pointer-events="none" style="display:{"inline" if visible else "none"}">')
for obj in sorted(M['contextFurniture'],key=lambda v:sum(sum(p) for p in v['polygon'])):
 color={'rug':'#706757','sofa':'#43543d','desk':'#786552','cabinet':'#51554e','stove':'#454c47','fridge':'#f6f5ec','mattress':'#dce0d6','chair':'#3c4a43','stored-stools':'#4c554c','round-table':'#e1ddc8'}[obj['kind']]
 b.append(f'<g id="iso-{obj["id"]}" data-room-id="{obj["roomId"]}"><title>{obj["kind"]}: observado nas fotos; dimensões estimadas</title>'+context_shape(obj,color)+'</g>')
b.append('</g>')
(ROOT/'casa-isometrica.svg').write_text(shell('Apartamento Casa Serena: representação isométrica','Oito ambientes na geometria da planta impressa, teto removido e paredes cortadas. Estrutura observada, posições e dimensões relativas estimadas. Mobiliário contextual em camada separada. Rótulos disponíveis no arquivo de regiões.', '0 0 1280 1080',''.join(b),defs),encoding='utf-8')
areas={'schemaVersion':1,'svg':'casa-isometrica.svg','viewBox':P['viewBox'],'coordinateSystem':'coordenadas SVG da projeção definida em geometria.json; pixels do viewBox, não metros','projection':P,'regions':[],'interactionNotes':['Selecionar por data-room-id ou pelas regiões deste arquivo.','Contorno tracejado e nome na lista complementam o destaque por cor.','Rótulos e controles são externos ao SVG.','No celular usar os números da legenda, lista equivalente e zoom para alvos pequenos.']}
for r in M['rooms']:
 areas['regions'].append({'id':r['id'],'name':r['name'],'number':r['number'],'appRoomId':None,'svgGroupId':'iso-'+r['id'],'polygon':[project(p) for p in r['polygon']],'labelPosition':project(r['labelAnchor']),'labelPosition2d':r['labelAnchor'],'accessibleName':'Selecionar '+r['name'],'geometryStatus':'estimado'})
(ROOT/'areas-interativas.json').write_text(json.dumps(areas,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('planta-2d.svg, casa-isometrica.svg, geometria.json e areas-interativas.json gerados; contexto',visible)
