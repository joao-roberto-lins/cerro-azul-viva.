/* Cerro Azul Viva · Level 2. Reference details are in LEIA-ME.md. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!window.THREE) { $('loading-message').textContent = 'Não foi possível abrir os gráficos. Mantenha a pasta vendor junto do jogo e recarregue a página.'; return; }
  const T = THREE;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const SAVE = 'cerro-azul-viva-v1';
  let saveKey=SAVE,coopActive=false,soloBackup=null;
  const MISSION_COUNT = 26;
  let level2=null;
  let started = false, selectedColor = '#e97843', near = null, frame = 0, elapsed = 0, lastSave = 0, toastTimer;
  let cameraYaw = 0.28, cameraDistance = 19, cameraMode = 0, jumpVelocity = 0, jumpHeight = 0;
  const keys = new Set(), obstacles = [], mapBuildings = [], interactables = [], labels = [], walkers = [], cars = [], lamps = [], waterJets = [];
  const defaults = () => ({name:'Visitante',color:'#e97843',money:50,energy:100,step:0,carrying:false,invitation:false,trash:[],photos:0,time:570,day:1,x:0,z:65,sceneryVersion:2,health:100,hunger:100,fullFor:40,deaths:0,transport:'walk',bikeDistance:0,deliveries:0,delivery:null,treeCleared:false,treePaid:false,treeDelivered:false,chopRemaining:0,tasted:[],picnicStarted:false,picnicGiven:[]});
  let state = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE));
    if(saved && saved.version===1){
      state={...state,...saved};
      state.name=String(state.name).slice(0,20)||'Visitante';
      state.step=clamp(Math.floor(Number(state.step)||0),0,MISSION_COUNT);
      state.invitation=state.step===5&&state.invitation===true;
      state.money=clamp(Number(state.money)||0,0,99999);state.energy=clamp(Number(state.energy)||100,0,100);
      state.x=clamp(Number(state.x)||0,-135,135);state.z=clamp(Number(state.z)||24,-135,135);
      if(saved.sceneryVersion!==2){state.x=0;state.z=65;}state.sceneryVersion=2;
      state.time=clamp(Number(state.time)||480,0,1439);state.day=Math.max(1,Math.floor(Number(state.day)||1));
      state.trash=Array.isArray(state.trash)?state.trash.filter(n=>Number.isInteger(n)&&n>=0&&n<3):[];
      if(!/^#[0-9a-f]{6}$/i.test(state.color))state.color='#e97843';
      state.health=Number.isFinite(saved.health)?clamp(saved.health,0,100):100;
      state.hunger=Number.isFinite(saved.hunger)?clamp(Math.round(saved.hunger),0,100):100;
      state.fullFor=clamp(Number(state.fullFor)||0,0,40);state.deliveries=Math.max(0,Math.floor(Number(state.deliveries)||0));state.bikeDistance=Math.max(0,Number(state.bikeDistance)||0);state.deaths=Math.max(0,Number(state.deaths)||0);
      state.transport=state.transport==='bike'?'bike':'walk';state.tasted=Array.isArray(state.tasted)?[...new Set(state.tasted.filter(x=>['bolo','carne','cocada'].includes(x)))]:[];
      state.picnicGiven=Array.isArray(state.picnicGiven)?[...new Set(state.picnicGiven.filter(x=>['ana','clara','miguel'].includes(x)))]:[];
      state.delivery=state.delivery&&['normal','tree','quick'].includes(state.delivery.kind)&&['rosa','lurdes','juca'].includes(state.delivery.to)?state.delivery:null;
      state.chopRemaining=clamp(Number(state.chopRemaining)||0,0,10);state.treeCleared=state.treeCleared===true;state.treePaid=state.treePaid===true;
      $('name').value=state.name;selectedColor=state.color;$('start').innerHTML='Continuar meu passeio <span>→</span>';
    }
  }catch(e){/* Storage may be unavailable when opening a local file. */}
  const scene = new T.Scene(); scene.background = new T.Color('#99c5df'); scene.fog = new T.Fog('#99c5df',160,560);
  const camera = new T.PerspectiveCamera(53,innerWidth/innerHeight,0.2,850);
  let renderer;
  try { renderer = new T.WebGLRenderer({canvas:$('world'),antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'}); }
  catch(e){$('loading-message').textContent='Este navegador não conseguiu iniciar o 3D. Abra o jogo no Chrome ou Edge com aceleração gráfica ativada.';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const hemi=new T.HemisphereLight('#c9e2f3','#576c42',1.45);scene.add(hemi);
  const sun=new T.DirectionalLight('#fff0d0',3.1);sun.position.set(-68,110,65);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-112,right:112,top:130,bottom:-115,near:1,far:330});sun.shadow.bias=-0.0006;sun.shadow.normalBias=.12;scene.add(sun);
  const mats=new Map(), unitBox=new T.BoxGeometry(1,1,1);
  function material(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.8}));return mats.get(color);}
  function mesh(geo,color,x,y,z,parent=scene){const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,color,x,y,z,parent=scene){const m=mesh(unitBox,color,x,y,z,parent);m.scale.set(w,h,d);return m;}
  function cylinder(rt,rb,h,color,x,y,z,parent=scene,sides=12){return mesh(new T.CylinderGeometry(rt,rb,h,sides),color,x,y,z,parent);}
  function ball(r,color,x,y,z,parent=scene,detail=0){return mesh(new T.SphereGeometry(r,12,9),color,x,y,z,parent);}
  function block(x,z,w,d){obstacles.push({x,z,w,d});}
  function collides(x,z,r=.38){if(level2&&state.inTunnel)return level2.tunnelCollision(x,z,r);return obstacles.some(o=>o.active!==false&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);}
  function group(x,z){const g=new T.Group();g.position.set(x,0,z);scene.add(g);return g;}
  let seed=2511;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const colorPick=arr=>arr[Math.floor(random()*arr.length)];
  function sign(text,w,h,bg='#fff8dc',fg='#234e45'){
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
    ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.font='bold 82px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,130,960);
    if(text==='EU ♥ CERRO AZUL'){ctx.fillStyle=bg;ctx.fillRect(26,0,972,256);ctx.textAlign='left';ctx.fillStyle=fg;ctx.fillText('EU',30,130);ctx.fillStyle='#ce3250';ctx.fillText('♥',167,130);ctx.fillStyle=fg;ctx.fillText('CERRO AZUL',270,130,728);}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:1,side:T.DoubleSide}));
  }
  function label(text,x,y,z,target=false){const el=document.createElement('div');el.className='landmark'+(target?' target':'');el.textContent=text;$('landmarks').appendChild(el);const data={el,pos:new T.Vector3(x,y,z),target};labels.push(data);return data;}
  const city=window.buildCerroAzul(T,scene);
  obstacles.push(...city.obstacles);mapBuildings.push(...city.buildings);lamps.push(...city.lamps);
  interactables.push(...city.animals);
  for(const [i,b] of city.benches.entries())interactables.push({id:'bench'+i,type:'bench',x:b.x,z:b.z,name:'Descansar no banco',radius:2.5});
  label('Igreja Nossa Senhora da Guia',-3,25,-84);
  // Characters remain fictional; their stops now follow the rebuilt square.
  // Stylized articulated characters with animated arms and legs.
  function person(color,skin='#bd916f',hat=false){
    const g=new T.Group(),shirt=new T.MeshStandardMaterial({color,roughness:.8});
    const torso=mesh(new T.CapsuleGeometry(.28,.39,4,10),shirt,0,1.16,0,g);torso.scale.set(1,.9,.65);
    const skinMat=new T.MeshStandardMaterial({color:skin,roughness:.8}),hairMat=new T.MeshStandardMaterial({color:'#382e24',roughness:.8});
    const head=ball(.225,skinMat,0,1.79,0,g);head.scale.set(.88,1.12,.95);
    const hair=ball(.224,hairMat,0,1.89,-.026,g);hair.scale.set(.94,.8,1);
    for(const x of [-.075,.075]){ball(.025,'#2c3535',x,1.79,.19,g);ball(.019,'#faf8ed',x+.007,1.8,.21,g);}
    ball(.041,skinMat,0,1.72,.224,g);cylinder(.085,.1,.16,skinMat,0,1.52,0,g);
    const arms=[],legs=[];
    for(const x of [-.36,.36]){const q=new T.Group();q.position.set(x,1.39,0);g.add(q);mesh(new T.CapsuleGeometry(.10,.18,3,8),shirt,0,-.14,0,q);mesh(new T.CapsuleGeometry(.075,.22,3,8),skinMat,0,-.4,0,q);ball(.083,skinMat,0,-.57,0,q);arms.push(q);}
    for(const x of [-.14,.14]){const q=new T.Group();q.position.set(x,.94,0);g.add(q);mesh(new T.CapsuleGeometry(.113,.53,4,8),'#344955',0,-.34,0,q);const shoe=ball(.14,'#e2ded2',0,-.79,.06,q);shoe.scale.set(.9,.5,1.55);const sole=box(.24,.045,.4,'#343d40',0,-.85,.08,q);legs.push(q);}
    if(hat){cylinder(.36,.36,.055,'#b59960',0,2.01,0,g);cylinder(.22,.25,.17,'#d4b77e',0,2.11,0,g);}
    const shadow=mesh(new T.CircleGeometry(.43,24),new T.MeshBasicMaterial({color:'#172e22',transparent:true,opacity:.12,depthWrite:false}),0,.01,0,g);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
    return {g,arms,legs,shirt,head,skinMat,hairMat};
  }
  const player=person(state.color);scene.add(player.g);player.g.position.set(state.x,.30,state.z);player.g.rotation.y=Math.PI;
  const pack=box(.4,.46,.16,'#c6a174',0,1.13,-.23,player.g);box(.28,.16,.08,'#977651',0,1.0,-.34,player.g);
  const crate=new T.Group();crate.position.set(0,1.0,.50);crate.scale.setScalar(.58);player.g.add(crate);box(1.5,.85,1.0,'#b18751',0,0,0,crate);crate.visible=state.carrying;for(let i=0;i<6;i++)ball(.19,'#efa334',(i%3-1)*.43,.49,-.25+Math.floor(i/3)*.42,crate);
  function npc(id,name,role,x,z,color,hat=false){const p=person(color,'#bd916f',hat);p.g.position.set(x,.31,z);scene.add(p.g);const n={id,name,role,x,z,type:'npc',radius:2.9,p};interactables.push(n);return n;}
  const ana=npc('ana','Ana','MORADORA · BOAS-VINDAS',-5,47,'#975b83');ana.p.g.rotation.y=.5;
  const jose=npc('jose','Seu José','FEIRANTE · SABORES DO VALE',27,-79,'#c29436',true);
  const clara=npc('clara','Clara','PADARIA · ENCOMENDAS',-39,31,'#bb6e51');
  const miguel=npc('miguel','Miguel','MORADOR · HISTÓRIAS DA PRAÇA',-3,-79,'#5c879c');
  label('Feira de ponkan',27,5,-83);label('Praça Monsenhor Celso',2,6,-25);
  for(let i=0;i<12;i++){const p=person(colorPick(['#708d9a','#bc8a64','#9da56b','#a1768c','#c4ad76']),'#bf946e',i%4===0);scene.add(p.g);walkers.push({...p,t:i/12*2*Math.PI,speed:.035+random()*.027});}
  for(const [x,z,id] of [[-25,18,0],[23,42,1],[4,-48,2]]){const g=group(x,z);const trash=box(.65,.25,.55,id%2?'#dbb35c':'#e8e3cd',0,.43,0,g);trash.rotation.y=.7;trash.rotation.z=.2;g.visible=!state.trash.includes(id);interactables.push({id:'trash'+id,trashId:id,type:'trash',name:'Recolher embalagem',x,z,radius:3.1,g});}
  function car(color){const g=new T.Group();const paint=new T.MeshStandardMaterial({color,roughness:.32,metalness:.3});
    box(1.75,.55,3.9,paint,0,.70,0,g);box(1.64,.42,2.05,'#344f5f',0,1.17,-.22,g);box(1.65,.14,1.9,paint,0,1.42,-.26,g);box(1.69,.12,1.08,paint,0,.99,1.35,g);box(1.5,.13,.12,'#3e4544',0,.48,2,g);box(1.5,.13,.12,'#3e4544',0,.48,-2,g);
    for(const x of [-.85,.85])for(const z of [-1.28,1.27]){const w=cylinder(.32,.32,.20,'#27302e',x,.37,z,g,16);w.rotation.z=Math.PI/2;const hub=cylinder(.18,.18,.215,'#c7ccc6',x,.37,z,g,10);hub.rotation.z=Math.PI/2;}
    for(const x of [-.57,.57]){box(.4,.2,.06,'#e7ebdc',x,.77,1.98,g);box(.4,.17,.06,'#a94338',x,.76,-1.98,g);box(.05,.45,.1,paint,x,1.15,.62,g);}box(.37,.14,.05,'#e4e8e4',0,.56,2.06,g);scene.add(g);return g;}
  for(let i=0;i<5;i++)cars.push({g:car(['#d8dcd7','#9b534a','#547b8b','#bdb8a8','#547765'][i]),t:i/5*424,speed:5.2+i*.35});
  for(const [x,z,r,c] of [[-29,36,0,'#ddd9cc'],[-29,-25,0,'#697e8b'],[-29,-49,0,'#c9ccbe'],[29,41,3.14,'#455668'],[29,-19,3.14,'#c3bca5'],[29,-37,3.14,'#dbdacf'],[-39,56,0,'#71807b'],[39,58,3.14,'#977169'],[10,-78,1.57,'#b9c1b5']]){const g=car(c);g.position.set(x,0,z);g.rotation.y=r;block(x,z,Math.abs(r-1.57)<.1?4:1.8,Math.abs(r-1.57)<.1?1.8:4);}
  const marker=new T.Group();scene.add(marker);const markerRing=mesh(new T.TorusGeometry(1.25,.065,6,36),'#f8c664',0,.4,0,marker);markerRing.rotation.x=Math.PI/2;const markerArrow=mesh(new T.ConeGeometry(.35,.7,4),'#ffd178',0,5,0,marker);markerArrow.rotation.z=Math.PI;
  const goalLabel=label('Ana · conversar',-12,5.3,10,true);
  let autoPath=[],moveVelocity=0;
  const adventure=window.buildAdventure(T,{scene,city,player,npc,box,cylinder,ball,group,sign,label,obstacles,mapBuildings,interactables,crate,say,toast,save,complete,updateHUD,getState:()=>state,clearRoute:()=>autoPath=[],clearKeys:()=>keys.clear()});
  level2=window.buildLevel2(T,{scene,player,npc,group,box,ball,cylinder,sign,label,say,toast,save,complete,updateHUD,interactables,getState:()=>state,clearRoute:()=>autoPath=[],setTunnelCamera:inside=>{cameraYaw=0;cameraDistance=inside?6:19;cameraMode=0;}});
  const missions=[
    {title:'Boas-vindas à praça',text:'Converse com Ana, perto do pergolado.',reward:20,target:()=>ana},
    {title:'O sabor de Cerro Azul',text:'Pegue uma caixa de ponkan com Seu José na feira.',reward:45,target:()=>state.carrying?clara:jose},
    {title:'Uma história para guardar',text:'Encontre Miguel em frente à Igreja Nossa Senhora da Guia.',reward:30,target:()=>miguel},
    {title:'Cuidar também é passear',text:'Recolha 3 embalagens espalhadas pela praça.',reward:35,target:()=>interactables.filter(o=>o.type==='trash'&&!state.trash.includes(o.trashId)).sort((a,b)=>distance(a)-distance(b))[0]||ana},
    {title:'Uma lembrança do vale',text:'Volte ao letreiro da praça e tire uma foto com F.',reward:50,target:()=>({x:-12,z:66,name:'Letreiro · fotografar'})},
    {title:'Um convite especial',text:'Volte até Ana para pegar um convite para Seu José.',reward:60,target:()=>state.invitation?jose:ana},
    ...adventure.quests,
    ...level2.quests
  ];
  function distance(o){return Math.hypot(player.g.position.x-o.x,player.g.position.z-o.z);}
  function save(){state.x=player.g.position.x;state.z=player.g.position.z;if(coopActive)return;const snapshot={...state,version:1};try{localStorage.setItem(saveKey,JSON.stringify(snapshot));}catch(e){}window.CerroOnline?.saveSolo(snapshot);}
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
  function complete(){if(coopActive)return;const m=missions[state.step];if(!m)return;state.money+=m.reward;state.step++;save();updateHUD();toast(state.step===11?'Nível 2 desbloqueado! Mais 15 missões esperam por você. + ◈ '+m.reward:state.step===missions.length?'Todas as 26 missões concluídas! + ◈ '+m.reward+'. Continue explorando.':'Missão concluída! + ◈ '+m.reward);}
  function paused(){return !started||adventure.dead||!!document.querySelector('dialog[open]')||document.hidden;}
  function openDialog(id){keys.clear();autoPath=[];$(id).showModal();}
  function closeDialog(id){$(id).close();keys.clear();$('world').focus({preventScroll:true});}
  function say(role,title,text,actions=[]){$('dialog-role').textContent=role;$('dialog-title').textContent=title;$('dialog-text').textContent=text;$('dialog-actions').replaceChildren();for(const a of actions){const b=document.createElement('button');b.type='button';b.className=a.secondary?'secondary':'primary';b.textContent=a.label;b.onclick=()=>{closeDialog('conversation');a.action();};$('dialog-actions').appendChild(b);}openDialog('conversation');}
  function interact(){if(paused()||!near)return;const n=near;if(window.CerroOnline?.interact(n))return;if(level2.handle(n))return;if(n.type==='animal'){n.phase=-elapsed*.35-Math.PI/2;toast(n.name.split(' · ')[0]+(n.kind==='cat'?' ronrona e recebe seu carinho.':' abana o rabo e recebe seu carinho.'));return;}if(adventure.handle(n))return;
    if(n.type==='bench'){state.energy=100;save();updateHUD();toast('Uma pausa na praça. Energia recuperada!');return;}
    if(n.type==='trash'){
      if(state.step!==3){toast('Você poderá ajudar a cuidar da praça após conversar com Miguel.');return;}
      if(!state.trash.includes(n.trashId)){state.trash.push(n.trashId);n.g.visible=false;toast('Praça mais limpa: '+state.trash.length+' de 3 embalagens.');if(state.trash.length===3)complete();save();}return;
    }
    if(n.id==='ana'){
      if(state.step===0)say(n.role,'Bem-vindo, '+state.name+'!','A praça é um bom lugar para começar. Que tal conhecer a feira? Seu José está precisando de uma mão com uma entrega de ponkan.',[{label:'Vamos conhecer a cidade · + ◈ 20',action:complete}]);
      else if(state.step===5&&!state.invitation)say(n.role,'Um convite para Seu José','Vamos reunir os vizinhos para um piquenique na praça! Você pode levar este convite ao Seu José, na feira de ponkan?', [{label:'Guardar o convite na mochila',action:()=>{state.invitation=true;save();updateHUD();toast('Convite na mochila! Entregue ao Seu José na feira.');}}]);
      else if(state.step===5)say(n.role,'O convite está com você!','Seu José está na feira de ponkan. Entregue o convite para ele usando E; o marcador dourado mostra o caminho.');
      else if(state.step>=missions.length)say(n.role,'Obrigada pelo carinho!','Seu José recebeu o convite. Agora todo mundo pode combinar um encontro na praça. Aproveite o resto do passeio!');
      else say(n.role,'A praça é de todos.','Passe pela igreja, encontre o pessoal da feira e aproveite o passeio. Os bancos da praça são ótimos para recuperar o fôlego.');
    }else if(n.id==='jose'){
      const actions=[];
      if(state.step===1&&!state.carrying)actions.push({label:'Pegar a caixa para Clara',action:()=>{state.carrying=true;crate.visible=true;save();updateHUD();toast('Leve a caixa de ponkan até Clara, na padaria.');}});
      if(state.step===5&&state.invitation)actions.push({label:'Entregar o convite · + ◈ 60',action:()=>{state.invitation=false;complete();}});
      actions.push({label:'Tomar suco · ◈ 10',secondary:actions.length>0,action:()=>{if(state.money<10){toast('Você precisa de ◈ 10. Descansar nos bancos é grátis.');return;}state.money-=10;state.energy=100;save();updateHUD();toast('Suco fresco de ponkan. Energia completa!');}});
      say(n.role,state.step===5&&state.invitation?'Um encontro na praça!':'Ponkan fresquinha!',state.step===5&&state.invitation?'A Ana mandou um convite? Que alegria! Vou combinar com ela e levar ponkan para o pessoal. Obrigado por trazer o recado.':state.carrying?'A Clara está esperando a encomenda na calçada da padaria. Siga o marcador dourado.':'Tem fruta e conversa boa por aqui! Você pode me ajudar com uma entrega ou tomar um suco para recuperar a energia.',actions);
    }else if(n.id==='clara'){
      if(state.step===1&&state.carrying)say(n.role,'Chegou a encomenda!','Obrigada pela ajuda! Depois, passe em frente à igreja. Miguel gosta de conversar sobre o centro da cidade.',[{label:'Entregar a caixa · + ◈ 45',action:()=>{state.carrying=false;crate.visible=false;complete();}}]);
      else say(n.role,'Bom dia, vizinho!','O movimento começa cedo por aqui. Seu José tem ponkan fresquinha na feira, do outro lado da rua.');
    }else if(n.id==='miguel'){
      say(n.role,'Olhe a torre da igreja.','Esta é uma interpretação da Igreja Nossa Senhora da Guia, junto à Praça Monsenhor Celso. Repare na torre do relógio e nas ameias. As fotos reais ajudaram a criar a fachada do jogo.'+(state.step===2?' Agora, que tal ajudar a recolher três embalagens que ficaram na praça?':''),state.step===2?[{label:'Vou ajudar a cuidar da praça · + ◈ 30',action:complete}]:[]);
    }
  }
  function updateHUD(){
    $('player-name').textContent=state.name;$('avatar-icon').textContent=state.name.charAt(0).toUpperCase();$('avatar-icon').style.background=state.color;
    $('money').textContent=Math.floor(state.money)+' moedas';$('energy-value').textContent='Energia '+Math.round(state.energy)+'%';$('energy-bar').style.width=state.energy+'%';
    const h=Math.floor(state.time/60)%24,min=Math.floor(state.time%60);$('clock').textContent=String(h).padStart(2,'0')+':'+String(min).padStart(2,'0');$('day').textContent='DIA '+state.day+' · '+({primavera:'PRIMAVERA',verao:'VERÃO',outono:'OUTONO',inverno:'INVERNO'}[state.season]||'PRIMAVERA')+(state.raining?' · CHUVA':'');$('weather-icon').textContent=state.raining?'☂':h>=18||h<6?'☾':'☀';$('chapter-label').textContent=level2.helpStatus();
    adventure.hud();$('role').textContent=state.inTunnel?'Explorador do túnel':state.delivery?'Entregador do vale':state.step>=11?'Explorador · nível 2':state.invitation?'Convite na mochila':'Explorador do vale';$('mission-progress').style.width=((state.step<11?state.step/11:(state.step-11)/15)*100)+'%';
    const total=state.step<11?'11':'15';
    if(state.step<missions.length){const m=missions[state.step],target=m.target();$('mission-title').textContent=m.title;$('mission-text').textContent=state.step===1&&state.carrying?'Leve a caixa de ponkan até Clara, na padaria.':state.step===3?'Recolha as embalagens na praça: '+state.trash.length+' de 3.':state.step===5&&state.invitation?'Entregue o convite de Ana ao Seu José, na feira.':m.text;$('mission-count').textContent=String(state.step<11?state.step+1:state.step-10).padStart(2,'0')+' / '+total;$('mission-reward').textContent='+ ◈ '+m.reward;$('mission-distance').textContent='◎ '+Math.round(distance(target))+' m';marker.position.set(target.x,0,target.z);marker.visible=true;goalLabel.pos.set(target.x,3.65,target.z);goalLabel.el.textContent=target.name?target.name+(target.type==='npc'?' · conversar':''):'Recolher embalagem';}
    else{$('mission-title').textContent='A cidade também é sua.';$('mission-text').textContent='Você concluiu as '+missions.length+' missões! Explore, fotografe e aproveite o passeio.';$('mission-count').textContent='15 / 15';$('mission-reward').textContent='PASSEIO LIVRE';$('mission-distance').textContent='✓ Tudo concluído';marker.visible=false;goalLabel.el.hidden=true;}
    $('place-label').textContent=player.g.position.z<-76&&player.g.position.x<16?'Igreja Nossa Senhora da Guia':player.g.position.z<-76&&player.g.position.x>=16?'Feira · Praça Monsenhor Celso':Math.abs(player.g.position.x)<28&&Math.abs(player.g.position.z)<68?'Praça Monsenhor Celso':player.g.position.x<-28?'Rua Carlos Gomes':player.g.position.x>28?'Av. Getúlio Vargas':'Centro de Cerro Azul';
  }
  function takePhoto(){if(paused())return;renderer.render(scene,camera);const photo=document.createElement('canvas');photo.width=renderer.domElement.width;photo.height=renderer.domElement.height;const c=photo.getContext('2d');c.drawImage(renderer.domElement,0,0);const s=Math.max(1,photo.width/1400);c.fillStyle='#163e35d9';c.fillRect(0,photo.height-77*s,photo.width,77*s);c.fillStyle='#fff5db';c.font='bold '+24*s+'px sans-serif';c.fillText('Cerro Azul Viva',28*s,photo.height-38*s);c.font=13*s+'px sans-serif';c.fillText('Meu passeio no Vale do Ribeira · cenário do jogo',28*s,photo.height-16*s);const url=photo.toDataURL('image/png');$('photo-image').src=url;$('photo-download').href=url;state.photos++;if(coopActive)window.CerroOnline?.act('photo');else if(state.step===4&&distance({x:-12,z:66})<14)complete();else if(state.step===4)toast('Para concluir, fotografe perto do marcador da praça.');save();openDialog('photo-dialog');}
  function setCamera(){cameraMode=(cameraMode+1)%3;cameraDistance=[19,43,100][cameraMode];toast(['Câmera do personagem','Vista da praça','Panorama do centro'][cameraMode]);}
  function toggleMap(){const expanded=document.querySelector('.map-panel').classList.toggle('expanded');$('map-toggle').setAttribute('aria-expanded',String(expanded));}
  $('welcome-form').addEventListener('submit',e=>{e.preventDefault();state.name=$('name').value.trim().slice(0,20)||'Visitante';state.color=selectedColor;player.shirt.color.set(selectedColor);started=true;closeDialog('welcome');save();updateHUD();toast('Bem-vindo! Use WASD para caminhar e E para conversar.');});
  document.querySelectorAll('#swatches button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.color===selectedColor));b.onclick=()=>{selectedColor=b.dataset.color;document.querySelectorAll('#swatches button').forEach(s=>s.setAttribute('aria-pressed',String(s===b)));player.shirt.color.set(selectedColor);};});
  $('dialog-close').onclick=()=>closeDialog('conversation');$('pause').onclick=()=>{if(started&&!paused()){save();openDialog('pause-dialog');}};$('resume').onclick=()=>closeDialog('pause-dialog');
  $('help').onclick=()=>openDialog('help-dialog');$('help-close').onclick=()=>closeDialog('help-dialog');$('pause-help').onclick=()=>openDialog('help-dialog');
  $('restart').onclick=()=>{if(coopActive){toast('Saia do grupo para recomeçar sua partida individual.');return;}closeDialog('pause-dialog');say('NOVO PASSEIO','Recomeçar do início?','Isso apaga o progresso salvo neste navegador e reinicia as '+missions.length+' missões.',[{label:'Sim, começar novamente',action:()=>{state=defaults();player.g.position.set(0,.31,65);save();location.reload();}}]);};
  $('photo-close').onclick=()=>closeDialog('photo-dialog');$('camera').onclick=setCamera;$('photo').onclick=takePhoto;$('map-toggle').onclick=toggleMap;$('interact-touch').onclick=interact;
  function jump(){if(!paused()&&state.transport==='walk'&&jumpHeight===0){jumpVelocity=6;}}
  $('touch-jump').onclick=jump;$('transport').onclick=()=>{if(!paused())adventure.transportMenu();};
  for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!paused())keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);}
  addEventListener('keydown',e=>{
    if(e.target instanceof HTMLInputElement)return;if(typeof e.key!=='string')return;const key=e.key.toLowerCase();
    if(!paused()&&[' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
    if(e.repeat)return;
    if(key==='p'){if($('pause-dialog').open)closeDialog('pause-dialog');else if(started&&!paused()){save();openDialog('pause-dialog');}return;}
    if(paused())return;keys.add(key);if(key==='e')interact();if(key===' ')jump();if(key==='c')setCamera();if(key==='m')toggleMap();if(key==='f')takePhoto();if(key==='v')adventure.setTransport(state.transport==='bike'?'walk':'bike');if(key==='r')toggleRain();
  });
  addEventListener('keyup',e=>{if(typeof e.key!=='string')return;keys.delete(e.key.toLowerCase());});addEventListener('blur',()=>{keys.clear();save();});addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden)save();});
  $('welcome').addEventListener('cancel',e=>e.preventDefault());
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>keys.clear()));
  // Click-to-walk uses an obstacle-aware route; a drag remains camera orbit.
  const groundRay=new T.Raycaster(),groundPlane=new T.Plane(new T.Vector3(0,1,0),-.31),groundPoint=new T.Vector3();
  function planRoute(tx,tz){const step=1.5,N=191,toCell=v=>clamp(Math.round((v+142.5)/step),0,N-1),toWorld=v=>v*step-142.5;
    if(collides(tx,tz)||Math.abs(tx)>142||Math.abs(tz)>142)return [];
    const sx=toCell(player.g.position.x),sz=toCell(player.g.position.z),gx=toCell(tx),gz=toCell(tz),key=(x,z)=>x*N+z,start=key(sx,sz),goal=key(gx,gz),open=[{x:sx,z:sz,id:start,g:0,f:0}],cost=new Map([[start,0]]),prev=new Map(),closed=new Set();let found=false;
    while(open.length&&closed.size<14000){open.sort((a,b)=>b.f-a.f);const n=open.pop();if(closed.has(n.id))continue;if(n.id===goal){found=true;break;}closed.add(n.id);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=n.x+dx,z=n.z+dz,id=key(x,z);if(x<0||z<0||x>=N||z>=N||closed.has(id)||collides(toWorld(x),toWorld(z),.62))continue;if(dx&&dz&&(collides(toWorld(n.x+dx),toWorld(n.z),.62)||collides(toWorld(n.x),toWorld(n.z+dz),.62)))continue;const g=n.g+(dx&&dz?1.414:1);if(g>=(cost.get(id)??Infinity))continue;cost.set(id,g);prev.set(id,n.id);open.push({x,z,id,g,f:g+Math.hypot(gx-x,gz-z)});}}
    if(!found)return [];const route=[{x:tx,z:tz}];let k=goal;while(k!==start&&prev.has(k)){route.unshift({x:toWorld(Math.floor(k/N)),z:toWorld(k%N)});k=prev.get(k);}return route;
  }
  let drag=null;$('world').addEventListener('pointerdown',e=>{if(paused())return;drag={x:e.clientX,startX:e.clientX,startY:e.clientY,id:e.pointerId,moved:false};$('world').setPointerCapture(e.pointerId);});
  $('world').addEventListener('pointermove',e=>{if(!drag||paused())return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;if(drag.moved)cameraYaw-=(e.clientX-drag.x)*.006;drag.x=e.clientX;});
  $('world').addEventListener('pointerup',e=>{if(drag&&!drag.moved&&!paused()){groundRay.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);if(groundRay.ray.intersectPlane(groundPlane,groundPoint)){autoPath=planRoute(groundPoint.x,groundPoint.z);if(!autoPath.length)toast('Escolha um ponto livre no chão para caminhar.');}}drag=null;});$('world').addEventListener('pointercancel',()=>drag=null);
  $('world').addEventListener('wheel',e=>{e.preventDefault();if(!paused())cameraDistance=clamp(cameraDistance+e.deltaY*.022,8,115);},{passive:false});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  function animatePerson(p,moving,time){const swing=moving?Math.sin(time*9)*.63:0;p.legs[0].rotation.x=swing;p.legs[1].rotation.x=-swing;p.arms[0].rotation.x=-swing*.7;p.arms[1].rotation.x=swing*.7;}
  function updatePlayer(dt){const before=player.g.position.clone();let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const manual=x!==0||z!==0;let dx=0,dz=0,running=false;
    if(manual){autoPath=[];const len=Math.hypot(x,z);x/=len;z/=len;dx=x*Math.cos(cameraYaw)+z*Math.sin(cameraYaw);dz=z*Math.cos(cameraYaw)-x*Math.sin(cameraYaw);}else if(autoPath.length){let p=autoPath[0],d=Math.hypot(p.x-player.g.position.x,p.z-player.g.position.z);if(d<.42){autoPath.shift();p=autoPath[0];}if(p){d=Math.hypot(p.x-player.g.position.x,p.z-player.g.position.z);dx=(p.x-player.g.position.x)/Math.max(d,.001);dz=(p.z-player.g.position.z)/Math.max(d,.001);}}
    const moving=dx!==0||dz!==0;running=moving&&keys.has('shift')&&state.energy>4&&!state.carrying&&state.transport==='walk';const desired=moving?(state.transport==='bike'?11:running?8:state.carrying?3.6:4.9):0;moveVelocity+=(desired-moveVelocity)*Math.min(1,dt*9);
    if(moving){const speed=Math.min(moveVelocity,autoPath.length?Math.hypot(autoPath[0].x-player.g.position.x,autoPath[0].z-player.g.position.z)/Math.max(dt,.001):moveVelocity),px=clamp(player.g.position.x+dx*speed*dt,-142,142),pz=clamp(player.g.position.z+dz*speed*dt,-142,142);if(!collides(px,player.g.position.z))player.g.position.x=px;if(!collides(player.g.position.x,pz))player.g.position.z=pz;const angle=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-player.g.rotation.y),Math.cos(angle-player.g.rotation.y));player.g.rotation.y+=delta*Math.min(1,dt*12);state.energy=clamp(state.energy+(running?-6:.3)*dt,0,100);}else state.energy=clamp(state.energy+2*dt,0,100);
    if(jumpVelocity!==0||jumpHeight>0){jumpVelocity-=18*dt;jumpHeight+=jumpVelocity*dt;if(jumpHeight<=0){jumpHeight=0;jumpVelocity=0;}}player.g.position.y=.31+jumpHeight;animatePerson(player,moving,elapsed*(running?1.35:.85));if(state.carrying){player.arms[0].rotation.x=-1;player.arms[1].rotation.x=-1;}
    near=interactables.filter(o=>!!o.tunnel===!!state.inTunnel&&!(o.type==='trash'&&state.trash.includes(o.trashId))&&distance(o)<o.radius).sort((a,b)=>distance(a)-distance(b))[0]||null;$('interaction').hidden=!near;if(near)$('interaction-label').textContent=near.type==='npc'?'Conversar com '+near.name:near.name;
    adventure.update(dt,Math.hypot(player.g.position.x-before.x,player.g.position.z-before.z));
  }
  const crossings=[{x:14,z:-73,t:47},{x:33,z:53,t:192},{x:-17,z:73,t:262},{x:-33,z:-60,t:411}];
  function isOnCrossing(p,c){return Math.abs(p.x-c.x)<4.2&&Math.abs(p.z-c.z)<4.2;}
  function carPose(c){const t=c.t;if(t<66){c.g.position.set(-33+t,0,-73);c.g.rotation.y=Math.PI/2;}else if(t<212){c.g.position.set(33,0,-73+t-66);c.g.rotation.y=0;}else if(t<278){c.g.position.set(33-(t-212),0,73);c.g.rotation.y=-Math.PI/2;}else{c.g.position.set(-33,0,73-(t-278));c.g.rotation.y=Math.PI;}}
  function updateTraffic(dt){const p=player.g.position;for(const c of cars){let travel=c.speed*dt;c.stopped=false;for(const crossing of crossings){const ahead=(crossing.t-c.t+424)%424;const phase=elapsed%24,red=phase>=14;if((red||isOnCrossing(p,crossing))&&ahead<12&&ahead>0){travel=Math.min(travel,Math.max(0,ahead-6));c.stopped=travel===0;}}
      c.t=(c.t+travel)%424;carPose(c);const dx=p.x-c.g.position.x,dz=p.z-c.g.position.z,cos=Math.cos(c.g.rotation.y),sin=Math.sin(c.g.rotation.y),localX=dx*cos-dz*sin,localZ=dx*sin+dz*cos;if(travel>0&&Math.abs(localX)<1.15&&Math.abs(localZ)<2.35&&jumpHeight<1.5)adventure.damage(50);
    }}
  function updateNPCs(dt){for(const w of walkers){w.t+=w.speed*dt;const t=(w.t/(Math.PI*2)*360)%360;let x,z;if(t<128){x=-26;z=65-t;w.g.rotation.y=Math.PI;}else if(t<180){x=-26+t-128;z=-63;w.g.rotation.y=Math.PI/2;}else if(t<308){x=26;z=-63+t-180;w.g.rotation.y=0;}else{x=26-(t-308);z=65;w.g.rotation.y=-Math.PI/2;}w.g.position.set(x,.31,z);animatePerson(w,true,elapsed*.75);}
    updateTraffic(dt);
  }
  const dayColor=new T.Color('#99c5df'),nightColor=new T.Color('#324c69');
  function updateDay(dt){state.time+=dt*.65;if(state.time>=1440){state.time-=1440;state.day++;if(state.step<20||state.step>=24){const seasons=['primavera','verao','outono','inverno'];state.season=seasons[(seasons.indexOf(state.season)+1)%4];}}const day=clamp(Math.sin((state.time-360)/720*Math.PI)*1.8+.15,0,1);scene.background.copy(nightColor).lerp(dayColor,day);scene.fog.color.copy(scene.background);sun.intensity=(.2+day*2.9)*(state.raining?.68:1);hemi.intensity=.65+day*.9;lamps.forEach(m=>m.emissiveIntensity=.2+(1-day)*2.5);}
  function toggleRain(){state.rainManual=!(state.rainManual??(Math.floor(state.time/35)%3===0));state.raining=state.rainManual;city.setSeason(state.season,state.raining&&!state.inTunnel,player.g.position);save();updateHUD();toast(state.raining?'Chuva na praça. As pedras escureceram.':'A chuva parou.');}
  $('weather').onclick=()=>{if(!paused())toggleRain();};
  const map=$('minimap'),ctx=map.getContext('2d');
  function drawMap(){const w=map.width,h=map.height;ctx.clearRect(0,0,w,h);if(state.inTunnel){ctx.fillStyle='#263834';ctx.fillRect(0,0,w,h);ctx.fillStyle='#96a29a';ctx.fillRect(w/2-12,15,24,h-30);ctx.fillStyle='#f2d18d';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('TÚNEL',w/2,18);ctx.fillStyle='#eab36f';ctx.fillText('SAÍDA ↑',w/2,48);ctx.fillText('MATEUS ↓',w/2,h-15);ctx.fillStyle='#80d8de';ctx.beginPath();ctx.arc(w/2,h/2+player.g.position.z*2,5,0,Math.PI*2);ctx.fill();return;}ctx.fillStyle='#273d3e';ctx.fillRect(0,0,w,h);const scale=.82,ox=w/2,oy=h*.58;const mx=x=>ox+x*scale,mz=z=>oy+z*scale;ctx.fillStyle='#617275';for(const x of [-33,33])ctx.fillRect(mx(x)-4,0,8,h);ctx.fillRect(mx(-95)-4,0,8,mz(38));ctx.fillRect(mx(95)-4,mz(-55),8,h-mz(-55));for(const z of [-73,73])ctx.fillRect(0,mz(z)-4,w,8);ctx.fillRect(0,mz(-135)-4,mx(18),8);ctx.fillRect(0,mz(135)-4,mx(-6),8);ctx.fillRect(mx(30),mz(-73)-4,w-mx(30),8);if(city.waterways){ctx.save();ctx.strokeStyle='#48b9df';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=5;for(const water of city.waterways){ctx.beginPath();water.forEach(([x,z],i)=>i?ctx.lineTo(mx(x),mz(z)):ctx.moveTo(mx(x),mz(z)));ctx.stroke();}ctx.restore();}ctx.fillStyle='#a9aea0';ctx.fillRect(mx(-28),mz(-66),56*scale,132*scale);
    for(const points of city.lawns){ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(mx(x),mz(z)):ctx.moveTo(mx(x),mz(z)));ctx.closePath();ctx.fillStyle='#648355';ctx.fill();}ctx.beginPath();city.basinPoints.forEach(([x,z],i)=>i?ctx.lineTo(mx(x),mz(z)):ctx.moveTo(mx(x),mz(z)));ctx.closePath();ctx.fillStyle='#59b5d0';ctx.fill();ctx.fillStyle='#b75e55';ctx.fillRect(mx(-23),mz(-12),15*scale,24*scale);
    for(const b of mapBuildings){ctx.fillStyle=b.color;ctx.fillRect(mx(b.x-b.w/2),mz(b.z-b.d/2),b.w*scale,b.d*scale);}
    ctx.fillStyle='#eff0e4';ctx.font='600 10px sans-serif';ctx.textAlign='center';ctx.fillText('IGREJA',mx(-3),mz(-101));ctx.fillText('PRAÇA',mx(0),mz(27));ctx.font='600 8px sans-serif';ctx.fillText('MAL. FLORIANO PEIXOTO',mx(-55),mz(-77));ctx.save();ctx.translate(mx(-37),mz(8));ctx.rotate(-Math.PI/2);ctx.fillText('R. CARLOS GOMES',0,0);ctx.restore();ctx.save();ctx.translate(mx(37),mz(8));ctx.rotate(-Math.PI/2);ctx.fillText('AV. GETÚLIO VARGAS',0,0);ctx.restore();
    if(state.step<missions.length){const t=missions[state.step].target();ctx.fillStyle='#ffcd69';ctx.beginPath();ctx.arc(mx(t.x),mz(t.z),4.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8dc';ctx.lineWidth=2;ctx.stroke();}
    if(state.delivery){const t=adventure.deliveryTarget();ctx.fillStyle='#79d7e7';ctx.beginPath();ctx.arc(mx(t.x),mz(t.z),4,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(mx(player.g.position.x),mz(player.g.position.z));ctx.rotate(-player.g.rotation.y);ctx.fillStyle='#7ddedc';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  const temp=new T.Vector3();function updateLabels(){for(const l of labels){if(l.forceHidden||(state.inTunnel&&!l.target&&!l.remote)){l.el.hidden=true;continue;}if(l===goalLabel&&state.step>=missions.length){l.el.hidden=true;continue;}const d=player.g.position.distanceTo(l.pos);temp.copy(l.pos).project(camera);const visible=d<(l.target?100:60)&&temp.z<1&&temp.z>-1&&Math.abs(temp.x)<.95&&Math.abs(temp.y)<.85;l.el.hidden=!visible;if(visible){l.el.style.left=((temp.x*.5+.5)*innerWidth)+'px';l.el.style.top=((-temp.y*.5+.5)*innerHeight)+'px';}}}
  const cameraRay=new T.Ray(),cameraBox=new T.Box3(),cameraHit=new T.Vector3();
  function updateCamera(dt){const viewDistance=state.inTunnel?5:cameraDistance,height=state.inTunnel?.48:[.47,.82,1.3][cameraMode],look=new T.Vector3(player.g.position.x,1.65,player.g.position.z-2.6);const target=new T.Vector3(player.g.position.x+Math.sin(cameraYaw)*viewDistance,player.g.position.y+viewDistance*height,player.g.position.z+Math.cos(cameraYaw)*viewDistance);
    cameraRay.origin.copy(look);cameraRay.direction.copy(target).sub(look).normalize();let reach=look.distanceTo(target);
    for(const b of mapBuildings){cameraBox.min.set(b.x-b.w/2-.6,0,b.z-b.d/2-.6);cameraBox.max.set(b.x+b.w/2+.6,b.h||14,b.z+b.d/2+.6);if(cameraRay.intersectBox(cameraBox,cameraHit)){const d=look.distanceTo(cameraHit)-.6;if(d>2&&d<reach)reach=d;}}
    target.copy(look).addScaledVector(cameraRay.direction,reach);camera.position.lerp(target,1-Math.exp(-dt*8));camera.lookAt(look);}
  if(collides(player.g.position.x,player.g.position.z))player.g.position.set(0,.31,65);
  camera.position.set(state.x+Math.sin(cameraYaw)*cameraDistance,10,state.z+Math.cos(cameraYaw)*cameraDistance);camera.lookAt(player.g.position.x,2,player.g.position.z-2);
  let last=performance.now();
  function tick(now){const dt=Math.min((now-last)/1000,.045);last=now;frame++;if(started&&!document.hidden)adventure.updateDeath(dt);if(!paused()){elapsed+=dt;level2.update(dt,elapsed);state.raining=state.rainManual??(Math.floor(state.time/35)%3===0);if(frame%90===0)city.setSeason(state.season,state.raining&&!state.inTunnel,player.g.position);city.update(elapsed,dt,collides);updatePlayer(dt);if(!state.inTunnel)updateNPCs(dt);updateDay(dt);if(elapsed-lastSave>5){save();lastSave=elapsed;}}updateCamera(dt);window.gameOnline?.tick(dt,now/1000);markerArrow.position.y=3.2+Math.sin(now*.003)*.35;markerArrow.rotation.y=now*.0007;if(frame%6===0){updateHUD();drawMap();updateLabels();}renderer.render(scene,camera);requestAnimationFrame(tick);}
  if(window.installOnlineBridge)window.gameOnline=window.installOnlineBridge(T,{scene,player,person,label,labels,interactables,unitBox,animatePerson,adventure,level2,getState:()=>state,setState:v=>state=v,defaults,setCoop:v=>coopActive=v,setSaveKey:v=>saveKey=v||SAVE,saveKey:SAVE,save,updateHUD,toast,clearInput:()=>{keys.clear();autoPath=[];},started:()=>started,start:()=>{started=true;if($('welcome').open)closeDialog('welcome');},syncWorld:()=>{for(const n of interactables)if(n.type==='trash')n.g.visible=!state.inTunnel&&!state.trash.includes(n.trashId);adventure.sync();level2.sync();crate.visible=state.carrying||!!state.delivery;updateHUD();}});
  updateHUD();drawMap();$('loading').hidden=true;openDialog('welcome');requestAnimationFrame(tick);
})();
