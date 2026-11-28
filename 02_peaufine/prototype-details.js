import * as THREE from 'three';
import { addOrganicBody } from './animal-detail.js?v=organic-4';
import { addOrganicPortrait } from './portrait-detail.js?v=organic-4';

// Keep the characteristic silhouettes of the 2026 compositions when seen
// from the trail. All curves are actual geometry and can be viewed from behind.
export function rainbowHeart(b) {
  const palette = ['#d16a72', '#df9a54', '#d4b95c', '#84b09a', '#86a4c0'];
  palette.forEach((color, layer) => {
    const radius = .96 - layer * .047;
    const points = Array.from({length: 47}, (_, i) => {
      const angle = .012 + i / 46 * (Math.PI * 2 - .024);
      const x = Math.sin(angle) ** 3;
      const y = (13*Math.cos(angle) - 5*Math.cos(2*angle) -
        2*Math.cos(3*angle) - Math.cos(4*angle)) / 16;
      return [radius*x, 1.05 + radius*y, .045*Math.cos(angle)];
    });
    b.path(points,.031,color);
  });
}

export function littleBear(b) {
  const peach = '#e2a075', cream = '#ffe1a8', pink = '#ce767e';
  addOrganicBody('bear','',b);
  b.ball([0,.67,.235],[.25,.29,.075],cream);
  for (const side of [-1,1]) {
    b.ball([side*.32,1.62,.03],[.19,.19,.14],peach);
    b.ball([side*.33,1.63,.15],[.105,.108,.035],pink);
    b.ball([side*.15,1.33,.32],[.050,.061,.032],'#42333e');
    b.ball([side*.14,1.36,.34],[.012,.015,.009],'#fff5de');
    b.ball([side*.40,.78,0],[.16,.29,.14],peach,[0,0,side*.37]);
    b.ball([side*.26,.20,.11],[.21,.20,.22],peach);
  }
  b.ball([0,1.19,.31],[.17,.115,.07],cream);
  b.ball([0,1.25,.37],[.064,.047,.037],'#5e4953');
  for(const [x,y,color] of [[-.10,.70,'#dc7c85'],[.01,.75,'#83abad'],[.10,.64,'#dba85b']]) {
    b.ball([x,y,.312],[.046,.046,.019],color);
  }
}

export function elbowWebs(b) {
  function fan(x, y, scale, turn) {
    const point=(angle,radius) => [
      x+scale*radius*Math.cos(angle+turn),
      y+scale*radius*Math.sin(angle+turn),
      .19*(1-radius)*scale
    ];
    const angles=Array.from({length:8},(_,i)=>.12+i*.40);
    for (const a of angles) b.rod(point(a,0),point(a,1),.019,.010,'#716976');
    for(let j=0;j<angles.length-1;j++) {
      const a=angles[j], next=angles[j+1];
      for(const r of [.23,.43,.66,.89]) {
        b.path([point(a,r),point((a+next)/2,r*.91),point(next,r)],.012,'#b4a3a4');
      }
    }
  }
  fan(-.32,.27,1.05,.36);
  fan(.54,.51,.78,-.90);
}

export function sixPetals(b) {
  b.path([[0,0,0],[.10,.45,0],[-.04,1.0,.04],[.05,1.38,0]],.034,'#526a53');
  leaf(b,[.07,.60,.02],[-.43,.98,.06],.09,'#687957');
  for(let i=0;i<6;i++) {
    const angle=i*Math.PI/3+.11;
    b.add(curvedPetal(angle,.018,.61,.18,.095,.112),
      [.05,1.43,0],[1,1,1],i%2?'#ae7582':'#945d74');
    const a=[.05+Math.sin(angle)*.12,1.43+Math.cos(angle)*.12,.045];
    const tip=[.05+Math.sin(angle)*.53,1.43+Math.cos(angle)*.53,.12];
    b.rod(a,tip,.014,.004,'#754b62');
  }
  b.ball([.05,1.43,.11],[.11,.10,.06],'#caa67d');
}

