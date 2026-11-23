// @ts-nocheck
/* Fuel App 3D tanker journey (procedural, illustrative). Ported from the static site; three.js r128 (same visuals).
   Browser only: called from OpsRoom after the section scrolls into view. */
export interface FuelSim { go(stage: number, hold?: boolean): void; destroy(): void }

export function initFuelSim(host: HTMLElement, THREE: any, OrbitControls: any, L: { simSteps: [string, string][]; simAria: string; unit: string }): FuelSim {
var $=function(i){return document.getElementById(i)};
var CAP=32000;
var STAGES=L.simSteps;
var DUR=[6,5,9,12,5,6];
$("sim-steps").innerHTML=STAGES.map(function(s){return '<li><i><b></b></i>'+s[0]+'</li>'}).join("");
var stepEls=[].slice.call(document.querySelectorAll("#sim-steps li"));

/* renderer / scene */
var canvas=document.createElement("canvas");canvas.className="sim-canvas";canvas.setAttribute("aria-label",L.simAria);host.insertBefore(canvas,host.firstChild);
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
var scene=new THREE.Scene();
scene.background=new THREE.Color(0xBFD6E6);
scene.fog=new THREE.Fog(0xD9CDB4,160,360);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.78;
var camera=new THREE.PerspectiveCamera(42,1,0.5,800);
camera.position.set(-70,60,90);
var controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.enableZoom=false;controls.enablePan=false;if(matchMedia("(pointer:coarse)").matches)controls.enabled=false;controls.maxPolarAngle=Math.PI*0.47;controls.minDistance=25;controls.maxDistance=260;

scene.add(new THREE.HemisphereLight(0xE8F1FA,0x9C8462,0.3));
var sun=new THREE.DirectionalLight(0xFFE7C2,1.05);
sun.position.set(-80,120,40);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
var sc=sun.shadow.camera;sc.left=-150;sc.right=150;sc.top=150;sc.bottom=-150;sc.far=400;
scene.add(sun);

function M(c,o){o=o||{};return new THREE.MeshStandardMaterial({color:c,roughness:o.r!=null?o.r:.7,metalness:o.m||0})}
function box(w,h,d,mat,x,y,z,p){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||scene).add(m);return m}
function cyl(rt,rb,h,mat,x,y,z,p,seg){var m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||scene).add(m);return m}

