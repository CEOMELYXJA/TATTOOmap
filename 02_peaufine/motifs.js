import * as THREE from 'three';
import { buildSculpture } from './sculptures.js';
import { buildPrototypeRose, buildPrototypeSkulls } from './prototype-details.js';

// Each stationary body or animated limb is one draw, including all of its colours.
// Recipes are baked once, then the geometry is shared between encounters.
const clay = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true, side: THREE.DoubleSide });
const unitSphere = new THREE.SphereGeometry(1, 20, 14);
const unitBox = new THREE.BoxGeometry();
const identity = [0, 0, 0];
const vector = a => new THREE.Vector3(...a);
const ink = '#24232b', ivory = '#fff0ce', amber = '#e3af55';
const leaves = '#406e4a', stem = '#637947';

class Batch {
  constructor() { this.positions = []; this.normals = []; this.colors = []; }
  add(geo, pos, scale, color, rotation = identity, orientation) {
    const q = orientation || new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    const matrix = new THREE.Matrix4().compose(vector(pos), q, vector(scale));
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const p = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color(color);
    const attr = geo.attributes, ix = geo.index;
    const count = ix ? ix.count : attr.position.count;
    for (let i = 0; i < count; i++) {
      const j = ix ? ix.getX(i) : i;
      p.fromBufferAttribute(attr.position,j).applyMatrix4(matrix);
      n.fromBufferAttribute(attr.normal,j).applyNormalMatrix(normalMatrix);
      this.positions.push(p.x,p.y,p.z); this.normals.push(n.x,n.y,n.z);
      this.colors.push(c.r,c.g,c.b);
    }
  }
  ball(pos, radii, color, rotation) { this.add(unitSphere,pos,radii,color,rotation); }
  box(pos, size, color, rotation) { this.add(unitBox,pos,size,color,rotation); }
  rod(a, b, base, tip, color) {
    const dir = vector(b).sub(vector(a)), length = dir.length();
    if (length < .00001) return;
    const orient = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
    const g = new THREE.CylinderGeometry(tip,base,length,8);
    this.add(g,vector(a).lerp(vector(b),.5).toArray(),[1,1,1],color,identity,orient);
  }
  path(points, radius, color) {
    const line = new THREE.CatmullRomCurve3(points.map(vector));
    this.add(new THREE.TubeGeometry(line,Math.max(6,points.length*3),radius,5),identity,[1,1,1],color);
  }
  poly(points, depth, pos, color, rotation) {
    const shape = new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
    const geo = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:4});
    this.add(geo,pos,[1,1,1],color,rotation);
  }
  ring(pos,radius,tube,color,rotation) {
    this.add(new THREE.TorusGeometry(radius,tube,6,32),pos,[1,1,1],color,rotation);
  }
  mesh() {
    if (!this.positions.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
    g.computeBoundingSphere();
    return new THREE.Mesh(g,clay);
  }
}

function leg(b,x,z,back,color,thickness=.16) {
  const knee = x+(back ? -.19 : .02);
  b.ball([x,1.12,z],[thickness*1.45,.43,thickness*1.18],color,[0,0,back ? -.25 : .13]);
  b.rod([x,.97,z],[knee,.54,z],thickness,thickness*.72,color);
  b.rod([knee,.54,z],[x-.02,.17,z],thickness*.75,thickness*.54,color);
  b.ball([x+.08,.13,z],[.21,.12,thickness*.85],color);
}

