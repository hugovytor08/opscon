from pathlib import Path
import json,csv,hashlib,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
G=json.loads((ROOT/'geometria.json').read_text(encoding='utf-8'));A=json.loads((ROOT/'areas-interativas.json').read_text(encoding='utf-8'));V=json.loads((ROOT/'evidencias/videos.json').read_text(encoding='utf-8'))
with (ROOT/'inventario.csv').open(encoding='utf-8-sig',newline='') as f:F=list(csv.DictReader(f))
checks=[]
assert len(F)==18 and len({r['id'] for r in F})==18
for f in F:assert hashlib.sha256((ROOT/f['copia']).read_bytes()).hexdigest()==f['sha256'],f['id']
checks.append('18 originais preservados byte a byte')
sources={f['id'] for f in F}
for v in V:
 assert v['duration']>0 and len(v['frames'])>=3
 assert all(0<=f['timeSeconds']<v['duration'] and (ROOT/f['file']).exists() for f in v['frames'])
 assert all(a['timeSeconds']<b['timeSeconds'] for a,b in zip(v['frames'],v['frames'][1:]))
 assert v['frames'][0]['timeSeconds']<=.05 and v['duration']-v['frames'][-1]['timeSeconds']<=.21
 sources.update(f['id'] for f in v['frames'])
assert sum(len(v['frames']) for v in V)==29
checks.append('dois vídeos e 29 quadros: tempos, arquivos e cobertura inicial/final')
assert G['coordinateSystem']['scaleToMeters'] is None and not G['confirmedLinearMeasurements']
assert G['representedState']['contextVisibleByDefault'] and G['representedState']['temporalStatus']=='atual_confirmado_pelo_usuario'
reference=next(o['reportedMeasurement'] for o in G['openings'] if o['id']=='window-sala')
assert reference['value']==1.6 and reference['status']=='estimado' and not reference['usedToScaleGeometry']
assert abs(sum(r['declaredArea']['value'] for r in G['rooms'])-53.05)<1e-8
assert len(G['rooms'])==len(A['regions'])==8 and len({r['id'] for r in G['rooms']})==8
assert all(r['appRoomId'] is None for r in G['rooms'])
checks.append('áreas declaradas somam 53,05 m²; escala relativa e IDs sem cadastro')
def area(p):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1]))/2)
def on(p,a,b):return abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))<1e-6 and min(a[0],b[0])-1e-6<=p[0]<=max(a[0],b[0])+1e-6 and min(a[1],b[1])-1e-6<=p[1]<=max(a[1],b[1])+1e-6
def boundary(p,poly):return any(on(p,a,b) for a,b in zip(poly,poly[1:]+poly[:1]))
def inside(p,poly):
 if boundary(p,poly):return True
 x,y=p;result=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
 return result
assert abs(sum(area(r['polygon']) for r in G['rooms'])-area(G['perimeter']))<1e-6
for x in range(50,1137,11):
 for y in range(40,951,11):
  p=[x+.371,y+.193]
  if inside(p,G['perimeter']):assert sum(inside(p,r['polygon']) for r in G['rooms'])==1,p
for r in G['rooms']:
 assert area(r['polygon'])>0 and inside(r['labelAnchor'],r['polygon'])
 assert all(s in sources for s in r['sources'])
for obj in G['fixedElements']+G['contextFurniture']:
 room=next(r for r in G['rooms'] if r['id']==obj['roomId'])
 assert all(inside(p,room['polygon']) for p in obj['polygon']),obj['id']
 assert all(s in sources for s in obj['sources']),obj['id']
walls={w['id']:w for w in G['walls']}
for o in G['openings']:
 if o.get('wallId'):
  w=walls[o['wallId']];assert all(on(p,w['a'],w['b']) for p in [o['a'],o['b']]),o['id']
 for room in o['connects']:
  if room=='exterior':continue
  poly=next(r['polygon'] for r in G['rooms'] if r['id']==room)
  assert boundary(o['a'],poly) and boundary(o['b'],poly),o['id']
 assert all(e['sourceId'] in sources for e in o['evidence'])
checks.append('perímetro coberto sem sobreposição; elementos e vãos contidos nos ambientes corretos')
roots={}
for name in ['planta-2d','casa-isometrica']:
 text=(ROOT/(name+'.svg')).read_text(encoding='utf-8');root=ET.fromstring(text);roots[name]=root
 ids=[n.attrib['id'] for n in root.iter() if 'id' in n.attrib]
 assert len(set(ids))==len(ids) and root.attrib.get('viewBox') and root.attrib.get('role')=='img'
 assert not re.search(r'<script|<foreignObject|<image|@import|https?://(?!www\.w3\.org/2000/svg)',text,re.I)
 assert all('href' not in k for n in root.iter() for k in n.attrib)
 assert root.find('{http://www.w3.org/2000/svg}title') is not None
checks.append('SVGs autocontidos, acessíveis, sem scripts/recursos externos ou IDs duplicados')
for r in G['rooms']:
 ar=next(a for a in A['regions'] if a['id']==r['id']);assert ar['appRoomId'] is None
 mat=G['projection']['matrix'];ox,oy=G['projection']['translation']
 expected=[[round(mat[0][0]*x+mat[0][1]*y+ox,3),round(mat[1][0]*x+mat[1][1]*y+oy,3)] for x,y in r['polygon']]
 assert expected==ar['polygon'],r['id']
 group=next(n for n in roots['casa-isometrica'].iter() if n.attrib.get('id')==ar['svgGroupId'])
 surface=next(n for n in group.iter() if n.attrib.get('class')=='room-surface')
 actual=[[float(v) for v in p.split(',')] for p in surface.attrib['points'].split()]
 assert actual==ar['polygon'],r['id']
checks.append('oito regiões iguais aos pisos do SVG e à projeção independente do modelo')
qa=json.loads((ROOT/'previews/qa-navegador.json').read_text(encoding='utf-8'))
assert {q['width'] for q in qa}=={360,390,412,1200}
assert all(not q['overflow'] and not q['duplicateIds'] and not q['collisions'] and q['selected']==2 and q['contextHidden'] and q['contextVisible'] for q in qa)
checks.append('QA em 360/390/412/1200 px: sem overflow/colisões; seleção e mobiliário operantes')
(ROOT/'evidencias/validacao.json').write_text(json.dumps({'result':'PASS','checks':checks,'limits':['não mede o apartamento','não substitui revisão do usuário','não testa app integrado/aparelho físico']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'PASS','checks':len(checks)},ensure_ascii=False))
