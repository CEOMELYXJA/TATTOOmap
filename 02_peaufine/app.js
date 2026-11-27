import * as THREE from 'three';
import { worldWorks } from '../assets/world-catalog.js?v=2024-3';
import { createMotif, animateMotif } from './motifs.js?v=forest-horizon-fluid-1';

const $ = (s) => document.querySelector(s);
const canvas = $('#world');
const isTouch = matchMedia('(pointer: coarse)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#091b23');
scene.fog = new THREE.FogExp2('#18312f', 0.0045);
const camera = new THREE.PerspectiveCamera(isTouch ? 74 : 67, innerWidth/innerHeight, 0.1, 760);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.3 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = false;
const hemi = new THREE.HemisphereLight(0xc9e3d5, 0x303d36, 2.2);scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffddab, 2.45);sun.position.set(45,75,-60);scene.add(sun);
const blue = new THREE.DirectionalLight(0x83b9a7, .75);blue.position.set(-60,24,70);scene.add(blue);
const clock = new THREE.Clock();
const UP = new THREE.Vector3(0,1,0);
const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const palette = { forest: '#638a68', garden: '#8b9b68', night: '#575a78' };
const biomes = [
  {id:'forest',name:'FORÊT DES ENCRES',x:0,z:0,color:'#6a9d7d'},
  {id:'garden',name:'JARDIN BOTANIQUE',x:45,z:8,color:'#c2ab70'},
  {id:'night',name:'CRÉPUSCULE MYSTIQUE',x:-45,z:8,color:'#b3a3d3'}
];
// The year comes from the Wix upload record, not the date the tattoo was made.
// The complete catalogue remains available for future additions.
const works = worldWorks;
let positions=[];
let yaw=0, pitch=0, locked=false, active=false;
let keys={};
let camX=0,camZ=8, bob=0, mobileF=0,mobileR=0;
let interactionArt=null;
let toastTimer=0;
const activeMotifs = new Map();
const ray = new THREE.Raycaster();
const aim = new THREE.Vector2();
const focus = new THREE.Vector3();
// Fixed world coordinates keep every artwork visible as the visitor moves.
const mapScale = Math.min((230 - 24) / 180, (176 - 24) / 180);
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let menuOpen = false;

function rng(seed=312031){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}const rand=rng();
// Broad, walkable undulations; every object and the visitor use this same height.
const terrain=(x,z)=> 2.2*Math.sin(x*.008)*Math.cos(z*.009)+.65*Math.sin(x*.026)*Math.cos(z*.020)+.26*Math.sin(z*.049+x*.018);
function biomeAt(x,z){let best=biomes[0],d=Infinity;for(const b of biomes){const v=(x-b.x)**2+(z-b.z)**2;if(v<d){d=v;best=b}}return best;}