// A black-and-grey tiger inspired by the frontal portrait in 2026-035.
// The face is sculpted in relief. The markings follow its volume instead of
// projecting the photograph onto a flat surface.
function tattooTiger(b) {
  const fur = '#817f7c', light = '#c6c2bb', shade = '#444443';
  // Torso and four weight-bearing legs, viewed most clearly from the side.
  b.ball([-.27,1.42,0],[1.05,.58,.45],fur);
  b.ball([.48,1.49,0],[.60,.70,.49],fur);
  for (const side of [-1,1]) {
    for (const x of [-.86,.56]) {
      const z=side*.29;
      b.ball([x,1.12,z],[.25,.42,.20],fur,[0,0,x<0?-.18:.06]);
      b.rod([x,1.04,z],[x-.04,.35,z],.18,.115,fur);
      b.ball([x+.08,.20,z],[.25,.14,.19],light);
      for(let toe=-1;toe<=1;toe++) b.path([[x+.19,.23,z+toe*.08],[x+.25,.18,z+toe*.08]],.012,shade);
    }
    // Tapered black stripes follow the curved flank.
    for(let i=0;i<7;i++) {
      const x=-.99+i*.25, span=Math.sqrt(Math.max(.1,1-((x+.27)/1.06)**2));
      const points=[[x,1.42+.55*span,side*.04],[x+.06,1.42+.36*span,side*.35*span],
        [x-.02,1.42+.02*span,side*.46*span],[x-.08,1.42-.23*span,side*.38*span]];
      for(let j=0;j<points.length-1;j++) b.rod(points[j],points[j+1],.065-j*.015,.050-j*.016,ink);
    }
  }
  b.path([[-1.24,1.48,0],[-1.60,1.34,-.02],[-1.84,.89,.03],[-2.15,.91,.05],[-2.28,1.10,.07]],.105,fur);
  for(let i=0;i<5;i++) b.ball([-1.52-i*.15,1.28-i*.065,.035],[.065,.12,.12],ink);

  // An enlarged, rounded forehead, narrowing into a muzzle with cheek ruffs.
  b.ball([.91,1.98,0],[.48,.53,.49],fur);
  b.ball([1.13,1.92,0],[.32,.38,.40],light);
  for(const side of [-1,1]) {
    const z=side*.32;
    b.ball([.79,2.39,z],[.16,.19,.14],ink);
    b.ball([.87,2.40,z],[.11,.12,.095],fur);
    // Cream markings surround the eyes and fan into the cheeks.
    b.ball([1.25,2.07,side*.23],[.10,.115,.16],light);
    b.ball([1.34,2.08,side*.23],[.028,.050,.075],ink);
    b.ball([1.366,2.09,side*.23],[.012,.023,.031],'#d8d5c5');
    b.ball([1.20,1.77,side*.30],[.19,.18,.19],light);
    // Fine, tapering curved stripes emulate the individual blackwork lines.
    const lines=[
      [[1.20,2.38,side*.02],[1.29,2.29,side*.06],[1.35,2.20,side*.11]],
      [[1.11,2.42,side*.13],[1.21,2.34,side*.18],[1.29,2.22,side*.20]],
      [[1.01,2.38,side*.25],[1.10,2.31,side*.31],[1.18,2.20,side*.36]],
      [[1.03,2.19,side*.43],[1.14,2.15,side*.41],[1.24,2.12,side*.34]],
      [[1.05,2.04,side*.45],[1.16,2.01,side*.43],[1.25,1.99,side*.36]],
      [[1.04,1.92,side*.44],[1.14,1.88,side*.42],[1.24,1.86,side*.35]],
      [[1.05,1.80,side*.39],[1.13,1.75,side*.38],[1.21,1.74,side*.31]],
    ];
    for (const points of lines) {
      b.rod(points[0],points[1],.043,.029,ink);
      b.rod(points[1],points[2],.029,.006,ink);
    }
    b.ball([1.38,1.81,side*.13],[.15,.13,.16],light);
    for(let i=0;i<4;i++) {
      const y=1.83-i*.035;
      b.rod([1.46,y,side*.14],[1.52,y+.025-i*.016,side*(.54+i*.035)],.009,.002,light);
    }
  }
  b.ball([1.48,1.88,0],[.075,.055,.12],ink);
  b.path([[1.49,1.84,0],[1.48,1.76,0],[1.43,1.72,-.12]],.018,ink);
  b.path([[1.48,1.76,0],[1.43,1.72,.12]],.018,ink);
  b.ball([1.25,1.59,0],[.18,.11,.24],light);
}

