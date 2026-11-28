import * as THREE from 'three';
const touchDetail=typeof globalThis.matchMedia==='function' && globalThis.matchMedia('(pointer: coarse)').matches;

// Rounded, genuinely three-dimensional petal shells. Three short bands allow
// a soft colour transition without a texture, transparent card or extra draw.
function makePetalBand(from,to) {
  const vertices=[], normals=[], indices=[], rows=touchDetail?3:4, columns=touchDetail?6:8;
  function point(t,u,back) {
    const width=Math.pow(Math.sin(Math.PI*t),.68)*(.84+.16*t);
    const bowl=(1-u*u)*Math.sin(Math.PI*t);
    const shell=(back?-.020:.020)*Math.sin(Math.PI*t)*(1-u*u);
    return new THREE.Vector3(u*width,t,.12*Math.sin(Math.PI*t)+.13*t*t+.075*bowl+shell);
  }
  for(let back=0;back<2;back++) for(let row=0;row<=rows;row++) {
    const t=from+(to-from)*row/rows;
    for(let col=0;col<=columns;col++) {
      const u=col/columns*2-1;
      const p=point(t,u,back),tt=THREE.MathUtils.clamp(t,.0001,.9999),eps=.00005;
      const du=point(tt,u+eps,back).sub(point(tt,u-eps,back));
      const dt=point(Math.min(1,tt+eps),u,back).sub(point(Math.max(0,tt-eps),u,back));
      // Keep normals aligned with the triangles on both surfaces. Reversed
      // normals made the front petals react like their shadowed backs.
      const normal=du.cross(dt).normalize().multiplyScalar(back?1:-1);
      vertices.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);
    }
  }
  const layer=(rows+1)*(columns+1);
  for(let back=0;back<2;back++) for(let row=0;row<rows;row++) for(let col=0;col<columns;col++) {
    const a=back*layer+row*(columns+1)+col, b=a+columns+1;
    if(back) indices.push(a,a+1,b,a+1,b+1,b);
    else indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setIndex(indices);return geometry;
}
const petals=[makePetalBand(0,1/3),makePetalBand(1/3,2/3),makePetalBand(2/3,1)];

// A folded leaf shell with a raised centre, built along local +Y.
function makeLeaf() {
  const p=[],ix=[],rows=touchDetail?7:10,cols=touchDetail?4:6;
  for(let back=0;back<2;back++) for(let y=0;y<=rows;y++) {
    const t=y/rows,w=Math.pow(Math.sin(Math.PI*t),.82);
    for(let x=0;x<=cols;x++) {
      const u=x/cols*2-1;
      p.push(u*w,t,.12*Math.sin(Math.PI*t)*(1-u*u)+.13*t*t+(back?-.015:.015)*w);
    }
  }
  const layer=(rows+1)*(cols+1);
  for(let side=0;side<2;side++) for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const a=side*layer+y*(cols+1)+x,b=a+cols+1;
    if(side) ix.push(a,a+1,b,a+1,b+1,b); else ix.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setIndex(ix);g.computeVertexNormals();return g;
}
const leafGeometry=makeLeaf(), antherGeometry=new THREE.SphereGeometry(1,8,6), UP=new THREE.Vector3(0,1,0);
function mix(a,b,t){return new THREE.Color(a).lerp(new THREE.Color(b),t).getHex();}
function randomFor(seed){let state=(seed||1)>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}