// Load local, repeatable CC0 textures after the world appears. If an image is
// unavailable, the existing material colours remain visible and usable.
function applyTexture(material, slot, file, repeat, isColor = false) {
  const url = new URL(`../assets/textures/${file}`, import.meta.url).href;
  new THREE.TextureLoader().load(url, texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
    material[slot] = texture;
    material.needsUpdate = true;
  }, undefined, () => {});
}
let skyGroup;
function addSky(){
  skyGroup=new THREE.Group();scene.add(skyGroup);
  const geo=new THREE.SphereGeometry(650,40,24);
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{t:{value:0}},vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vPos; void main(){float h=normalize(vPos).y;vec3 top=vec3(.023,.063,.110);vec3 horizon=vec3(.22,.34,.32);vec3 glow=vec3(.49,.36,.27);vec3 col=mix(horizon,top,smoothstep(-.20,.68,h));col=mix(glow,col,smoothstep(-.22,.19,h));gl_FragColor=vec4(col,1.);}`});
  skyGroup.add(new THREE.Mesh(geo,mat));
  const starPositions=[];for(let i=0;i<420;i++){const a=rand()*Math.PI*2,phi=.12+rand()*Math.PI*.48,rr=505;starPositions.push(Math.cos(a)*Math.cos(phi)*rr,Math.sin(phi)*rr,Math.sin(a)*Math.cos(phi)*rr)}
  const starsG=new THREE.BufferGeometry();starsG.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(starsG,new THREE.PointsMaterial({color:0xdce7c6,size:1.9,sizeAttenuation:false,transparent:true,opacity:.62,depthWrite:false}));skyGroup.add(stars);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(18,32,20),new THREE.MeshBasicMaterial({color:0xf2e7c3}));moon.position.set(-230,180,-400);skyGroup.add(moon);
}
function makeGround(){
  const seg=110,size=240;const geo=new THREE.PlaneGeometry(size,size,seg,seg);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position, colors=[];const c=new THREE.Color();
  const biomeColors=biomes.map(b=>new THREE.Color(palette[b.id]).lerp(new THREE.Color('#e3ded1'),.58));
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrain(x,z));
    // Blend the three soils instead of drawing hard biome borders.
    c.setRGB(0,0,0);let total=0;
    biomes.forEach((b,j)=>{const weight=1/Math.pow(600+(x-b.x)**2+(z-b.z)**2,2);c.r+=biomeColors[j].r*weight;c.g+=biomeColors[j].g*weight;c.b+=biomeColors[j].b*weight;total+=weight});
    c.multiplyScalar(1/total);const d=Math.sin(x*.13)*Math.sin(z*.19)*.043;c.offsetHSL(0,0,d);colors.push(c.r,c.g,c.b)
  }
  pos.needsUpdate=true;geo.computeVertexNormals();geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const groundMaterial = new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  applyTexture(groundMaterial, 'map', 'ground.jpg', [48,48], true);
  applyTexture(groundMaterial, 'normalMap', 'ground-normal.jpg', [48,48]);
  groundMaterial.normalScale.set(.42,.42);
  scene.add(new THREE.Mesh(geo,groundMaterial));
  // A low-cost terrain skirt extends under the distant forest. The playable
  // ground stays detailed; this surrounding mesh is never used for navigation.
  const ringPositions=[],ringColors=[],ringUvs=[],ringIndices=[];
  const along=48, across=12, inner=116, outer=350;
  for(let side=0;side<4;side++){
    const start=ringPositions.length/3;
    for(let j=0;j<=across;j++){
      const half=inner+(outer-inner)*j/across;
      for(let i=0;i<=along;i++){
        const edge=(i/along*2-1)*half;
        const x=side===0?half:side===1?-half:edge;
        const z=side===2?half:side===3?-half:edge;
        ringPositions.push(x,terrain(x,z)-.22,z);
        ringUvs.push((x+120)/240,(z+120)/240);
        c.setRGB(0,0,0);let total=0;
        biomes.forEach((b,k)=>{const weight=1/Math.pow(600+(x-b.x)**2+(z-b.z)**2,2);c.r+=biomeColors[k].r*weight;c.g+=biomeColors[k].g*weight;c.b+=biomeColors[k].b*weight;total+=weight});
        c.multiplyScalar(1/total);ringColors.push(c.r,c.g,c.b);
        if(i<along&&j<across){const n=start+j*(along+1)+i;ringIndices.push(n,n+along+1,n+1,n+1,n+along+1,n+along+2)}
      }
    }
  }
  const skirt=new THREE.BufferGeometry();
  skirt.setAttribute('position',new THREE.Float32BufferAttribute(ringPositions,3));
  skirt.setAttribute('color',new THREE.Float32BufferAttribute(ringColors,3));
  skirt.setAttribute('uv',new THREE.Float32BufferAttribute(ringUvs,2));
  skirt.setIndex(ringIndices);skirt.computeVertexNormals();
  // Both orientations are present around the square perimeter.
  const skirtMaterial=groundMaterial.clone();skirtMaterial.side=THREE.DoubleSide;
  // Keep the same texture callbacks as the foreground material.
  applyTexture(skirtMaterial,'map','ground.jpg',[48,48],true);
  applyTexture(skirtMaterial,'normalMap','ground-normal.jpg',[48,48]);
  scene.add(new THREE.Mesh(skirt,skirtMaterial));
}
function placeInstanced(geometry,material,count,positionFn){const m=new THREE.InstancedMesh(geometry,material,count);const dummy=new THREE.Object3D();for(let i=0;i<count;i++){const p=positionFn(i);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);dummy.rotation.set(p.rx||0,p.rot||0,p.rz||0);if(p.quaternion)dummy.quaternion.copy(p.quaternion);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)}m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;scene.add(m);return m}

// Select one isolated leaf or pine sprig from each photographic texture atlas.
function foliageGeometry(u0,v0,u1,v1) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const uv = geometry.attributes.uv;
  for (let i=0; i<uv.count; i++) uv.setXY(i, u0 + uv.getX(i)*(u1-u0), v0 + uv.getY(i)*(v1-v0));
  return geometry;
}

// A cluster is built out of separate textured leaves facing different directions.
// One shared geometry can then be instanced across the whole forest.
function leafClusterGeometry() {
  const random = rng(8675309);
  const source = foliageGeometry(.01,.50,.16,1).toNonIndexed();
  const positions=[], normals=[], uvs=[];
  const transform=new THREE.Object3D();
  const leafCount=isTouch?10:14;
  for(let i=0;i<leafCount;i++) {
    const angle=i*2.399963;
    const radius=.18+random()*.7;
    transform.position.set(Math.cos(angle)*radius,(random()-.5)*1.2,Math.sin(angle)*radius);
    transform.rotation.set((random()-.5)*1.3,angle,(random()-.5)*1.5);
    const scale=.55+random()*.42;
    transform.scale.set(scale,scale,scale);
    transform.updateMatrix();
    const leaf=source.clone();
    leaf.applyMatrix4(transform.matrix);
    positions.push(...leaf.attributes.position.array);
    normals.push(...leaf.attributes.normal.array);
    uvs.push(...leaf.attributes.uv.array);
    leaf.dispose();
  }
  source.dispose();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeBoundingSphere();
  return geometry;
}
function foliageMaterial(colorFile, alphaFile, color) {
  const material = new THREE.MeshStandardMaterial({color, side:THREE.DoubleSide, roughness:1, alphaTest:.4});
  material.visible = false;
  const loader = new THREE.TextureLoader();
  const root = new URL('../assets/textures/', import.meta.url);
  let loaded = 0;
  const done = () => { if (++loaded === 2) { material.visible=true; material.needsUpdate=true; } };
  loader.load(new URL(colorFile,root).href, texture => { texture.colorSpace=THREE.SRGBColorSpace; material.map=texture; done(); });
  loader.load(new URL(alphaFile,root).href, texture => { material.alphaMap=texture; done(); });
  return material;
}
function trees(){
  const trunks=new THREE.CylinderGeometry(.32,.66,1,10);trunks.translate(0,.5,0);
  const treePositions=[];for(let k=0;k<3;k++){const b=biomes[k];const n=k===0?320:260;for(let i=0;i<n;i++){
    const a=rand()*6.283, r=13+Math.sqrt(rand())*54;
    const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
    if (biomeAt(x,z)!==b || Math.abs(x)>90 || Math.abs(z)>85) continue;
    // Reserve each central gallery and arrival point for a clear view.
    if (biomes.some(center => Math.hypot(x-center.x,z-center.z) < 14)) continue;
    if (positions.some(p => Math.hypot(x-p.x,z-p.z) < 10 || Math.hypot(x-p.entryX,z-p.entryZ) < 8)) continue;
    if(Math.abs(x)<7&&z<40&&z>-70)continue;
    if(Math.abs(x-(b.x+20))<5&&Math.abs(z-(b.z+20))<5)continue;
    treePositions.push({x,y:terrain(x,z),z,biome:k,sx:.9+rand()*.55,sy:24+rand()*14,sz:.9+rand()*.55,rot:rand()*6.28});
  }}
  // Add one neighbour for every existing tree while keeping clearings and paths open.
  const originalTrees=treePositions.slice();
  for (const parent of originalTrees) {
    const b=biomes[parent.biome];
    let added=false;
    for (let attempt=0; attempt<160 && !added; attempt++) {
      const angle=rand()*Math.PI*2;
      const distance=attempt<100 ? 2.5+rand()*3 : .05+rand()*2.45;
      const x=parent.x+Math.cos(angle)*distance, z=parent.z+Math.sin(angle)*distance;
      if (biomeAt(x,z)!==b || Math.abs(x)>90 || Math.abs(z)>85) continue;
      if (biomes.some(center => Math.hypot(x-center.x,z-center.z) < 14)) continue;
      if (positions.some(p => Math.hypot(x-p.x,z-p.z) < 10 || Math.hypot(x-p.entryX,z-p.entryZ) < 8)) continue;
      if (Math.abs(x)<7 && z<40 && z>-70) continue;
      if (Math.abs(x-(b.x+20))<5 && Math.abs(z-(b.z+20))<5) continue;
      if (treePositions.some(existing => Math.hypot(x-existing.x,z-existing.z) < 1.5)) continue;
      treePositions.push({x,y:terrain(x,z),z,biome:parent.biome,sx:.9+rand()*.55,sy:24+rand()*14,sz:.9+rand()*.55,rot:rand()*6.28});
      added=true;
    }
  }
  const tmat=new THREE.MeshStandardMaterial({color:0xd8cbb7,roughness:1});
  applyTexture(tmat, 'map', 'bark.jpg', [1,2], true);
  applyTexture(tmat, 'normalMap', 'bark-normal.jpg', [1,2]);
  tmat.normalScale.set(.55,.55);
  placeInstanced(trunks,tmat,treePositions.length,i=>({...treePositions[i],sx:treePositions[i].sx,sy:treePositions[i].sy,sz:treePositions[i].sz}));
  // Each branch supports multiple clusters of distinct leaves, with no solid crown.
  const limbs=[],leafClusters=[];
  const branchesPerTree=isTouch?12:17;
  for (const p of treePositions) {
    for(let i=0;i<branchesPerTree;i++) {
      const angle=p.rot+i*2.399963;
      const level=(i%6)/5;
      const height=p.sy*(.48+level*.40);
      const length=(5.3-level*1.8)*p.sx;
      const direction=new THREE.Vector3(Math.cos(angle)*length,length*(.25+level*.15),Math.sin(angle)*length);
      const center=new THREE.Vector3(p.x,p.y+height,p.z).addScaledVector(direction,.5);
      limbs.push({x:center.x,y:center.y,z:center.z,sx:1,sy:direction.length(),sz:1,quaternion:new THREE.Quaternion().setFromUnitVectors(UP,direction.clone().normalize())});
      for(const fraction of [.55,.82,1.04]) {
        const size=1.35+rand()*.45;
        leafClusters.push({x:p.x+direction.x*fraction,y:p.y+height+direction.y*fraction,z:p.z+direction.z*fraction,
          sx:size*p.sx,sy:size,sz:size*p.sz,rot:angle+rand()*1.2,rx:(rand()-.5)*.4,rz:(rand()-.5)*.4});
      }
    }
    // A leafy apex closes the canopy without replacing it with an opaque mass.
    leafClusters.push({x:p.x,y:p.y+p.sy*.97,z:p.z,sx:1.8*p.sx,sy:1.5,sz:1.8*p.sz,rot:p.rot});
  }
  placeInstanced(new THREE.CylinderGeometry(.045,.20,1,7),tmat,limbs.length,i=>limbs[i]);
  const leaves=foliageMaterial('leaves.jpg','leaves-alpha.png',0xb8cda5);
  placeInstanced(leafClusterGeometry(),leaves,leafClusters.length,i=>leafClusters[i]);
  horizonForest(tmat,leaves);
  // Flower meadow: one draw call per palette, not thousands of individual meshes.
  const flowerGeo=new THREE.IcosahedronGeometry(.12,0);
  const paletteFlowers=[0xe2c48d,0xe7d9ca,0x9fb2c6,0xe3aba3];
  for(let colorIndex=0;colorIndex<4;colorIndex++){
    const floral=[];for(let i=0;i<250;i++){const b=biomes[(i+colorIndex)%3],a=rand()*6.28,r=8+Math.sqrt(rand())*48,x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
      floral.push({x,y:terrain(x,z)+.20+rand()*.24,z,sx:.8+rand(),sy:1+rand(),sz:1})}
    placeInstanced(flowerGeo,new THREE.MeshStandardMaterial({color:paletteFlowers[colorIndex],emissive:paletteFlowers[colorIndex],emissiveIntensity:.18}),floral.length,i=>floral[i]);
  }
  const blades=new THREE.ConeGeometry(.10,1.0,3);blades.translate(0,.4,0);
  const grass=[];for(let i=0;i<1000;i++){const b=biomes[i%3],a=rand()*6.28,r=8+Math.sqrt(rand())*52,x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;grass.push({x,y:terrain(x,z),z,sx:.4+rand(),sy:.45+rand()*.8,sz:1,rot:rand()*6.28})}
  placeInstanced(blades,new THREE.MeshStandardMaterial({color:0x739a6f,side:THREE.DoubleSide,roughness:1}),grass.length,i=>grass[i]);
}
// A layered belt of simplified but textured trees conceals every map edge.
// It is outside the playable +/-90 area and uses only two additional draw calls.
function horizonForest(trunkMaterial,leafMaterial){
  const random=rng(880167), distantTrunks=[], distantLeaves=[];
  for(let row=0;row<4;row++){
    const half=105+row*19, count=36+row*6;
    for(let side=0;side<4;side++) for(let i=0;i<count;i++){
      const p=((i+random())/count*2-1)*half;
      const edge=half+(random()-.5)*8;
      const x=side===0?edge:side===1?-edge:p;
      const z=side===2?edge:side===3?-edge:p;
      const y=terrain(x,z), height=28+random()*15, width=.8+random()*.55;
      distantTrunks.push({x,y,z,sx:width,sy:height,sz:width,rot:random()*Math.PI*2});
      for(let crown=0;crown<4;crown++){
        const angle=crown*2.399963+random()*.5;
        const spread=crown===3?0:2.0+random();
        const size=2.6+random()*.9;
        distantLeaves.push({x:x+Math.cos(angle)*spread,y:y+height*(.70+crown*.085),z:z+Math.sin(angle)*spread,
          sx:size*width,sy:size*.8,sz:size*width,rot:angle});
      }
    }
  }
  const trunks=new THREE.CylinderGeometry(.32,.62,1,6);trunks.translate(0,.5,0);
  placeInstanced(trunks,trunkMaterial,distantTrunks.length,i=>distantTrunks[i]);
  placeInstanced(leafClusterGeometry(),leafMaterial,distantLeaves.length,i=>distantLeaves[i]);
}
// Quiet paths and clustered understory give the landscapes depth without individual draw calls.
function landscapeDetails(){
  const rockGeo=new THREE.DodecahedronGeometry(1,0);
  const shrubGeo=new THREE.IcosahedronGeometry(1,1);
  const rockColors=[0x6a7161,0x99917c,0x686578];
  const shrubColors=[0x345e45,0x82936a,0x544e72];
  for(let k=0;k<3;k++){
    const b=biomes[k],rocks=[],shrubs=[];
    for(let i=0;i<145;i++){
      const a=rand()*Math.PI*2,r=12+Math.sqrt(rand())*48;
      const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
      if (biomeAt(x,z)!==b || Math.abs(x)>90 || Math.abs(z)>85) continue;
      if (positions.some(p => Math.hypot(x-p.x,z-p.z) < 5 || Math.hypot(x-p.entryX,z-p.entryZ) < 4)) continue;
      const q=.35+rand()*1.15;
      rocks.push({x,y:terrain(x,z)+q*.20,z,sx:q*(1+rand()),sy:q*.5,sz:q,rot:rand()*6.28});
    }
    for(let i=0;i<245;i++){
      const a=rand()*Math.PI*2,r=12+Math.sqrt(rand())*48;
      const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r,q=.45+rand()*.8;
      if (biomeAt(x,z)!==b || Math.abs(x)>90 || Math.abs(z)>85) continue;
      if (positions.some(p => Math.hypot(x-p.x,z-p.z) < 5 || Math.hypot(x-p.entryX,z-p.entryZ) < 4)) continue;
      shrubs.push({x,y:terrain(x,z)+q*.55,z,sx:q*1.35,sy:q*.7,sz:q,rot:rand()*6.28});
    }
    placeInstanced(rockGeo,new THREE.MeshStandardMaterial({color:rockColors[k],roughness:1,flatShading:true}),rocks.length,i=>rocks[i]);
    placeInstanced(shrubGeo,new THREE.MeshStandardMaterial({color:shrubColors[k],roughness:1,flatShading:true}),shrubs.length,i=>shrubs[i]);
  }
  // Low, gently curving paths link the central clearings. Their vertices follow terrain.
  for(const target of [biomes[1],biomes[2]]){
    const coords=[],indices=[],segments=180;
    for(let i=0;i<=segments;i++){
      const t=i/segments,x=target.x*t,z=target.z*t+Math.sin(t*Math.PI)*12;
      const dx=target.x,dz=target.z+12*Math.PI*Math.cos(t*Math.PI),len=Math.hypot(dx,dz);
      for(const side of [-1,1]){
        const px=x-side*dz/len*2.2,pz=z+side*dx/len*2.2;
        coords.push(px,terrain(px,pz)+.15,pz);
      }
      if(i<segments){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3)}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setIndex(indices);geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x9a8b6d,roughness:1,side:THREE.DoubleSide})));
  }
}
const atmosphere={
  forest:{fog:0x18312f,sky:0x091b23,sun:0xffddab,hemi:0xc9e3d5,exposure:1.35},
  garden:{fog:0x45544a,sky:0x233b3a,sun:0xffdfa7,hemi:0xf3e7c8,exposure:1.48},
  night:{fog:0x282b45,sky:0x10172f,sun:0xb4bee7,hemi:0xaab6dc,exposure:1.12}
};
const atmosphereColors={fog:new THREE.Color(),sky:new THREE.Color(),sun:new THREE.Color(),hemi:new THREE.Color()};
function updateAtmosphere(delta){
  const a=atmosphere[biomeAt(camX,camZ).id],blend=1-Math.exp(-delta*.6);
  scene.fog.color.lerp(atmosphereColors.fog.set(a.fog),blend);
  scene.background.lerp(atmosphereColors.sky.set(a.sky),blend);
  sun.color.lerp(atmosphereColors.sun.set(a.sun),blend);
  hemi.color.lerp(atmosphereColors.hemi.set(a.hemi),blend);
  renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,a.exposure,blend);
}
function landmarks(){
  for(const b of biomes){
    // Curving illuminated trail is a geometry, not a static image.
    const pts=[];for(let i=0;i<=160;i++){const t=i/160*Math.PI*5,r=7+i/160*35,x=b.x+Math.cos(t)*r,z=b.z+Math.sin(t)*r;pts.push(v3(x,terrain(x,z)+.08,z))}
    const curve=new THREE.CatmullRomCurve3(pts);const track=new THREE.Mesh(new THREE.TubeGeometry(curve,520,.055,3,false),new THREE.MeshBasicMaterial({color:b.color,transparent:true,opacity:.64}));scene.add(track);
  }
  // Water garden pond, with offset glints.
  const pool=new THREE.Mesh(new THREE.CircleGeometry(8,48),new THREE.MeshStandardMaterial({color:0x447b82,metalness:.65,roughness:.23,transparent:true,opacity:.85,side:THREE.DoubleSide}));pool.rotation.x=-Math.PI/2;pool.scale.y=.55;pool.position.set(56,terrain(56,30)+.13,30);scene.add(pool);
  // Moonglow under darker sector.
  const lamp=new THREE.PointLight(0x9887bd,70,55);lamp.position.set(-45,15,8);scene.add(lamp);
  const lamp2=new THREE.PointLight(0xd9af84,50,45);lamp2.position.set(45,9,8);scene.add(lamp2);
}
const flecks=[];let fleckGeo;
function makeFireflies(){const particles=260;const p=new Float32Array(particles*3);for(let i=0;i<particles;i++){const b=biomes[i%3],a=rand()*6.283,r=8+rand()*48;const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r,y=terrain(x,z)+2+rand()*7;flecks.push({x,y,z,offset:rand()*6.28});p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z}fleckGeo=new THREE.BufferGeometry();fleckGeo.setAttribute('position',new THREE.BufferAttribute(p,3));scene.add(new THREE.Points(fleckGeo,new THREE.PointsMaterial({color:0xefdc9a,size:.26,transparent:true,opacity:.8,depthWrite:false})))}
const botanical = new Set(['rose', 'flower', 'flowers', 'blossom', 'blossomBranch', 'floweringBranch', 'lotus', 'sunflower', 'palm', 'branch', 'redRose']);
const aquatic = new Set(['fish', 'betta', 'anglerfish', 'seahorse', 'swordfish']);
const wild = new Set(['tiger', 'lion', 'gorilla', 'cat', 'dog', 'pug', 'bear', 'cub', 'teddy', 'bird', 'raptor', 'eagle', 'owl', 'butterfly', 'moth', 'snake', 'turtle']);
const facesPositiveX = new Set(['tiger', 'lion', 'cat', 'dog', 'pug', 'gorilla', 'bear', 'snake', 'turtle']);

function habitat(work) {
  const primary = work.models[0];
  if (botanical.has(primary) || aquatic.has(primary)) return biomes[1];
  return wild.has(primary) ? biomes[0] : biomes[2];
}

function createPositions() {
  const counts = new Map();
  const placed = [];
  positions = works.map((work, index) => {
    const biome = habitat(work);
    const ordinal = counts.get(biome.id) || 0;
    counts.set(biome.id, ordinal + 1);
    // Give every work and its approach space, even where the sectors meet.
    for (let attempt = 0; attempt < 600; attempt++) {
      const step = ordinal + attempt;
      const radius = 15 + Math.sqrt(step) * 1.9;
      const angle = step * 2.399963 + biomes.indexOf(biome) * 0.7;
      const x = biome.x + Math.cos(angle) * radius;
      const z = biome.z + Math.sin(angle) * radius;
      const entryX = x - Math.cos(angle) * 6.5;
      const entryZ = z - Math.sin(angle) * 6.5;
      if (biomeAt(x,z) !== biome || Math.abs(x)>80 || Math.abs(z)>80) continue;
      if (placed.some(p => Math.hypot(x-p.x,z-p.z)<9 ||
          Math.hypot(entryX-p.x,entryZ-p.z)<5 ||
          Math.hypot(x-p.entryX,z-p.entryZ)<5)) continue;
      const point = {index, x, z, y:terrain(x,z), biome:biome.id, angle, entryX, entryZ};
      placed.push(point);
      return point;
    }
    throw new Error('Impossible de placer toutes les œuvres dans la carte.');
  });
}

function refreshMotifs() {
  const renderDistance = isTouch ? 42 : 55;
  for (const point of positions) {
    const distance = Math.hypot(point.x - camX, point.z - camZ);
    const current = activeMotifs.get(point.index);
    if (current && distance > renderDistance + 8) {
      scene.remove(current);
      activeMotifs.delete(point.index);
    } else if (!current && distance < renderDistance) {
      const group = createMotif(works[point.index]);
      group.userData.artIndex = point.index;
      group.position.set(point.x, point.y, point.z);
      // Turn each principal motif toward the center of its clearing.
      const primary = works[point.index].models[0];
      group.rotation.y = facesPositiveX.has(primary) ? Math.PI - point.angle : -Math.PI / 2 - point.angle;
      scene.add(group);
      group.updateMatrixWorld(true);
      activeMotifs.set(point.index, group);
    }
  }
  $('#visibleCount').textContent = activeMotifs.size;
}

// Read the visible mesh first, with a small target around openwork and thin stems.
function artworkAt(ndc) {
  ray.setFromCamera(ndc, camera);
  ray.far = 13;
  const groups = [...activeMotifs.values()];
  const hit = ray.intersectObjects(groups, true)[0];
  if (hit) {
    let node = hit.object;
    while (node && node.userData.artIndex === undefined) node = node.parent;
    if (node) return works[node.userData.artIndex];
  }
  let bestDistance = ray.far;
  let found = null;
  for (const group of groups) {
    group.children[0].getWorldPosition(focus);
    focus.y = group.position.y + (group.userData.focusHeight || 1.15);
    const distance = camera.position.distanceTo(focus);
    if (distance < bestDistance && focus.clone().sub(camera.position).dot(ray.ray.direction) > 0 &&
        ray.ray.distanceSqToPoint(focus) < 0.42 ** 2) {
      bestDistance = distance;
      found = works[group.userData.artIndex];
    }
  }
  return found;
}

function getNearest() { return artworkAt(aim.set(0, 0)); }

function inspect(art){ if(!art)return;document.exitPointerLock?.();$('#detailTitle').textContent=art.title;$('#detailYear').textContent=art.year||'—';$('#detailDescription').textContent=art.description||'Une œuvre de Melisa Fortin.';$('#detailCategory').textContent=art.category||'Tatouage';$('#detailPhoto').src=art.image;$('#detailPhoto').alt=art.title;const link=$('#detailSource');if(art.source?.startsWith('https://')){link.hidden=false;link.href=art.source}else{link.hidden=true;link.removeAttribute('href')}$('#details').hidden=false;}
function hideDetails(){$('#details').hidden=true}
function hideHelp(){$('#help').hidden=true}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
function visitMotif(point) {
  if (!point) return;
  const biome = biomes.find(b => b.id === point.biome);
  const angle = Math.atan2(point.z - biome.z, point.x - biome.x);
  camX = point.x - Math.cos(angle) * 6.5;
  camZ = point.z - Math.sin(angle) * 6.5;
  refreshMotifs();
  const group = activeMotifs.get(point.index);
  const height = group?.userData.focusHeight || 1.15;
  yaw = Math.atan2(camX - point.x, camZ - point.z);
  pitch = Math.atan2(point.y + height - terrain(camX,camZ) - 1.85, 6.5);
  camera.position.set(camX, terrain(camX,camZ) + 1.85, camZ);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  camera.updateMatrixWorld();
  interactionArt = getNearest();
  updateLocation();
  drawMiniMap();
}

function updateLocation(){
  $('#coords').textContent=`X ${Math.round(camX)} · Z ${Math.round(camZ)}`;
}
function drawMiniMap(){
  const can=$('#minimap'),ctx=can.getContext('2d'),w=can.width,h=can.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(7,26,24,.65)';ctx.fillRect(0,0,w,h);
  for(let x=0;x<=w;x+=23){ctx.strokeStyle='rgba(183,200,176,.09)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<=h;y+=22){ctx.strokeStyle='rgba(183,200,176,.09)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const scale=mapScale,tx=x=>w/2+x*scale,ty=z=>h/2+z*scale;
  for(let i=0;i<positions.length;i++){const p=positions[i],x=tx(p.x),y=ty(p.z);if(x<0||x>w||y<0||y>h)continue;ctx.fillStyle='rgba(233,215,164,.82)';ctx.beginPath();ctx.arc(x,y,2.4,0,Math.PI*2);ctx.fill()}
  ctx.save();ctx.translate(tx(camX),ty(camZ));ctx.rotate(-yaw);ctx.fillStyle='#d0efae';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.restore();
}
function folded(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
}

function searchResults() {
  const input = $('#search');
  const term = folded(input.value.trim());
  const out = $('#results');
  out.replaceChildren();
  out.hidden = !term && !menuOpen;
  $('#searchCount').textContent = '';
  if (out.hidden) return;
  const matches = works.map((work,i) => ({work,i})).filter(({work}) =>
    [work.title, work.category, work.description, work.year].some(value => folded(value).includes(term)));
  $('#searchCount').textContent = matches.length;
  for (const {work,i} of matches) {
    const button = document.createElement('button');
    button.textContent = work.title;
    const small = document.createElement('small');
    small.textContent = work.category;
    button.append(small);
    button.onclick = () => {
      visitMotif(positions[i]);
      input.value = '';
      input.blur();
      menuOpen = false;
      searchResults();
      showToast(work.title);
    };
    out.append(button);
  }
  if (!matches.length) out.textContent = 'Aucun tatouage trouvé.';
}

function setupMap() {
  const map = $('#minimap');
  map.onclick = event => {
    const bounds = map.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * map.width / mapScale;
    const z = ((event.clientY - bounds.top) / bounds.height - 0.5) * map.height / mapScale;
    let target;
    let threshold = 9 / mapScale;
    for (const point of positions) {
      const distance = Math.hypot(point.x - x, point.z - z);
      if (distance < threshold) { target = point; threshold = distance; }
    }
    if (target) {
      visitMotif(target);
      showToast(works[target.index].title);
    }
  };
  $('#catalogBtn').onclick = () => {
    inputCatalog();
  };
  function inputCatalog() {
    document.exitPointerLock?.();
    menuOpen = !menuOpen;
    $('#search').value = '';
    searchResults();
    if (menuOpen) $('#search').focus();
  }
}

function setupEvents(){
  const lockPointer = () => canvas.requestPointerLock?.()?.catch(() => {});
  $('#enter').disabled = false;
  $('#enter').onclick = () => {
    $('#intro').hidden = true;
    active = true;
    if (!isTouch) lockPointer();
  };
  canvas.addEventListener('click', event => {
    if (!active || !$('#details').hidden || !$('#help').hidden || touchWasDrag) return;
    const bounds = canvas.getBoundingClientRect();
    const ndc = locked ? aim.set(0,0) : aim.set(
      (event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2);
    const work = artworkAt(ndc);
    if (work) inspect(work);
    else if (!isTouch && !locked) lockPointer();
  });
  document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===canvas);
  document.addEventListener('mousemove',e=>{if(!locked||!active||!$('#details').hidden)return;yaw-=e.movementX*.00225;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.00225,-1.35,1.35)});
  document.addEventListener('keydown',e=>{
    if (e.code === 'Escape') {
      if (document.pointerLockElement) document.exitPointerLock?.();
      hideDetails(); hideHelp(); menuOpen = false; $('#search').value = ''; searchResults(); $('#search').blur();
      return;
    }
    if (!active || !$('#details').hidden || !$('#help').hidden || e.target instanceof HTMLInputElement) return;
    keys[e.code]=true;
    if(e.code==='KeyE'&&active&&$('#details').hidden&&$('#help').hidden)inspect(getNearest());
  });
  document.addEventListener('keyup',e=>{keys[e.code]=false});
  const stopMovement=()=>{keys={};mobileF=mobileR=0;$('#knob').style.transform='translate(0,0)'};
  addEventListener('blur',stopMovement);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMovement()});
  $('#search').addEventListener('input',searchResults);
  $('#fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
  $('#helpBtn').onclick=()=>{document.exitPointerLock?.();$('#help').hidden=false};
  $('#helpDim').onclick=$('#closeHelp').onclick=$('#helpOkay').onclick=hideHelp;
  $('#closeDetails').onclick=$('#closeDim').onclick=hideDetails;
  $('#mobileInspect').onclick=()=>inspect(getNearest());
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.3:1.75))});
  setupMap();
  if(isTouch)setupTouch();
}
let touchWasDrag = false;
function setupTouch(){
  $('#mobileControls').hidden=false;
  $('#interaction strong').textContent='EXAMINER';
  const joy=$('#joystick'),knob=$('#knob');let joyId=null,lookId=null,lastX=0,lastY=0,startX=0,startY=0;
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joystickMove(e)});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joystickMove(e)});
  const release=e=>{if(e.pointerId!==joyId)return;joyId=null;mobileR=mobileF=0;knob.style.transform='translate(0,0)'};
  joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);
  function joystickMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(len,39)/len;mobileR=dx*scale/39;mobileF=-dy*scale/39;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;lookId=e.pointerId;touchWasDrag=false;startX=lastX=e.clientX;startY=lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||!active)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>8)touchWasDrag=true;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastY)*.006,-1.35,1.35);lastX=e.clientX;lastY=e.clientY});
  canvas.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null});
  $('#mobileLook').onclick=()=>showToast('Glisse sur le paysage pour tourner la caméra.');
}
function animateDecor(t){
  for (const group of activeMotifs.values()) animateMotif(group, prefersReducedMotion.matches ? 0 : t, camera.position);
  const attr=fleckGeo.attributes.position;for(let i=0;i<flecks.length;i++)attr.setY(i,flecks[i].y+Math.sin(t*.85+flecks[i].offset)*.38);attr.needsUpdate=true;
}
let frameCounter=0,fpsLast=0,worldLast=0,miniLast=0,interactionLast=0;
function animate(){requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.065),t=clock.elapsedTime;
  const modal=!$('#details').hidden||!$('#help').hidden;
  let f=0,r=0;if(active&&!modal&&document.activeElement!==$('#search')){f=(keys.KeyW||keys.KeyZ||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+mobileF;r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.KeyQ||keys.ArrowLeft?1:0)+mobileR}
  const velocity=v3(r,0,-f);if(velocity.lengthSq()){velocity.normalize().applyAxisAngle(UP,yaw).multiplyScalar((keys.ShiftLeft||keys.ShiftRight?12.4:6.2)*delta);camX=THREE.MathUtils.clamp(camX+velocity.x,-90,90);camZ=THREE.MathUtils.clamp(camZ+velocity.z,-90,90);bob+=delta*11}else{bob+=delta*3}
  camera.position.set(camX,terrain(camX,camZ)+1.85+(velocity.lengthSq()?.034*Math.sin(bob):0),camZ);camera.rotation.set(pitch,yaw,0,'YXZ');
  skyGroup.position.copy(camera.position);updateAtmosphere(delta);
  animateDecor(t);renderer.render(scene,camera);
  frameCounter++;if(t-fpsLast>1){$('#fps').textContent=String(Math.round(frameCounter/(t-fpsLast)));frameCounter=0;fpsLast=t}
  if(t-worldLast>.42){refreshMotifs();updateLocation();worldLast=t}
  if(t-miniLast>.26){drawMiniMap();miniLast=t}
  if(t-interactionLast>.13){interactionArt=active&&!modal?getNearest():null;$('#interaction').hidden=!interactionArt;if(interactionArt)$('#nearTitle').textContent=interactionArt.title;interactionLast=t}
}
createPositions();
addSky();
makeGround();
trees();
landscapeDetails();
landmarks();
makeFireflies();
setupEvents();
$('#totalCount').textContent = works.length;
visitMotif(positions.find(p => works[p.index].models[0] === 'tiger') || positions[0]);
animate();