function feline(b,code,variant) {
  if (code==='tiger' && variant==='blackwork') return tattooTiger(b);
  const stripes = code==='tiger', mane = code==='lion', kitten = code==='cat', cub = code==='cub';
  // The photographed back piece is black and grey, rather than an orange tiger.
  const body = stripes ? (variant==='blackwork' ? '#8c8984' : '#ce8035') : kitten ? (variant==='black' ? '#35323c' : '#9d806a') : '#bd965d';
  const headY = 1.99, hx = .91;
  b.ball([-.06,1.33,0],[1.02,.51,.41],body);
  b.ball([.52,1.53,0],[.53,.49,.42],body);
  for (const s of [-1,1]) {
    leg(b,-.69,s*.28,true,body); leg(b,.59,s*.26,false,body);
  }
  b.path([[-.9,1.41,0],[-1.29,1.4,-.05],[-1.56,.91,.04],[-1.89,1.0,.12],[-1.96,1.31,.15]],.094,body);
  if (mane || stripes || cub) b.ball([-1.96,1.31,.15],[.12,.19,.12],mane?'#7e4a2d':ink);
  if (mane) {
    b.ball([.71,1.85,0],[.54,.67,.56],'#714328');
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      b.ball([.75,1.83+.45*Math.cos(a),.39*Math.sin(a)],[.39,.29,.18],i%2?'#8e5129':'#a06137',[a,0,-.18]);
    }
  }
  b.ball([hx,headY,0],[.43,.43,.42],body);
  for(const s of [-1,1]){
    const z=s*.27;
    if(kitten) {
      b.poly([[-.17,0],[.11,0],[-.09,.37]],.13,[hx-.09,2.22,z-.065],body);
      b.poly([[-.11,0],[.06,0],[-.065,.22]],.018,[hx-.07,2.25,z+s*.075],'#b48b91');
    } else {
      b.ball([hx-.17,2.31,z],[.14,.18,.11],ink);
      b.ball([hx-.14,2.32,z+s*.07],[.096,.12,.055],body);
    }
    b.ball([hx+.20,2.06,s*.318],[.105,.082,.062],ink);
    b.ball([hx+.23,2.075,s*.358],[.05,.052,.03],amber);
    b.ball([hx+.33,1.9,s*.145],[.19,.15,.18],ivory);
    if(stripes){
      // Curved tapering bands follow the side of the barrel and flank.
      for(let i=0;i<7;i++){
        const x=-.76+i*.23, r=Math.sqrt(Math.max(.08,1-((x+.06)/1.02)**2));
        const ys=[.94,.68,.29,-.04], xs=[0,.035,-.015,-.10];
        const pts=ys.map((y,j)=>[x+xs[j],1.33+.51*r*y,s*(.41*r*Math.sqrt(1-y*y)+.015)]);
        for(let j=0;j<3;j++) b.rod(pts[j],pts[j+1],.058-j*.012,.049-j*.016,ink);
      }
      b.path([[hx-.16,2.26,s*.19],[hx-.04,2.2,s*.34],[hx+.03,2.11,s*.4]],.033,ink);
      b.path([[hx-.13,1.99,s*.4],[hx,1.95,s*.425],[hx+.10,1.92,s*.36]],.031,ink);
    }
    if(kitten) for(let i=0;i<3;i++) b.rod([1.24,1.90-i*.035,s*.16],[1.36-i*.05,1.95-i*.07,s*.48],.011,.004,ivory);
  }
  b.ball([1.34,1.97,0],[.085,.07,.10],ink);
  if(stripes){
    // The source tattoo is a frontal tiger portrait. Define the face in depth,
    // with both eyes, cheek ruffs and dark markings visible from the front.
    for(const s of [-1,1]){
      b.ball([1.27,2.08,s*.20],[.075,.09,.095],ink);
      b.ball([1.33,2.09,s*.20],[.028,.043,.041],variant==='blackwork'?ivory:amber);
      b.ball([1.17,1.87,s*.31],[.20,.19,.17],ivory);
      b.path([[1.22,2.24,s*.035],[1.30,2.19,s*.10],[1.32,2.14,s*.14]],.025,ink);
      b.path([[1.21,2.25,s*.16],[1.27,2.18,s*.23],[1.23,2.14,s*.30]],.032,ink);
      b.path([[1.19,2.03,s*.34],[1.25,1.99,s*.31],[1.28,1.97,s*.25]],.025,ink);
      b.path([[1.14,1.92,s*.36],[1.20,1.89,s*.31],[1.25,1.87,s*.26]],.022,ink);
      b.ball([.84,2.35,s*.30],[.13,.15,.13],ink);
      b.ball([.94,2.36,s*.30],[.055,.085,.075],body);
      for(let i=0;i<3;i++){
        b.rod([1.33,1.89-i*.035,s*.17],[1.43,1.90-i*.045,s*(.47+i*.045)],.012,.004,ivory);
      }
    }
    b.ball([1.32,1.86,0],[.17,.12,.20],ivory);
    b.poly([[-.1,.02],[.1,.02],[0,-.12]],.025,[1.43,1.93,-.01],ink,[0,Math.PI/2,0]);
    b.path([[1.45,1.84,0],[1.44,1.78,-.10],[1.39,1.78,-.16]],.018,ink);
    b.path([[1.45,1.84,0],[1.44,1.78,.10],[1.39,1.78,.16]],.018,ink);
  }
}

function dog(b,pug) {
  const color=pug?'#c9af86':'#a97551', dark=pug?'#39302e':'#704434';
  b.ball([0,1.28,0],[.82,.49,.42],color);
  for(const s of [-1,1]) for(const x of [-.54,.51]) leg(b,x,s*.27,x<0,color);
  b.ball([.67,1.82,0],[.44,.45,.39],color);
  for(const s of [-1,1]){
    b.ball([.56,1.91,s*.34],[.20,.27,.11],dark,[s*.14,0,-.25]);
    b.ball([.91,1.90,s*.265],[.086,.096,.066],ink);
    b.ball([.93,1.925,s*.31],[.025,.024,.016],ivory);
  }
  b.ball([pug?1.0:1.11,1.74,0],[pug?.18:.33,.19,.245],pug?dark:'#e0be98');
  b.ball([pug?1.15:1.38,1.82,0],[.075,.073,.12],ink);
  b.path(pug?[[-.68,1.40,0],[-.94,1.73,0],[-.74,1.92,.02],[-.61,1.74,.04]]:[[-.66,1.4,0],[-1.07,1.47,.04],[-1.36,1.76,.1]],.092,color);
}