/* ground + subtle dunes */
var g=new THREE.PlaneGeometry(700,700,80,80);
var pa=g.attributes.position;
for(var i=0;i<pa.count;i++){var x=pa.getX(i),y=pa.getY(i);var d=Math.hypot(x,y);var h=d>120?(Math.sin(x*.03)*Math.cos(y*.025)*4+((d-120)*.02)):0;pa.setZ(i,h)}
g.computeVertexNormals();
var ground=new THREE.Mesh(g,M(0xCFAF7E,{r:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

/* route */
var route=new THREE.CatmullRomCurve3([
 new THREE.Vector3(-20,0,40),new THREE.Vector3(-55,0,30),new THREE.Vector3(-78,0,0),new THREE.Vector3(-70,0,-28), // to loading bay
 new THREE.Vector3(-45,0,-38),new THREE.Vector3(0,0,-30),new THREE.Vector3(40,0,-20),new THREE.Vector3(70,0,0),new THREE.Vector3(78,0,24), // to project
 new THREE.Vector3(55,0,48),new THREE.Vector3(15,0,52),new THREE.Vector3(-20,0,40)
],true,"catmullrom",.4);
var roadGeo=new THREE.TubeGeometry(route,400,3.6,4,true);
var road=new THREE.Mesh(roadGeo,M(0x4A4744,{r:.95}));road.scale.y=.02;road.position.y=.05;road.receiveShadow=true;scene.add(road);
var dashMat=new THREE.MeshBasicMaterial({color:0xF2E6C9});
for(var k=0;k<120;k++){var t=k/120,p=route.getPointAt(t),tg=route.getTangentAt(t);var dsh=new THREE.Mesh(new THREE.PlaneGeometry(.3,2.2),dashMat);dsh.rotation.x=-Math.PI/2;dsh.rotation.z=-Math.atan2(tg.z,tg.x)+Math.PI/2;dsh.position.set(p.x,.12,p.z);scene.add(dsh)}
var T_LOAD=.255,T_SITE=.66;

/* loading terminal (generic industrial, no brand marks) */
var steel=M(0xB8BCC2,{r:.4,m:.6}),white=M(0xF2F2EE,{r:.5}),pipe=M(0x8E949B,{r:.35,m:.7}),yellow=M(0xE7B416,{r:.6});
var T=new THREE.Group();T.position.set(-82,0,-48);scene.add(T);
box(36,.6,22,M(0xA99A84,{r:1}),0,.3,0,T);
[[-10,-4],[2,-6],[14,-3]].forEach(function(c){cyl(5,5,10,white,c[0],5.6,c[1],T,28);cyl(5.2,5.2,.6,pipe,c[0],10.9,c[1],T,28)});
var sph=new THREE.Mesh(new THREE.SphereGeometry(4.5,24,16),white);sph.position.set(-12,9,8);sph.castShadow=true;T.add(sph);cyl(.5,.5,5,pipe,-12,2.5,8,T);
for(var r=0;r<5;r++){box(.6,8,.6,steel,-4+r*4,4.6,8,T);}
box(18,.5,1.2,steel,4,8.5,8,T);box(18,.5,1.2,steel,4,6,8,T);
cyl(.35,.35,18,pipe,4,7.2,9.2,T).rotation.z=Math.PI/2;cyl(.35,.35,18,pipe,4,7.9,9.2,T).rotation.z=Math.PI/2;
/* loading gantry over bay */
var bay=route.getPointAt(T_LOAD);
var bayT=route.getTangentAt(T_LOAD);var G=new THREE.Group();G.position.copy(bay).add(bayT.clone().multiplyScalar(-2.4));G.rotation.y=-Math.atan2(bayT.z,bayT.x);scene.add(G);
[[-5,-4],[5,-4],[-5,4],[5,4]].forEach(function(c){box(.7,9,.7,steel,c[0],4.5,c[1],G)});
box(11,.8,9.4,M(0x6F757D,{r:.5,m:.5}),0,9.2,0,G);
box(11.2,.25,9.6,yellow,0,8.7,0,G);
var arm=new THREE.Group();arm.position.set(0,8.6,0);G.add(arm);
var armPipe=cyl(.3,.3,2,pipe,0,-1,0,arm);
var nozzle=cyl(.5,.35,.8,yellow,0,-2.4,0,arm);
/* project site */
var P=new THREE.Group();P.position.set(92,0,36);scene.add(P);
box(40,.4,34,M(0xC9AE84,{r:1}),0,.2,0,P);
var concrete=M(0xBFC2C4,{r:.9});
for(var f=0;f<4;f++){box(16,.5,12,concrete,6,2+f*4,-6,P);[[-1,-11],[13,-11],[-1,-1],[13,-1]].forEach(function(c){box(.8,4,.8,concrete,c[0],f*4+4,c[1],P)})}
/* tower crane */
var crane=new THREE.Group();crane.position.set(-12,0,-10);P.add(crane);
var cy=M(0xE7B416,{r:.6});
box(1.6,32,1.6,cy,0,16,0,crane);var jib=box(30,1.2,1.2,cy,8,32,0,crane);box(8,1,1,cy,-6,32,0,crane);box(3,2,3,M(0x777777),-9,31,0,crane);
cyl(.08,.08,10,M(0x333333),18,27,0,crane);
/* site diesel tank + generators */
var siteTank=new THREE.Group();scene.add(siteTank);
var st=cyl(1.4,1.4,5,M(0xE9E9E2,{r:.5}),0,2.2,0,siteTank);st.rotation.z=Math.PI/2;
box(.4,1.3,2.2,steel,-1.9,.65,0,siteTank);box(.4,1.3,2.2,steel,1.9,.65,0,siteTank);
box(7,3,3.2,M(0x2C5530,{r:.6}),12,1.5,10,P);box(7,3,3.2,M(0x2C5530,{r:.6}),12,1.5,15,P);
/* safety cones */
var cone=M(0xF37421,{r:.6});
function cones(grp,pts){pts.forEach(function(c){var m=new THREE.Mesh(new THREE.ConeGeometry(.45,1.2,14),cone);m.position.set(c[0],.6,c[1]);m.castShadow=true;grp.add(m)})}
/* fleet yard */
var Y=new THREE.Group();Y.position.set(-26,0,64);scene.add(Y);
box(42,.3,18,M(0x9C9284,{r:1}),0,.15,0,Y);
box(18,8,10,M(0xD9D6CF,{r:.8}),-10,4,-2,Y);box(18.6,.6,10.6,M(0x8C939C,{r:.4,m:.5}),-10,8.3,-2,Y);

/* realistic tractor + tank semi-trailer (procedural, metres; local +x = forward) */
var ROUTE_LEN=route.getLength();
var MAT={
 cab:new THREE.MeshPhysicalMaterial({color:0xF4F5F2,roughness:.28,metalness:.1,clearcoat:.8,clearcoatRoughness:.15}),
 tank:new THREE.MeshPhysicalMaterial({color:0xF2F3F1,roughness:.22,metalness:.25,clearcoat:1,clearcoatRoughness:.1}),
 navy:new THREE.MeshPhysicalMaterial({color:0x14306E,roughness:.3,metalness:.2,clearcoat:.9,clearcoatRoughness:.12}),
 chassis:new THREE.MeshStandardMaterial({color:0x1C1D20,roughness:.6,metalness:.4}),
 tire:new THREE.MeshStandardMaterial({color:0x151515,roughness:.95}),
 rim:new THREE.MeshStandardMaterial({color:0xCFD3D8,roughness:.25,metalness:.9}),
 chrome:new THREE.MeshStandardMaterial({color:0xDADDE2,roughness:.15,metalness:1}),
 glass:new THREE.MeshPhysicalMaterial({color:0x0D1622,roughness:.05,metalness:.6,clearcoat:1}),
 grille:new THREE.MeshStandardMaterial({color:0x2A2D33,roughness:.5,metalness:.6}),
 light:new THREE.MeshStandardMaterial({color:0xFFF6E0,emissive:0xFFF1C8,emissiveIntensity:.6,roughness:.2}),
 tail:new THREE.MeshStandardMaterial({color:0xB01515,emissive:0x6A0A0A,emissiveIntensity:.5,roughness:.3}),
 amber:new THREE.MeshStandardMaterial({color:0xF0A020,emissive:0x704000,emissiveIntensity:.4}),
 alu:new THREE.MeshStandardMaterial({color:0xB9BEC4,roughness:.35,metalness:.85})
};
function add(m,p,x,y,z){m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function bx(p,w,h,d,mat,x,y,z){return add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat),p,x,y,z)}
function wheel(p,x,z,dual,store){
 var g=new THREE.Group();g.position.set(x,.52,z);p.add(g);
 var n=dual?2:1;
 for(var i=0;i<n;i++){var off=(z>0?1:-1)*i*.3;
  var tire=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.29,26),MAT.tire);tire.rotation.x=Math.PI/2;tire.position.z=off;tire.castShadow=true;g.add(tire);
  var tread=new THREE.Mesh(new THREE.TorusGeometry(.47,.06,8,26),MAT.tire);tread.position.z=off;g.add(tread);}
 var rim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.3,20),MAT.rim);rim.rotation.x=Math.PI/2;rim.position.z=(z>0?1:-1)*(dual?.3:.02);g.add(rim);
 var hub=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.36,12),MAT.chrome);hub.rotation.x=Math.PI/2;hub.position.z=rim.position.z+(z>0?.04:-.04);g.add(hub);
 for(var k=0;k<8;k++){var a=k/8*Math.PI*2;var nut=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),MAT.chrome);nut.position.set(Math.cos(a)*.19,Math.sin(a)*.19,rim.position.z+(z>0?.16:-.16));g.add(nut)}
 store.push(g);return g;
}
function fender(p,x,z,len){var f=new THREE.Mesh(new THREE.CylinderGeometry(.66,.66,len,20,1,true,0,Math.PI),MAT.chassis);f.rotation.x=Math.PI/2;f.rotation.y=Math.PI/2;f.rotation.z=0;f.material.side=THREE.DoubleSide;f.position.set(x,.52,z);p.add(f);return f}

