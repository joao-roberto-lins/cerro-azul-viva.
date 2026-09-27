/* Second chapter: fifteen playable quests, seasonal visits, market, children and the hidden tunnel. */
window.buildLevel2=function(T,a){
  const {scene,player,npc,group,box,ball,cylinder,sign,label,say,toast,save,complete,updateHUD,interactables}=a;
  const s=()=>a.getState(),$=id=>document.getElementById(id);
  const defaults=()=>({picnicReady:false,picnicPrepared:false,invited:[],basket:false,served:[],groceries:[],vegDelivered:false,bileFound:false,ballFound:false,ballReturned:false,signalChecked:false,spring:false,summer:false,autumn:false,winter:false,clues:[],passageOpen:false,rescued:false});
  s().chapter2={...defaults(),...(s().chapter2||{})};for(const k of ['invited','served','groceries','clues'])if(!Array.isArray(s().chapter2[k]))s().chapter2[k]=[];
  s().season=['primavera','verao','outono','inverno'].includes(s().season)?s().season:'primavera';s().inTunnel=s().inTunnel===true;s().rainManual=typeof s().rainManual==='boolean'?s().rainManual:null;
  const q=()=>s().chapter2,at=n=>s().step===n,uniq=(key,id)=>{if(!q()[key].includes(id))q()[key].push(id);save();updateHUD();};
  const produce=npc('davi','Davi','FEIRA · LEGUMES',43,-112,'#669260',true);
  const market=npc('mercado','Nina','MERCADO · ALIMENTOS',39,44,'#b47b58');
  const grocer=npc('hortifruti','Olívia','HORTIFRÚTI · LEGUMES',38,-17,'#68875b');
  label('Mercado de Nina',39,4.7,44);label('Hortifruti de Olívia',38,4.7,-17);
  function stand(x,z,title,color){const g=group(x,z);box(4.5,1.2,2,color,0,.8,0,g);for(const xx of [-2,2])box(.12,2.3,.12,'#5b5140',xx,2,0,g);box(5.1,.15,3.2,'#ded0a8',0,3,0,g);const b=sign(title,4.4,.65,'#385b4d','#fff6da');b.position.set(0,2.47,1.7);g.add(b);for(let i=0;i<12;i++)ball(.2,i%3?'#edae48':'#78a85b',-1.7+i%6*.65,1.52,Math.floor(i/6)*.6-.3,g);}
  stand(39,49,'MERCADO', '#668494');stand(38,-22,'HORTIFRÚTI','#71885b');
  // Picnic blanket: interaction is only offered when the second chapter begins.
  const blanket=group(5,37);box(4.4,.05,3.6,'#c45f50',0,.32,0,blanket);for(let i=-2;i<=2;i++)box(.21,.015,3.7,'#e8d7a8',i*.85,.36,0,blanket);box(1.3,.75,.9,'#ae8551',1,.7,0,blanket);for(let i=0;i<5;i++)ball(.19,'#e6ad4b',.35+i*.31,1.05,0,blanket);
  const picnic={id:'picnic-spot',type:'level2',name:'Preparar o piquenique',x:5,z:37,radius:2.6};interactables.push(picnic);
  const child1=npc('caio','Caio','CRIANÇA · JOGANDO BOLA',9,16,'#eab347');const child2=npc('luna','Luna','CRIANÇA · JOGANDO BOLA',14,16,'#688fbb');
  child1.p.g.scale.setScalar(.69);child2.p.g.scale.setScalar(.69);
  const playBall=group(11.4,15.6);ball(.28,'#f6e9d7',0,.3,0,playBall);for(let i=0;i<6;i++){const spot=ball(.07,'#4b728a',Math.cos(i*1.05)*.19,.3+Math.sin(i*1.05)*.14,.2,playBall);spot.castShadow=false;}
  const lostBall=group(23,-31);ball(.35,'#f6eed9',0,.5,0,lostBall);for(let i=0;i<5;i++)ball(.09,'#678fac',Math.cos(i*1.25)*.2,.5,Math.sin(i*1.25)*.2,lostBall);
  const ballItem={id:'lost-ball',type:'level2',name:'Pegar a bola das crianças',x:23,z:-31,radius:2.6};interactables.push(ballItem);lostBall.visible=!q().ballFound;
  const talk1=label('Caio: Vamos jogar!',9,3.1,16),talk2=label('Luna: Passa a bola!',14,3.1,16);talk1.el.classList.add('conversation');talk2.el.classList.add('conversation');
  const signal={id:'signal-crossing',type:'level2',name:'Observar o semáforo',x:-22,z:68,radius:3};interactables.push(signal);
  // A covered service hatch is behind the large vegetable stall.
  const portal=group(51,-127);box(5.5,.48,2.8,'#6e746c',0,.3,0,portal);box(5.1,.08,2.4,'#303f42',0,.59,0,portal);for(const xx of [-2.7,2.7])box(.16,1.3,2.8,'#7b8f84',xx,.78,0,portal);const arrow=sign('PASSAGEM',4.7,.6,'#284348','#f0d28c');arrow.position.set(0,2.3,1.5);portal.add(arrow);
  const entrance={id:'secret-entrance',type:'level2',name:'Passagem secreta',x:51,z:-124,radius:3.3};interactables.push(entrance);
  const tunnel=new T.Group();scene.add(tunnel);tunnel.visible=s().inTunnel;
  function tb(w,h,d,c,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.92}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;tunnel.add(m);return m;}
  tb(10,.3,41,'#777f79',0,.06,-16);for(const xx of [-5,5])tb(.55,7,41,'#495853',xx,3.5,-16);tb(10,.6,41,'#3f4c49',0,7,-16);tb(10,7,.5,'#52635b',0,3.5,-36);
  for(const z of [-2,-10,-18,-26,-34]){tb(9,.12,.18,'#8b9c89',0,6.5,z);for(const x of [-4.3,4.3])tb(.25,6,.25,'#677569',x,3.1,z);const light=new T.PointLight('#ffe4aa',2.2,14);light.position.set(0,5.5,z);tunnel.add(light);const bulb=new T.Mesh(new T.SphereGeometry(.19,10,8),new T.MeshBasicMaterial({color:'#ffe3a0'}));bulb.position.copy(light.position);tunnel.add(bulb);}
  const trapped=npc('rescue','Mateus','MORADOR · PRECISA DE AJUDA',0,-31,'#9e7162');trapped.tunnel=true;trapped.p.g.visible=s().inTunnel&&!q().rescued;
  const tunnelExit={id:'tunnel-exit',type:'level2',name:'Voltar à feira',x:0,z:2.2,radius:2.1,tunnel:true};interactables.push(tunnelExit);
  const outside=scene.children.filter(o=>o!==tunnel&&o!==player.g&&!o.isLight&&o!==trapped.p.g);
  if(s().inTunnel)outside.forEach(o=>o.visible=false);
  function setInside(value){s().inTunnel=value;tunnel.visible=value;outside.forEach(o=>o.visible=!value);trapped.p.g.visible=value&&!q().rescued;player.g.position.set(value?0:51,.31,value?0:-123);a.setTunnelCamera(value);a.clearRoute();save();updateHUD();toast(value?'Você encontrou o túnel. Siga até Mateus.':'Você voltou à feira de legumes.');}
  function buy(item,price,fill){if(s().money<price){toast('Faltam '+(price-s().money)+' moedas. Faça uma entrega com Ivo.');return;}s().money-=price;s().hunger=Math.min(100,s().hunger+fill);if(s().hunger===100)s().fullFor=40;uniq('groceries',item);toast(item+' comprado. Alimentação: '+s().hunger+'%.');if(at(14)&&q().groceries.includes('Pão')&&q().groceries.includes('Legumes'))complete();if(at(23)&&item==='Sopa quente')complete();save();updateHUD();}
  function marketTalk(n){if(s().step<11){say(n.role,'Mercado do centro','Volte depois das 11 primeiras missões: novos produtos e tarefas estarão disponíveis.');return true;}const menu=n.id==='mercado'?[['Pão',15,25],['Leite',12,18],['Sopa quente',20,48]]:[['Legumes',18,30],['Frutas',14,26],['Sopa quente',20,48]];say(n.role,n.id==='mercado'?'Mercado de Nina':'Hortifruti de Olívia','Escolha um alimento. A compra usa as moedas que você ganhou nas missões e nas entregas.',menu.map(([name,price,fill])=>({label:name+' · '+price+' moedas · +'+fill+'% alimentação',action:()=>buy(name,price,fill)})));return true;}
  function action(role,title,message,labelText,fn){say(role,title,message,[{label:labelText,action:()=>{fn();save();updateHUD();}}]);return true;}
  function handle(n){const step=s().step,b=q();if(n.id==='mercado'||n.id==='hortifruti')return marketTalk(n);
    if(n.id==='secret-entrance'){if(step<24&&!b.passageOpen){toast('Uma tampa antiga está escondida atrás dos legumes. Talvez alguém saiba mais.');return true;}if(!b.passageOpen&&b.clues.length===3&&step===24)return action('PASSAGEM SECRETA','A tampa se abriu','As pistas de Miguel, Ivo e Davi revelaram o acesso ao túnel atrás da barraca.','Abrir a passagem',()=>{b.passageOpen=true;complete();});if(!b.passageOpen){toast('Descubra as três pistas antes de entrar.');return true;}setInside(true);return true;}
    if(n.id==='tunnel-exit'){setInside(false);return true;}
    if(n.id==='rescue'){if(step===25&&!b.rescued)return action(n.role,'Encontrei você!','Mateus ficou preso ao procurar a saída antiga. Ajude-o a voltar à feira.','Salvar Mateus e sair do túnel',()=>{b.rescued=true;setInside(false);complete();});say(n.role,'A saída está livre.','Obrigado pelo resgate!');return true;}
    if(n.id==='picnic-spot'&&at(11)&&b.picnicReady&&!b.picnicPrepared)return action('PIQUENIQUE','Um lugar para todos','Estenda a toalha e organize a mesa para os vizinhos.','Preparar o espaço',()=>{b.picnicPrepared=true;complete();});
    if(n.id==='ana'&&at(11)&&!b.picnicReady)return action(n.role,'Vamos preparar o piquenique','A toalha está perto dos bancos. Coloque-a no espaço marcado para começarmos.','Pegar a toalha',()=>{b.picnicReady=true;toast('Agora prepare o espaço do piquenique.');});
    if(at(12)&&['clara','miguel','rita'].includes(n.id)){if(b.invited.includes(n.id))return action(n.role,'Convite recebido','Estarei no piquenique!','Continuar',()=>{});return action(n.role,'Convite para o piquenique','Que bom reunir os moradores! Conte comigo.','Convidar '+n.name,()=>{uniq('invited',n.id);if(b.invited.length===3)complete();});}
    if(at(13)&&n.id==='rita'&&!b.basket)return action(n.role,'A cesta está pronta','Rita separou refeições para Ana, Bia e Caio.','Pegar as refeições',()=>{b.basket=true;});
    if(at(13)&&b.basket&&['ana','bia','caio'].includes(n.id)){if(b.served.includes(n.id))return action(n.role,'Obrigado!','Minha refeição já chegou.','Continuar',()=>{});return action(n.role,'Hora de compartilhar','Uma refeição para o nosso piquenique.','Entregar refeição',()=>{uniq('served',n.id);if(b.served.length===3)complete();});}
    if(at(15)&&n.id==='lurdes'){if(!b.groceries.includes('Legumes'))return action(n.role,'Ainda falta a cesta','Compre legumes no hortifruti de Olívia.','Entendi',()=>{});return action(n.role,'Encomenda recebida','Dona Lurdes agradece a visita e os legumes frescos.','Entregar os legumes',()=>{b.vegDelivered=true;complete();});}
    if(at(16)&&n.id==='animal0')return action('BILE · CACHORRO','Bile apareceu!','Ele está passeando perto do pergolado e aceita um carinho.','Fazer carinho em Bile',()=>{b.bileFound=true;complete();});
    if(n.id==='lost-ball'){if(at(17))return action('CRIANÇAS','A bola perdida','Você encontrou a bola perto do caminho da igreja.','Pegar a bola',()=>{b.ballFound=true;lostBall.visible=false;complete();});toast('Uma bola das crianças. Você poderá devolvê-la mais adiante.');return true;}
    if(at(18)&&n.id==='caio'&&b.ballFound)return action(n.role,'Nossa bola voltou!','Caio e Luna agora podem continuar a partida.','Devolver a bola',()=>{b.ballReturned=true;complete();});
    if(n.id==='signal-crossing'){if(at(19))return action('TRÂNSITO','Atravessar com atenção','O semáforo organiza os carros junto à faixa de pedestres.','Observar o sinal e concluir',()=>{b.signalChecked=true;complete();});toast('O sinal muda de cor. Os carros param no vermelho e respeitam quem está na faixa.');return true;}
    if(at(20)&&n.id==='elisa')return action(n.role,'Primavera na praça','Flores novas aparecem nos canteiros menores.','Observar as flores',()=>{b.spring=true;complete();});
    if(at(21)&&n.id==='dito')return action(n.role,'Verão na feira','O calor traz movimento às barracas.','Conversar sobre o verão',()=>{b.summer=true;complete();});
    if(at(22)&&n.id==='miguel')return action(n.role,'Outono junto à igreja','As copas ganham tons quentes perto da torre.','Observar as árvores',()=>{b.autumn=true;complete();});
    if(at(24)&&['miguel','ivo','davi'].includes(n.id)){if(b.clues.includes(n.id))return action(n.role,'Você já tem esta pista','Procure os outros moradores indicados no mapa.','Continuar',()=>{});const lines={miguel:'Um caminho de serviço passava ao norte da praça.',ivo:'As entregas antigas seguiam pelo fundo da feira.',davi:'Há uma tampa atrás da barraca grande de legumes.'};return action(n.role,'Pista do túnel',lines[n.id],'Guardar a pista',()=>{uniq('clues',n.id);if(b.clues.length===3){toast('Três pistas! Procure a tampa atrás da barraca de legumes.');}});}
    if(['caio','luna'].includes(n.id)){say(n.role,'Vamos jogar bola?','Caio e Luna jogam juntos na praça. Eles também conversam enquanto passam a bola.');return true;}
    if(n.id==='davi'){say(n.role,'Legumes frescos','O movimento da feira é grande. Repare no fundo desta barraca quando o mapa indicar uma nova história.');return true;}
    return false;
  }
  const ana=()=>interactables.find(n=>n.id==='ana'),clara=()=>interactables.find(n=>n.id==='clara'),miguel=()=>interactables.find(n=>n.id==='miguel'),rita=()=>interactables.find(n=>n.id==='rita'),dito=()=>interactables.find(n=>n.id==='dito'),ivo=()=>interactables.find(n=>n.id==='ivo'),lurdes=()=>interactables.find(n=>n.id==='lurdes'),elisa=()=>interactables.find(n=>n.id==='elisa'),bile=()=>interactables.find(n=>n.id==='animal0');
  const firstUnmet=(ids,done)=>ids.map(id=>interactables.find(n=>n.id===id)).find(n=>!done.includes(n.id));
  const quests=[
    {title:'Nível 2 · Preparar o piquenique',text:'Converse com Ana e prepare a toalha perto dos bancos.',reward:45,target:()=>q().picnicReady?picnic:ana()},
    {title:'Nível 2 · Convidar os vizinhos',text:'Convide Clara, Miguel e Rita para o piquenique.',reward:50,target:()=>firstUnmet(['clara','miguel','rita'],q().invited)||rita()},
    {title:'Nível 2 · Repartir a comida',text:'Pegue a cesta com Rita e sirva Ana, Bia e Caio.',reward:60,target:()=>q().basket?firstUnmet(['ana','bia','caio'],q().served)||ana():rita()},
    {title:'Compras do novo bairro',text:'Compre pão no mercado de Nina e legumes com Olívia.',reward:55,target:()=>!q().groceries.includes('Pão')?market:grocer},
    {title:'Legumes para Dona Lurdes',text:'Leve os legumes do hortifruti para Dona Lurdes.',reward:55,target:()=>lurdes()},
    {title:'Encontre o cachorro Bile',text:'Ache Bile perto do pergolado e faça carinho nele.',reward:40,target:()=>bile()},
    {title:'A bola perdida',text:'Procure a bola que saiu da brincadeira das crianças.',reward:35,target:()=>ballItem},
    {title:'Devolva a bola',text:'Leve a bola de volta para Caio e Luna.',reward:40,target:()=>child1},
    {title:'Sinal para atravessar',text:'Observe o semáforo da faixa ao sul da praça.',reward:45,target:()=>signal},
    {title:'Flores da primavera',text:'Converse com Elisa sobre as flores na praça.',reward:45,target:()=>elisa()},
    {title:'Verão na feira',text:'Converse com Dito sobre o movimento da feira.',reward:45,target:()=>dito()},
    {title:'Outono da igreja',text:'Observe as árvores com Miguel, perto da igreja.',reward:45,target:()=>miguel()},
    {title:'Um prato de inverno',text:'Compre sopa quente no mercado ou no hortifruti.',reward:50,target:()=>market},
    {title:'Descubra a passagem secreta',text:'Junte as pistas de Miguel, Ivo e Davi; encontre a tampa atrás da barraca de legumes.',reward:70,target:()=>firstUnmet(['miguel','ivo','davi'],q().clues)||entrance},
    {title:'Resgate no túnel',text:'Entre pela passagem atrás dos legumes, encontre Mateus e salve-o.',reward:120,target:()=>s().inTunnel?trapped:entrance}
  ];
  let lastStep=-1,lastChat=-1;
  function update(dt,t){const step=s().step;if(step!==lastStep){lastStep=step;const seasonal={20:'primavera',21:'verao',22:'outono',23:'inverno'};if(seasonal[step]){s().season=seasonal[step];save();toast('Nova estação: '+{primavera:'primavera',verao:'verão',outono:'outono',inverno:'inverno'}[s().season]+'.');}}
    const chat=Math.floor(t/6)%4;if(chat!==lastChat){lastChat=chat;const lines=[['Vamos jogar, Luna!','Passa a bola, Caio!'],['Você viu o Bile?','Ele está no pergolado!'],['O céu mudou!','A chuva vem chegando!'],['Depois vamos à feira?','Vamos comprar cocada!']][chat];talk1.el.textContent='Caio: '+lines[0];talk2.el.textContent='Luna: '+lines[1];}
    playBall.position.x=11.4+Math.sin(t*2.1)*1.6;playBall.position.y=Math.max(0,Math.abs(Math.sin(t*2.1))*.5);
    portal.visible=s().step>=24||q().passageOpen;entrance.radius=portal.visible?3.3:0.1;
  }
  function tunnelCollision(x,z,r){return Math.abs(x)>4.45-r||z>3-r||z< -35+r;}
  function helpStatus(){return s().inTunnel?'TÚNEL · RESGATE':s().step>=11?'NÍVEL 2 · '+Math.min(15,s().step-10)+'/15':'NÍVEL 1 · '+Math.min(11,s().step+1)+'/11';}
  return {sync(){lostBall.visible=!s().inTunnel&&!q().ballFound;trapped.p.g.visible=s().inTunnel&&!q().rescued;},quests,handle,update,tunnelCollision,helpStatus,setInside,get trapped(){return trapped;},npcs:{market,grocer,produce,child1,child2,trapped},items:{picnic,ballItem,entrance,signal}};
};