function primateOrBear(b,gorilla) {
  const fur=gorilla?'#44454b':'#d79778', cheeks=gorilla?'#605750':'#f1c6a2';
  b.ball([-.18,1.25,0],[.63,.79,.49],fur,[0,0,.26]);
  b.ball([.16,1.88,0],[.57,.56,.62],fur);
  b.ball([.53,2.18,0],[.42,.48,.415],fur);
  b.ball([.83,2.07,0],[.24,.26,.29],cheeks);
  b.ball([1.0,2.13,0],[.11,.085,.16],ink);
  for (const s of [-1,1]){
    leg(b,-.4,s*.30,true,fur,.215);
    const z=s*.45;
    b.ball([.24,1.76,z],[.34,.41,.27],fur);
    b.rod([.29,1.71,z],[.56,1.09,z*1.15],.23,.17,fur);
    b.rod([.56,1.09,z*1.15],[.80,.27,z],.205,.135,fur);
    b.ball([.83,.17,z],[.23,.16,.17],cheeks);
    b.ball([.37,gorilla?2.25:2.53,s*.34],[.13,.15,.10],fur);
    b.ball([.79,2.29,s*.252],[.081,.079,.055],ink);
    if (gorilla) b.ball([.73,2.37,s*.195],[.145,.081,.18],fur,[.18*s,0,0]);
  }
}

function flight(b,part,code) {
  const owl=code==='owl', eagle=code==='raptor', dragon=code==='dragon';
  const body=owl?'#917654':dragon?'#506f7e':eagle?'#755a44':'#5d8495';
  const light=dragon?'#93b3ad':owl?'#dcc39b':eagle?'#f0e5c8':'#c6d7c4';
  b.ball([0,1.62,0],[.32,.36,.68],body,[.23,0,0]);
  b.ball([0,1.78,.50],[owl?.42:.28,owl?.38:.29,.32],owl?body:light);
  if(owl) {
    for (const s of [-1,1]) {
      b.ball([s*.17,1.81,.74],[.20,.22,.058],light);
      b.poly([[-.13,0],[.14,0],[s*.15,.23]],.13,[s*.25,2.00,.45],body);
    }
  }
  for(const s of [-1,1]){
    b.ball([s*(owl?.17:.155),1.85,.755],[owl?.096:.066,owl?.11:.071,.05],amber);
    b.ball([s*(owl?.17:.155),1.85,.799],[.041,.056,.025],ink);
    if(dragon) {
      b.rod([s*.17,1.96,.41],[s*.26,2.23,.17],.08,.006,ivory);
      b.rod([s*.18,1.56,.31],[s*.31,1.24,.43],.092,.047,body);
    }
    const wing=part('wing',s,[s*.20,1.75,0]);
    const outline=dragon?[[0,.16],[s*.71,.65],[s*1.52,.82],[s*1.17,.23],[s*1.06,.36],[s*.79,.01],[s*.62,.17],[s*.25,-.28],[0,-.22]]:
      [[0,.10],[s*.77,.35],[s*1.59,.58],[s*1.27,.16],[s*.69,-.13],[s*.13,-.24]];
    wing.poly(outline,.09,[0,0,0],dragon?'#778f9e':body,[-.42,0,0]);
    if(dragon) {
      for (const [x,y] of [[1.49,.8],[1.10,.28],[.78,.02],[.28,-.16]]) {
        wing.rod([s*.65,.54,-.08],[s*x,y,.055],.04,.014,body);
      }
    } else {
      for(let j=0;j<7;j++) {
        const x=.4+j*.162, y=.01+j*.07;
        wing.ball([s*x,y,-.11-j*.025],[.13,.105,.38-j*.012],j%2?light:body,[.31,s*(.13+j*.07),s*.25]);
      }
    }
  }
  if(dragon) {
    b.ball([0,1.72,.83],[.19,.12,.23],body);
    b.path([[0,1.52,-.54],[.1,1.39,-.98],[.46,1.53,-1.40],[.59,1.77,-1.67]],.09,body);
    for(let j=0;j<6;j++) b.rod([0,1.92-j*.04,.34-j*.17],[0,2.10-j*.055,.25-j*.17],.065,.003,ivory);
  } else {
    b.rod([0,1.74,.77],[0,1.66,.99],.105,.008,'#d9a850');
    for(const side of [-1,0,1]) b.ball([side*.10,1.47,-.74],[.10,.045,.39],body,[-.15,side*.15,0]);
  }
}