function brandTexture(){
 var cv=document.createElement("canvas");cv.width=1024;cv.height=256;var c=cv.getContext("2d");
 c.clearRect(0,0,1024,256);
 c.fillStyle="#FFFFFF";c.font="italic 800 120px 'IBM Plex Sans','Segoe UI',sans-serif";c.textAlign="center";c.textBaseline="alphabetic";
 c.fillText("FUEL APP",560,128);
 c.font="700 92px 'IBM Plex Sans Arabic','Segoe UI',sans-serif";c.fillText("فيــول آب",560,226);
 /* simple mark: F with drop (brand-like, drawn) */
 c.fillStyle="#3A78F2";c.fillRect(70,40,46,170);c.fillRect(70,40,140,40);c.fillRect(70,108,104,36);
 c.beginPath();c.arc(190,186,26,0,Math.PI*2);c.fillStyle="#F37421";c.fill();
 var t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;
}
var BRAND=brandTexture();

function makeTrailer(wheels){
 var t=new THREE.Group(); /* x=0 is the kingpin */
 var L=11.6,cx=-6.6,cy=2.45,ry=1.12,rz=1.25;
 /* main frame */
 bx(t,12.6,.22,1.0,MAT.chassis,-6.2,1.15,0);
 /* elliptical tank in two colours (white front, navy rear like the fleet) */
 function shell(len,x,mat){var g=new THREE.CylinderGeometry(1,1,len,48,1,true);var m=new THREE.Mesh(g,mat);m.rotation.z=Math.PI/2;m.scale.set(ry,1,rz);m.position.set(x,cy,0);m.castShadow=true;m.receiveShadow=true;t.add(m);return m}
 shell(5.6,cx+2.9,MAT.tank);shell(6.0,cx-2.9,MAT.navy);
 /* thin chrome ring at colour split */
 var ring=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,48),MAT.chrome);ring.rotation.y=Math.PI/2;ring.scale.set(1,ry,rz);ring.position.set(cx-.1,cy,0);t.add(ring);
 /* domed ends */
 function dome(x,dir,mat){var g=new THREE.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI/2);var m=new THREE.Mesh(g,mat);m.rotation.z=dir*-Math.PI/2;m.scale.set(ry,.42,rz);m.position.set(x,cy,0);m.castShadow=true;t.add(m)}
 dome(cx+5.7,1,MAT.tank);dome(cx-5.9,-1,MAT.navy);
 /* gold pinstripe along the navy section */
 [1,-1].forEach(function(z){var st=new THREE.Mesh(new THREE.BoxGeometry(6.0,.05,.02),new THREE.MeshStandardMaterial({color:0xD4A63A,metalness:.6,roughness:.3}));add(st,t,cx-2.9,cy-.55,z*(rz*.86));});
 /* branding on navy section */
 [1,-1].forEach(function(z){var p=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.05),new THREE.MeshBasicMaterial({map:BRAND,transparent:true}));p.position.set(cx-3.0,cy+.12,z*(rz+.005));if(z<0)p.rotation.y=Math.PI;t.add(p)});
 /* top catwalk + manholes + railing */
 bx(t,9.6,.05,.55,MAT.alu,cx,cy+ry+.03,0);
 for(var m=0;m<3;m++){var mh=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.14,20),MAT.alu);add(mh,t,cx+3.2-m*3.2,cy+ry+.1,0)}
 [1,-1].forEach(function(z){var rail=bx(t,9.4,.04,.04,MAT.alu,cx,cy+ry+.55,z*.3);for(var p=0;p<7;p++)bx(t,.04,.5,.04,MAT.alu,cx+4.6-p*1.53,cy+ry+.3,z*.3)});
 /* rear ladder */
 bx(t,.04,2.4,.04,MAT.alu,-12.15,2.2,.25);bx(t,.04,2.4,.04,MAT.alu,-12.15,2.2,-.25);
 for(var r=0;r<6;r++)bx(t,.04,.04,.5,MAT.alu,-12.15,1.2+r*.4,0);
 /* landing gear, side guards, hose box */
 [1,-1].forEach(function(z){bx(t,.12,.9,.12,MAT.chassis,-2.2,.62,.55*z);bx(t,.4,.06,.4,MAT.chassis,-2.2,.18,.55*z);
  bx(t,4.6,.08,.04,MAT.alu,-5.3,.95,1.12*z);bx(t,4.6,.08,.04,MAT.alu,-5.3,.72,1.12*z);
  bx(t,1.8,.55,.45,MAT.alu,-3.4,1.0,.82*z)});
 /* axles */
 [-8.9,-10.2,-11.5].forEach(function(x){[1,-1].forEach(function(z){wheel(t,x,.88*z,true,wheels)})});
 [1,-1].forEach(function(z){bx(t,3.6,.06,.8,MAT.chassis,-10.2,1.17,.98*z)});
 /* rear bumper + lights + reflective strip */
 bx(t,.15,.2,2.4,MAT.chassis,-12.35,.75,0);
 [1,-1].forEach(function(z){bx(t,.05,.16,.4,MAT.tail,-12.42,1.0,.95*z);bx(t,.05,.12,.12,MAT.amber,-12.42,1.0,.6*z)});
 bx(t,.03,.08,2.2,new THREE.MeshStandardMaterial({color:0xE04030,emissive:0x501008,roughness:.4}),-12.43,.78,0);
 /* discharge valve (rear, right side) */
 var v=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.4,12),MAT.chrome);v.rotation.x=Math.PI/2;add(v,t,-11.6,1.05,1.05);
 t.userData.hatch=new THREE.Vector3(cx,cy+ry+.2,0);t.userData.valve=new THREE.Vector3(-11.6,1.05,1.25);
 return t;
}

