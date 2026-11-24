import * as THREE from 'three';

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

function facialBone(b, origin, size, light) {
  const p = (x,y,z) => [origin[0]+x*size,origin[1]+y*size,origin[2]+z*size];
  const skin = light ? '#d2b8a5' : '#a98d80';
  const shadow = '#332d32';
  const dark = '#1d1d24';
  // Cranial dome plus a shaped facial mask, projecting in depth.
  b.ball(p(0,1.58,-.03),[.55*size,.71*size,.46*size],skin,[0,0,-.04]);
  b.ball(p(0,1.04,.10),[.45*size,.45*size,.36*size],skin);
  b.ball(p(0,.75,.10),[.37*size,.22*size,.31*size],skin);
  for (const side of [-1, 1]) {
    b.ball(p(side*.25,1.32,.40),[.20*size,.22*size,.075*size],dark,[0,0,-side*.12]);
    b.path([p(side*.07,1.54,.42),p(side*.25,1.58,.43),p(side*.42,1.48,.34)],
      .048*size,'#8b716a');
    b.rod(p(side*.18,1.08,.44),p(side*.44,1.16,.29),.055*size,.025*size,'#886e67');
    b.path([p(side*.42,.98,.29),p(side*.40,.76,.30),p(side*.29,.58,.32)],.055*size,'#69585a');
  }
  b.poly([[-.13,0],[0,.25],[.13,0]].map(([x,y])=>[x*size,y*size]), .035*size,
    p(0,.99,.44), dark);
  for(let tooth=-4;tooth<=4;tooth++){
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
  facialBone(b, [.47,1.43,0], .77, false);
  facialBone(b, [-.53,.64,.04], .62, false);
  facialBone(b, [.40,0,.17], .76, true);
}