function butterfly(b,part,code,variant) {
  const moth=code==='moth', delicate=code==='insect';
  const outline='#29282a', colour=variant==='blackwork'?'#969493':moth?'#c5a67c':delicate?'#9bbcac':'#d58141';
  b.ball([0,1.34,.03],[.084,.37,.11],outline);
  b.ball([0,1.72,.06],[.105,.105,.105],outline);
  for(const s of [-1,1]){
    b.path([[s*.045,1.79,.07],[s*.095,1.94,.08],[s*.19,2.00,.055]],.014,outline);
    const w=part('flutter',s,[s*.04,1.43,0]);
    // The photographed wings are full, rounded and shaded, with dark veins.
    // Layered shallow volumes keep the wings visible from both sides.
    w.ball([s*.48,.25,0],[.58,.30,.055],outline,[0,0,s*.46]);
    w.ball([s*.45,-.20,0],[.43,.28,.055],outline,[0,0,-s*.32]);
    for(const face of [-1,1]) {
      const z=face*.055;
      w.ball([s*.47,.25,z],[.50,.245,.016],colour,[0,0,s*.46]);
      w.ball([s*.44,-.20,z],[.35,.22,.016],colour,[0,0,-s*.32]);
      // Radiating lines and spots echo the engraved wings of the reference.
      const front=face*.077;
      for(const end of [[.88,.51],[.90,.31],[.78,.11],[.66,-.03],[.69,-.22],[.54,-.39]]) {
        w.path([[s*.08,0,front],[s*(end[0]*.49),end[1]*.52,front],[s*end[0],end[1],front]],.014,outline);
      }
      for(let j=0;j<4;j++) w.ball([s*(.75-j*.12),.41-j*.045,face*.08],[.045,.06,.009],j%2?outline:ivory);
      w.ball([s*.58,-.20,face*.08],[.095,.12,.01],outline,[0,0,s*.2]);
      w.ball([s*.58,-.20,face*.092],[.047,.06,.008],ivory,[0,0,s*.2]);
    }
  }
}

function pond(b) {
  b.ball([0,.064,0],[1.34,.075,.70],'#558d89');
  b.ball([-.63,.14,-.31],[.21,.10,.15],'#809286');
  for(let j=0;j<4;j++) {
    const x=1.03+j*.06;
    b.rod([x,.09,-.15],[x+.06,.43+j*.027,-.17],.024,.005,leaves);
  }
}

function fish(b,part,code){
  pond(b);
  const deep=code==='anglerfish', betta=code==='betta', sword=code==='swordfish';
  const body=deep?'#545868':betta?'#60899b':sword?'#60818d':'#629c97';
  const fin=deep?'#a59080':betta?'#c77ba1':'#789baf', y=.85;
  if (code==='seahorse'){
    b.path([[.00,.78,0],[-.03,1.04,0],[.03,1.43,0],[.23,1.54,0]],.13,'#d49f59');
    b.ball([0,.87,0],[.26,.39,.17],'#e0ae64');
    b.ball([.21,1.52,.01],[.24,.165,.13],'#e3b76e');
    b.rod([.39,1.49,0],[.60,1.37,0],.094,.061,'#c99252');
    b.ball([.25,1.56,.13],[.039,.04,.02],ink);
    b.path([[0,.63,0],[-.18,.42,0],[-.43,.42,0],[-.47,.56,0],[-.37,.62,0],[-.31,.56,0]],.07,'#cd9858');
    for(let j=0;j<5;j++) b.rod([-.13,1.28-j*.12,0],[-.29,1.31-j*.12,0],.048,.009,'#a97046');
    return;
  }
  b.ball([.04,y,0],[sword?.87:deep?.65:.61,deep?.44:sword?.22:.30,.245],body);
  b.ball([.41,y+.04,0],[.32,.78*(deep?.44:.31),.22],body);
  for(const s of [-1,1]){
    b.ball([.47,y+.105,s*.208],[.083,.091,.037],ivory);
    b.ball([.495,y+.104,s*.236],[.049,.055,.026],ink);
    b.ball([.05,y-.11,s*.23],[.18,.045,.16],fin,[s*.35,0,-.25]);
  }
  const tail=part('tail',1,[-.47,y,0]);
  if (betta) {
    tail.poly([[.04,.12],[-.25,.32],[-.65,.53],[-.81,.41],[-.86,.1],[-.82,-.14],[-.63,-.48],[-.31,-.39],[.04,-.10]],.045,identity,fin);
    for(let j=-2;j<=2;j++) tail.path([[0,0,.06],[-.31,j*.08,.055],[-.67,j*.18,.065]],.015,'#a75d87');
    b.poly([[-.4,0],[-.37,-.23],[-.10,-.48],[.25,-.31],[.32,-.12]],.05,[0,y-.13,0],fin);
  } else {
    tail.poly([[.10,0],[-.54,.42],[-.35,.02],[-.57,-.34]],.055,identity,fin);
  }
  b.poly([[-.48,0],[-.08,sword?.61:.35],[.10,0]],.045,[0,y+(sword?.15:.24),0],fin);
  if(sword) b.rod([.61,y+.05,0],[1.55,y+.14,0],.089,.002,body);
  if(deep){
    b.ball([.62,y-.08,.09],[.15,.20,.16],ink,[0,0,-.32]);
    for(let j=0;j<5;j++) b.rod([.52+j*.052,y+.046,.216],[.53+j*.049,y-.08,.223],.03,.001,ivory);
    b.path([[.12,1.21,0],[.29,1.60,0],[.61,1.65,0],[.74,1.47,0]],.025,fin);
    b.ball([.74,1.45,0],[.087,.090,.084],'#f6dc97');
  }
}