function makeRig(){
 var wheels=[];var tr=makeTractor(wheels),tl=makeTrailer(wheels);
 var g=new THREE.Group();g.add(tr);g.add(tl);scene.add(g);
 return {group:g,tractor:tr,trailer:tl,wheels:wheels};
}
var KING=1.9;   /* fifth wheel behind tractor front reference */
var TRL=10.2;   /* kingpin to trailer bogie centre */
function placeRig(rig,u){
 var front=route.getPointAt(((u%1)+1)%1);
 var back=route.getPointAt((((u-4.5/ROUTE_LEN)%1)+1)%1);
 var dir=new THREE.Vector3().subVectors(front,back).setY(0).normalize();
 var tractorPos=front.clone().sub(dir.clone().multiplyScalar(2.45));
 rig.tractor.position.set(tractorPos.x,0,tractorPos.z);rig.tractor.rotation.y=-Math.atan2(dir.z,dir.x);
 var king=tractorPos.clone().add(dir.clone().multiplyScalar(-1.9));
 var bog=route.getPointAt((((u-(2.45+1.9+TRL)/ROUTE_LEN)%1)+1)%1);
 var tdir=new THREE.Vector3().subVectors(king,bog).setY(0).normalize();
 rig.trailer.position.set(king.x,0,king.z);rig.trailer.rotation.y=-Math.atan2(tdir.z,tdir.x);
 return dir;
}

/* environment reflections */
(function(){var es=new THREE.Scene();var sg=new THREE.SphereGeometry(50,32,16);var cols=[];var pp=sg.attributes.position;
 for(var i=0;i<pp.count;i++){var y=pp.getY(i)/50;var c=new THREE.Color(y>0?0xCFE0EE:0xB89870).lerp(new THREE.Color(0xFFFFFF),y>0?Math.max(0,.4-y):0);cols.push(c.r,c.g,c.b)}
 sg.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));es.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
 var pm=new THREE.PMREMGenerator(renderer);var envT=pm.fromScene(es,.04).texture;window.envMapRef=envT;Object.keys(MAT).forEach(function(k){MAT[k].envMap=envT;MAT[k].envMapIntensity=.55;MAT[k].needsUpdate=true});})();