function leaf(b,start,end,width,color) {
  const a=new THREE.Vector3(...start),z=new THREE.Vector3(...end),direction=z.clone().sub(a),len=direction.length();
  if(len<.001)return;
  const q=new THREE.Quaternion().setFromUnitVectors(UP,direction.normalize());
  b.add(leafGeometry,start,[width,len,width*.65],color,[0,0,0],q);
  // Follow the curved shell in its own frame so the raised veins stay on the
  // leaf when it tilts in any direction. Small palm leaflets stay lightweight.
  const point=(t,u)=>{
    const w=Math.pow(Math.sin(Math.PI*t),.82);
    const local=new THREE.Vector3(u*w*width,t*len,
      (.12*Math.sin(Math.PI*t)*(1-u*u)+.13*t*t+.015*w)*width*.65+.006);
    return local.applyQuaternion(q).add(a).toArray();
  };
  const veinColor=mix(color,'#d9ddae',.22);
  b.path([point(.04,0),point(.5,0),point(.96,0)],Math.max(.0025,width*.018),veinColor);
  if(len>.42){
    for(const t of [.34,.56,.75]) for(const side of [-1,1]){
      b.path([point(t,0),point(t+.08,side*.42),point(t+.13,side*.78)],
        Math.max(.0018,width*.010),veinColor);
    }
  }
}

function blossom(b,x,y,z,scale,code,tint,shape,rand) {
  const rose=code==='rose', sun=code==='sunflower', lotus=code==='lotus', small=code==='blossom';
  const base=shape.hue || (rose?'#b74455':sun?'#cf8f26':lotus?'#d78398':tint);
  const tip=shape.tip || (rose?'#e48991':sun?'#f2c05d':lotus?'#f2c8cf':'#eed0cf');
  const layers=shape.layers || (rose?3:lotus?2:sun?2:1);
  const count=shape.petals || (rose?10:sun?17:lotus?10:small?5:7);
  for(let layer=0;layer<layers;layer++) {
    const n=Math.max(4,count-layer*(rose?2:1));
    const spread=(rose?.13:lotus?.12:.10)*scale*(1-layer*.15);
    const length=(rose?.53:sun?.63:lotus?.58:small?.34:.49)*scale*(1-layer*.15);
    const width=(shape.width || (rose?.19:sun?.073:lotus?.12:small?.11:.15))*scale*(1-layer*.12);
    for(let i=0;i<n;i++){
      const angle=i*Math.PI*2/n+layer*.43+(rand()-.5)*.055;
      const origin=[x+Math.sin(angle)*spread,y+Math.cos(angle)*spread*.82,z+layer*.045*scale];
      const rotation=[-.24-layer*.13,Math.sin(angle)*.12,-angle];
      const sizes=[width,length*(.95+rand()*.10),scale*.65];
      for(let band=0;band<3;band++) b.add(petals[band],origin,sizes,mix(base,tip,.12+band*.12),rotation);
      // Fine organic grooves, strongest at the base, follow the petal face.
      if(!rose && i%2===0 && scale>.38){
        const r0=spread+.08*scale,r1=spread+length*.72;
        b.path([[x+Math.sin(angle)*r0,y+Math.cos(angle)*r0*.82,z+.065*scale],
          [x+Math.sin(angle)*r1,y+Math.cos(angle)*r1*.82,z+.14*scale]],.0045*scale,mix(base,tip,.58));
      }
    }
  }
  const center=shape.blackwork?'#87827d':sun?'#704d2e':rose?mix(base,tip,.18):'#be9d64';
  b.ball([x,y+.015*scale,z+.12*scale],[scale*(sun?.20:.10),scale*(sun?.18:.095),.11*scale],center);
  if(!rose){
    const num=sun?20:8;
    for(let i=0;i<num;i++){
      const a=i*2.399963,r=(sun?.035:.023)*Math.sqrt(i)*scale;
      const sx=x+Math.cos(a)*r,sy=y+Math.sin(a)*r*.85;
      b.rod([sx,sy,z+.14*scale],[sx,sy+.045*scale,z+.19*scale],.004*scale,.003*scale,center);
      b.add(antherGeometry,[sx,sy+.045*scale,z+.19*scale],[.012*scale,.012*scale,.012*scale],mix(center,'#e9d29b',.5));
    }
  }
}