function reptile(b,code){
  if(code==='turtle'){
    b.ball([0,.44,0],[.71,.45,.53],'#668159');
    b.ball([.69,.43,0],[.25,.15,.19],'#8f975f');
    for(const s of [-1,1]){
      b.ball([.77,.49,s*.14],[.033,.035,.025],ink);
      for(const x of [-.43,.43]) b.ball([x,.22,s*.38],[.19,.13,.14],'#879259');
      for(let j=0;j<3;j++) b.ball([-.31+j*.31,.76,s*.16],[.135,.066,.14],'#8e995e');
    }
  }else{
    const pts=[];
    for(let i=0;i<28;i++){const a=i*.265,r=.23+i*.022;pts.push([Math.cos(a)*r,.18+i*.009,Math.sin(a)*r*.78]);}
    pts.push([.51,.66,.62],[.75,1.04,.45],[.92,1.20,.27]);
    b.path(pts,.11,'#7d915c');
    for(let i=3;i<26;i+=4) b.ball(pts[i],[.115,.115,.115],'#b99d62');
    b.ball([1.01,1.20,.24],[.21,.12,.15],'#829767');
    b.ball([1.07,1.25,.365],[.031,.032,.02],ink);
    b.rod([1.18,1.18,.24],[1.37,1.17,.24],.019,.01,'#b8665d');
    b.rod([1.32,1.17,.24],[1.40,1.18,.32],.012,.002,'#b8665d');
  }
}

function leaf(b,a,end,color){
  const d=vector(end).sub(vector(a)), length=d.length(), mid=vector(a).lerp(vector(end),.5);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  b.add(unitSphere,mid.toArray(),[length*.15,length*.52,length*.076],color,identity,q);
}
function bloom(b,x,y,z,scale,code,tint) {
  const rose=code==='rose', sunflower=code==='sunflower', lotus=code==='lotus', small=code==='blossom';
  const petals=rose?11:sunflower?16:lotus?10:small?5:6;
  const hue=rose?'#b74455':sunflower?'#df9c2a':lotus?'#df919f':tint;
  const tip=rose?'#dc6572':sunflower?'#f1b942':lotus?'#f1bcca':small?'#edd2cb':'#c98ba0';
  const layers=rose||lotus?3:sunflower?2:1;
  // Petals curl around a gently forward-facing corolla so side views retain depth.
  for(let k=0;k<layers;k++) {
    const n=petals-k*(rose?3:1), radius=(rose?.33:lotus?.33:.36)*scale*(1-k*.25);
    for(let j=0;j<n;j++){
      const a=2*Math.PI*j/n+k*.67;
      const p=[x+Math.sin(a)*radius,y+Math.cos(a)*radius*.81+k*.036*scale,
        z-Math.cos(a)*radius*.44+k*.104*scale];
      const width=(rose?.24:lotus?.16:sunflower?.085:small?.18:.23)*scale*(1-k*.17);
      const height=(rose?.26:sunflower?.33:.31)*scale*(1-k*.18);
      b.ball(p,[width,height,(rose?.09:.065)*scale],j%4===0?tip:hue,[-.42,rose?.34:0,-a+(rose?.42:.05)]);
    }
  }
  b.ball([x,y+.025*scale,z+.045*scale],[scale*(sunflower?.245:.105),scale*(sunflower?.21:.10),.12*scale],sunflower?'#614333':rose?'#bd4856':amber);
  if (sunflower) for(let j=0;j<14;j++){
    const a=j*2.4,r=.048*Math.sqrt(j)*scale;
    b.ball([x+Math.cos(a)*r,y+Math.sin(a)*r*.84,z+.143*scale],[.025*scale,.022*scale,.018*scale],'#966a38');
  }
}