var rig=makeRig();
placeRig(rig,T_LOAD);rig.group.updateMatrixWorld(true);
(function(){var hw=rig.trailer.localToWorld(rig.trailer.userData.hatch.clone());G.position.set(hw.x,0,hw.z);G.rotation.y=rig.trailer.rotation.y;})();
/* parked fleet */
for(var q=0;q<3;q++){var pr=makeRig();var bx0=Y.position.x+14,bz=Y.position.z-5+q*4.6;pr.tractor.position.set(bx0,0,bz);pr.trailer.position.set(bx0-1.9,0,bz);}
/* ---------- Actros-style tractor (white, flat-front high cab) ---------- */
function makeTractor(wheels){
 var t=new THREE.Group();
 bx(t,6.4,.28,.9,MAT.chassis,-.2,.95,0);
 /* cab body: side profile, flat near-vertical front, high roof */
 var s=new THREE.Shape();
 s.moveTo(.95,1.12);s.lineTo(3.48,1.12);s.lineTo(3.52,2.35);s.lineTo(3.40,3.62);
 s.quadraticCurveTo(3.36,3.98,3.05,4.02);s.lineTo(1.15,4.02);s.quadraticCurveTo(.95,4.0,.95,3.75);s.lineTo(.95,1.12);
 var cg=new THREE.ExtrudeGeometry(s,{depth:2.36,bevelEnabled:true,bevelThickness:.1,bevelSize:.1,bevelSegments:4,curveSegments:12});
 cg.translate(0,0,-1.18);var cab=new THREE.Mesh(cg,MAT.cab);cab.castShadow=cab.receiveShadow=true;t.add(cab);
 /* roof air deflector */
 var sp=new THREE.Shape();sp.moveTo(1.1,4.02);sp.lineTo(2.85,4.05);sp.quadraticCurveTo(2.35,4.42,1.25,4.45);sp.lineTo(1.1,4.02);
 var spg=new THREE.ExtrudeGeometry(sp,{depth:2.3,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2});spg.translate(0,0,-1.15);
 add(new THREE.Mesh(spg,MAT.cab),t,0,0,0);
 /* windscreen (large, two-piece look) */
 var ws=bx(t,.05,1.12,2.25,MAT.glass,3.5,3.0,0);ws.rotation.z=-.1;
 bx(t,.06,1.1,.05,MAT.chassis,3.51,3.0,0).rotation.z=-.1;
 /* sun visor */
 var sv=bx(t,.45,.07,2.42,MAT.cab,3.56,3.66,0);sv.rotation.z=-.3;
 /* wide grille: dark panel + 4 horizontal chrome slats */
 bx(t,.07,1.05,1.95,MAT.grille,3.55,1.98,0);
 for(var i=0;i<4;i++)bx(t,.05,.07,1.9,MAT.chrome,3.6,1.6+i*.26,0);
 /* headlights: angled LED units at lower corners */
 [1,-1].forEach(function(z){
  var hl=bx(t,.1,.24,.62,MAT.grille,3.54,1.38,.86*z);
  bx(t,.04,.05,.58,MAT.light,3.6,1.47,.86*z);bx(t,.04,.12,.18,MAT.light,3.6,1.33,.98*z);bx(t,.04,.12,.18,MAT.light,3.6,1.33,.74*z);
  bx(t,.04,.07,.14,MAT.amber,3.58,1.36,1.18*z);
 });
 /* bumper: grey plastic + black lower, fog lights, step */
 bx(t,.32,.34,2.48,new THREE.MeshStandardMaterial({color:0x9AA0A6,roughness:.6}),3.47,1.12,0);
 bx(t,.34,.18,2.4,MAT.chassis,3.46,.84,0);
 [1,-1].forEach(function(z){var f=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.05,14),MAT.light);f.rotation.z=Math.PI/2;add(f,t,3.64,.86,.9*z)});
 /* side: door window outlines, aero corner deflector, entry steps, mirrors */
 [1,-1].forEach(function(z){
  bx(t,1.15,.72,.04,MAT.glass,2.65,3.22,1.27*z);
  bx(t,.12,1.9,.1,MAT.cab,3.3,2.6,1.26*z);
  for(var k=0;k<3;k++)bx(t,.62,.05,.32,MAT.alu,2.7,.58+k*.42,1.26*z);
  bx(t,.05,.6,.05,MAT.chassis,3.45,3.25,1.38*z);bx(t,.1,.42,.18,MAT.chassis,3.45,3.0,1.55*z);bx(t,.02,.38,.14,MAT.glass,3.51,3.0,1.55*z);
  bx(t,.05,.05,.3,MAT.chassis,3.45,3.52,1.4*z);
 });
 /* driver door (left = -z), hinged at front edge */
 var door=new THREE.Group();door.position.set(3.28,0,-1.28);t.add(door);
 bx(door,1.18,1.55,.06,MAT.cab,-.59,2.08,0);bx(door,1.1,.72,.04,MAT.glass,-.62,3.22,-.01);
 bx(door,.18,.05,.04,MAT.chrome,-1.0,2.4,-.04);
 t.userData.door=door;
 /* side skirts between axles */
 [1,-1].forEach(function(z){bx(t,1.6,.55,.05,MAT.cab,.55,1.05,1.18*z)});
 /* fuel + air tanks, exhaust behind cab */
 var ft=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,1.1,20),MAT.alu);ft.rotation.z=Math.PI/2;add(ft,t,.45,.95,1.0);
 var at=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.9,14),MAT.chassis);at.rotation.z=Math.PI/2;add(at,t,.45,.95,-1.0);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.5,12),MAT.chrome),t,.8,3.45,-.95);
 add(new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.12,24),MAT.chassis),t,-1.9,1.16,0);
 [1,-1].forEach(function(z){wheel(t,2.45,1.02*z,false,wheels);wheel(t,-1.25,.88*z,true,wheels);wheel(t,-2.6,.88*z,true,wheels)});
 fender(t,2.45,1.05,.4);fender(t,2.45,-1.05,.4);
 [1,-1].forEach(function(z){bx(t,2.3,.06,.75,MAT.chassis,-1.93,1.22,.95*z);bx(t,.05,.12,.35,MAT.tail,-3.4,1.0,1.0*z)});
 return t;
}

/* ---------- people: hi-vis crew ---------- */
var PM={skin:new THREE.MeshStandardMaterial({color:0xB98560,roughness:.7}),pants:new THREE.MeshStandardMaterial({color:0x22304F,roughness:.85}),
 vest:new THREE.MeshStandardMaterial({color:0xD8F03A,roughness:.6,emissive:0x2A3300,emissiveIntensity:.3}),strip:new THREE.MeshStandardMaterial({color:0xD9D9D9,roughness:.25,metalness:.6}),
 shirt:new THREE.MeshStandardMaterial({color:0x1F3D7A,roughness:.8}),hat:new THREE.MeshStandardMaterial({color:0xF4F4F2,roughness:.35}),boot:new THREE.MeshStandardMaterial({color:0x2B211A,roughness:.8})};