/** Build a detailed botanical motif with the existing tattoo-specific layout. */
export function buildDetailedPlant(b,code,variant,identitySeed,design={}) {
  if(!['rose','flower','blossom','palm','sunflower','lotus'].includes(code))return false;
  const rand=randomFor(identitySeed), black=Boolean(design.blackwork || variant==='blackwork');
  const stem=black?'#737670':'#54724b', green=black?'#858780':'#537b52';
  const palette={...design};
  if(black){palette.hue='#77736f';palette.tip='#bbb6b1';palette.blackwork=true;}
  const tint=palette.hue || (variant==='plum'?'#955e82':'#cf99ab');
  if(code==='palm'){
    b.path([[0,0,0],[.09,.88,.03],[-.07,1.65,0],[.08,2.37,0]],.12,'#806347');
    for(let i=0;i<9;i++){
      const a=i*2.399963, ux=Math.cos(a),uz=Math.sin(a),start=[.08,2.37,0],end=[.08+1.06*ux,2.25,1.06*uz];
      b.path([start,[.08+.54*ux,2.62,.54*uz],end],.028,green);
      for(let j=1;j<=6;j++) for(const side of [-1,1]){
        const t=j/7,x=.08+t*ux,y=2.37+.24*Math.sin(t*Math.PI)-.1*t,z=t*uz;
        leaf(b,[x,y,z],[x+.12*ux-side*.24*uz,y-.19,z+.12*uz+side*.24*ux],.055,green);
      }
    }
    return true;
  }
  if(code==='lotus'){
    b.ball([0,.055,0],[1.20,.055,.80],'#557a73');
    b.ball([-.15,.17,.02],[.58,.050,.42],'#78966b');
    b.rod([0,.13,0],[.1,.84,0],.047,.03,stem);
    blossom(b,.1,.86,0,1.32,code,tint,palette,rand);return true;
  }
  const lean=(rand()-.5)*.28;
  if(code==='blossom' || palette.branch){
    const count=palette.count || (code==='blossom'?4+Math.floor(rand()*3):4),tilt=.31+rand()*.28;
    b.path([[0,0,0],[lean*.6,.70,0],[tilt*.45,1.40,.02],[tilt,2.05,.02]],.045,black?'#77736f':'#78664f');
    for(let i=0;i<count;i++){
      const y=.52+i*1.44/Math.max(1,count-1),x=tilt*y/2.05,side=i%2?-1:1;
      const reach=(palette.small?.23:.31)+rand()*.12,end=[x+side*reach,y+.23,.035];
      b.rod([x,y,0],end,.029,.012,stem);
      leaf(b,[x,y,0],[x+side*reach*.7,y+.25,.04],.075,green);
      blossom(b,end[0],end[1]+.03,end[2],palette.small?.34:.43,'blossom',tint,palette,rand);
    }
    return true;
  }
  const count=palette.count || 1,leafLength=.40+rand()*.24;
  b.path([[0,0,0],[lean,.62,.03],[lean*.55,1.32,0],[lean,1.73,.03]],code==='sunflower'?.064:.043,stem);
  for(let i=0;i<3;i++){
    const y=.43+i*.32,side=(i%2?-1:1)*(rand()>.5?1:-1),x=lean*y/1.73;
    const start=[x,y,.03],end=[x+side*leafLength,y+.27+rand()*.12,.15];
    b.rod(start,[x+side*.16,y+.12,.055],.023,.015,stem);
    leaf(b,start,end,.11+rand()*.035,green);
    if(code==='rose') b.rod([x,y+.18,.02],[x+side*.09,y+.27,.03],.026,.004,black?'#77736f':'#945e56');
  }
  blossom(b,lean,1.77,.03,code==='sunflower'?1.29:1.05,code,tint,palette,rand);
  for(let i=1;i<count;i++){
    const side=i%2?-1:1,height=1.36-(i-1)*.25,x=lean+side*(.47+(i>2?.13:0));
    b.path([[lean*.4,.48+i*.12,0],[lean+side*.20,height-.22,.03],[x,height,.04]],.032,stem);
    leaf(b,[lean+side*.18,height-.27,.03],[x+side*.15,height-.12,.08],.09,green);
    blossom(b,x,height,.06,.70+rand()*.10,code,tint,palette,rand);
  }
  return true;
}