function plant(b,code,variant){
  if (code==='palm'){
    b.path([[0,0,0],[.09,.88,.03],[-.07,1.65,0],[.08,2.37,0]],.12,'#9d7853');
    for(let j=0;j<9;j++){
      const a=j*2.4, ux=Math.cos(a), uz=Math.sin(a);
      b.path([[.08,2.37,0],[.08+.56*ux,2.65,.56*uz],[.08+1.04*ux,2.29,1.04*uz]],.037,leaves);
      for(let k=1;k<=5;k++){
        const t=k/6, yy=2.37+.26*Math.sin(t*Math.PI)-.1*t;
        for(const s of [-1,1]) leaf(b,[.08+t*ux,yy,t*uz],[.08+t*ux+.18*ux-s*.19*uz,yy-.2,t*uz+.18*uz+s*.19*ux],s>0?'#688b58':leaves);
      }
    }
    return;
  }
  const tint=variant==='plum'?'#955e82':'#cf99ab';
  if(code==='lotus'){
    pond(b);
    b.ball([-.15,.17,.02],[.58,.050,.42],'#78966b');
    b.rod([0,.13,0],[.1,.84,0],.049,.035,stem);
    bloom(b,.1,.86,0,1.32,code,tint); return;
  }
  if(code==='blossom') {
    const branch=[[0,0,0],[-.16,.68,0],[.07,1.36,.02],[.52,2.04,.02]];
    b.path(branch,.056,'#78664f');
    for(const [x,y,z,s] of [[-.1,.67,.1,-1],[.04,1.12,-.08,1],[.05,1.36,.05,-1],[.34,1.83,0,1]]){
      b.rod([x,y,z],[x+s*.35,y+.25,z+.05],.034,.016,'#77634f');
      leaf(b,[x,y,z],[x+s*.23,y+.32,z-.05],leaves);
      bloom(b,x+s*.38,y+.29,z+.07,.42,code,tint);
    }
    bloom(b,.52,2.06,.02,.52,code,tint); return;
  }
  b.path([[0,0,0],[-.09,.62,.03],[.13,1.32,0],[.075,1.73,.03]],code==='sunflower'?.064:.043,stem);
  for(const [y,s] of [[.47,-1],[.77,1],[1.13,-1]]){
    const x=y>1?.11:-.04;
    b.rod([x,y,0],[x+s*.15,y+.11,.055],.023,.015,stem);
    leaf(b,[x+s*.09,y+.06,.02],[x+s*.57,y+.32,.15],leaves);
    if(code==='rose') b.rod([x,y+.18,.02],[x+s*.09,y+.27,.03],.026,.004,'#945e56');
  }
  bloom(b,.075,1.77,.03,code==='sunflower'?1.29:1.1,code,tint);
}

const templates = new Map();
export const supportedModels = Object.freeze((
  'tiger flower symbols gorilla dragon bird turtle face bear heart rose web snake butterfly skull flame blossom lips dog paw pug betta arrows lotus moon geometry tribal lion cub lettering cat sunflower helmet eye raptor cassette insect palm anglerfish sailboat seahorse fish cross owl music greenfigure swordfish moth scales compass hand plane rope'
).split(' '));
function makeTemplate(code,variant) {
  const root=new THREE.Group(), body=new Batch(), parts=[];
  function part(motion,side,pos){
    const batch=new Batch();
    parts.push({batch,motion,side,pos});
    return batch;
  }
  switch(code){
    case 'tiger': case 'lion': case 'cub': case 'cat': feline(body,code,variant); break;
    case 'dog': case 'pug': dog(body,code==='pug'); break;
    case 'gorilla': case 'bear': primateOrBear(body,code==='gorilla'); break;
    case 'bird': case 'owl': case 'raptor': case 'dragon': flight(body,part,code); break;
    case 'butterfly': case 'moth': case 'insect': butterfly(body,part,code,variant); break;
    case 'seahorse': case 'fish': case 'betta': case 'anglerfish': case 'swordfish': fish(body,part,code); break;
    case 'snake': case 'turtle': reptile(body,code); break;
    case 'rose':
      if (variant === 'prototype') buildPrototypeRose(body);
      else plant(body,code,variant);
      break;
    case 'skull':
      if (variant === 'prototype') buildPrototypeSkulls(body);
      else buildSculpture(code,body);
      break;
    case 'flower': case 'blossom': case 'palm': case 'sunflower': case 'lotus': plant(body,code,variant); break;
    default:
      if(!supportedModels.includes(code)) throw new Error('Motif 3D inconnu : '+code);
      buildSculpture(code,body);
  }
  const core=body.mesh();
  if(!core) throw new Error('Motif sans géométrie : '+code);
  root.add(core);
  for(const {batch,motion,side,pos} of parts){
    const mesh=batch.mesh();
    mesh.position.set(...pos); mesh.userData={motion,side}; root.add(mesh);
  }
  const box=new THREE.Box3().setFromObject(root), size=box.getSize(new THREE.Vector3());
  const centre=box.getCenter(new THREE.Vector3());
  const scale=3.25/Math.max(size.x,size.y,size.z,.1);
  root.position.set(-centre.x*scale,-box.min.y*scale,-centre.z*scale);
  root.scale.setScalar(scale);
  return root;
}