export function floweringSpray(b, horizontal) {
  const twig='#73615e', foliage='#777f69', petal='#c0a4ac';
  function point(t) {
    return horizontal
      ? [-.94+1.94*t, .28+.80*t+.18*Math.sin(Math.PI*t), .10*Math.sin(t*3.6)]
      : [.12*Math.sin(t*5),.08+1.83*t,.09*Math.sin(t*3)];
  }
  b.path(Array.from({length:7},(_,i)=>point(i/6)),.024,twig);
  for(let i=0;i<7;i++){
    const t=.17+i*.115, side=i%2 ? 1 : -1, [x,y,z]=point(t);
    const end = horizontal ? [x+.20,y+side*.24,z+.045] : [x+side*.24,y+.22,z+.035];
    b.rod([x,y,z],end,.019,.008,twig);
    leaf(b,[x,y,z],[x+side*.14,y+.21,z+.07],.045,foliage);
    if(i%3===0 || (!horizontal && i===5)) {
      for(let j=0;j<5;j++){
        const a=j*Math.PI*.4;
        b.ball([end[0]+.083*Math.sin(a),end[1]+.083*Math.cos(a),end[2]],
          [.061,.093,.035],petal,[0,0,-a]);
      }
      b.ball(end,[.039,.039,.044],'#ad9566');
    } else {
      leaf(b,[x,y,z],end,.053,foliage);
    }
  }
}

// These models interpret the two reviewed reference photographs. Their colors
// and composition are intentionally specific to those photographs.
function curvedPetal(angle, innerRadius, length, width, lift, depth) {
  const vertices = [];
  const indices = [];
  const rows = 9;
  const columns = 10;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const radius = innerRadius + length * t;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns * 2 - 1;
      const spread = width * Math.pow(Math.sin(Math.PI * t), 0.55) * u;
      const x = Math.sin(angle) * radius + Math.cos(angle) * spread;
      const y = Math.cos(angle) * radius - Math.sin(angle) * spread;
      const curl = lift * t * t + depth * (1 - u * u) * Math.sin(Math.PI * t);
      vertices.push(x, y, curl);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafGeometry(start, end, width, bend) {
  const vertices = [];
  const indices = [];
  const rows = 8;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const x = THREE.MathUtils.lerp(start[0], end[0], t);
    const y = THREE.MathUtils.lerp(start[1], end[1], t);
    const z = THREE.MathUtils.lerp(start[2], end[2], t) + Math.sin(Math.PI * t) * bend;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy) || 1;
    const half = width * Math.sin(Math.PI * t);
    for (const side of [-1, 0, 1]) {
      vertices.push(x - dy / length * half * side, y + dx / length * half * side,
        z + (side === 0 ? .08 * Math.sin(Math.PI * t) : 0));
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 2; col++) {
      const a = row * 3 + col;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leaf(b, start, end, width, color) {
  b.add(leafGeometry(start, end, width, .04), [0, 0, 0], [1, 1, 1], color);
  b.rod(start, end, .018, .005, '#a5aa61');
}

export function buildPrototypeRose(b) {
  const darkGreen = '#37613c';
  b.path([[0,0,0],[.10,.40,.01],[.07,.90,0],[.11,1.35,0],[.06,1.84,0]], .043, '#527247');
  leaf(b, [.07,.55,.02], [-.48,1.02,.08], .11, darkGreen);
  leaf(b, [.07,.62,.02], [.52,1.09,.08], .12, '#648a4c');
  leaf(b, [.07,.68,.01], [.38,1.25,-.02], .095, '#4f7c40');
  leaf(b, [.04,1.70,0], [-.63,1.84,.06], .13, '#4f7b42');
  leaf(b, [.09,1.70,0], [.68,1.76,.03], .14, '#45783d');

  // Layered, curved petals form a deep cup with a visible spiral centre.
  const centre = [0, 1.91, 0];
  const layers = [
    { count: 8, radius: .17, length: .50, width: .27, lift: -.22, depth: .12, color: '#ad2734' },
    { count: 7, radius: .09, length: .42, width: .23, lift: -.10, depth: .16, color: '#c63840' },
    { count: 6, radius: .03, length: .29, width: .17, lift: .02, depth: .14, color: '#d64b4c' },
    { count: 4, radius: .00, length: .18, width: .11, lift: .09, depth: .09, color: '#a92031' },
  ];
  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      const angle = i * Math.PI * 2 / layer.count + layerIndex * .48;
      const geometry = curvedPetal(angle, layer.radius, layer.length, layer.width, layer.lift, layer.depth);
      b.add(geometry, [centre[0], centre[1], centre[2] + layerIndex * .10],
        [1, .87, 1], layer.color);
      geometry.dispose();
    }
  });

  // The source includes small ink diamonds suspended beneath the blossom.
  for (const [x, y] of [[-.40,1.39],[-.37,.57],[.38,.46]]) {
    b.path([[x,y+.09,.17],[x+.055,y,.17],[x,y-.09,.17],[x-.055,y,.17],[x,y+.09,.17]],
      .012, '#302d34');
    for (let j = 1; j <= 3; j++) b.ball([x,y+.15+j*.075,.17],[.015,.015,.015],'#302d34');
  }
}