function limb(p,w,h,d,mat,x,y,z){var g=new THREE.Group();g.position.set(x,y,z);p.add(g);var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.y=-h/2;m.castShadow=true;g.add(m);return g}
function makePerson(shirtMat){
 var p=new THREE.Group();
 var legL=limb(p,.17,.86,.2,PM.pants,0,.92,.12),legR=limb(p,.17,.86,.2,PM.pants,0,.92,-.12);
 [legL,legR].forEach(function(l){var b=new THREE.Mesh(new THREE.BoxGeometry(.28,.12,.2),PM.boot);b.position.set(.05,-.86,0);l.add(b)});
 var torso=new THREE.Mesh(new THREE.BoxGeometry(.28,.62,.48),shirtMat||PM.shirt);torso.position.y=1.24;torso.castShadow=true;p.add(torso);
 var vest=new THREE.Mesh(new THREE.BoxGeometry(.31,.5,.5),PM.vest);vest.position.y=1.26;p.add(vest);
 [1.12,1.34].forEach(function(y){var s=new THREE.Mesh(new THREE.BoxGeometry(.32,.045,.51),PM.strip);s.position.y=y;p.add(s)});
 var armL=limb(p,.13,.66,.13,shirtMat||PM.shirt,0,1.52,.31),armR=limb(p,.13,.66,.13,shirtMat||PM.shirt,0,1.52,-.31);
 [armL,armR].forEach(function(a){var h=new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.11),PM.skin);h.position.y=-.71;a.add(h)});
 var neck=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.1,10),PM.skin);neck.position.y=1.6;p.add(neck);
 var head=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),PM.skin);head.position.y=1.74;head.scale.set(1,1.12,.95);head.castShadow=true;p.add(head);
 var hat=new THREE.Mesh(new THREE.SphereGeometry(.15,16,8,0,Math.PI*2,0,Math.PI/2),PM.hat);hat.position.y=1.79;p.add(hat);
 var brim=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.02,16),PM.hat);brim.position.set(.03,1.79,0);p.add(brim);
 p.userData={legL:legL,legR:legR,armL:armL,armR:armR,phase:0};p.visible=false;scene.add(p);return p;
}
function walkPose(p,moving,dt){var u=p.userData;if(moving){u.phase+=dt*7}else{u.phase*=.85}
 var s=Math.sin(u.phase)*(moving?.55:0);u.legL.rotation.z=s;u.legR.rotation.z=-s;u.armL.rotation.z=-s*.8;u.armR.rotation.z=s*.8;}
function pointAlong(pts,f){var L=[0],tot=0;for(var i=1;i<pts.length;i++){tot+=pts[i].distanceTo(pts[i-1]);L.push(tot)}
 var d=Math.max(0,Math.min(1,f))*tot;for(var j=1;j<pts.length;j++){if(d<=L[j]){var a=(d-L[j-1])/((L[j]-L[j-1])||1);return {p:pts[j-1].clone().lerp(pts[j],a),dir:pts[j].clone().sub(pts[j-1]).normalize()}}}
 return {p:pts[pts.length-1].clone(),dir:pts[pts.length-1].clone().sub(pts[pts.length-2]).normalize()}}
function face(p,dir){if(dir.lengthSq()>1e-6)p.rotation.y=-Math.atan2(dir.z,dir.x)}
var driver=makePerson(PM.shirt),crew=makePerson(new THREE.MeshStandardMaterial({color:0x6B6F76,roughness:.8}));

/* ---------- realism: textures, sky, palms, light poles ---------- */
function noiseTex(base,amp,size,rep){var cv=document.createElement("canvas");cv.width=cv.height=size;var c=cv.getContext("2d");var im=c.createImageData(size,size);
 var b=new THREE.Color(base);for(var i=0;i<size*size;i++){var n=(Math.random()-.5)*amp;im.data[i*4]=Math.max(0,Math.min(255,b.r*255+n));im.data[i*4+1]=Math.max(0,Math.min(255,b.g*255+n));im.data[i*4+2]=Math.max(0,Math.min(255,b.b*255+n*.9));im.data[i*4+3]=255}
 c.putImageData(im,0,0);var t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.encoding=THREE.sRGBEncoding;return t}
ground.material=new THREE.MeshStandardMaterial({map:noiseTex(0xCFAF7E,26,256,[60,60]),roughness:1});
road.material=new THREE.MeshStandardMaterial({map:noiseTex(0x47464A,30,256,[120,1]),roughness:.92});
(function(){var cv=document.createElement("canvas");cv.width=2;cv.height=256;var c=cv.getContext("2d");var g=c.createLinearGradient(0,0,0,256);
 g.addColorStop(0,"#6FA3D6");g.addColorStop(.55,"#BFD8EC");g.addColorStop(1,"#EADBC0");c.fillStyle=g;c.fillRect(0,0,2,256);
 var t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;scene.background=t;})();
function palm(x,z,h){var g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 var trunkM=new THREE.MeshStandardMaterial({color:0x7A5F43,roughness:.95}),leafM=new THREE.MeshStandardMaterial({color:0x4E7A3A,roughness:.8,side:THREE.DoubleSide});
 for(var i=0;i<8;i++){var s=new THREE.Mesh(new THREE.CylinderGeometry(.28-i*.012,.32-i*.012,h/8,10),trunkM);s.position.set(i*.05,h/16+i*h/8,0);s.castShadow=true;g.add(s)}
 for(var k=0;k<9;k++){var lf=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.7,6,1),leafM);var pa=lf.geometry.attributes.position;for(var v=0;v<pa.count;v++){var xx=pa.getX(v);pa.setY(v,pa.getY(v)*(1-Math.abs(xx)/2.2));pa.setZ(v,-Math.pow((xx+1.8)/3.6,2)*1.3)}lf.geometry.computeVertexNormals();
  lf.position.set(.4,h,0);lf.rotation.y=k/9*Math.PI*2;lf.rotation.x=-.15;lf.translateX(1.6);lf.castShadow=true;g.add(lf)}}
