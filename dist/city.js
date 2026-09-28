/* Rebuilt from the user's jogo.rar: aerial image, street photographs and fountain flythrough.
   North is -Z. Dimensions are visual estimates, not a cadastral survey. */
window.buildCerroAzul = function (T, scene) {
  'use strict';
  const root = new T.Group(); scene.add(root);
  const obstacles=[], buildings=[], lamps=[], jets=[], pools=[], benches=[], trees=[], waterways=[];
  const mats=new Map(), boxGeo=new T.BoxGeometry(1,1,1), sphereGeo=new T.SphereGeometry(1,9,7);
  let seed=73127; const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const mat=(c)=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);};
  function mesh(geo,m,x=0,y=0,z=0,p=root){const o=new T.Mesh(geo,typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
  function box(w,h,d,m,x,y,z,p=root){const o=mesh(boxGeo,m,x,y,z,p);o.scale.set(w,h,d);return o;}
  function cyl(r1,r2,h,m,x,y,z,p=root,n=12){return mesh(new T.CylinderGeometry(r1,r2,h,n),m,x,y,z,p);}
  function ball(x,y,z,sx,sy,sz,m,p=root){const o=mesh(sphereGeo,m,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
  function group(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;root.add(g);return g;}
  function block(x,z,w,d){obstacles.push({x,z,w,d});}
  function line(a,b,r,c,p=root){const v=new T.Vector3(...a),q=new T.Vector3(...b),o=cyl(r,r,v.distanceTo(q),c,0,0,0,p,7);o.position.copy(v.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(new T.Vector3(...a)).normalize());return o;}
  function canvasTexture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
  const paver=canvasTexture((c,n)=>{c.fillStyle='#8c928e';c.fillRect(0,0,n,n);for(let y=0;y<n;y+=32)for(let x=-32;x<n;x+=64){const a=x+(y/32%2)*32;const v=160+rnd()*28;c.fillStyle=`rgb(${v},${v+2},${v-3})`;c.fillRect(a+1,y+1,62,30);c.fillStyle='#ffffff20';c.fillRect(a+3,y+3,57,2);}for(let i=0;i<12000;i++){c.fillStyle=rnd()<.5?'#ffffff10':'#0000000c';c.fillRect(rnd()*n,rnd()*n,1.5,1.5);}});
  const stone=canvasTexture((c,n)=>{c.fillStyle='#777d77';c.fillRect(0,0,n,n);for(let y=-1;y<12;y++)for(let x=-1;x<11;x++){const px=x*55+(y%2)*27.5,py=y*47.6,v=122+rnd()*35;c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;c.lineTo(px+30*Math.sin(a),py+30*Math.cos(a));}c.closePath();c.fillStyle=`rgb(${v+6},${v+6},${v})`;c.fill();c.strokeStyle='#6d746d';c.lineWidth=2;c.stroke();}for(let i=0;i<15000;i++){c.fillStyle=rnd()<.5?'#fff1':'#0001';c.fillRect(rnd()*n,rnd()*n,1,1);}});
  const grass=canvasTexture((c,n)=>{c.fillStyle='#658047';c.fillRect(0,0,n,n);for(let i=0;i<34000;i++){c.fillStyle=['#455f3030','#a1ad5135','#314a3420','#abb87026'][i%4];c.fillRect(rnd()*n,rnd()*n,1+rnd()*3,2+rnd()*5);}});
  const roofTex=canvasTexture((c,n)=>{c.fillStyle='#a46145';c.fillRect(0,0,n,n);for(let y=0;y<n;y+=48)for(let x=0;x<n;x+=22){const v=128+rnd()*36;c.fillStyle=`rgb(${v+35},${v-42},${v-68})`;c.fillRect(x+1,y+2,20,45);c.fillStyle='#f3b18355';c.fillRect(x+4,y+2,4,43);c.fillStyle='#482d2633';c.fillRect(x+17,y+2,3,46);}});
  const paveMat=new T.MeshStandardMaterial({map:paver,roughness:.94});
  const roadMat=new T.MeshStandardMaterial({map:stone,roughness:.98});
  const grassMat=new T.MeshStandardMaterial({map:grass,roughness:1});
  const tileMat=new T.MeshStandardMaterial({map:roofTex,roughness:.85,side:T.DoubleSide});
  function worldUV(geo,scale=5){const p=geo.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/scale,p.getZ(i)/scale);geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return geo;}
  function plane(w,d,m,x,z,y=.03,scale=5){const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);worldUV(g,scale);const o=mesh(g,m,x,y,z);o.castShadow=false;return o;}
  function strip(points,width,m,y=.025){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),s=plane(width,len,m,(a[0]+b[0])/2,(a[1]+b[1])/2,y,3);s.rotation.y=Math.atan2(dx,dz);}waterways.push(points);}
  function shape(points,y,m){const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);worldUV(g);const o=mesh(g,m,0,y,0);o.castShadow=false;return o;}
  function edge(points,y,c,r=.15,closed=true){for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length];line([a[0],y,a[1]],[b[0],y,b[1]],r,c);}}
  function lawn(points){shape(points,.29,grassMat);edge(points,.3,'#d0cbc0',.12);}
  function roof(w,d,h,x,y,z,p=root){const g=new T.BufferGeometry();const v=[-w/2,0,-d/2,w/2,0,-d/2,0,h,-d/2,-w/2,0,d/2,0,h,d/2,w/2,0,d/2,-w/2,0,-d/2,0,h,-d/2,0,h,d/2,-w/2,0,-d/2,0,h,d/2,-w/2,0,d/2,w/2,0,-d/2,w/2,0,d/2,0,h,d/2,w/2,0,-d/2,0,h,d/2,0,h,-d/2];g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();worldUV(g,4);return mesh(g,tileMat,x,y,z,p);}
  function hipped(w,d,h,x,y,z,p){const g=new T.BufferGeometry(),a=[-w/2,0,-d/2],b=[w/2,0,-d/2],c=[w/2,0,d/2],e=[-w/2,0,d/2],q=[0,h,0];g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...q,...b,...c,...q,...c,...e,...q,...e,...a,...q],3));g.computeVertexNormals();worldUV(g,4);return mesh(g,tileMat,x,y,z,p);}
  function sign(text,w,h,x,y,z,p=root,bg='#eee9df',fg='#283e4a'){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 96px Arial';ctx.fillText(text,512,133,980);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.8,side:T.DoubleSide}),x,y,z,p);s.castShadow=false;return s;}
  // Terrain and street framework adjusted from the user's 2023 plan.
  // Fountain, plaza landscaping, furniture and buildings are intentionally unchanged.
  plane(950,950,grassMat,0,0,-.13,8);plane(285,330,paveMat,0,0,-.04);

  // Main north-south streets flanking the plaza.
  plane(10.5,325,roadMat,-33,0,.01,4); // Rua Carlos Gomes
  plane(10.5,325,roadMat,33,0,.01,4);  // Av. Getúlio Vargas

  // Cross streets and continuations visible on the plan.
  plane(275,10.5,roadMat,0,-73,.015,4);
  plane(275,10.5,roadMat,0,73,.015,4);
  plane(10.5,130,roadMat,-95,-65,.01,4);
  plane(10.5,160,roadMat,95,10,.01,4);
  plane(150,10.5,roadMat,-70,-135,.015,4);
  plane(135,10.5,roadMat,-75,135,.015,4);
  plane(120,10.5,roadMat,88,-73,.016,4);

  box(56,.22,133,'#b7b6aa',0,.08,0);plane(55.5,132.5,paveMat,0,0,.198,4);
  for(const x of [-27.5,27.5])box(.45,.05,132,'#a76d59',x,.23,0);
  for(const z of [-66,66])box(55,.05,.45,'#a76d59',0,.23,z);
  // Watercourses shown on the plan are brought into the playable horizon as simplified blue corridors.
  // They are deliberately kept outside the core walking square and pass beneath the road deck where the survey shows crossings.
  strip([[-150,-118],[-128,-111],[-108,-114],[-88,-108],[-70,-99],[-58,-88]],7.2,'#2f9ed0',.005);
  strip([[62,-150],[55,-135],[48,-122],[43,-108],[39,-94],[34,-82]],5.4,'#35a7d6',.004);
  strip([[-150,118],[-132,119],[-116,125],[-99,133],[-88,145]],8.4,'#2e9ccc',.004);

  function crosswalk(x,z,rot){const g=group(x,z,rot);for(let i=-3;i<=3;i++)box(.55,.025,7,'#dfdfcf',i*1.05,.065,0,g);}
  crosswalk(-17,73,0);crosswalk(14,-73,0);crosswalk(-33,-60,Math.PI/2);crosswalk(33,53,Math.PI/2);
  const lawns=[
    [[-24,-62],[-8,-62],[-8,-48],[-21,-34],[-24,-36]],
    [[-3,-62],[23,-62],[23,-46],[10,-32],[-3,-43]],
    [[-23,-30],[-8,-45],[-6,-32],[7,-22],[-4,-10],[-23,-17]],
    [[24,-39],[24,-18],[15,-14],[6,-22]],
    [[-24,20],[-13,20],[-5,33],[-8,38],[-24,34]],
    [[12,22],[23,14],[24,40],[16,39],[7,31]],
    [[4,1],[8,-9],[23,-10],[23,7],[14,16],[8,15]],
    [[-1,-6],[5,6],[2,17],[-4,26],[-10,17],[-12,8]]
  ];
  // Narrower, irregular grass islands leave broader stone paths like the supplied views.
  lawns.forEach((island,k)=>{const cx=island.reduce((n,p)=>n+p[0],0)/island.length,cz=island.reduce((n,p)=>n+p[1],0)/island.length;lawns[k]=island.map(([x,z],i)=>[cx+(x-cx)*(.69+(i%3)*.025),cz+(z-cz)*(.72+(i%2)*.035)]);lawn(lawns[k]);});
  for(const [x,z] of [[-4,-42],[20,-38],[-19,-24],[13,33],[18,20],[-15,27]]){const bed=[[x-2,z-1],[x+1.7,z-1.5],[x+2,z+.6],[x-1,z+1.4]];lawn(bed);for(let i=0;i<10;i++){const xx=x+(rnd()-.5)*3,zz=z+(rnd()-.5)*2;ball(xx,.51,zz,.11,.16,.11,['#eabf55','#e6a6ac','#eee5c6'][i%3]);}}
  // The fountain follows the curved footprint in Animação2.mp4, viewed from its south end.
  const fountainShape=new T.Shape();fountainShape.moveTo(-24,-61);fountainShape.lineTo(-9,-61);fountainShape.bezierCurveTo(-13,-58,-19,-57,-19,-51);fountainShape.bezierCurveTo(-19,-45,-11,-42,-14,-38);fountainShape.bezierCurveTo(-17,-35,-23,-39,-24,-44);fountainShape.lineTo(-24,-61);
  const basinPoints=fountainShape.getPoints(40).map(v=>[v.x,-v.y]);
  const basinGeo=new T.ShapeGeometry(fountainShape,48);basinGeo.rotateX(-Math.PI/2);worldUV(basinGeo,2);
  const basin=mesh(basinGeo,'#258ab9',0,.30,0);basin.castShadow=false;
  edge(basinPoints,.38,'#aeaaa0',.25);
  const waterTexture=canvasTexture((c,n)=>{c.fillStyle='#63c1d4';c.fillRect(0,0,n,n);c.strokeStyle='#d8fdff70';c.lineWidth=1.5;for(let i=0;i<40;i++){c.beginPath();const x=rnd()*n,y=rnd()*n;c.ellipse(x,y,8+rnd()*34,4+rnd()*17,rnd()*6,0,Math.PI*2);c.stroke();}});
  const waterMat=new T.MeshStandardMaterial({map:waterTexture,color:'#6ec4d8',metalness:.25,roughness:.24,transparent:true,opacity:.87});
  const water=mesh(basinGeo,waterMat,0,.37,0);water.castShadow=false;pools.push(waterMat);
  for(let i=0;i<7;i++){const x=-22.15+Math.sin(i*.7)*.7,z=43+i*2.55;block(x,z,3.2,2.8);const pts=[];for(let k=0;k<13;k++){const t=k/12;pts.push(new T.Vector3(x+t*1.5,.46+Math.sin(t*Math.PI)*1.2,z));}const jet=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.038,5,false),new T.MeshStandardMaterial({color:'#ccf3fa',transparent:true,opacity:.7,roughness:.18}));jets.push(jet);}
  block(-18,59.8,8,3);block(-16.8,40.1,7,3.5);
  const innerIsland=[[-17,45],[-15,42],[-9,44],[-7,50],[-4,58],[-8,60],[-15,57],[-17,52]];lawn(innerIsland);
  const pergola=group(-12,49);
  for(const x of [-2.2,2.2])for(const z of [-2.3,2.3]){box(.25,3.9,.25,'#62422e',x,2.15,z,pergola);block(-12+x,49+z,.28,.28);}
  for(const x of [-2.25,2.25])box(.23,.35,5.7,'#795138',x,4.0,0,pergola);
  for(let z=-2.65;z<=2.7;z+=.49)box(5.35,.22,.16,'#98663e',0,4.2,z,pergola);
  for(let x=-10;x<-5;x+=1.4)box(1.18,.1,1.2,'#e4e0d4',x,.35,50);
  // Raised, transparent lettering, matching the blue letters in the street photographs.
  const letterCanvas=document.createElement('canvas');letterCanvas.width=2048;letterCanvas.height=256;const lc=letterCanvas.getContext('2d');lc.font='900 181px Arial';lc.textBaseline='middle';lc.lineWidth=10;lc.strokeStyle='#fff';lc.fillStyle='#1678aa';lc.strokeText('EU',8,130);lc.fillText('EU',8,130);lc.fillStyle='#dc3b48';lc.strokeText('♥',315,130);lc.fillText('♥',315,130);lc.fillStyle='#1678aa';lc.strokeText('CERRO AZUL',530,130,1500);lc.fillText('CERRO AZUL',530,130,1500);
  const letters=new T.CanvasTexture(letterCanvas);letters.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(17.4,2.1),new T.MeshStandardMaterial({map:letters,transparent:true,alphaTest:.3,side:T.DoubleSide,roughness:.58}),-12,1.53,63.2);box(18,.35,.95,'#eee9dc',-12,.4,63.2);block(-12,63.2,18,1);
  function bench(x,z,rot=0,concrete=false){const g=group(x,z,rot);const wood=concrete?'#d4d4c9':'#6d4d35';for(let k=0;k<4;k++)box(2.7,.075,.16,wood,0,.77,-.3+k*.2,g);for(let k=0;k<3;k++)box(2.7,.14,.075,wood,0,1.03+k*.18,-.4,g);for(const a of [-1.0,1.0]){box(.18,.55,.8,concrete?'#b4b6ad':'#374a40',a,.48,0,g);box(.11,1.13,.11,'#425047',a,.81,-.42,g);line([a,.78,.35],[a,1.14,.22],.045,'#344039',g);line([a,1.14,.22],[a,1.14,-.4],.045,'#344039',g);}block(x,z,Math.abs(Math.cos(rot))>.5?2.8:1.0,Math.abs(Math.cos(rot))>.5?1:2.8);benches.push({x:x+Math.sin(rot)*1.6,z:z+Math.cos(rot)*1.6});}
  bench(-12,48.5,0,true);for(const a of [[-23,28,1.57],[22,30,-1.57],[-3,39,3.14],[7,-30,0],[-23,-47,1.57],[23,-53,-1.57],[13,18,0],[-18,-25,0],[-3,-55,0]])bench(...a);
  // Red concrete skate ramps on the west side, visible in captures 647–651.
  plane(15,24,roadMat,-16,0,.23,4);edge([[-24,-12],[-8,-12],[-8,12],[-24,12]],.26,'#ba564b',.15);
  function ramp(x,z,rot){const g=group(x,z,rot),s=new T.Shape();s.moveTo(-2.2,0);s.lineTo(2.2,0);s.lineTo(2.2,1.65);s.bezierCurveTo(1.6,1.65,.7,.15,-2.2,.15);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:5.5,bevelEnabled:false,curveSegments:20});const o=mesh(geo,'#b6514c',0,.22,-2.75,g);o.rotation.y=Math.PI/2;block(x,z,6,4.5);}
  ramp(-16,-8,0);ramp(-16,8,Math.PI);box(1.6,.45,6,'#b95b50',-16,.45,0);block(-16,0,1.6,6);line([-11,.95,-4],[-11,.95,4],.06,'#767d7a');for(const z of [-3.5,3.5])line([-11,.25,z],[-11,.95,z],.06,'#767d7a');
  // Small municipal building near the southern entry.
  const kiosk=group(19,53);box(9,3.8,7,'#dad7c2',0,2.1,0,kiosk);box(9.4,.35,7.4,'#9d9e91',0,4.1,0,kiosk);box(9,.7,7.02,'#858d84',0,.55,0,kiosk);box(4,1.3,.05,'#284b51',0,2.4,3.52,kiosk);for(const x of [-2,0,2])box(.1,1.45,.1,'#eef1e4',x,2.4,3.56,kiosk);box(1.4,2.5,.06,'#a6aca3',-3.1,1.55,3.55,kiosk);sign('FISCALIZAÇÃO MUNICIPAL',8,.65,0,3.55,3.54,kiosk);block(19,53,9,7);buildings.push({x:19,z:53,w:9,d:7,color:'#d4cfb4'});
  const clock=group(2,58);box(.4,5.7,.4,'#b86a3d',0,3.0,0,clock);box(1.8,2.5,.4,'#e88535',0,5.8,0,clock);sign('23°',1.5,.8,0,5.9,.23,clock,'#182c28','#b4df99');sign('CERRO AZUL',1.5,.35,0,6.7,.23,clock,'#36895d','#fff');block(2,58,.5,.5);
  const billboard=group(-26,62);box(.3,5.3,.3,'#454846',0,2.9,0,billboard);box(4.7,2.4,.18,'#252e33',0,5.5,0,billboard);sign('VIVA A PRAÇA',4.3,.5,0,5.5,.1,billboard,'#252e33','#e7e9e4');
  const northKiosk=group(-18,-52);box(6,2.9,5,'#d8cfb1',0,1.7,0,northKiosk);const kr=hipped(7,6,1.25,0,3.2,0,northKiosk);kr.material=mat('#57704d');box(3,.95,.08,'#3a5251',0,2.2,2.54,northKiosk);block(-18,-52,6,5);
  // Pavilion-style playground, scaled from the aerial layout.
  const play=group(17,-2);box(10,.05,14,'#b89b65',0,.24,0,play);
  for(const x of [-2,2])for(const z of [-2,2])cyl(.11,.11,3.1,'#d56f37',x,1.8,z,play);
  box(4.2,.2,4.2,'#4b97aa',0,1.65,0,play);const pr=hipped(5,5,1.5,0,3.3,0,play);pr.material=mat('#deaa43');const slide=box(1.25,.13,5.2,'#bd4842',0,1.0,4.0,play);slide.rotation.x=.33;for(let i=0;i<6;i++)box(1.1,.07,.25,'#3b7d9a',-3,0.4+i*.27,-2+i*.4,play);
  for(const x of [-3,3]){line([x,.3,-6],[x,3.4,-4],.1,'#537d89',play);line([x,.3,-2],[x,3.4,-4],.1,'#537d89',play);}line([-3,3.4,-4],[3,3.4,-4],.1,'#ddaa4d',play);for(const x of [-1.4,1.4]){for(const dx of [-.4,.4])line([x+dx,3.4,-4],[x+dx,.9,-4],.022,'#575b52',play);box(1.1,.1,.55,'#dca246',x,.9,-4,play);}block(17,-2,5,5);block(17,2,1.5,4);
  // Intersecting leaf clusters create broken silhouettes, rather than solid polygon crowns.
  const leafTex=canvasTexture((c,n)=>{c.clearRect(0,0,n,n);for(let i=0;i<290;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*.46*n,x=n/2+Math.cos(a)*r,y=n/2+Math.sin(a)*r;c.fillStyle=['#537536','#739344','#8ba954','#476c38','#618641'][i%5];c.beginPath();c.ellipse(x,y,4+rnd()*10,2+rnd()*5,rnd()*6,0,Math.PI*2);c.fill();}},256);
  const leafMats=['#b1ba86','#d2ce91','#9db38d'].map(color=>new T.MeshStandardMaterial({map:leafTex,color,alphaTest:.45,side:T.DoubleSide,roughness:.96}));
  const leafGeo=new T.PlaneGeometry(1,1);
  function tree(x,z,h=9,r=4.5){trees.push({x,z,r});block(x,z,.7,.7);const trunkH=h*.52;cyl(.2,.42,trunkH,'#655c46',x,trunkH/2+.2,z);cyl(.3,.43,.95,'#dfded0',x,.65,z);for(let i=0;i<7;i++){const a=i*2.399+randomAngle(),bx=x+Math.cos(a)*r*.6,bz=z+Math.sin(a)*r*.6;line([x,trunkH*.5,z],[bx,h*.8,bz],.1,'#6e654c');}for(let i=0;i<90;i++){const a=rnd()*6.283,rr=Math.sqrt(rnd())*r*.95,xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr,yy=h-1.1+rnd()*2.7-(rr/r)**2*1.9,s=1.35+rnd()*1.15;for(let k=0;k<2;k++){const leaf=mesh(leafGeo,leafMats[i%3],xx,yy,zz);leaf.scale.set(s*1.45,s,1);leaf.rotation.set((rnd()-.5)*2,rnd()*6.28,k*1.57);}}}
  function randomAngle(){return rnd()*.45;}
  for(const [x,z,h,r] of [[-23,-60,11,6],[-11,-58,10,5],[0,-59,12,6],[16,-60,12,6],[24,-48,11,5],[-24,-39,10,4.5],[-15,-33,11,5],[-2,-36,9,4],[14,-37,10,4.5],[23,-26,11,5],[-22,-23,10,4],[-7,-17,9,4],[4,-20,10,4],[-22,28,8,4],[19,32,10,4],[-1,16,8,3],[7,26,7,3],[23,15,9,4],[-48,-48,10,4],[-47,-5,8,4],[51,64,9,4],[8,-125,10,5]])tree(x,z,h,r);
  function palm(x,z,h=9){cyl(.16,.28,h,'#887d5b',x,h/2,z);block(x,z,.6,.6);for(let i=0;i<9;i++){const a=i*.7,pts=[new T.Vector3(x,h-.2,z),new T.Vector3(x+Math.cos(a)*2,h+.7,z+Math.sin(a)*2),new T.Vector3(x+Math.cos(a)*3.8,h-1.2,z+Math.sin(a)*3.8)];mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),8,.1,5,false),'#486c3c');for(let k=1;k<6;k++){const t=k/6,cx=x+Math.cos(a)*t*3.5,cz=z+Math.sin(a)*t*3.5,cy=h+Math.sin(t*3.14)*.8-t;for(const side of [-1,1])line([cx,cy,cz],[cx+Math.cos(a+1.2*side)*1.0,cy-.6,cz+Math.sin(a+1.2*side)*1.0],.045,'#5d8147');}}}
  palm(25,39);palm(25,-7);palm(23,-59);palm(-44,-39);
  function lamp(x,z){cyl(.065,.12,5,'#59665e',x,2.7,z);const glow=new T.MeshStandardMaterial({color:'#eee4c3',emissive:'#fbd7a2',emissiveIntensity:.2});lamps.push(glow);ball(x,5.3,z,.3,.43,.3,glow);cyl(.45,.12,.22,'#526156',x,5.7,z);}
  for(const [x,z] of [[-26,-60],[26,-60],[-26,61],[26,61],[-6,34],[6,-12],[-5,-41],[24,9],[-26,15]])lamp(x,z);
  for(const [x,z] of [[-25,35],[24,45],[-23,-15],[25,-41],[-8,32]]){cyl(.35,.35,.85,'#526353',x,.68,z);cyl(.38,.38,.1,'#354b41',x,1.14,z);}
  // The bus shelter on Avenida Getúlio Vargas.
  const stop=group(26,21);for(const z of [-3,3])box(.13,2.8,.13,'#36494e',0,1.65,z,stop);box(2.6,.13,7.3,'#526264',-.7,3.05,0,stop);box(.06,1.8,6.7,'#758e89',.1,1.9,0,stop);bench(24.4,21,-Math.PI/2);
  // Buildings have individual facades, heights and rooflines taken from the street sequence.
  function facade(x,z,w,d,h,c,rot=0,style='ordinary',name=''){
    const g=group(x,z,rot);box(w,h,d,c,0,h/2+.2,0,g);box(w+.5,.2,d+.5,'#d7d2c2',0,.2,0,g);const front=d/2;
    if(style==='glass'){box(w-.65,h-.8,.08,'#345364',0,h/2+.3,front+.03,g);for(let y=3;y<h;y+=3)box(w,.2,.2,'#b3b7ad',0,y,front+.13,g);for(const xx of [-w*.33,0,w*.33])box(.12,h,.15,'#bcc2b8',xx,h/2,front+.16,g);box(w+.5,.3,d+.5,'#c0c0b4',0,h+.15,0,g);}
    else{
      if(style==='heritage')roof(w+.7,d+.7,2.6,0,h,0,g);else if(style!=='yellow'&&style!=='blue')roof(w+.4,d+.4,1.35,0,h,0,g);
      box(w+.3,.32,.5,'#e9e3d3',0,h,front,g);box(w,.35,.16,'#a3a18e',0,.7,front+.03,g);
      const floors=Math.max(1,Math.floor(h/3.5)),cols=Math.max(2,Math.floor(w/3.3));
      for(let f=0;f<floors;f++)for(let j=0;j<cols;j++){const xx=-w/2+(j+.5)*w/cols,yy=1.6+f*3.15,ww=w/cols*.61;
        const frame=style==='blue'?'#168dac':style==='yellow'?'#929585':'#e6e3d6';box(ww+.22,2.0,.19,frame,xx,yy,front+.11,g);box(ww,1.78,.08,f===0?'#455b5a':'#617f86',xx,yy,front+.23,g);box(.06,1.78,.1,frame,xx,yy,front+.29,g);box(ww,.06,.1,frame,xx,yy,front+.29,g);
        if(f===0&&style==='yellow'){const aw=box(ww+.5,.14,1.2,'#e2ddd0',xx,2.75,front+.6,g);aw.rotation.x=-.14;}
      }
      if(style==='heritage'){for(let xx=-w/2+.3;xx<=w/2;xx+=w/3){box(.4,h+.4,.36,'#ece9d8',xx,h/2,front+.1,g);box(.7,.3,.55,'#eeeada',xx,h-.2,front+.15,g);}box(w,.3,.35,'#f0e9d8',0,h-1.0,front+.2,g);}
      if(style==='blue'){for(const yy of [3.2,h-.1])box(w+.3,.27,.6,'#148bab',0,yy,front+.15,g);}
      if(name){sign(name,w-.6,.85,0,3.0,front+.35,g,style==='yellow'?'#b1943b':style==='blue'?'#b67633':'#476373','#fbf4e6');const aw=box(w+.3,.12,1.2,style==='blue'?'#c98d46':'#6a858b',0,3.65,front+.6,g);aw.rotation.x=-.1;}
    }
    const turns=Math.abs(Math.sin(rot))>.5;block(x,z,turns?d:w,turns?w:d);buildings.push({x,z,w:turns?d:w,d:turns?w:d,h:h+2,color:c});return g;
  }
  facade(-49,52,20,15,7.4,'#e4ddd0',Math.PI/2,'ordinary','MERCADO');
  facade(-50,31,20,17,6.8,'#d9d7c3',Math.PI/2,'ordinary','PADARIA');
  facade(-50,-57,12,17,14.3,'#6c7576',Math.PI/2,'glass');
  facade(-49,-72,14,15,4.5,'#d4c9a9',Math.PI/2,'heritage');
  // School fence and its high timber entrance canopy on Carlos Gomes.
  const school=group(-58,-16);box(21,4.8,45,'#d6dfd3',0,2.6,0,school);roof(23,47,2,0,4.9,0,school);block(-58,-16,21,45);buildings.push({x:-58,z:-16,w:21,d:45,color:'#b7c8c0'});
  box(.4,.9,45,'#5595bb',-41,.6,-16);for(let z=-38;z<7;z+=.42)box(.055,2.7,.06,'#b0b9b6',-41,2.2,z);for(const y of [1,3.4])box(.09,.08,45,'#d3d8d1',-41,y,-16);const sg=group(-42,3,Math.PI/2);roof(6,8,3,0,3.5,0,sg);for(const x of [-2.7,2.7])box(.25,3.6,.25,'#74644a',x,2,3,sg);block(-41,-20,.5,36);
  facade(49,-64,18,16,7.8,'#ede6d2',-Math.PI/2,'blue','LANCHONETE');
  facade(50,-44,19,17,8,'#ba7554',-Math.PI/2,'ordinary','CÂMARA MUNICIPAL');
  facade(49,-23,20,16,9.8,'#d4c6a5',-Math.PI/2,'ordinary','FARMÁCIA');
  facade(49,3,30,16,7.7,'#c2a63e',-Math.PI/2,'yellow');
  facade(49,34,24,17,6.4,'#d8ccab',-Math.PI/2,'ordinary','COMÉRCIO DO CENTRO');
  facade(49,60,21,16,7.4,'#dad4b9',-Math.PI/2,'ordinary','MULTILOJA');
  facade(-22,91,27,22,4.8,'#65906d',Math.PI,'heritage');
  facade(7,92,27,23,7.6,'#e1d8bb',Math.PI,'ordinary','SABORES DO RIBEIRA');
  facade(34,93,23,24,7.8,'#d8cbb1',Math.PI,'ordinary');
  // Church faces south across Praça Monsenhor Celso. No church is placed on the western block.
  const church=group(-3,-103),cc='#acafaa',trim='#eeeee1';
  box(32,.25,44,'#c9c8bc',0,.13,0,church);box(21,9.5,29,cc,0,5,-1,church);roof(22,30,4,0,9.6,-1,church);
  box(22,10.7,1.2,cc,0,5.6,13.8,church);box(6.3,21,6.5,cc,0,10.7,15.6,church);
  for(const x of [-10.4,10.4,-5,5])box(.7,10.8,.4,trim,x,5.6,14.5,church);
  for(const x of [-2.87,2.87])box(.5,21,.42,trim,x,10.7,18.9,church);
  for(const y of [8.6,15.5,20.7])box(6.9,.34,7.1,trim,0,y,15.6,church);
  for(let x=-10;x<11;x+=2)box(.8,.9,1.3,cc,x,11.35,13.8,church);
  for(const x of [-2.5,0,2.5])for(const z of [12.5,18.6])box(1,.9,.9,cc,x,21.35,z,church);
  function arch(w,h,c,x,y,z,p){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h*.64);s.quadraticCurveTo(-w/2,h*.82,0,h);s.quadraticCurveTo(w/2,h*.82,w/2,h*.64);s.lineTo(w/2,0);s.closePath();return mesh(new T.ShapeGeometry(s),c,x,y,z,p);}
  arch(3.25,5.5,trim,0,.3,18.94,church);arch(2.75,5.1,'#654e3c',0,.3,18.96,church);box(.06,3.7,.03,'#b39462',0,2.15,18.98,church);
  arch(2.45,4.3,trim,0,10,18.94,church);arch(1.85,3.7,'#537b84',0,10.2,18.96,church);cyl(.12,.36,1.65,'#c9bba0',0,11.5,19.05,church);ball(0,12.48,19.05,.22,.25,.2,'#d6c7a9',church);
  for(const x of [-7.7,7.7]){arch(2.7,4.8,trim,x,1.5,14.44,church);arch(2.1,4.2,'#677f7c',x,1.7,14.46,church);}
  for(let x=-10;x<=10;x+=2.5){if(Math.abs(x)<4)continue;box(.2,.75,.08,trim,x,8.8,14.48,church);box(.7,.2,.08,trim,x,8.8,14.49,church);}
  for(const side of [-1,1])for(let z=-10;z<=8;z+=6){const w=arch(2,4.2,trim,side*10.55,3,z,church);w.rotation.y=side*Math.PI/2;const w2=arch(1.5,3.6,'#5d7272',side*10.57,3.2,z,church);w2.rotation.y=side*Math.PI/2;}
  const clockTex=canvasTexture((c,n)=>{c.clearRect(0,0,n,n);c.fillStyle='#f1eee0';c.beginPath();c.arc(n/2,n/2,n*.46,0,Math.PI*2);c.fill();c.strokeStyle='#4e635a';c.lineWidth=12;c.stroke();c.lineWidth=7;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(n/2+Math.sin(a)*n*.36,n/2-Math.cos(a)*n*.36);c.lineTo(n/2+Math.sin(a)*n*.42,n/2-Math.cos(a)*n*.42);c.stroke();}c.lineWidth=12;c.beginPath();c.moveTo(n*.31,n*.4);c.lineTo(n/2,n/2);c.lineTo(n/2,n*.2);c.stroke();});
  mesh(new T.CircleGeometry(1.38,40),new T.MeshStandardMaterial({map:clockTex,roughness:.8}),0,18.1,18.97,church);
  const peak=new T.Shape();peak.moveTo(-2.3,0);peak.lineTo(0,2.4);peak.lineTo(2.3,0);peak.closePath();mesh(new T.ShapeGeometry(peak),trim,0,21.1,18.99,church);box(.13,1.5,.13,'#696f5e',0,24.25,19,church);box(.8,.13,.13,'#696f5e',0,24.45,19,church);
  block(-3,-104,21,30);block(-3,-87.5,6.5,7);buildings.push({x:-3,z:-104,w:21,d:30,color:'#adb5b0'});
  for(const x of [-15.5,15.5]){box(.25,.7,43,'#bab9aa',x,.6,-103);for(let z=-123;z<-82;z+=.8)box(.055,1.35,.055,'#655f50',x,1.6,z);block(x,-103,.3,43);}
  for(const x of [-12,6]){box(9,.7,.3,'#bab9aa',x,.6,-81.6);for(let dx=-4;dx<=4;dx+=.6)box(.06,1.3,.06,'#675e4f',x+dx,1.6,-81.6);block(x,-81.6,9,.3);}
  for(const x of [-7,1]){box(.8,1.3,.8,'#b2b1a3',x,.85,-81.5);cyl(.09,.27,.9,'#e2ded0',x,1.95,-81.5);ball(x,2.53,-81.5,.16,.19,.16,'#e2ded0');}
  // Corrugated barrel-vault pavilion east of the church, captures 659–664.
  const hall=group(27,-104);box(18,3.6,36,'#48778c',0,2,0,hall);
  const archPts=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;archPts.push(new T.Vector3(Math.cos(a)*9.5,3.8+Math.sin(a)*3.7,-18.5));}
  const vertices=[];for(let i=0;i<32;i++){const a=archPts[i],b=archPts[i+1];vertices.push(a.x,a.y,-18.5,b.x,b.y,-18.5,b.x,b.y,18.5,a.x,a.y,-18.5,b.x,b.y,18.5,a.x,a.y,18.5);}const ag=new T.BufferGeometry();ag.setAttribute('position',new T.Float32BufferAttribute(vertices,3));ag.computeVertexNormals();mesh(ag,new T.MeshStandardMaterial({color:'#b8c2bb',metalness:.4,roughness:.55,side:T.DoubleSide}),0,0,0,hall);
  for(let z=-18;z<=18;z+=1.15){const pts=archPts.map(p=>new T.Vector3(p.x,p.y,z));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.035,4,false),'#687f82',0,0,0,hall);}box(15,3.4,.08,'#293c3c',0,1.95,18.06,hall);block(27,-104,18,36);buildings.push({x:27,z:-104,w:18,d:36,color:'#7b9295'});
  const fair=group(27,-82.7);for(const x of [-3.3,3.3])for(const z of [-1,1])box(.09,2.8,.09,'#77634a',x,1.6,z,fair);for(let x=-3.5;x<3.5;x+=.7)box(.7,.12,3.2,Math.round(x*10)%14===0?'#dfc779':'#eee8cd',x,3.0,0,fair);box(6.5,1.0,1.4,'#9e7246',0,.7,0,fair);for(let i=0;i<40;i++)ball((i%10)*.59-2.65,1.3+Math.floor(i/20)*.18,Math.floor(i/10)%2*.45-.2,.19,.18,.18,'#ec9e35',fair);sign('PONKAN DO VALE',6.4,.65,0,2.55,1.65,fair,'#386343','#f5eaca');block(27,-82.7,6.5,1.5);
  // Side blocks complete the horizon without copying screenshot pixels into the game.
  for(const x of [-76,76])for(let z=-115;z<130;z+=24)facade(x,z,18,17,4.5+rnd()*4,['#c7c0a9','#c5d0c0','#bfc7c5','#c7a488'][Math.floor(rnd()*4)],x<0?Math.PI/2:-Math.PI/2);
  for(const z of [-145,122])for(let x=-50;x<=50;x+=24)facade(x,z,20,16,5+rnd()*4,'#c3c2ac',z<0?0:Math.PI);
  // Fourteen additional fictional homes along the outer residential streets.
  for(const x of [-118,118])for(const z of [-115,-89,-65,-13,15,91,116]){
    const color=['#b8c7ae','#d5b69c','#b4c4cf','#dbc993','#c9b9c6'][Math.floor(rnd()*5)];
    const g=facade(x,z,14,12,4.2+rnd()*1.8,color,x<0?Math.PI/2:-Math.PI/2,'heritage');
    for(const xx of [-4.7,4.7]){box(2.2,.45,.6,'#a47154',xx,.55,6.7,g);for(let k=0;k<4;k++)ball(xx-.7+k*.45,.96,6.7,.24,.32,.24,k%2?'#bf758b':'#709257',g);}
    plane(6,18,paveMat,x+(x<0?9:-9),z,.07,4);
    const gate=group(x+(x<0?8:-8),z+7);for(let k=-5;k<=5;k++)box(.07,1.15,.08,'#d9d5c4',k*.55,.65,0,gate);box(6,.1,.1,'#d9d5c4',0,1,0,gate);block(x+(x<0?8:-8),z+7,6,.2);
  }
  // Utility poles, catenary wires and modest roadside details.
  for(const side of [-1,1])for(let z=-115;z<=100;z+=37){const x=side*39;cyl(.13,.2,9.4,'#96998b',x,4.75,z);box(2,.15,.15,'#7b806f',x,8.7,z);line([x,8.4,z],[x-side*2.4,8.7,z],.05,'#6d776e');box(.8,.12,.35,'#b7c0b5',x-side*2.3,8.7,z);if(z<90)for(const offset of [-.55,0,.55]){const pts=[new T.Vector3(x+offset,8.9,z),new T.Vector3(x+offset,8.3,z+18.5),new T.Vector3(x+offset,8.9,z+37)];mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.018,3,false),'#4e554f');}}
  function bicycle(x,z,rot){const g=group(x,z,rot);for(const zz of [-.6,.6]){const w=mesh(new T.TorusGeometry(.34,.042,5,18),'#343d38',0,.57,zz,g);w.rotation.y=Math.PI/2;line([0,.57,zz],[0,.57+(.5),0],.035,'#637681',g);}line([0,1.04,0],[0,1.04,-.55],.035,'#a4593f',g);box(.22,.06,.35,'#3b403a',0,1.12,0,g);line([-.3,1.2,.58],[.3,1.2,.58],.035,'#4f605d',g);}
  bicycle(25,-31,.2);bicycle(-25,-44,-.3);bicycle(25,25,1.4);
  // Rolling forest ridges, derived only as a backdrop from the supplied aerial photograph.
  const terrain=new T.PlaneGeometry(1100,1100,90,90);terrain.rotateX(-Math.PI/2);const pp=terrain.attributes.position,colors=[];
  for(let i=0;i<pp.count;i++){const x=pp.getX(i),z=pp.getZ(i),dist=Math.hypot(x,z);const ridge=Math.max(0,Math.min(1,(dist-210)/170));const y=ridge*(15+24*Math.sin(x*.013+z*.008)**2+22*Math.cos(z*.019-x*.009)**2);pp.setY(i,y-2);const c=new T.Color(['#466851','#527254','#5d805b'][i%3]);c.multiplyScalar(.87+rnd()*.22);colors.push(c.r,c.g,c.b);}terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();const hills=mesh(terrain,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));hills.castShadow=false;
  // Merge the static scenery by material to keep thousands of details inexpensive to draw.
  root.updateMatrixWorld(true);const batches=new Map(),remove=[];root.traverse(o=>{if(!o.isMesh||pools.includes(o.material)||jets.includes(o))return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,geos:[],cast:o.castShadow});const b=batches.get(key),g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();b.geos.push(g);b.cast=b.cast||o.castShadow;remove.push(o);});
  for(const b of batches.values()){const attrs=['position','normal','uv','color'].filter(k=>b.geos.every(g=>g.attributes[k]));const g=new T.BufferGeometry();for(const k of attrs){const size=b.geos[0].attributes[k].itemSize,arr=new Float32Array(b.geos.reduce((n,a)=>n+a.attributes[k].array.length,0));let offset=0;for(const part of b.geos){arr.set(part.attributes[k].array,offset);offset+=part.attributes[k].array.length;}g.setAttribute(k,new T.BufferAttribute(arr,size));}g.computeBoundingSphere();const o=new T.Mesh(g,b.material);o.castShadow=b.cast;o.receiveShadow=true;scene.add(o);b.geos.forEach(g=>g.dispose());}remove.forEach(o=>o.removeFromParent());
  // Animals are kept outside the static batch so their legs, tails and wings can move.
  const animals=[];
  function pet(kind,name,x,z,color){const g=group(x,z),cat=kind==='cat',scale=cat?.7:1;g.scale.setScalar(scale);g.position.y=.24;
    ball(0,.65,0,.29,.3,.55,color,g);ball(0,.94,.48,.27,.29,.28,color,g);ball(0,.85,.73,.18,.13,.19,cat?'#d9cbb3':color,g);ball(0,.9,.87,.07,.06,.05,'#303b35',g);
    for(const xx of [-.19,.19]){const ear=cat?mesh(new T.ConeGeometry(.13,.3,3),color,xx,1.24,.49,g):ball(xx,.95,.39,.1,.28,.14,color,g);ear.rotation.z=xx>0?-.22:.22;ball(xx*.58,1.01,.72,.038,.041,.032,'#26352e',g);}
    const legs=[];for(const xx of [-.19,.19])for(const zz of [-.33,.33]){const l=new T.Group();l.position.set(xx,.63,zz);g.add(l);cyl(.075,.065,.44,color,0,-.2,0,l);ball(0,-.42,.035,.095,.08,.13,color,l);legs.push(l);}
    const tail=new T.Group();tail.position.set(0,.75,-.46);g.add(tail);const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,.28,-.22),new T.Vector3(.12,.5,-.28)]);mesh(new T.TubeGeometry(curve,10,cat?.045:.07,6,false),color,0,0,0,tail);
    if(!cat){const collar=cyl(.285,.285,.065,'#4b909e',0,.93,.46,g);collar.rotation.x=Math.PI/2;}
    animals.push({id:'animal'+animals.length,type:'animal',kind,name,x,z,homeX:x,homeZ:z,g,legs,tail,radius:2.2,angle:rnd()*6.28,speed:cat?.42:.67,phase:rnd()*10});
  }
  pet('dog','Bile · fazer carinho',3,47,'#b88b4d');pet('dog','Toby · fazer carinho',14,28,'#dbd6c2');pet('dog','Pipoca · fazer carinho',-105,92,'#806c55');
  pet('cat','Mimi · fazer carinho',9,41,'#a39485');pet('cat','Chico · fazer carinho',-108,18,'#cba76b');pet('cat','Lua · fazer carinho',108,-13,'#545e65');
  const birds=[];for(let i=0;i<10;i++){const g=group(0,0);ball(0,0,0,.12,.13,.25,i%2?'#809399':'#b1b9b3',g);ball(0,.14,.18,.09,.1,.1,'#607c7e',g);const beak=mesh(new T.ConeGeometry(.04,.13,4),'#c3a46a',0,.13,.29,g);beak.rotation.x=Math.PI/2;const wings=[];for(const side of [-1,1]){const w=ball(side*.16,.02,-.02,.23,.035,.2,'#6b7d82',g);w.rotation.z=side*.15;wings.push(w);}birds.push({g,wings,phase:i*.628,flight:i>=6});}
  // Signal poles serve the four marked crossings. Lamps change as traffic phases advance.
  const signals=[];for(const [x,z,turn] of [[-22,69,0],[19,-69,Math.PI],[-37,-56,Math.PI/2],[37,49,-Math.PI/2]]){const g=group(x,z,turn);cyl(.09,.13,5,'#4f5a52',0,2.6,0,g);box(.7,1.85,.5,'#2a3336',0,4.95,0,g);const colors=['#c8453a','#dba547','#62a868'];const bulbs=colors.map((c,i)=>{const lampMat=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.05,roughness:.25});return ball(0,5.55-i*.56,.32,.2,.2,.09,lampMat,g);});signals.push({g,bulbs});block(x,z,.22,.22);}
  const rainCount=180,rainPositions=new Float32Array(rainCount*6);const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rainMesh=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:'#b9dfee',transparent:true,opacity:.56,depthWrite:false}));rainMesh.frustumCulled=false;rainMesh.visible=false;scene.add(rainMesh);
  let lastSeason='',lastWet=null;
  function setSeason(season,wet=false,focus={x:0,z:0}){if(lastSeason!==season){lastSeason=season;const palette={primavera:['#b8c58e','#cfb98b','#b3c595'],verao:['#91b681','#a7bf84','#8caf8b'],outono:['#caa474','#e2bf83','#a88665'],inverno:['#9eada5','#abb6af','#8ea39a']}[season]||['#b8c58e','#cfb98b','#b3c595'];leafMats.forEach((m,i)=>m.color.set(palette[i]));grassMat.color.set({primavera:'#b5c988',verao:'#95b36f',outono:'#b49d73',inverno:'#a6b7a8'}[season]||'#b5c988');}if(lastWet!==wet){lastWet=wet;paveMat.color.set(wet?'#b9c6c8':'#ffffff');roadMat.color.set(wet?'#a8b5b9':'#ffffff');paveMat.roughness=wet?.56:.94;roadMat.roughness=wet?.53:.98;rainMesh.visible=wet;}if(wet){for(let i=0;i<rainCount;i++){const k=i*6,a=(i*13.71+focus.x*2)%135,b=(i*24.83+focus.z*2)%135,y=(i*7.3)%24;rainPositions[k]=focus.x+a-67;rainPositions[k+1]=y;rainPositions[k+2]=focus.z+b-67;rainPositions[k+3]=rainPositions[k]-.12;rainPositions[k+4]=y-.85;rainPositions[k+5]=rainPositions[k+2]+.16;}rainGeo.attributes.position.needsUpdate=true;}}
  return {obstacles,buildings,lamps,jets,benches,trees,lawns,basinPoints,waterways,paveMat,animals,signals,setSeason,update(t,dt=0,isBlocked=()=>false){waterTexture.offset.set(Math.sin(t*.12)*.03,t*.008);jets.forEach((j,i)=>j.material.opacity=.55+Math.sin(t*3+i)*.15);for(const sig of signals){const phase=t%24,active=phase<14?2:phase<17?1:0;sig.bulbs.forEach((b,i)=>b.material.emissiveIntensity=i===active?2:.05);}
    if(rainMesh.visible&&dt>0){for(let i=0;i<rainCount;i++){const k=i*6;rainPositions[k+1]-=dt*27;rainPositions[k+4]-=dt*27;if(rainPositions[k+1]<.5){rainPositions[k+1]=21+(i%4);rainPositions[k+4]=rainPositions[k+1]-.85;}}rainGeo.attributes.position.needsUpdate=true;}
    for(const a of animals){const active=Math.sin(t*.35+a.phase)>-.5;if(active&&dt>0){const x=a.x+Math.sin(a.angle)*a.speed*dt,z=a.z+Math.cos(a.angle)*a.speed*dt;if(Math.hypot(x-a.homeX,z-a.homeZ)>4||isBlocked(x,z,.5))a.angle+=dt*4;else{a.x=x;a.z=z;a.g.position.set(x,.24,z);}a.g.rotation.y=a.angle;}a.legs.forEach((l,i)=>l.rotation.x=active?Math.sin(t*7+(i===0||i===3?0:Math.PI))*.4:0);a.tail.rotation.z=Math.sin(t*5+a.phase)*.3;}
    for(const b of birds){const q=t*(b.flight?.3:.07)+b.phase,r=b.flight?20:5;b.g.position.set(6+Math.cos(q)*r,b.flight?14+Math.sin(q*2)*2:.43,38+Math.sin(q)*r);b.g.rotation.y=-q;b.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(b.flight?Math.sin(t*10+b.phase)*.65:.15));}
  }};
};
