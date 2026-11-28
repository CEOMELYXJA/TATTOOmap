import * as THREE from 'three';
const touchDetail=typeof globalThis.matchMedia==='function' && globalThis.matchMedia('(pointer: coarse)').matches;

// Small details are baked into the existing body / articulated part batches.
// They add no new draw calls and are never a substitute for the original photo.
const bead = new THREE.SphereGeometry(1, 10, 7);
const black = '#25272a', pearl = '#fff7e5';
const unit = [1,1,1], origin = [0,0,0];

// A shallow double-sided shell, curved along its length and across the shaft.
// Each feather is actual geometry baked into its existing animated wing batch.
function makeFeather() {
  const p=[],indices=[],rows=8,columns=4;
  for(let face=0;face<2;face++) for(let y=0;y<=rows;y++) {
    const t=y/rows, width=Math.pow(Math.sin(Math.PI*t),.72)*(1-.32*t);
    for(let x=0;x<=columns;x++) {
      const u=2*x/columns-1;
      p.push(u*width, .12*Math.sin(Math.PI*t)*(1-u*u)+(face?-.012:.012), t+.045*Math.sin(Math.PI*t));
    }
  }
  const count=(rows+1)*(columns+1);
  for(let face=0;face<2;face++) for(let y=0;y<rows;y++) for(let x=0;x<columns;x++) {
    const a=face*count+y*(columns+1)+x,b=a+columns+1;
    if(face) indices.push(a,a+1,b,a+1,b+1,b); else indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
const featherGeometry=makeFeather();

// A bounded implicit surface blends the torso, shoulder and head into a
// single continuous skin. Leg pivots and facial features remain separate so
// their existing animations and the particular tattoo's details are kept.
const organicBodies = new Map();
function organicGeometry(kind) {
  if(organicBodies.has(kind)) return organicBodies.get(kind);
  const shapes=kind==='bird' || kind==='raptor' || kind==='dragon' || kind==='owl' ? [
    [0,1.62,0,.32,.36,.68],[0,1.78,.50,kind==='owl'?.42:.28,kind==='owl'?.38:.29,.32]
  ] : kind==='butterfly' ? [
    [0,1.34,.03,.084,.37,.11],[0,1.72,.06,.105,.105,.105]
  ] : kind==='turtle' ? [
    [0,.44,0,.71,.45,.53],[.56,.43,0,.25,.17,.19],[.69,.43,0,.25,.15,.19]
  ] : kind==='seahorse' ? [
    [0,.87,0,.26,.39,.17],[-.03,1.10,0,.15,.32,.14],[.03,1.37,0,.16,.24,.14],[.21,1.52,.01,.24,.165,.13]
  ] : kind==='jellyfish' ? [
    [0,1.75,0,.73,.36,.65],[0,1.61,0,.66,.14,.57]
  ] : kind==='elk' ? [
    [-.13,1.15,0,.83,.48,.36],[.52,1.50,0,.35,.57,.31],[.74,1.98,0,.34,.30,.27],[1.02,1.84,0,.30,.17,.22]
  ] : kind==='anubis' ? [
    [0,1.56,0,.42,.53,.33],[0,1.34,.42,.19,.15,.34]
  ] : kind==='lioness' ? [
    [0,1.26,0,.66,.73,.44],[-.19,.98,.40,.25,.20,.17],[.19,.98,.40,.25,.20,.17]
  ] : kind==='scorpion' ? [
    [0,.48,.42,.33,.17,.17],[0,.48,.25,.305,.17,.17],[0,.48,.08,.28,.17,.17],
    [0,.48,-.09,.255,.17,.17],[0,.48,-.26,.23,.17,.17],[0,.48,-.43,.205,.17,.17],[0,.52,.57,.26,.16,.25]
  ] : kind==='gorilla' ? [
    [-.18,1.25,0,.63,.79,.49],[.16,1.88,0,.57,.56,.62],[.53,2.18,0,.42,.48,.415]
  ] : kind==='bear' ? [
    [0,.66,0,.40,.48,.28],[0,1.29,.035,.46,.40,.315]
  ] : kind==='frog' ? [
    [0,.68,0,.58,.31,.73],[0,.79,.51,.62,.25,.39]
  ] : kind==='octopus' ? [
    [0,1.72,0,.48,.62,.39],[0,1.22,.03,.50,.30,.43]
  ] : kind==='fish' || kind==='betta' || kind==='anglerfish' || kind==='swordfish' ? [
    [.04,.85,0,kind==='swordfish'?.87:kind==='anglerfish'?.65:.61,kind==='anglerfish'?.44:kind==='swordfish'?.22:.30,.245],
    [.41,.89,0,.32,.78*(kind==='anglerfish'?.44:.31),.22]
  ] : kind==='tiger-grey' ? [
    [-.27,1.42,0,1.05,.58,.45],[.48,1.49,0,.60,.70,.49],[.91,1.98,0,.48,.53,.49]
  ] : kind==='dog' || kind==='pug' ? [
    [0,1.28,0,.82,.49,.42],[.42,1.46,0,.48,.48,.40],[.67,1.82,0,.44,.45,.39],
    [kind==='pug'?.92:1.01,1.74,0,kind==='pug'?.18:.32,.19,.245]
  ] : kind==='cat' ? [
    [-.06,1.33,0,1.02,.51,.41],[.52,1.53,0,.53,.49,.42],[.91,1.99,0,.43,.43,.42],
    [1.16,1.90,-.125,.15,.13,.15],[1.16,1.90,.125,.15,.13,.15],
    [1.18,1.90,0,.15,.13,.19]
  ] : [
    [-.06,1.33,0,1.02,.51,.41],[.52,1.53,0,.53,.49,.42],[.91,1.99,0,.43,.43,.42]
  ];
  let bounds=[-1.48,.62,-.70,3.10,2.04,1.40,32,23,17];
  if(kind==='gorilla') bounds=[-1.20,.25,-.80,2.55,2.70,1.60,28,29,18];
  if(kind==='bear') bounds=[-.70,.05,-.55,1.40,1.80,1.10,22,27,18];
  if(kind==='frog') bounds=[-.82,.22,-.90,1.64,1.08,2.0,24,17,29];
  if(kind==='octopus') bounds=[-.70,.82,-.63,1.40,1.80,1.26,24,28,20];
  if(['bird','raptor','dragon','owl'].includes(kind)) bounds=[-.62,1.05,-.90,1.24,1.30,1.90,20,21,30];
  if(kind==='butterfly') bounds=[-.20,.88,-.20,.40,1.05,.47,14,30,16];
  if(kind==='turtle') bounds=[-.88,-.08,-.72,2.05,1.06,1.44,30,17,23];
  if(kind==='seahorse') bounds=[-.43,.35,-.35,1.0,1.50,.70,20,30,15];
  if(kind==='jellyfish') bounds=[-.90,1.28,-.83,1.80,.92,1.66,28,15,26];
  if(kind==='elk') bounds=[-1.16,.56,-.56,2.60,1.90,1.12,34,25,17];
  if(kind==='anubis') bounds=[-.60,.85,-.52,1.20,1.40,1.40,21,24,25];
  if(kind==='lioness') bounds=[-.84,.40,-.62,1.68,1.72,1.30,25,27,20];
  if(kind==='scorpion') bounds=[-.51,.18,-.80,1.02,.64,1.82,19,13,32];
  if(['fish','betta','anglerfish','swordfish'].includes(kind)) bounds=[-1.10,.25,-.43,2.15,1.25,.86,31,19,14];
  let [x0,y0,z0,wx,wy,wz,nx,ny,nz]=bounds;
  // Lower sampling density on touch devices keeps smooth normals and reduces memory.
  if(touchDetail){nx=Math.max(12,Math.round(nx*.76));ny=Math.max(12,Math.round(ny*.76));nz=Math.max(12,Math.round(nz*.76));}
  const dx=wx/nx,dy=wy/ny,dz=wz/nz, sx=nx+1,sy=ny+1,sz=nz+1;
  const values=new Float32Array(sx*sy*sz), index=(x,y,z)=>(z*sy+y)*sx+x;
  const field=(x,y,z)=>{
    let d=1e3;
    for(const [cx,cy,cz,rx,ry,rz] of shapes) {
      const a=(x-cx)/rx,b=(y-cy)/ry,c=(z-cz)/rz;
      const next=(Math.sqrt(a*a+b*b+c*c)-1)*Math.min(rx,ry,rz);
      const k=.19,h=Math.max(k-Math.abs(d-next),0)/k;
      d=Math.min(d,next)-h*h*k*.25;
    }
    return d;
  };
  for(let z=0;z<sz;z++) for(let y=0;y<sy;y++) for(let x=0;x<sx;x++)
    values[index(x,y,z)]=field(x0+x*dx,y0+y*dy,z0+z*dz);
  const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const position=[],normal=[];
  const vertex=(x,y,z)=>{
    const xm=Math.max(0,x-1),xp=Math.min(nx,x+1),ym=Math.max(0,y-1),yp=Math.min(ny,y+1),zm=Math.max(0,z-1),zp=Math.min(nz,z+1);
    const n=new THREE.Vector3((values[index(xp,y,z)]-values[index(xm,y,z)])/(Math.max(1,xp-xm)*dx),
      (values[index(x,yp,z)]-values[index(x,ym,z)])/(Math.max(1,yp-ym)*dy),
      (values[index(x,y,zp)]-values[index(x,y,zm)])/(Math.max(1,zp-zm)*dz)).normalize();
    return {p:new THREE.Vector3(x0+x*dx,y0+y*dy,z0+z*dz),n,d:values[index(x,y,z)]};
  };
  const crossing=(a,b)=>{const t=a.d/(a.d-b.d);return {p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()};};
  const triangle=(a,b,c)=>{
    const face=b.p.clone().sub(a.p).cross(c.p.clone().sub(a.p));
    if(face.dot(a.n)<0) [b,c]=[c,b];
    for(const v of [a,b,c]){position.push(v.p.x,v.p.y,v.p.z);normal.push(v.n.x,v.n.y,v.n.z);}
  };
  for(let z=0;z<nz;z++) for(let y=0;y<ny;y++) for(let x=0;x<nx;x++) {
    const d=offsets.map(([a,b,c])=>values[index(x+a,y+b,z+c)]);
    if(d.every(q=>q>=0)||d.every(q=>q<0)) continue;
    const v=offsets.map(([a,b,c])=>vertex(x+a,y+b,z+c));
    for(const ids of tetra) {
      const inside=ids.filter(i=>d[i]<0), outside=ids.filter(i=>d[i]>=0);
      if(!inside.length||inside.length===4) continue;
      if(inside.length===1) triangle(...outside.map(i=>crossing(v[inside[0]],v[i])));
      else if(inside.length===3) {const q=inside.map(i=>crossing(v[outside[0]],v[i]));triangle(q[0],q[2],q[1]);}
      else {
        const a=crossing(v[inside[0]],v[outside[0]]),b=crossing(v[inside[0]],v[outside[1]]),
          c=crossing(v[inside[1]],v[outside[0]]),e=crossing(v[inside[1]],v[outside[1]]);
        triangle(a,b,c);triangle(b,e,c);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));
  geometry.computeBoundingSphere();organicBodies.set(kind,geometry);return geometry;
}

// Call in place of the old torso / head spheres in feline and dog builders.
export function addOrganicBody(code,variant,b) {
  const tiger=code==='tiger',cat=code==='cat',dog=code==='dog',pug=code==='pug';
  const greyTiger=tiger&&variant==='blackwork';
  const feathered=['bird','raptor','owl','dragon'].includes(code);
  const wingedInsect=['butterfly','moth','insect'].includes(code);
  const birdColour=variant==='raven'?'#292b30':variant==='hummingbird'?'#6e4f89':
    code==='owl'?'#917654':code==='dragon'?'#506f7e':code==='raptor'?'#755a44':'#5d8495';
  const colour=feathered?birdColour:wingedInsect?'#29282a':
    code==='turtle'?'#668159':code==='seahorse'?'#d49f59':code==='jellyfish'?'#b69fa5':
    code==='elk'?'#726d64':code==='anubis'?'#34383a':code==='lioness'?'#aaa49c':code==='scorpion'?'#393a3b':
    code==='gorilla'?'#44454b':code==='bear'?'#e2a075':code==='frog'?'#7a915a':code==='octopus'?'#96928d':
    code==='anglerfish'?'#545868':code==='betta'?'#60899b':code==='swordfish'?'#60818d':code==='fish'?'#629c97':
    greyTiger?'#817f7c':tiger?'#ce8035':cat?(variant==='black'?'#35323c':
    variant==='sleepy'||variant==='cocotte'?'#898783':'#9d806a'):dog?(variant==='small-dog'?'#ab8365':'#99877e'):
    pug?'#c9af86':'#bd965d';
  const kind=greyTiger?'tiger-grey':dog?'dog':pug?'pug':cat?'cat':wingedInsect?'butterfly':
    ['bird','raptor','dragon','owl','turtle','seahorse','jellyfish','elk','anubis','lioness','scorpion',
      'gorilla','bear','frog','octopus','fish','betta','anglerfish','swordfish'].includes(code)?code:'feline';
  const geometry=organicGeometry(kind), first=Array.isArray(b.colors)?b.colors.length:0;
  b.add(geometry,origin,unit,colour);
  // Preserve the photograph's distinct head/neck colours with a soft, true
  // per-vertex transition over the continuous body rather than a second blob.
  if (!Array.isArray(b.colors)) return;
  const p=geometry.attributes.position, base=new THREE.Color(colour), tint=new THREE.Color(colour), shaded=new THREE.Color();
  if(feathered && code!=='owl') tint.set(variant==='raven'?'#44464a':variant==='hummingbird'?'#ab91bd':
    code==='dragon'?'#93b3ad':code==='raptor'?'#f0e5c8':'#c6d7c4');
  else if(code==='turtle') tint.set('#8f975f');
  else if(code==='elk') tint.set('#464641');
  else if(code==='lioness') tint.set('#c7c2b9');
  else if(code==='cat') tint.set(variant==='black'?'#4a484d':variant==='sleepy'||variant==='cocotte'?'#b1aca5':'#cfb59f');
  else if(dog||pug) tint.set(pug?'#39302e':variant==='small-dog'?'#d5b191':'#e0be98');
  const smooth=(a,z,v)=>{v=Math.max(0,Math.min(1,(v-a)/(z-a)));return v*v*(3-2*v);};
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    let blend=0;
    if(feathered && code!=='owl') blend=smooth(.15,.58,z)*smooth(1.38,1.75,y);
    else if(code==='turtle') blend=smooth(.30,.74,x);
    else if(code==='elk') blend=smooth(.12,.64,x)*smooth(1.10,1.66,y);
    else if(code==='lioness') blend=smooth(.24,.48,z)*(1-smooth(1.08,1.34,y));
    else if(code==='cat') blend=.48*smooth(1.00,1.32,x)*(1-smooth(2.02,2.20,y));
    else if(dog||pug) blend=.70*smooth(.74,1.18,x)*(1-smooth(1.90,2.10,y));
    shaded.copy(base).lerp(tint,blend);
    const variation=.96+.08*smooth(.4,2.1,y);
    const j=first+i*3;b.colors[j]=shaded.r*variation;b.colors[j+1]=shaded.g*variation;b.colors[j+2]=shaded.b*variation;
  }
}

function dot(b, p, size, colour) {
  b.add(bead, p, size, colour);
}
function random(seed) {
  let v = seed >>> 0 || 1;
  return () => ((v = (Math.imul(v, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function hash(value) {
  let h = 2166136261;
  for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Short individual, tapered filaments follow an ellipsoid rather than forming
// a visible outer shell. Their triangles are merged with the animal body.
function coat(b, centre, radii, shades, seed, count=160, floor=-Infinity, forwardLimit=Infinity) {
  if(touchDetail) count=Math.ceil(count*.7);
  const rnd=random(seed), groups=shades.map(()=>({p:[],i:[]}));
  for(let k=0;k<count;k++) {
    const u=rnd()*1.80-.90, around=rnd()*Math.PI*2, v=Math.sqrt(1-u*u);
    const p=new THREE.Vector3(centre[0]+radii[0]*u,centre[1]+radii[1]*v*Math.cos(around),centre[2]+radii[2]*v*Math.sin(around));
    if(p.y<floor || p.x>forwardLimit) continue;
    const normal=new THREE.Vector3(u/radii[0],v*Math.cos(around)/radii[1],v*Math.sin(around)/radii[2]).normalize();
    const direction=new THREE.Vector3(-.78,-.16,0).addScaledVector(normal,.30).normalize();
    const side=new THREE.Vector3().crossVectors(direction,normal).normalize();
    const length=.035+rnd()*.070, width=.0024+rnd()*.0022;
    p.addScaledVector(normal,.004);
    const tip=p.clone().addScaledVector(direction,length).addScaledVector(normal,.014);
    const a=p.clone().addScaledVector(side,width), c=p.clone().addScaledVector(side,-width), d=p.clone().addScaledVector(normal,width*1.3);
    const g=groups[Math.floor(rnd()*groups.length)], base=g.p.length/3;
    for(const q of [a,c,d,tip]) g.p.push(q.x,q.y,q.z);
    g.i.push(base,base+1,base+3,base+1,base+2,base+3,base+2,base,base+3);
  }
  for(let i=0;i<groups.length;i++) {
    const data=groups[i];if(!data.p.length) continue;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));
    geometry.setIndex(data.i);geometry.computeVertexNormals();
    b.add(geometry,origin,unit,shades[i]);geometry.dispose();
  }
}

function sideEye(b,x,y,z,iris,scale=1) {
  for(const side of [-1,1]) {
    dot(b,[x,y,side*z],[.041*scale,.050*scale,.013*scale],iris);
    dot(b,[x+.002,y,side*(z+.011*scale)],[.019*scale,.033*scale,.009*scale],black);
    dot(b,[x+.010*scale,y+.019*scale,side*(z+.019*scale)],[.010*scale,.012*scale,.006*scale],pearl);
    dot(b,[x-.010*scale,y-.012*scale,side*(z+.019*scale)],[.005*scale,.006*scale,.004*scale],'#d2dce0');
  }
}
function frontEye(b,x,y,z,iris,scale=1) {
  for(const side of [-1,1]) {
    dot(b,[side*x,y,z],[.044*scale,.048*scale,.012*scale],iris);
    dot(b,[side*x,y,z+.011*scale],[.022*scale,.032*scale,.009*scale],black);
    dot(b,[side*x+.010*scale,y+.017*scale,z+.019*scale],[.011*scale,.012*scale,.006*scale],pearl);
    dot(b,[side*x-.010*scale,y-.011*scale,z+.019*scale],[.005*scale,.006*scale,.004*scale],'#d2dce0');
  }
}

function furDetails(code,variant,b,workId) {
  const feline=['tiger','lion','cub','cat'].includes(code), dog=code==='dog'||code==='pug';
  if(!feline && !dog && code!=='gorilla' && code!=='bear' && code!=='elk') return;
  let centre,radii,shade;
  if(feline) {
    centre=variant==='blackwork'&&code==='tiger'?[-.27,1.42,0]:[-.06,1.33,0];
    radii=variant==='blackwork'&&code==='tiger'?[1.05,.58,.45]:[1.02,.51,.41];
    shade=code==='tiger'?(variant==='blackwork'?['#777572','#969390','#aaa7a3']:['#b96f2f','#ce8035','#dc944e']):
      code==='cat'?(variant==='black'?['#343139','#4a454e','#5a545c']:variant==='sleepy'||variant==='cocotte'?['#777570','#92908b','#a6a39d']:['#8c705c','#a38a74','#b79b85']):['#ad8350','#c49a64','#d2ae79'];
  } else if(dog) {
    centre=[0,1.28,0];radii=[.82,.49,.42];
    shade=code==='pug'?['#b59a73','#d0b58d','#dfc7a1']:variant==='small-dog'?['#997453','#b58d69','#c5a17d']:['#8b7a70','#a99589','#b9a59a'];
  } else if(code==='gorilla') { centre=[-.18,1.25,0];radii=[.63,.79,.49];shade=['#3e3f45','#525359','#66666b']; }
  else if(code==='bear') { centre=[0,.66,0];radii=[.40,.48,.28];shade=['#cd906f','#e2a075','#f0b58b']; }
  else { centre=[-.13,1.15,0];radii=[.83,.48,.36];shade=['#676159','#817970','#928b80']; }
  const seed=hash(`${workId}:${code}:${variant}`);
  coat(b,centre,radii,shade,seed,feline||dog?410:260,centre[1]-.24);
  // A shorter layer follows the forehead and neck; the eyes and muzzle stay clear.
  if(feline) {
    const head=code==='tiger'&&variant==='blackwork'?[.91,1.98,0]:[.91,1.99,0];
    const size=code==='tiger'&&variant==='blackwork'?[.48,.53,.49]:[.43,.43,.42];
    coat(b,head,size,shade,seed^0x873abc,180,head[1]-.13,head[0]+.12);
  } else if(dog) coat(b,[.67,1.82,0],[.44,.45,.39],shade,seed^0x873abc,150,1.69,.79);
  if(code==='tiger'&&variant==='blackwork') sideEye(b,1.362,2.09,.294,'#aaa9a2',.85);
  else if(feline&&code!=='cat'&&variant!=='sleepy') sideEye(b,1.11,2.065,.377,code==='cat'?'#b2bd78':'#b89151',1.08);
  else if(dog) sideEye(b,.918,1.908,.329,'#80634a',.96);
  else if(code==='gorilla') sideEye(b,.79,2.29,.308,'#846e5a',.84);
  else if(code==='bear') frontEye(b,.15,1.33,.352,'#755f51',.64);
  else if(code==='elk') sideEye(b,.91,2.03,.266,'#95816b',.45);
}

function featherDetail(part,code,variant) {
  const owl=code==='owl',dragon=code==='dragon';
  frontEye(part.body,owl?.17:.155,1.85,.825,owl?'#bc8840':'#8e755d',owl?.72:.52);
  if(dragon) return;
  const stroke=variant==='raven'?'#575a5d':owl?'#c3aa84':'#adb4a4';
  for(const side of [-1,1]) {
    const wing=part.make('wing',side,[side*.20,1.75,0]);
    for(let j=0;j<7;j++) {
      const x=.4+j*.162,y=.01+j*.07,z=-.11-j*.025;
      // Layered, gently rounded feathers provide depth around the upper wing.
      wing.add(featherGeometry,[side*x,y+.10,z-.31],[.085,.05,.43-j*.012],stroke,[0,side*.10,side*.08]);
      wing.rod([side*x,y+.09,z-.29],[side*(x+.035),y+.10,z+.13],.009,.003,stroke);
      for(let k=0;k<3;k++) {
        const dz=-.21+k*.10;
        wing.rod([side*x,y+.095,z+dz],[side*(x+.075),y+.09,z+dz+.075],.006,.002,stroke);
      }
    }
  }
}

function insectDetail(part,code,variant) {
  const light=variant==='blackwork'?'#b8b6b0':code==='moth'?'#dbc3a4':'#e1c18e';
  for(const side of [-1,1]) {
    const wing=part.make('flutter',side,[side*.04,1.43,0]);
    for(const face of [-1,1]) {
      for(let j=0;j<8;j++) {
        const x=.20+(j%4)*.15,y=j<4?.22:-.18,z=face*.083;
        dot(wing,[side*x,y,z],[.018,.024,.006],light);
      }
    }
  }
}

function swimmerDetail(part,code,variant) {
  const b=part.make('fish-body',1,[0,0,0]);
  if(code==='seahorse') {
    dot(b,[.257,1.58,.151],[.015,.017,.008],pearl);
    for(let i=0;i<5;i++) b.rod([-.11,1.26-i*.115,.145],[.10,1.28-i*.115,.15],.008,.004,'#f2d299');
    return;
  }
  const tint=code==='anglerfish'?'#858391':code==='betta'?'#aec9c9':'#a1c1b6';
  for(const side of [-1,1]) {
    dot(b,[.50,.98,side*.264],[.014,.017,.008],pearl);
    // Tiny offset scales and a curved gill follow the existing animated body.
    for(let row=0;row<3;row++) for(let col=0;col<5;col++) {
      const x=-.32+col*.125+(row%2)*.05,y=.72+row*.10;
      const h=(x/.70)**2+((y-.85)/.40)**2;if(h>.85)continue;
      const z=side*(.245*Math.sqrt(Math.max(.05,1-h))+.006);
      b.rod([x,y,z],[x+.035,y+.025,z],.009,.003,tint);
    }
    b.path([[.27,1.04,side*.20],[.22,.91,side*.23],[.24,.78,side*.20]],.012,tint);
  }
}

function reptileDetails(b,code) {
  if(code==='turtle') {
    sideEye(b,.78,.50,.17,'#9d9b66',.35);
    for(let j=-2;j<=2;j++) {
      const x=j*.20;
      b.path([[x-.12,.80,-.24],[x,.87,0],[x+.12,.80,.24]],.014,'#aab080');
    }
  } else {
    dot(b,[1.077,1.263,.385],[.010,.011,.006],pearl);
    for(let i=4;i<24;i+=2) {
      const a=i*.265,r=.23+i*.022,x=Math.cos(a)*r,z=Math.sin(a)*r*.78,y=.18+i*.009;
      b.rod([x,y+.105,z],[x+.038,y+.108,z+.018],.008,.003,'#c6b27c');
    }
  }
}

function otherCreature(b,code) {
  if(code==='lioness') {
    frontEye(b,.27,1.44,.465,'#9b8b71',.82);
    for(const side of [-1,1]) for(let i=0;i<5;i++) b.rod([side*(.27+i*.06),1.68-i*.035,.355],[side*(.32+i*.06),1.64-i*.035,.37],.008,.002,'#d0c7b9');
  } else if(code==='frog') {
    frontEye(b,.40,1.01,.86,'#a9b979',.75);
    for(const side of [-1,1])for(let i=0;i<6;i++) dot(b,[side*(.25+i*.045),.92-i*.014,.54-i*.08],[.022,.008,.018],'#a1b47e');
  } else if(code==='octopus') {
    frontEye(b,.27,1.29,.51,'#a59c91',.66);
    for(let j=0;j<14;j++) { const a=j*2.399963,y=1.5+(j%4)*.13;dot(b,[Math.cos(a)*.43,y,Math.sin(a)*.34],[.026,.016,.018],'#b7b1a8'); }
  } else if(code==='jellyfish') {
    for(let i=0;i<10;i++) {
      const a=i*Math.PI/5,c=Math.cos(a),s=Math.sin(a);
      b.path([[c*.12,2.08,s*.11],[c*.37,2.00,s*.33],[c*.62,1.81,s*.55]],.009,'#e4d5d0');
    }
  } else if(code==='scorpion') {
    for(const side of [-1,1]) {dot(b,[side*.12,.64,.72],[.025,.020,.020],'#b3aaa0');dot(b,[side*.12,.65,.735],[.009,.009,.007],pearl);}
    for(let i=0;i<5;i++) b.rod([-.20,.64,.37-i*.17],[.20,.64,.37-i*.17],.008,.004,'#aaa49b');
  } else if(code==='anubis') frontEye(b,.23,1.68,.353,'#d0b778',.45);
  else if(code==='reaper') {
    for(const side of [-1,1]) b.path([[side*.04,1.62,.45],[side*.10,1.58,.45],[side*.15,1.62,.44]],.009,'#8c8b85');
  } else if(code==='wings') {
    for(const side of [-1,1]) for(let i=0;i<8;i++) {
      const t=i/8,x=.23+t*1.1,y=1.45+.29*Math.sin(t*Math.PI*.68);
      b.rod([side*x,y,.01],[side*(x+.10),y-.31,.01],.009,.002,'#c9c5bc');
    }
  }
}

function personDetail(b,code,seed) {
  if(code==='face'||code==='greenfigure') {
    const r=random(code==='greenfigure'?1:seed);r();r();
    const x=.19+r()*.09,y=1.38+r()*.09;
    frontEye(b,x,y,.435,code==='greenfigure'?'#b6a04d':'#765744',.68);
  } else if(code==='helmet') {
    for(const side of [-1,1]) b.path([[side*.11,1.28,.57],[side*.23,1.29,.57],[side*.34,1.28,.50]],.012,'#d0b486');
  }
}

/** Add bounded, species-specific 3D detail to the existing animated motif. */
export function enhanceAnimal({code,variant,workId,identitySeed,body,part}) {
  const binding={body,make:part};
  furDetails(code,variant,body,workId);
  if(['bird','owl','raptor','dragon'].includes(code)) featherDetail(binding,code,variant);
  else if(['butterfly','moth','insect'].includes(code)) insectDetail(binding,code,variant);
  else if(['seahorse','fish','betta','anglerfish','swordfish'].includes(code)) swimmerDetail(binding,code,variant);
  else if(['snake','turtle'].includes(code)) reptileDetails(body,code);
  else otherCreature(body,code);
  personDetail(body,code,identitySeed);
}