[[-46,72],[-8,74],[-52,52],[112,58],[112,14],[70,62],[-100,-20],[-60,-70]].forEach(function(p,i){palm(p[0],p[1],7+i%3)});
var poleM=new THREE.MeshStandardMaterial({color:0x8E949B,metalness:.7,roughness:.4});
for(var pi=0;pi<14;pi++){var tt=pi/14,pp=route.getPointAt(tt),tg=route.getTangentAt(tt),off=new THREE.Vector3(tg.z,0,-tg.x).multiplyScalar(6);
 var pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,8,8),poleM);pole.position.set(pp.x+off.x,4,pp.z+off.z);pole.castShadow=true;scene.add(pole);
 var lamp=new THREE.Mesh(new THREE.BoxGeometry(1.2,.15,.35),poleM);lamp.position.set(pp.x+off.x*.82,8,pp.z+off.z*.82);lamp.lookAt(pp.x,8,pp.z);scene.add(lamp)}
/* crisp shadows that follow the truck */
sun.shadow.mapSize.set(2048,2048);var sc2=sun.shadow.camera;sc2.left=-45;sc2.right=45;sc2.top=45;sc2.bottom=-45;sc2.updateProjectionMatrix();scene.add(sun.target);

/* hose (unloading) */
var hoseMat=M(0x111111,{r:.8});
var hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(1,0,1),new THREE.Vector3(2,0,2)]),20,.18,8),hoseMat);hose.visible=false;scene.add(hose);
cones(scene,[]);
var coneGrp=new THREE.Group();scene.add(coneGrp);
var site0=0;var site=route.getPointAt(T_SITE),siteTan=route.getTangentAt(T_SITE),siteSide=new THREE.Vector3(-siteTan.z,0,siteTan.x);
var tankPos=site.clone().add(siteSide.clone().multiplyScalar(8.5)).add(siteTan.clone().multiplyScalar(-15));siteTank.position.copy(tankPos);siteTank.rotation.y=-Math.atan2(siteTan.z,siteTan.x);
[[-21,4.5],[-9,4.5],[-21,12],[-9,12]].forEach(function(c){var v=site.clone().add(siteTan.clone().multiplyScalar(c[0])).add(siteSide.clone().multiplyScalar(c[1]));cones(coneGrp,[[v.x,v.z]])});
coneGrp.visible=false;

/* labels */
var tagA=$("sim-tagA"),tagB=$("sim-tagB");
var anchorA=new THREE.Vector3(bay.x,13,bay.z),anchorB=new THREE.Vector3(P.position.x-6,34,P.position.z-10);
function place(el,v){var p=v.clone().project(camera);if(p.z>1){el.style.display="none";return}el.style.display="";el.style.left=((p.x+1)/2*host.clientWidth)+"px";el.style.top=((1-p.y)/2*host.clientHeight)+"px"}

/* timeline */
var tPath=[[0,T_LOAD],[T_LOAD,T_LOAD],[T_LOAD,T_SITE],[T_SITE,T_SITE],[T_SITE,T_SITE],[T_SITE,1]];
var stage=0,stT=0,playing=true,follow=true,level=0;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function ease(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2}
function setStage(s){stage=s;stT=0;
 stepEls.forEach(function(li,i){li.className=i<s?"done":i===s?"now":""});
 $("sim-stTitle").textContent=STAGES[s][0];$("sim-stText").textContent=STAGES[s][1];
 var ph=$("sim-photos");ph.classList.toggle("on",s>=1&&s<=4);
 [].slice.call(ph.children).forEach(function(c,i){if(i<4)c.className=(s>1&&i<2)||(s===1&&stT>.5&&i<1)||(s>3&&i<4)||(s===3&&i<3)?"ok":""});
 $("sim-inv").hidden=s!==4;
}
setStage(0);
function updatePhotos(){var ph=$("sim-photos").children;var okN=0;
 if(stage===1)okN=stT/DUR[1]>.15?(stT/DUR[1]>.9?2:1):0;else if(stage===2)okN=2;else if(stage===3)okN=stT/DUR[3]>.36?(stT/DUR[3]>.88?4:3):2;else if(stage===4)okN=4;
 for(var i=0;i<4;i++)ph[i].className=i<okN?"ok":"";}
canvas.addEventListener("pointerdown",function(){follow=false;clearTimeout(window.__simF);window.__simF=setTimeout(function(){follow=true},6000)});