// Subtle raised finishing details on recognisable non-floral sculptures.
// They are deliberately tied to each model's existing silhouette so that a
// tattoo's design is not replaced with arbitrary decorative symbols.
export function addSculpturalDetails(b,code,variant,identitySeed) {
  const pale='#e8decd',metal='#aa9473',dark='#454346';
  if(code==='eye') {
    // Layered iris and tiny catchlights: the pupil stays visible behind them.
    b.ring([0,1.1,.305],.22,.009,'#6f8584');
    for(let i=0;i<16;i++){
      const a=i*Math.PI*2/16,c=Math.cos(a),s=Math.sin(a);
      b.rod([c*.17,1.1+s*.19,.312],[c*.23,1.1+s*.26,.295],.006,.003,'#b2c1b4');
    }
    b.ball([-.053,1.19,.365],[.042,.055,.016],pale);
    b.ball([.058,1.04,.355],[.017,.023,.012],pale);
  } else if(code==='compass') {
    b.ring([0,1,.092],.70,.012,'#e1d1ad');
    for(let i=0;i<32;i++){
      const a=i*Math.PI*2/32,c=Math.cos(a),s=Math.sin(a),inner=i%4===0?.60:.65;
      b.rod([c*inner,1+s*inner,.10],[c*.68,1+s*.68,.10],.009,.006,i%4===0?pale:metal);
    }
    b.ball([0,1,.19],[.045,.045,.022],pale);
  } else if(code==='mechanism') {
    for(const [x,y,r,z] of [[-.42,1.56,.55,.02],[.49,.91,.51,.16],[.05,.38,.29,.04]]){
      b.ring([x,y,z+.105],r*.70,.012,'#d9d1c2');
      b.ring([x,y,z+.12],r*.29,.009,'#716c66');
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;
        b.ball([x+Math.cos(a)*r*.70,y+Math.sin(a)*r*.70,z+.116],[.018,.018,.009],metal);
      }
    }
  } else if(code==='cross') {
    b.path([[-.085,.10,.128],[-.085,1.91,.128]],.008,'#e5d4a7');
    b.path([[-.50,1.40,.128],[.50,1.40,.128]],.008,'#e5d4a7');
    b.ball([0,1.35,.132],[.035,.035,.012],pale);
  } else if(code==='scales') {
    b.ring([0,1.76,.04],.10,.012,pale);
    for(const s of [-1,1]){
      const x=s*.75;b.ring([x,.92,.02],.25,.012,'#decda5',[Math.PI/2,0,0]);
    }
  } else if(code==='lips') {
    b.path([[-.54,1.15,.20],[-.30,1.21,.21],[-.10,1.16,.20]],.012,'#d28c85');
    b.path([[.08,.82,.20],[.32,.84,.21],[.51,.90,.20]],.009,'#ca7976');
  } else if(code==='heart') {
    b.path([[-.74,1.25,.28],[-.64,1.49,.29],[-.42,1.57,.28]],.018,'#e3aca0');
  } else if(code==='paw') {
    b.path([[-.26,.79,.13],[-.12,.90,.15],[.05,.92,.15]],.015,'#716d6c');
  } else if(code==='sailboat') {
    b.path([[-.75,.32,.44],[0,.27,.44],[.66,.33,.44]],.012,'#c7a77e');
    b.path([[-.45,.63,.08],[-.22,1.19,.08],[-.12,1.69,.08]],.008,'#d1c9b8');
  } else if(code==='moon') {
    for(const [x,y,r] of [[-.57,1.47,.07],[-.72,1.13,.055],[-.60,.78,.04]]){
      b.ball([x,y,.17],[r,r*.72,.012],mix('#d4c9ad',dark,.20));
    }
  } else if(code==='web') {
    // A few smaller silk highlights sit directly on existing radial threads.
    for(let i=0;i<9;i+=2){
      const angle=i*Math.PI*2/9,c=Math.cos(angle),s=Math.sin(angle);
      b.path([[c*.22,1.15+s*.22,.112],[c*.62,1.15+s*.62,.056],[c*.96,1.15+s*.96,.008]],.005,'#d3d5ce');
    }
  } else if(code==='arrows') {
    b.rod([.018,.2,.04],[.018,1.82,.04],.007,.004,'#e7dbbf');
    for(const h of [.2,.4,.6]) for(const side of [-1,1])
      b.path([[side*.035,h+.035,.02],[side*.18,h+.16,.025],[side*.23,h+.19,.015]],.006,pale);
  } else if(code==='helmet') {
    for(const side of [-1,1]){
      for(let i=0;i<4;i++) b.ball([side*(.31+i*.065),1.08-i*.075,.40-i*.022],
        [.022,.022,.012],pale);
      b.path([[side*.13,1.37,.60],[side*.27,1.39,.58],[side*.42,1.33,.47]],.009,'#ead2a0');
    }
  } else if(code==='cassette') {
    // Curved reel spokes and a narrow label edge give the existing tape depth.
    for(const x of [-.49,.49]){
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5,c=Math.cos(a),s=Math.sin(a);
        b.rod([x+c*.042,1.17+s*.042,.34],[x+c*.13,1.17+s*.13,.34],.010,.006,'#c7d4ce');
      }
      b.ball([x,1.17,.35],[.025,.025,.012],pale);
    }
    b.path([[-.70,1.38,.268],[0,1.40,.268],[.70,1.38,.268]],.008,'#d9e5dc');
  } else if(code==='music') {
    for(const x of [-.5,.52])
      b.path([[x+.025,.45,.04],[x+.025,.92,.04],[x+.025,1.50,.04]],.007,'#e6d1a3');
  } else if(code==='hand') {
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.19,y=1.77-Math.abs(i-1)*.1;
      b.ball([x*1.23,y-.075,.076],[.045,.072,.012],'#e6cfb0');
      b.path([[x*1.10,y-.33,.083],[x*1.20,y-.31,.085]],.006,'#c9b392');
    }
    b.path([[-.22,.81,.195],[0,.77,.214],[.21,.80,.195]],.009,'#c9b392');
  } else if(code==='plane') {
    b.ball([0,1.105,.26],[.105,.055,.22],'#78969b');
    b.path([[-.055,1.14,.13],[0,1.16,.25],[.055,1.14,.13]],.008,'#d8ece9');
  } else if(code==='rope') {
    const fibre=Array.from({length:46},(_,i)=>{
      const a=i/45*Math.PI*4;
      return [.704*Math.cos(a),.2+i/45*1.25,.704*Math.sin(a)];
    });
    b.path(fibre,.008,'#b99773');
  } else if(code==='windmill') {
    b.path([[-.25,.35,.34],[-.29,.95,.30],[-.23,1.48,.24]],.009,'#c8c4bb');
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,x=Math.sin(a),y=Math.cos(a);
      for(const t of [.43,.61,.78]){
        const side=.10;
        b.rod([x*t-y*side,1.36+y*t+x*side,.459],
          [x*t+y*side,1.36+y*t-x*side,.459],.009,.007,'#a69b86');
      }
    }
  } else if(code==='vehicle') {
    for(const side of [-1,1]){
      for(const z of [-.67,.66]){
        b.ring([side*.85,.28,z],.095,.012,'#c7c5bc',[0,Math.PI/2,0]);
        b.ball([side*.866,.28,z],[.014,.034,.034],'#a9a49b');
      }
      b.ball([side*.48,.71,1.16],[.068,.070,.018],'#fff1c5');
    }
    for(let i=-2;i<=2;i++) b.rod([i*.115,.46,1.10],[i*.115,.70,1.10],.009,.009,'#a6aaa7');
  } else if(code==='forest') {
    // These strokes detail the tattoo's miniature trees, not the scene forest.
    for(const [x,z,h] of [[-.82,-.32,1.65],[-.36,.12,2.15],[.28,-.18,2.55],[.87,.16,1.8],[.15,.55,1.48]])
      b.path([[x-.018,.20,z+.083],[x+.015,h*.31,z+.075],[x-.01,h*.58,z+.055]],.006,'#827769');
  }
}