const flora=new Set(['flower','rose','blossom','palm','sunflower','lotus']);
const flying=new Set(['bird','owl','raptor','dragon','insect','butterfly','moth']);
const breathing=new Set(['tiger','lion','cub','cat','pug','dog','gorilla','bear','snake','turtle']);
const swimmers=new Set(['seahorse','fish','betta','anglerfish','swordfish']);
function hash(text) {
  let h=0;
  for(const ch of text) h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;
  return h;
}
function variantFor(code,work,seed){
  if ((code==='rose' && work.id==='wix-upload-2026-062') ||
      (code==='skull' && work.id==='wix-upload-2026-065')) return 'prototype';
  if ((code==='tiger' && work.id==='wix-upload-2026-035') ||
      (code==='butterfly' && work.id==='wix-upload-2025-027')) return 'blackwork';
  if(code==='cat' && /noir/i.test(work.title||'')) return 'black';
  if(code==='flower' && seed%2) return 'plum';
  return '';
}

export function createMotif(work){
  const group=new THREE.Group(), animated=[];
  const seed=hash(String(work.id || work.title));
  const models=work.models;
  if(!Array.isArray(models)||!models.length) throw new Error('Cette œuvre demande au moins un motif.');
  models.forEach((code,i)=>{
    const variant=variantFor(code,work,seed), key=code+':'+variant;
    if(!templates.has(key)) templates.set(key,makeTemplate(code,variant));
    const piece=templates.get(key).clone(), pivot=new THREE.Group();
    pivot.add(piece); group.add(pivot);
    if(i>0){
      const angle=(i-1)*2.40+.47;
      pivot.position.set(Math.cos(angle)*1.62,0,Math.sin(angle)*1.0+.45);
      pivot.scale.setScalar(i===1?.53:.39);
    }
    // Grazers and flowers stand on the terrain; the winged motifs hover above it.
    const hover=flying.has(code)?.66:0;
    pivot.position.y=hover;
    const yaw=.2*(i%2?-1:1);
    pivot.rotation.y=yaw;
    const motion=flora.has(code)||code==='flame'?'sway':flying.has(code)?'hover':breathing.has(code)?'breathe':swimmers.has(code)?'swim':'still';
    if(motion!=='still') animated.push({object:pivot,motion,baseY:hover,baseYaw:yaw,phase:(seed%997)*.016+i});
    for(const mesh of piece.children){
      if(mesh.userData.motion) animated.push({object:mesh,motion:mesh.userData.motion,side:mesh.userData.side,phase:(seed%997)*.016+i});
    }
  });
  const primaryBounds=new THREE.Box3().setFromObject(group.children[0]);
  group.userData.focusHeight=primaryBounds.getCenter(new THREE.Vector3()).y;
  group.userData.animatedParts=animated;
  return group;
}

export function animateMotif(group,time,visitorPosition){
  // The visitor's approach adds a subtle reaction; idle motion stays active at a distance.
  const proximity=visitorPosition ? Math.max(0,1-group.position.distanceTo(visitorPosition)/6) : 0;
  for(const p of group.userData.animatedParts){
    const t=time+p.phase, obj=p.object;
    switch(p.motion){
      case 'wing': obj.rotation.z=p.side*Math.sin(t*2.65)*.32; break;
      case 'flutter': obj.rotation.y=p.side*(.38+.42*Math.sin(t*(5.8+proximity*2))); break;
      case 'tail': obj.rotation.y=Math.sin(t*2.8)*.24; break;
      case 'hover': obj.position.y=p.baseY+(.12+proximity*.16)*Math.sin(t*1.4); obj.rotation.y=p.baseYaw+(.09+proximity*.12)*Math.sin(t*.83); break;
      case 'sway': obj.rotation.z=(.036+proximity*.055)*Math.sin(t*1.4); break;
      case 'breathe': obj.rotation.y=p.baseYaw+(.057+proximity*.08)*Math.sin(t*.86); obj.rotation.z=.008*Math.sin(t*1.85); break;
      case 'swim': obj.rotation.y=p.baseYaw+.048*Math.sin(t*1.18); break;
    }
  }
}