function resize(){var w=Math.max(host.clientWidth,10),h=Math.max(host.clientHeight,10);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<700?55:42;camera.updateProjectionMatrix()}
addEventListener("resize",resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(host);resize();
var visible=true,hold=false;if(window.IntersectionObserver)new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(host);

var clock=new THREE.Clock(),camTarget=new THREE.Vector3(),camPos=new THREE.Vector3();
var lastU=0;
var dead=false;
function frame(){
 if(dead)return;
 var dt=Math.min(clock.getDelta(),.05);
 if(!visible){requestAnimationFrame(frame);return}
 if(playing&&!hold){stT+=dt*(reduce?.7:1);if(stT>=DUR[stage])stT=DUR[stage]}
 var k=Math.min(stT/DUR[stage],1),seg=tPath[stage];
 var u=seg[0]===seg[1]?seg[0]:seg[0]+(seg[1]-seg[0])*ease(k);
 if(u>=1)u-=1;
 var pos=route.getPointAt(u),tan=route.getTangentAt(u);
 var dirv=placeRig(rig,u);tan=dirv;
 var moved=Math.abs(u-lastU);if(moved>.5)moved=0;lastU=u;rig.wheels.forEach(function(w){w.rotation.z-=moved*ROUTE_LEN/.52});
 /* loading arm + level */
 if(stage===1){var a=Math.min(k*3,1)*(k<.85?1:(1-k)/.15);armPipe.scale.y=1+a*1.2;armPipe.position.y=-1-a*1.2;nozzle.position.y=-2.4-a*2.35;level=Math.max(0,Math.min(1,(k-.15)/.7))}
 else{armPipe.scale.y=1;armPipe.position.y=-1;nozzle.position.y=-2.4}
 if(stage===3){level=1-Math.max(0,Math.min(1,(k-.4)/.45));
   var from=rig.trailer.localToWorld(rig.trailer.userData.valve.clone()),to=tankPos.clone().setY(1.2);
   var mid=from.clone().lerp(to,.5);mid.y=.2;
   hose.geometry.dispose();hose.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from,mid,to]),24,.18,8);hose.visible=k>.34&&k<.9}
 else hose.visible=false;
 coneGrp.visible=stage===3||stage===4;
 /* crew + door during unloading */
 var Tr=rig.tractor,Tl=rig.trailer,doorOpen=0;
 if(stage===3||stage===4){
   var W=function(o,x,z){return o.localToWorld(new THREE.Vector3(x,0,z)).setY(0)};
   var dPath=[W(Tr,2.75,-1.9),W(Tr,4.4,-1.9),W(Tr,4.4,1.95),W(Tr,1.0,2.0),W(Tl,-11.0,2.15)];
   var vw=W(Tl,-11.6,2.2),crewSpot=vw.clone().lerp(tankPos.clone().setY(0),.55),crewHome=tankPos.clone().add(siteTan.clone().multiplyScalar(6)).add(siteSide.clone().multiplyScalar(3)).setY(0);
   if(stage===3){doorOpen=Math.min(1,k/.06)*(k<.3?1:Math.max(0,1-(k-.3)/.05));
     var f=(k-.06)/.28;driver.visible=k>.05;var r=pointAlong(dPath,f);driver.position.copy(r.p);
     if(f<1)face(driver,r.dir);else face(driver,tankPos.clone().sub(driver.position));walkPose(driver,f>0&&f<1,dt);
     var g=(k-.05)/.27;crew.visible=true;var r2=pointAlong([crewHome,crewSpot],g);crew.position.copy(r2.p);if(g<1)face(crew,r2.dir);else face(crew,vw.clone().sub(crew.position));walkPose(crew,g>0&&g<1,dt);}
   else{var f2=k/.7;var rev=dPath.slice().reverse();var r3=pointAlong(rev,f2);driver.position.copy(r3.p);face(driver,r3.dir);walkPose(driver,f2<1,dt);driver.visible=f2<1;
     doorOpen=f2>.85&&k<.95?Math.min(1,(k-.6)/.06)*(1-Math.max(0,(k-.82)/.1)):0;
     var g2=k/.6;var r4=pointAlong([crewSpot,crewHome],g2);crew.position.copy(r4.p);face(crew,r4.dir);walkPose(crew,g2<1,dt);crew.visible=k<.98;}
 }else{driver.visible=false;crew.visible=false}
 Tr.userData.door.rotation.y=-1.15*Math.max(0,Math.min(1,doorOpen));
 /* shadows follow the rig */
 sun.target.position.copy(Tr.position);sun.position.copy(Tr.position).add(new THREE.Vector3(-55,90,35));
 $("sim-lvl").textContent=Math.round(level*CAP).toLocaleString("en-US")+L.unit;$("sim-lvlBar").style.width=(level*100)+"%";
 updatePhotos();
 /* camera */
 if(follow){
   var back=tan.clone().multiplyScalar(-1);
   var side=new THREE.Vector3(-tan.z,0,tan.x);
   var still=stage===1||stage===3||stage===4;
   var mid=rig.tractor.position.clone().add(dirv.clone().multiplyScalar(-5));camPos.copy(mid).add(back.multiplyScalar(still?18:26)).add(side.multiplyScalar(still?24:14));camPos.y=still?22:20;
   if(stage===3||stage===4){mid=rig.trailer.localToWorld(new THREE.Vector3(-9.5,0,3.5));camPos.copy(mid).add(side.clone().normalize().multiplyScalar(4)).add(tan.clone().multiplyScalar(-14));camPos.y=6.5;mid=mid.clone().add(side.clone().normalize().multiplyScalar(3.5))}
   camera.position.lerp(camPos,1-Math.pow(.02,dt));
   camTarget.lerp(mid.clone().setY(2.6),1-Math.pow(.01,dt));controls.target.copy(camTarget);
 }
 controls.update();
 renderer.render(scene,camera);
 place(tagA,anchorA);place(tagB,anchorB);
 requestAnimationFrame(frame);
}

var api={go:function(n,h){hold=!!h;if(n===0)level=0;if(n===2)level=1;setStage(n);if(n>=3)level=n===3?1:0},destroy:function(){dead=true;removeEventListener("resize",resize);try{renderer.dispose()}catch(x){}}};
requestAnimationFrame(frame);
return api;
}