function facialBone(b, origin, size, light, character=0) {
  const width=[1,.88,1.10][character], eyeWidth=[.20,.17,.23][character];
  const p = (x,y,z) => [origin[0]+x*size*width,origin[1]+y*size,origin[2]+z*size];
  const skin = light ? '#d2b8a5' : '#a98d80';
  const shadow = '#332d32';
  const dark = '#1d1d24';
  // Cranial dome plus a shaped facial mask, projecting in depth.
  const bones=[
    [...p(0,1.58,-.03),.55*size*width,.71*size,.46*size],
    [...p(0,1.04,.10),.45*size*width,.45*size,.36*size],
    [...p(0,.75,.10),.37*size*width,.22*size,.31*size]
  ];
  const sockets=[-1,1].map(side=>[...p(side*.25,1.32,.40),eyeWidth*size,(.22-character*.015)*size,.14*size]);
  addOrganicPortrait(b,bones,sockets,skin);
  for (const side of [-1, 1]) {
    b.ball(p(side*.25,1.32,.40),[eyeWidth*size,(.22-character*.015)*size,.075*size],dark,[0,0,-side*(.12+character*.06)]);
    b.path([p(side*.07,1.54,.42),p(side*.25,1.58,.43),p(side*.42,1.48,.34)],
      .048*size,'#8b716a');
    b.rod(p(side*.18,1.08,.44),p(side*.44,1.16,.29),.055*size,.025*size,'#886e67');
    b.path([p(side*.42,.98,.29),p(side*.40,.76,.30),p(side*.29,.58,.32)],.055*size,'#69585a');
  }
  b.poly([[-.13,0],[0,.25],[.13,0]].map(([x,y])=>[x*size,y*size]), .035*size,
    p(0,.99,.44), dark);
  for(let tooth=-4+character;tooth<=4-character;tooth++){
    const x=tooth*.073;
    b.box(p(x,.79,.39),[.055*size,.16*size,.075*size], light?'#ead4bf':'#ccb3a0',
      [0,0,tooth*.035]);
    b.box(p(x,.62,.36),[.052*size,.13*size,.065*size], light?'#ddc4b0':'#bba192',
      [0,0,-tooth*.035]);
  }
  b.path([p(-.37,.71,.29),p(0,.54,.34),p(.37,.71,.29)],.035*size,shadow);
  // Fine cracks echo those in the tattoo, without claiming an exact reconstruction.
  b.path([p(.20,2.16,.23),p(.12,1.94,.39),p(.19,1.82,.42),p(.05,1.66,.43),
    p(.11,1.52,.42)], .018*size, shadow);
  b.path([p(.12,1.94,.39),p(-.05,1.87,.43),p(-.12,1.76,.42)], .012*size, shadow);
}

export function buildPrototypeSkulls(b) {
  // Three staggered skulls follow the photographed composition.
  facialBone(b, [.47,1.43,0], .77, false, 0);
  facialBone(b, [-.53,.64,.04], .62, false, 1);
  facialBone(b, [.40,0,.17], .76, true, 2);
}
