import * as THREE from 'three';
import { buildSculpturalFlame } from './flame-detail.js?v=organic-1';
import { buildDetailedPlant, addSculpturalDetails } from './botanical-detail.js?v=detail-3';
import { addOrganicBody, enhanceAnimal } from './animal-detail.js?v=organic-3';
import { buildSculpture } from './sculptures.js?v=organic-2';
import { build2024 } from './motifs-2024.js?v=organic-3';
import { animateAnimal, animalRest, animalRun, animalStep } from './animal-behaviors.js?v=animals-6';
import {
  buildPrototypeRose, buildPrototypeSkulls, rainbowHeart, littleBear,
  elbowWebs, floweringSpray, sixPetals
} from './prototype-details.js?v=organic-3';

// Each stationary body or animated limb is one draw, including all of its colours.
// Recipes are baked once, then the geometry is shared between encounters.
// Shared physically based finishes preserve batching, but let organic surfaces,
// petals and crafted objects respond differently to the existing light.
// Shared periodic microrelief and roughness maps: no large texture per object.
function surfaceMaps(kind) {
  const size=64, heights=new Float32Array(size*size), normal=new Uint8Array(size*size*4), rough=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const u=x*Math.PI*2/size,v=y*Math.PI*2/size;
    const primary=kind==='animal' ? Math.sin(u*5+v*13)*.12 : kind==='petal' ? Math.sin(u*10+Math.sin(v*2))*.08 : Math.sin(u*7)*Math.sin(v*9)*.08;
    heights[y*size+x]=.5+primary+Math.sin(u*19+v*17)*.035+Math.cos(u*13-v*11)*.025;
  }
  const sample=(x,y)=>heights[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const i=(y*size+x)*4, dx=(sample(x+1,y)-sample(x-1,y))*.75,dy=(sample(x,y+1)-sample(x,y-1))*.75;
    const n=new THREE.Vector3(-dx,-dy,1).normalize();
    normal[i]=Math.round((n.x*.5+.5)*255);normal[i+1]=Math.round((n.y*.5+.5)*255);normal[i+2]=Math.round((n.z*.5+.5)*255);normal[i+3]=255;
    const value=Math.max(0,Math.min(255,Math.round(185+sample(x,y)*55)));
    rough[i]=rough[i+1]=rough[i+2]=value;rough[i+3]=255;
  }
  const create=data=>{const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;};
  return {normal:create(normal),roughness:create(rough)};
}
const detailMaps={animal:surfaceMaps('animal'),petal:surfaceMaps('petal'),crafted:surfaceMaps('crafted')};
function surfaceMaterial(roughness, sheen, clearcoat, grain, kind) {
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness, metalness: 0, flatShading: false,
    sheen, sheenRoughness: .75, sheenColor: 0xd3c7b4,
    clearcoat, clearcoatRoughness: .55, side: THREE.DoubleSide
  });
  mat.normalMap=detailMaps[kind].normal;
  mat.roughnessMap=detailMaps[kind].roughness;
  mat.normalScale.set(.22,.22);
  // A very fine, local-space colour variation avoids large perfectly uniform
  // plastic-looking areas without loading textures per tattoo or adding draws.
  mat.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePosition;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float surfaceGrain = sin(vSurfacePosition.x * 91.0 + sin(vSurfacePosition.y * 63.0)) * sin(vSurfacePosition.z * 83.0 + vSurfacePosition.y * 37.0);
      diffuseColor.rgb *= 1.0 + surfaceGrain * ${grain.toFixed(3)};`);
  };
  mat.customProgramCacheKey = () => 'tattoo-surface-' + grain;
  return mat;
}
const animalSurface = surfaceMaterial(.82, .22, .02, .025, 'animal');
const petalSurface = surfaceMaterial(.62, .30, .04, .018, 'petal');
const craftedSurface = surfaceMaterial(.68, .08, .08, .015, 'crafted');
const animalCodes = new Set('tiger lion cub cat dog pug gorilla bear bird owl raptor dragon butterfly moth insect seahorse fish betta anglerfish swordfish snake turtle jellyfish octopus frog scorpion lioness elk anubis'.split(' '));
const botanicalCodes = new Set('rose flower blossom palm sunflower lotus forest windmill'.split(' '));
const materialFor = code => animalCodes.has(code) ? animalSurface : botanicalCodes.has(code) ? petalSurface : craftedSurface;
const unitSphere = new THREE.SphereGeometry(1, 20, 14);
// A gently rounded shared box is useful for teeth, stones and manufactured
// details. It keeps the existing size and rotations without hard block corners.
const unitBox = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
{
  const p=unitBox.attributes.position, n=unitBox.attributes.normal;
  const v=new THREE.Vector3(), inner=new THREE.Vector3(), direction=new THREE.Vector3();
  for(let i=0;i<p.count;i++) {
    v.fromBufferAttribute(p,i);
    inner.set(THREE.MathUtils.clamp(v.x,-.42,.42),THREE.MathUtils.clamp(v.y,-.42,.42),THREE.MathUtils.clamp(v.z,-.42,.42));
    direction.copy(v).sub(inner).normalize();
    v.copy(inner).addScaledVector(direction,.08);
    p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,direction.x,direction.y,direction.z);
  }
  p.needsUpdate=true;n.needsUpdate=true;
}
const identity = [0, 0, 0];
const vector = a => new THREE.Vector3(...a);
const ink = '#24232b', ivory = '#fff0ce', amber = '#e3af55';
const leaves = '#406e4a', stem = '#637947';
// Shapes shared by catalogue variants are triangulated only once. The batch
// copies their buffers, so no renderer-owned geometry is shared or mutated.
const shapeCache = new Map();
function sharedShape(key, create) {
  let geometry = shapeCache.get(key);
  if (geometry) return geometry;
  geometry = create();
  if (shapeCache.size >= 512) shapeCache.delete(shapeCache.keys().next().value);
  shapeCache.set(key,geometry);
  return geometry;
}

class Batch {
  constructor(material = craftedSurface) { this.positions = []; this.normals = []; this.colors = []; this.material = material; }
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
    const key = `r:${tip.toFixed(4)}:${base.toFixed(4)}:${length.toFixed(4)}`;
    const g = sharedShape(key,()=>new THREE.CylinderGeometry(tip,base,length,10));
    this.add(g,vector(a).lerp(vector(b),.5).toArray(),[1,1,1],color,identity,orient);
  }
  path(points, radius, color) {
    const line = new THREE.CatmullRomCurve3(points.map(vector));
    this.add(new THREE.TubeGeometry(line,Math.max(6,points.length*3),radius,6),identity,[1,1,1],color);
  }
  poly(points, depth, pos, color, rotation) {
    const bevel = Math.min(.025, Math.max(.002, depth*.12));
    const key = `p:${depth}:`+points.map(([x,y])=>`${x},${y}`).join(';');
    const geo = sharedShape(key,()=>{
      const shape = new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
      return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:5});
    });
    this.add(geo,pos,[1,1,1],color,rotation);
  }
  ring(pos,radius,tube,color,rotation) {
    this.add(new THREE.TorusGeometry(radius,tube,8,36),pos,[1,1,1],color,rotation);
  }
  mesh() {
    if (!this.positions.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
    // Stable object-space coordinates keep procedural microdetails on the 3D surface.
    const uv=new Float32Array(this.positions.length/3*2);
    for(let i=0,j=0;i<this.positions.length;i+=3,j+=2){
      uv[j]=this.positions[i]*.38+this.positions[i+2]*.21;
      uv[j+1]=this.positions[i+1]*.38+this.positions[i+2]*.17;
    }
    g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    g.computeBoundingSphere();
    return new THREE.Mesh(g,this.material);
  }
}

function leg(b,x,z,back,color,thickness=.16) {
  const knee = x+(back ? -.19 : .02);
  b.ball([x,1.12,z],[thickness*1.45,.43,thickness*1.18],color,[0,0,back ? -.25 : .13]);
  b.rod([x,.97,z],[knee,.54,z],thickness,thickness*.72,color);
  b.rod([knee,.54,z],[x-.02,.17,z],thickness*.75,thickness*.54,color);
  b.ball([x+.08,.13,z],[.21,.12,thickness*.85],color);
}

// Four separate pivots let the animal move its legs without duplicating the body.
function animatedLeg(b,back,color,thickness=.16) {
  const knee=back?-.19:.02;
  b.ball([0,0,0],[thickness*1.45,.43,thickness*1.18],color,[0,0,back?-.25:.13]);
  b.rod([0,-.15,0],[knee,-.58,0],thickness,thickness*.72,color);
  b.rod([knee,-.58,0],[-.02,-.95,0],thickness*.75,thickness*.54,color);
  b.ball([.08,-.99,0],[.21,.12,thickness*.85],color);
}

// A black-and-grey tiger inspired by the frontal portrait in 2026-035.
// The face is sculpted in relief. The markings follow its volume instead of
// projecting the photograph onto a flat surface.
function tattooTiger(b,part) {
  const fur = '#817f7c', light = '#c6c2bb', shade = '#444443';
  // Torso and four weight-bearing legs, viewed most clearly from the side.
  addOrganicBody('tiger','blackwork',b);
  for (const side of [-1,1]) {
    for (const x of [-.86,.56]) {
      const z=side*.29;
      const limb=part(x<0?'leg-back':'leg-front',(x<0?-1:1)*side,[x,1.12,z]);
      limb.ball([0,0,0],[.25,.42,.20],fur,[0,0,x<0?-.18:.06]);
      limb.rod([0,-.08,0],[-.04,-.77,0],.18,.115,fur);
      limb.ball([.08,-.92,0],[.25,.14,.19],light);
      for(let toe=-1;toe<=1;toe++) limb.path([[.19,-.89,toe*.08],[.25,-.94,toe*.08]],.012,shade);
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

function feline(b,part,code,variant) {
  if (code==='tiger' && variant==='blackwork') return tattooTiger(b,part);
  const stripes = code==='tiger', mane = code==='lion', kitten = code==='cat', cub = code==='cub';
  // The photographed back piece is black and grey, rather than an orange tiger.
  const body = stripes ? (variant==='blackwork' ? '#8c8984' : '#ce8035') : kitten ? (variant==='black' ? '#35323c' : variant==='sleepy' || variant==='cocotte' ? '#898783' : '#9d806a') : '#bd965d';
  const headY = 1.99, hx = .91;
  addOrganicBody(code,variant,b);
  for (const s of [-1,1]) {
    for (const [x,back] of [[-.69,true],[.59,false]]) {
      const limb=part(back?'leg-back':'leg-front',(back?-1:1)*s,[x,1.12,s*(back?.28:.26)]);
      animatedLeg(limb,back,body);
    }
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
  // The 2024 source is a crowned lion; the other lion portrait has no crown.
  if (mane && variant==='crowned') {
    b.poly([[-.34,0],[-.42,.32],[-.19,.18],[0,.39],[.19,.18],[.42,.32],[.34,0]],.16,[.92,2.36,-.08],'#bfa36b',[0,Math.PI/2,0]);
    for(const z of [-.27,0,.27]) b.ball([1.03,2.43,z],[.055,.055,.055],'#d6c794');
  }
  if (kitten && variant==='sleepy') {
    for(const z of [-.31,.31]) for(let k=0;k<3;k++) b.path([[-.45+k*.24,1.68,z],[-.32+k*.24,1.52,z*1.1],[-.42+k*.24,1.38,z*1.1]],.025,ink);
  }
  for(const s of [-1,1]){
    const z=s*.27;
    if(kitten) {
      b.poly([[-.17,0],[.11,0],[-.09,.37]],.13,[hx-.09,2.22,z-.065],body);
      b.poly([[-.11,0],[.06,0],[-.065,.22]],.018,[hx-.07,2.25,z+s*.075],'#b48b91');
    } else {
      b.ball([hx-.17,2.31,z],[.14,.18,.11],ink);
      b.ball([hx-.14,2.32,z+s*.07],[.096,.12,.055],body);
    }
    if (variant==='sleepy') b.path([[hx+.10,2.06,s*.335],[hx+.20,2.025,s*.36],[hx+.30,2.055,s*.33]],.026,ink);
    else {
      b.ball([hx+.20,2.06,s*.318],[.105,.082,.062],ink);
      b.ball([hx+.23,2.075,s*.358],[.05,.052,.03],kitten&&variant==='black'?'#b4b3a7':amber);
      // Layer the iris, pupil and highlight toward the animal's forward view.
      if(kitten){
        b.ball([hx+.305,2.065,s*.318],[.018,.062,.050],variant==='black'?'#aaa9a0':'#b4bd72');
        b.ball([hx+.321,2.065,s*.318],[.010,.042,.021],ink);
        b.ball([hx+.330,2.087,s*.302],[.006,.014,.011],ivory);
      }
    }
    if(!kitten) b.ball([hx+.33,1.9,s*.145],[.19,.15,.18],ivory);
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

function dog(b,part,pug,variant) {
  const small=variant==='small-dog';
  const color=pug?'#c9af86':small?'#ab8365':'#99877e', dark=pug?'#39302e':small?'#624839':'#645c58';
  addOrganicBody(pug?'pug':'dog',variant,b);
  for(const s of [-1,1]) for(const x of [-.54,.51]) {
    const limb=part(x<0?'leg-back':'leg-front',(x<0?-1:1)*s,[x,1.12,s*.27]);
    animatedLeg(limb,x<0,color);
  }
  for(const s of [-1,1]){
    if(small) {
      b.poly([[-.17,0],[.13,0],[-.10,.29]],.13,[.53,2.09,s*.29-.06],dark);
    } else b.ball([.56,1.91,s*.34],[.20,.27,.11],dark,[s*.14,0,-.25]);
    b.ball([.91,1.90,s*.265],[.086,.096,.066],ink);
    b.ball([1.00,1.905,s*.265],[.013,.052,.043],'#80634a');
    b.ball([1.012,1.905,s*.265],[.008,.036,.023],ink);
    b.ball([1.019,1.925,s*.250],[.005,.012,.010],ivory);
    b.ball([.93,1.925,s*.31],[.025,.024,.016],ivory);
  }
  b.ball([pug?1.15:1.38,1.82,0],[.075,.073,.12],ink);
  b.path(pug?[[-.68,1.40,0],[-.94,1.73,0],[-.74,1.92,.02],[-.61,1.74,.04]]:[[-.66,1.4,0],[-1.07,1.47,.04],[-1.36,1.76,.1]],.092,color);
}

function primateOrBear(b,gorilla) {
  const fur=gorilla?'#44454b':'#d79778', cheeks=gorilla?'#605750':'#f1c6a2';
  if(gorilla) addOrganicBody('gorilla','',b);
  else {
    b.ball([-.18,1.25,0],[.63,.79,.49],fur,[0,0,.26]);
    b.ball([.16,1.88,0],[.57,.56,.62],fur);
    b.ball([.53,2.18,0],[.42,.48,.415],fur);
  }
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

function flight(b,part,code,variant) {
  const owl=code==='owl', eagle=code==='raptor', dragon=code==='dragon';
  const body=variant==='raven'?'#292b30':variant==='hummingbird'?'#6e4f89':owl?'#917654':dragon?'#506f7e':eagle?'#755a44':'#5d8495';
  const light=variant==='raven'?'#44464a':variant==='hummingbird'?'#ab91bd':dragon?'#93b3ad':owl?'#dcc39b':eagle?'#f0e5c8':'#c6d7c4';
  addOrganicBody(code,variant,b);
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
  if(variant==='heraldic') {
    // The source is an eagle crest: shield and crown distinguish it from a live raptor.
    b.poly([[-.34,.35],[.34,.35],[.29,-.11],[0,-.42],[-.29,-.11]],.08,[0,1.47,.50],'#646b76');
    b.path([[-.24,1.70,.62],[0,1.34,.62],[.24,1.70,.62]],.025,ivory);
    b.poly([[-.28,0],[-.28,.20],[-.12,.10],[0,.26],[.12,.10],[.28,.20],[.28,0]],.07,[0,2.13,.45],'#c6ad7c');
  }
  if(dragon) {
    b.ball([0,1.72,.83],[.19,.12,.23],body);
    b.path([[0,1.52,-.54],[.1,1.39,-.98],[.46,1.53,-1.40],[.59,1.77,-1.67]],.09,body);
    for(let j=0;j<6;j++) b.rod([0,1.92-j*.04,.34-j*.17],[0,2.10-j*.055,.25-j*.17],.065,.003,ivory);
  } else {
    b.rod([0,1.74,.77],[0,1.66,variant==='hummingbird'?1.25:.99],variant==='hummingbird'?.045:.105,.008,variant==='raven'?ink:'#d9a850');
    for(const side of [-1,0,1]) b.ball([side*.10,1.47,-.74],[.10,.045,.39],body,[-.15,side*.15,0]);
  }
}

function butterfly(b,part,code,variant) {
  const moth=code==='moth', delicate=code==='insect';
  const outline='#29282a', colour=variant==='blackwork'?'#969493':moth?'#c5a67c':delicate?'#9bbcac':'#d58141';
  addOrganicBody(code,variant,b);
  if(variant==='mothdog') {
    // The source butterfly encloses a small dog portrait between its wings.
    b.ball([0,1.34,.14],[.15,.20,.07],'#aba7a0');
    for(const side of [-1,1]) {
      b.ball([side*.135,1.46,.14],[.065,.13,.04],outline);
      b.ball([side*.07,1.40,.21],[.024,.025,.015],outline);
    }
    b.ball([0,1.29,.22],[.05,.035,.02],outline);
  }
  if(variant==='ornamental') {
    b.ring([0,1.36,-.12],.48,.018,'#bfaa85');
    for(const side of [-1,1]) b.path([[side*.12,1.05,0],[side*.44,.84,0],[side*.71,.72,0]],.018,outline);
  }

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

function fish(ground,part,code,variant){
  pond(ground);
  const b=part('fish-body',1,[0,0,0]);
  const deep=code==='anglerfish', betta=code==='betta', sword=code==='swordfish';
  const body=deep?'#545868':betta?'#60899b':sword?'#60818d':'#629c97';
  const fin=deep?'#a59080':betta?'#c77ba1':'#789baf', y=.85;
  if (code==='seahorse'){
    addOrganicBody('seahorse',variant,b);
    b.rod([.39,1.49,0],[.60,1.37,0],.094,.061,'#c99252');
    b.ball([.25,1.56,.13],[.039,.04,.02],ink);
    b.path([[0,.63,0],[-.18,.42,0],[-.43,.42,0],[-.47,.56,0],[-.37,.62,0],[-.31,.56,0]],.07,'#cd9858');
    for(let j=0;j<5;j++) b.rod([-.13,1.28-j*.12,0],[-.29,1.31-j*.12,0],.048,.009,'#a97046');
    return;
  }
  addOrganicBody(code,variant,b);
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
  if(deep && variant==='spiny') {
    for(let j=0;j<7;j++) {
      const x=-.46+j*.15, lift=.15+Math.sin(j*Math.PI/7)*.14;
      b.rod([x,y+.30,0],[x-.08,y+.30+lift,0],.035,.002,ink);
    }
  }
  if(deep){
    b.ball([.62,y-.08,.09],[.15,.20,.16],ink,[0,0,-.32]);
    for(let j=0;j<5;j++) b.rod([.52+j*.052,y+.046,.216],[.53+j*.049,y-.08,.223],.03,.001,ivory);
    b.path([[.12,1.21,0],[.29,1.60,0],[.61,1.65,0],[.74,1.47,0]],.025,fin);
    b.ball([.74,1.45,0],[.087,.090,.084],'#f6dc97');
  }
}

function reptile(b,code){
  if(code==='turtle'){
    addOrganicBody('turtle','',b);
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
function bloom(b,x,y,z,scale,code,tint,shape={}) {
  const rose=code==='rose', sunflower=code==='sunflower', lotus=code==='lotus', small=code==='blossom';
  const petals=shape.petals ?? (rose?11:sunflower?16:lotus?10:small?5:6);
  const hue=shape.hue ?? (rose?'#b74455':sunflower?'#df9c2a':lotus?'#df919f':tint);
  const tip=shape.tip ?? (rose?'#dc6572':sunflower?'#f1b942':lotus?'#f1bcca':small?'#edd2cb':'#c98ba0');
  const layers=shape.layers ?? (rose||lotus?3:sunflower?2:1);
  // Petals curl around a gently forward-facing corolla so side views retain depth.
  for(let k=0;k<layers;k++) {
    const n=petals-k*(rose?3:1), radius=(rose?.33:lotus?.33:.36)*scale*(1-k*.25);
    for(let j=0;j<n;j++){
      const a=2*Math.PI*j/n+k*.67;
      const p=[x+Math.sin(a)*radius,y+Math.cos(a)*radius*.81+k*.036*scale,
        z-Math.cos(a)*radius*.44+k*.104*scale];
      const width=(shape.width ?? (rose?.24:lotus?.16:sunflower?.085:small?.18:.23))*scale*(1-k*.17);
      const height=(shape.height ?? (rose?.26:sunflower?.33:.31))*scale*(1-k*.18);
      b.ball(p,[width,height,(rose?.09:.065)*scale],j%4===0?tip:hue,[-.42,rose?.34:0,-a+(rose?.42:.05)]);
    }
  }
  b.ball([x,y+.025*scale,z+.045*scale],[scale*(sunflower?.245:.105),scale*(sunflower?.21:.10),.12*scale],sunflower?'#614333':rose?'#bd4856':amber);
  if (sunflower) for(let j=0;j<14;j++){
    const a=j*2.4,r=.048*Math.sqrt(j)*scale;
    b.ball([x+Math.cos(a)*r,y+Math.sin(a)*r*.84,z+.143*scale],[.025*scale,.022*scale,.018*scale],'#966a38');
  }
}

// Arrangements below follow the visible number and type of flowers in the
// linked tattoo photos. Remaining floral works get their own stable silhouette.
const floralPhotoDesigns={
  'wix-upload-2024-005':{rose:{count:2,blackwork:true}},
  'wix-upload-2024-007':{flower:{count:4,branch:true,small:true,hue:'#c45b70',tip:'#e39aab'}},
  'wix-upload-2024-008':{rose:{count:1,hue:'#74353f',tip:'#a2555c'}},
  'wix-upload-2024-009':{flower:{count:1,petals:12,blackwork:true}},
  'wix-upload-2024-015':{rose:{count:1,blackwork:true}},
  'wix-upload-2024-017':{flower:{count:2,petals:5,hue:'#c68f83',tip:'#e3b6a2'}},
  'wix-upload-2024-019':{rose:{count:1,blackwork:true}},
  'wix-upload-2024-022':{flower:{count:3,petals:6,hue:'#cd5e87',tip:'#e590ae'}},
  'wix-upload-2024-023':{flower:{count:3,petals:7,hue:'#b77d8b',tip:'#d8a7b0'}},
  'wix-upload-2024-024':{flower:{count:4,branch:true,small:true,blackwork:true}},
  'wix-upload-2024-025':{rose:{count:3,blackwork:true}},
  'wix-upload-2024-031':{flower:{count:2,branch:true,petals:5,blackwork:true}},
  'wix-upload-2024-032':{flower:{count:2,petals:13,layers:3,width:.13,hue:'#829a9e',tip:'#b8c5c4'}},
  'wix-upload-2024-033':{flower:{count:3,petals:7,blackwork:true}},
  'wix-upload-2024-040':{rose:{count:1,blackwork:true}},
  'wix-upload-2024-046':{flower:{count:3,petals:5,blackwork:true}},
  'wix-upload-2025-002':{sunflower:{count:1},flower:{count:2,petals:7}},
  'wix-upload-2025-026':{rose:{count:1,blackwork:true}},
  'wix-upload-2025-027':{flower:{count:2,blackwork:true}},
  'wix-upload-2025-028':{rose:{count:2,hue:'#b15365',tip:'#d88998'}},
  'wix-upload-2025-032':{blossom:{count:5,branch:true}},
  'wix-upload-2025-034':{flower:{count:1,petals:9,hue:'#ca9b8b',tip:'#ecd2bf'}},
  'wix-upload-2025-037':{rose:{count:1,blackwork:true}},
  'wix-upload-2026-078':{rose:{count:2},flower:{count:2}}
};
function floralRandom(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function plant(b,code,variant,identitySeed,design={}){
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
  const rand=floralRandom(identitySeed || 1);
  const tint=design.hue || (variant==='plum'?'#955e82':'#cf99ab');
  const shape={...design};
  if(!shape.petals && code==='flower') shape.petals=5+Math.floor(rand()*4);
  const lean=(rand()-.5)*.28, leafLength=.40+rand()*.24;
  if(code==='lotus'){
    pond(b);
    b.ball([-.15,.17,.02],[.58,.050,.42],'#78966b');
    b.rod([0,.13,0],[.1,.84,0],.049,.035,stem);
    bloom(b,.1,.86,0,1.32,code,tint,shape); return;
  }
  if(code==='blossom' || design.branch) {
    const count=design.count || (code==='blossom'?4+Math.floor(rand()*3):4);
    const tilt=.31+rand()*.28;
    b.path([[0,0,0],[lean*.6,.70,0],[tilt*.45,1.40,.02],[tilt,2.05,.02]],.045,'#78664f');
    for(let i=0;i<count;i++){
      const y=.52+i*1.44/Math.max(1,count-1), x=tilt*y/2.05, side=i%2?-1:1;
      const reach=(design.small?.23:.31)+rand()*.12;
      b.rod([x,y,0],[x+side*reach,y+.23,.035],.029,.012,'#77634f');
      leaf(b,[x,y,0],[x+side*(reach*.7),y+.25,.04],leaves);
      bloom(b,x+side*reach,y+.26,.04,design.small?.34:.43,'blossom',tint,shape);
    }
    return;
  }
  const count=design.count || 1;
  // Distinct stems, leaves and arrangements preserve the subject's silhouette.
  b.path([[0,0,0],[lean,.62,.03],[lean*.55,1.32,0],[lean,1.73,.03]],code==='sunflower'?.064:.043,stem);
  for(let i=0;i<3;i++){
    const y=.43+i*.32, side=(i%2?-1:1)*(rand()>.5?1:-1), x=lean*y/1.73;
    b.rod([x,y,0],[x+side*.16,y+.12,.055],.023,.015,stem);
    leaf(b,[x+side*.09,y+.06,.02],[x+side*leafLength,y+.27+rand()*.12,.15],leaves);
    if(code==='rose') b.rod([x,y+.18,.02],[x+side*.09,y+.27,.03],.026,.004,'#945e56');
  }
  bloom(b,lean,1.77,.03,code==='sunflower'?1.29:1.05,code,tint,shape);
  for(let i=1;i<count;i++){
    const side=i%2?-1:1, height=1.36-(i-1)*.25, x=lean+side*(.47+(i>2?.13:0));
    b.path([[lean*.4,.48+i*.12,0],[lean+side*.20,height-.22,.03],[x,height,.04]],.032,stem);
    leaf(b,[lean+side*.18,height-.27,.03],[x+side*.15,height-.12,.08],leaves);
    bloom(b,x,height,.06,.70+rand()*.10,code,tint,shape);
  }

}

const templates = new Map();
export const supportedModels = Object.freeze((
  'tiger flower symbols gorilla dragon bird turtle face bear heart rose web snake butterfly skull flame blossom lips dog paw pug betta arrows lotus moon geometry tribal lion cub lettering cat sunflower helmet eye raptor cassette insect palm anglerfish sailboat seahorse fish cross owl music greenfigure swordfish moth scales compass hand plane rope forest mechanism jellyfish octopus frog vehicle wings scorpion reaper lioness elk anubis windmill'
).split(' '));
function makeTemplate(code,variant,identitySeed,workId) {
  const floralDesign=floralPhotoDesigns[workId]?.[code] || {};
  const root=new THREE.Group(), body=new Batch(materialFor(code)), parts=[];
  function part(motion,side,pos){
    const batch=new Batch(materialFor(code));
    parts.push({batch,motion,side,pos});
    return batch;
  }
  switch(code){
    case 'tiger': case 'lion': case 'cub': case 'cat': feline(body,part,code,variant); break;
    case 'dog': case 'pug': dog(body,part,code==='pug',variant); break;
    case 'gorilla': primateOrBear(body,true); break;
    case 'bear': littleBear(body); break;
    case 'flame': buildSculpturalFlame(body); break;
    case 'heart':
      if(variant==='rainbow') rainbowHeart(body);
      else buildSculpture(code,body);
      break;
    case 'web':
      if(variant==='elbows') elbowWebs(body);
      else buildSculpture(code,body);
      break;
    case 'bird': case 'owl': case 'raptor': case 'dragon': flight(body,part,code,variant); break;
    case 'butterfly': case 'moth': case 'insect': butterfly(body,part,code,variant); break;
    case 'seahorse': case 'fish': case 'betta': case 'anglerfish': case 'swordfish': fish(body,part,code,variant); break;
    case 'snake': case 'turtle': reptile(body,code); break;
    case 'rose':
      if (variant === 'prototype') buildPrototypeRose(body);
      else buildDetailedPlant(body,code,variant,identitySeed,floralDesign);
      break;
    case 'skull':
      if (variant === 'prototype') buildPrototypeSkulls(body);
      else buildSculpture(code,body,identitySeed,workId);
      break;
    case 'flower':
      if(variant==='six-petals') sixPetals(body);
      else buildDetailedPlant(body,code,variant,identitySeed,floralDesign);
      break;
    case 'blossom':
      if(variant==='shoulder' || variant==='fine-line') floweringSpray(body,variant==='shoulder');
      else buildDetailedPlant(body,code,variant,identitySeed,floralDesign);
      break;
    case 'palm': case 'sunflower': case 'lotus': buildDetailedPlant(body,code,variant,identitySeed,floralDesign); break;
    default:
      if(!supportedModels.includes(code)) throw new Error('Motif 3D inconnu : '+code);
      if (!build2024(code,body) && !buildSculpture(code,body,identitySeed,workId)) throw new Error('Motif sans représentation : '+code);
  }
  addSculpturalDetails(body,code,variant,identitySeed);
  if(code!=='face') enhanceAnimal({code,variant,workId,identitySeed,body,part});
  // Keep black-and-grey tattoo interpretations neutral rather than applying
  // the default bright colours used by the garden variants.
  if (variant === 'blackwork' || floralDesign.blackwork) {
    for (const batch of [body, ...parts.map(part => part.batch)]) {
      for (let i=0; i<batch.colors.length; i+=3) {
        const value = batch.colors[i]*.2126 + batch.colors[i+1]*.7152 + batch.colors[i+2]*.0722;
        batch.colors[i] = batch.colors[i+1] = batch.colors[i+2] = value;
      }
    }
  }
  const core=body.mesh();
  if(!core) throw new Error('Motif sans géométrie : '+code);
  if (['tiger','lion','cub','cat','dog','pug'].includes(code)) core.userData.motion='animal-body';
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
  const variants = photoVariants[work.id];
  if(variants && variants[code]) return variants[code];
  if ((code==='rose' && work.id==='wix-upload-2026-062') ||
      (code==='skull' && work.id==='wix-upload-2026-065')) return 'prototype';
  if ((code==='tiger' && work.id==='wix-upload-2026-035') ||
      (code==='butterfly' && work.id==='wix-upload-2025-027')) return 'blackwork';
  if(code==='cat' && /noir/i.test(work.title||'')) return 'black';
  if(code==='flower' && seed%2) return 'plum';
  return '';
}

const photoVariants = {
  'wix-upload-2024-013': {bird:'raven'},
  'wix-upload-2024-014': {bird:'hummingbird'},
  'wix-upload-2024-020': {raptor:'heraldic'},
  'wix-upload-2024-028': {lion:'crowned'},
  'wix-upload-2024-038': {moth:'mothdog'},
  'wix-upload-2024-045': {anglerfish:'spiny'},
  'wix-upload-2025-023': {cat:'sleepy'},
  'wix-upload-2025-041': {moth:'ornamental'},
  'wix-upload-2026-071': {cat:'cocotte'},
  'wix-upload-2025-001': {cat:'black',rose:'blackwork',blossom:'blackwork'},
  'wix-upload-2025-002': {sunflower:'blackwork',flower:'blackwork'},
  'wix-upload-2025-003': {helmet:'blackwork'},
  'wix-upload-2025-004': {eye:'blackwork'},
  'wix-upload-2025-005': {raptor:'blackwork'},
  'wix-upload-2025-007': {cassette:'blackwork'},
  'wix-upload-2025-008': {rose:'blackwork',hand:'blackwork',insect:'blackwork'},
  'wix-upload-2025-009': {tribal:'blackwork'},
  'wix-upload-2025-010': {geometry:'blackwork'},
  'wix-upload-2025-011': {palm:'blackwork',plane:'blackwork',flower:'blackwork'},
  'wix-upload-2025-012': {anglerfish:'blackwork',sailboat:'blackwork'},
  'wix-upload-2025-013': {anglerfish:'blackwork'},
  'wix-upload-2025-014': {skull:'blackwork',rose:'blackwork',compass:'blackwork'},
  'wix-upload-2025-015': {tiger:'blackwork'},
  'wix-upload-2025-016': {blossom:'blackwork'},
  'wix-upload-2026-040': {heart:'rainbow'},
  'wix-upload-2026-063': {web:'elbows'},
  'wix-upload-2026-066': {blossom:'fine-line'},
  'wix-upload-2026-068': {dog:'small-dog'},
  'wix-upload-2026-079': {blossom:'shoulder'},
  'wix-upload-2026-082': {flower:'six-petals'}
};

// [x, ground offset, z, scale] arranges companion motifs around the subject.
const compositions = {
  'wix-upload-2025-001': {rose:[-.96,0,.32,.54],blossom:[.87,0,-.26,.43]},
  'wix-upload-2025-002': {flower:[-.85,0,.31,.64]},
  'wix-upload-2025-008': {hand:[-.72,.18,.25,.53],insect:[.78,1.55,-.12,.35]},
  'wix-upload-2025-011': {plane:[.95,1.72,-.27,.36],flower:[-.88,0,.38,.48]},
  'wix-upload-2025-012': {sailboat:[-.92,0,.45,.52]},
  'wix-upload-2025-014': {rose:[-.97,0,.40,.59],compass:[.90,.65,-.12,.48]},
  'wix-upload-2025-015': {flower:[-.98,0,.45,.56]},
  'wix-upload-2026-039': {bird:[.08,1.46,-.14,.75],face:[0,.80,0,.54],turtle:[-.10,0,.22,.49]},
  'wix-upload-2026-040': {bear:[0,.57,.24,.60],heart:[0,0,-.31,1.13]},
  'wix-upload-2026-064': {snake:[-1.05,0,.35,.59],butterfly:[.93,1.67,-.03,.34],flower:[1.03,0,.52,.49]},
  'wix-upload-2026-067': {lips:[.59,1.56,-.24,.42]},
  'wix-upload-2026-068': {paw:[-.96,0,.40,.29]},
  'wix-upload-2026-070': {butterfly:[-.91,1.64,-.12,.34],rose:[1.23,0,.42,.46],face:[.65,1.36,-.31,.55]},
  'wix-upload-2026-075': {symbols:[.49,.39,-.07,.41]},
  'wix-upload-2026-077': {moon:[0,1.90,-.17,.48],scales:[0,.09,.30,.46]},
  'wix-upload-2026-078': {flower:[-.70,.25,.25,.63]}
};

export function createMotif(work){
  const group=new THREE.Group(), animated=[];
  const seed=hash(String(work.id || work.title));
  const models=work.models;
  if(!Array.isArray(models)||!models.length) throw new Error('Cette œuvre demande au moins un motif.');
  models.forEach((code,i)=>{
    const variant=variantFor(code,work,seed);
    // Faces and skulls belong to a particular tattoo, even when the same
    // type is used as a companion in another composition.
    const individual=code==='face' || code==='skull' || code==='symbols' || code==='geometry' || code==='tribal' || flora.has(code);
    const identitySeed=individual?hash(String(work.id || work.title)+':'+code+':'+i):0;
    const key=code+':'+variant+(individual?':'+String(work.id || work.title)+':'+i:'');
    if(!templates.has(key)) templates.set(key,makeTemplate(code,variant,identitySeed,work.id));
    const piece=templates.get(key).clone(), pivot=new THREE.Group();
    pivot.add(piece); group.add(pivot);
    if(i>0){
      const angle=(i-1)*2.40+.47;
      pivot.position.set(Math.cos(angle)*1.62,0,Math.sin(angle)*1.0+.45);
      pivot.scale.setScalar(i===1?.53:.39);
    }
    const layout=compositions[work.id]?.[code];
    if(layout) {
      pivot.position.set(layout[0],layout[1],layout[2]); pivot.scale.setScalar(layout[3]);
    } else if(flying.has(code)) pivot.position.y=.66;
    const hover=pivot.position.y;
    pivot.userData.animalCode=code;
    pivot.userData.animalBase={x:pivot.position.x,y:pivot.position.y,z:pivot.position.z};
    const yaw=.2*(i%2?-1:1);
    pivot.rotation.y=yaw;
    const motion=flora.has(code)||code==='flame'||code==='web'?'sway':flying.has(code)?'hover':breathing.has(code)?'breathe':swimmers.has(code)?'swim':'suspend';
    animated.push({object:pivot,motion,baseY:hover,baseYaw:yaw,phase:(seed%997)*.016+i});
    for(const mesh of piece.children){
      if(mesh.userData.motion) animated.push({object:mesh,motion:mesh.userData.motion,side:mesh.userData.side,phase:(seed%997)*.016+i,restPhase:(seed%997)*.016+i*1.7,code,baseY:mesh.position.y});
    }
  });
  const primaryBounds=new THREE.Box3().setFromObject(group.children[0]);
  group.userData.motionSeed=(seed%997)*.016;
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
      case 'leg-front': case 'leg-back': {
        const rest=animalRest(p.code,time,p.restPhase);
        obj.position.y=p.baseY-.29*rest;
        const run=animalRun(p.code,time,p.restPhase);
        obj.rotation.z=(p.motion==='leg-back'?-.83:.77)*rest+p.side*Math.sin(animalStep(time,p.restPhase,run))*(.28+run*.17)*(1-rest);
        break;
      }
      case 'animal-body': obj.position.y=-.29*animalRest(p.code,time,p.restPhase); break;
      case 'fish-body': obj.position.x=.12*Math.sin(t*1.1); obj.position.y=.07*Math.sin(t*1.5); break;
      case 'wing': obj.rotation.z=p.side*Math.sin(t*2.65)*.32; break;
      case 'flutter': obj.rotation.y=p.side*(.38+.42*Math.sin(t*(5.8+proximity*2))); break;
      case 'tail': obj.position.x=-.47+.12*Math.sin(t*1.1); obj.position.y=.85+.07*Math.sin(t*1.5); obj.rotation.y=Math.sin(t*2.8)*.24; break;
      case 'hover': obj.position.y=p.baseY+(.12+proximity*.16)*Math.sin(t*1.4); obj.rotation.y=p.baseYaw+(.09+proximity*.12)*Math.sin(t*.83); break;
      case 'sway': obj.rotation.z=(.036+proximity*.055)*Math.sin(t*1.4); break;
      case 'breathe': obj.rotation.y=p.baseYaw+(.057+proximity*.08)*Math.sin(t*.86); obj.rotation.z=.008*Math.sin(t*1.85); break;
      case 'swim': obj.rotation.y=p.baseYaw+.048*Math.sin(t*1.18); break;
      case 'suspend':
        obj.position.y=p.baseY+.04+.04*Math.sin(t*1.13);
        obj.rotation.y=p.baseYaw+(.035+proximity*.09)*Math.sin(t*.81);
        break;
    }
  }
  animateAnimal(group,time,visitorPosition);
}
