'use strict';
// The server owns the group's mission order, wallet and rewards.
const rewards=[20,45,30,35,50,60,40,60,50,45,100,45,50,60,55,55,40,35,40,45,45,45,45,50,70,120];
const positions={ana:[-5,47],jose:[27,-79],clara:[-39,31],miguel:[-3,-79],trash0:[-25,18],trash1:[23,42],trash2:[4,-48],photo:[-12,66],ivo:[58,-103],rosa:[-117,47],lurdes:[113,54],lenhador:[106,71],rita:[43,-82],dito:[57,-84],lia:[43,-102],joaquim:[-39,-50],bia:[20,61],'picnic-spot':[5,37],caio:[9,16],mercado:[39,44],hortifruti:[38,-17],animal0:[3,47],'lost-ball':[23,-31],'signal-crossing':[-22,68],elisa:[8,-30],davi:[43,-112],'secret-entrance':[51,-124],rescue:[0,-31],'tunnel-exit':[0,2.2]};
function initial(){return {step:0,money:50,carrying:false,invitation:false,trash:[],photos:0,deliveries:0,delivery:null,treeCleared:false,treePaid:false,treeDelivered:false,chopRemaining:0,tasted:[],picnicStarted:false,picnicGiven:[],chapter2:{picnicReady:false,picnicPrepared:false,invited:[],basket:false,served:[],groceries:[],vegDelivered:false,bileFound:false,ballFound:false,ballReturned:false,signalChecked:false,spring:false,summer:false,autumn:false,winter:false,clues:[],passageOpen:false,rescued:false}};}
function normalize(saved,now=Date.now()){const base=initial();const s={...base,...structuredClone(saved||{}),chapter2:{...base.chapter2,...structuredClone(saved?.chapter2||{})}};if(s.cutAt&&now>=s.cutAt){s.treeCleared=true;s.chopRemaining=0;}else if(s.cutAt)s.chopRemaining=Math.ceil((s.cutAt-now)/1000);return s;}
function applyEvent(saved,event,now=Date.now()){
  const s=normalize(saved,now),b=s.chapter2,n=event.target,pos=positions[n];
  if(!pos||!Number.isFinite(event.x)||!Number.isFinite(event.z))throw new Error('Ação inválida.');
  const inside=event.inTunnel===true;
  if(inside!==['rescue','tunnel-exit'].includes(n))throw new Error('Esse personagem está em outra área.');
  const radius=n==='photo'?14:n==='animal0'?12:n==='lenhador'?13:4.2;
  if(Math.hypot(event.x-pos[0],event.z-pos[1])>radius)throw new Error('Aproxime-se do objetivo para interagir.');
  if(!Number.isInteger(event.step)||event.step!==s.step)return {state:s,message:'O grupo já avançou. Seu objetivo foi atualizado.',effect:null};
  let message='Siga o objetivo dourado da missão do grupo.',effect=null;
  const finish=()=>{s.money+=rewards[s.step];s.step++;message=s.step===26?'Resgate concluído! O grupo terminou as 26 missões.':'Missão concluída por seu grupo!';};
  const add=(arr,v)=>{if(!arr.includes(v))arr.push(v);};
  const food=(item,cost,fill)=>{if(s.money<cost){message='O grupo precisa de mais moedas.';return false;}s.money-=cost;effect={food:fill};message=item+' comprado para você com moedas do grupo.';return true;};
  if(n==='tunnel-exit'){effect={tunnel:false};message='Você voltou à feira.';return {state:s,message,effect};}
  if(n==='secret-entrance'&&s.step>=25&&b.passageOpen){effect={tunnel:true};message='Entre e procure Mateus. Seu grupo pode acompanhar.';return {state:s,message,effect};}
  if(n==='bia'&&s.step!==13){effect={bike:true};message='Bicicleta pronta. Pedale até a oficina.';return {state:s,message,effect};}
  switch(s.step){
    case 0:if(n==='ana')finish();break;
    case 1:if(n==='jose'){s.carrying=true;message='Caixa compartilhada: qualquer integrante pode levá-la até Clara.';}else if(n==='clara'&&s.carrying){s.carrying=false;finish();}break;
    case 2:if(n==='miguel')finish();break;
    case 3:if(/^trash[0-2]$/.test(n)){add(s.trash,Number(n.at(-1)));message='Embalagens recolhidas: '+s.trash.length+'/3.';if(s.trash.length===3)finish();}break;
    case 4:if(n==='photo'){s.photos++;finish();}break;
    case 5:if(n==='ana'){s.invitation=true;message='Convite guardado na mochila do grupo.';}else if(n==='jose'&&s.invitation){s.invitation=false;finish();}break;
    case 6:if(n==='ivo'){s.delivery={kind:'normal',to:'rosa'};message='Levem a encomenda à Rosa.';}else if(n==='rosa'&&s.delivery){s.delivery=null;s.deliveries++;s.money+=60;finish();}break;
    case 7:if(n==='ivo'){s.delivery={kind:'tree',to:'lurdes'};message='Bento precisa liberar a entrada da casa de Dona Lurdes.';}else if(n==='lenhador'&&s.delivery){if(!s.treePaid&&s.money>=50){s.money-=50;s.treePaid=true;s.cutAt=now+10000;s.chopRemaining=10;message='Bento recebeu 50 moedas do grupo. Aguarde o corte.';}else message=s.treeCleared?'O caminho está livre.':'O corte já foi pago; aguarde Bento terminar.';}else if(n==='lurdes'&&s.delivery&&s.treeCleared){s.delivery=null;s.treeDelivered=true;s.deliveries++;s.money+=100;finish();}break;
    case 8:{const f={rita:['bolo',12,35],dito:['carne',25,65],lia:['cocada',8,25]}[n];if(f&&!s.tasted.includes(f[0])&&food(...f)){add(s.tasted,f[0]);if(s.tasted.length===3)finish();}}break;
    case 9:if(n==='joaquim'){if(event.transport==='bike'&&Number(event.bikeDistance)>=50)finish();else message='Um integrante precisa pedalar 50 metros e chegar de bicicleta.';}break;
    case 10:if(n==='rita'){s.picnicStarted=true;message='Dividam as refeições entre Ana, Clara e Miguel.';}else if(s.picnicStarted&&['ana','clara','miguel'].includes(n)){add(s.picnicGiven,n);message='Refeições entregues: '+s.picnicGiven.length+'/3.';if(s.picnicGiven.length===3)finish();}break;
    case 11:if(n==='ana'){b.picnicReady=true;message='Preparem juntos o local marcado para o piquenique.';}else if(n==='picnic-spot'&&b.picnicReady){b.picnicPrepared=true;finish();}break;
    case 12:if(['clara','miguel','rita'].includes(n)){add(b.invited,n);message='Convidados: '+b.invited.length+'/3.';if(b.invited.length===3)finish();}break;
    case 13:if(n==='rita'){b.basket=true;message='Levem as refeições para Ana, Bia e Caio.';}else if(b.basket&&['ana','bia','caio'].includes(n)){add(b.served,n);message='Refeições do grupo: '+b.served.length+'/3.';if(b.served.length===3)finish();}break;
    case 14:if(n==='mercado'&&!b.groceries.includes('Pão')&&food('Pão',15,25))add(b.groceries,'Pão');if(n==='hortifruti'&&!b.groceries.includes('Legumes')&&food('Legumes',18,30))add(b.groceries,'Legumes');if(b.groceries.includes('Pão')&&b.groceries.includes('Legumes'))finish();break;
    case 15:if(n==='lurdes'&&b.groceries.includes('Legumes')){b.vegDelivered=true;finish();}break;
    case 16:if(n==='animal0'){b.bileFound=true;finish();}break;
    case 17:if(n==='lost-ball'){b.ballFound=true;finish();}break;
    case 18:if(n==='caio'&&b.ballFound){b.ballReturned=true;finish();}break;
    case 19:if(n==='signal-crossing'){b.signalChecked=true;finish();}break;
    case 20:if(n==='elisa'){b.spring=true;finish();}break;
    case 21:if(n==='dito'){b.summer=true;finish();}break;
    case 22:if(n==='miguel'){b.autumn=true;finish();}break;
    case 23:if(['mercado','hortifruti'].includes(n)&&food('Sopa quente',20,48)){b.winter=true;finish();}break;
    case 24:if(['miguel','ivo','davi'].includes(n)){add(b.clues,n);const clue={miguel:'Um caminho de serviço passava ao norte da praça.',ivo:'As entregas antigas seguiam pelo fundo da feira.',davi:'A tampa está atrás da grande barraca de legumes.'};message=clue[n]+' Pistas: '+b.clues.length+'/3.';}else if(n==='secret-entrance'&&b.clues.length===3){b.passageOpen=true;finish();}break;
    case 25:if(n==='rescue'&&b.passageOpen&&inside){b.rescued=true;effect={tunnel:false};finish();}break;
  }
  // Optional food remains available without advancing an unrelated mission.
  if(message.startsWith('Siga o objetivo')&&['rita','dito','lia','mercado','hortifruti'].includes(n)){const f={rita:['Bolo',12,35],dito:['Carne',25,65],lia:['Cocada',8,25],mercado:['Pão',15,25],hortifruti:['Frutas',14,26]}[n];food(...f);}
  return {state:s,message,effect};
}
module.exports={initial,normalize,applyEvent,positions,rewards};
