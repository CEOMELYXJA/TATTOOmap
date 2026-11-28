// Three-dimensional ornaments for tattoos with symbolic, human or object motifs.
// Coordinates are local to a motif, facing +Z. The shared builder batches the pieces.
const brass = 0xc59b54, pale = 0xf1dfb4, ink = 0x303340, silver = 0xa9c6c8;
const coral = 0xb45351, wood = 0x805438;
const tau = Math.PI * 2;
const center = [0, 1, 0];

function heart(b) {
  const outline = Array.from({length:48}, (_,i) => {
    const a = i / 48 * tau;
    return [.064 * 16 * Math.sin(a)**3, .065 * (13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))];
  });
  b.poly(outline,.25,center,coral);
}

// Stable proportions give each tattoo its own sculpted face rather than
// cloning one shared portrait. The same work always produces the same model.
function identityFactors(seed) {
  let value=(Number(seed) || 1) >>> 0;
  return () => { value=(Math.imul(value,1664525)+1013904223)>>>0; return value/4294967296; };
}

function skull(b,identitySeed) {
  const rand=identityFactors(identitySeed);
  const width=.64+rand()*.17, height=.71+rand()*.15;
  const jaw=.44+rand()*.13, eyeX=.26+rand()*.10, eyeY=1.36+rand()*.09;
  const eyeW=.18+rand()*.08, eyeH=.18+rand()*.10, teeth=5+Math.floor(rand()*3);
  b.ball([0,1.45,0],[width,height,.54+rand()*.08],pale);
  b.ball([0,.9,.13],[jaw,.37+rand()*.09,.43],pale);
  for(const side of [-1,1]) {
    b.ball([side*eyeX,eyeY,.48],[eyeW,eyeH,.12],ink,[0,0,side*(rand()-.5)*.24]);
    b.ball([side*(jaw+.01),1.04,.31],[.12+rand()*.06,.14+rand()*.05,.18],pale);
  }
  const nose=.075+rand()*.07;
  b.poly([[-nose,0],[nose,0],[0,.18+rand()*.1]],.05,[0,.92,.54],ink);
  for(let i=0;i<teeth;i++) {
    const x=(i-(teeth-1)/2)*(.73/teeth);
    b.box([x,.71,.46],[.62/teeth,.16+rand()*.06,.13],pale);
  }
  // Fine bone fissures vary with the tattoo, without adding flat photo panels.
  const side=rand()>.5?1:-1, x=side*(.12+rand()*.21), depth=.49;
  b.path([[x,1.95,depth],[x+side*.07,1.84,depth+.025],[x+side*.02,1.74,depth+.04]],.012,ink);
}

function web(b) {
  const point = (i,r) => [Math.cos(i*tau/9)*r,1.15+Math.sin(i*tau/9)*r,.14*(1-r)];
  for(let i=0;i<9;i++) {
    b.rod(point(i,0),point(i,1.1),.024,.018,silver);
    for(const r of [.28,.54,.79,1.02]) b.path([point(i,r),point(i+.5,r*.87),point(i+1,r)],.018,pale);
  }
}

function eye(b) {
  b.path([[-.93,1,0],[-.5,1.42,.1],[.12,1.51,.18],[.63,1.3,.08],[.96,1,0],[.28,.73,.1],[-.36,.74,.1],[-.93,1,0]],.075,brass);
  b.ball([0,1.1,.12],[.29,.33,.18],silver);
  b.ball([0,1.1,.27],[.14,.21,.09],ink);
  b.path([[-.28,.77,.02],[-.31,.34,.08],[-.57,.1,.1]],.07,ink);
  b.path([[.31,.74,0],[.38,.45,.02],[.78,.3,.01],[.87,.5,0]],.055,brass);
}

function face(b,green=false,identitySeed) {
  const skin=green?0x769742:0xb98e6e;
  const rand=identityFactors(identitySeed);
  const width=.50+rand()*.16, height=.70+rand()*.17;
  const eyeX=.19+rand()*.09, eyeY=1.38+rand()*.09, mouthY=.91+rand()*.10;
  const hairColor=[0x352f30,0x49403a,0x61524b,0x292a2c][Math.floor(rand()*4)];
  const hairStyle=Math.floor(rand()*4);
  if(!green) {
    // Individual silhouettes and hair parting make portraits distinct from afar.
    b.ball([0,1.56,-.17],[width*1.12,.62,.31],hairColor);
    const hairLength=[.55,.82,1.05,1.32][hairStyle];
    for(const s of [-1,1]) {
      b.path([[s*width*.72,1.78,.01],[s*width*1.04,1.47,.02],[s*(width*1.04+.05),1.78-hairLength,.03]],.09+hairStyle*.012,hairColor);
    }
    b.path([[-width*.75,1.78,.30],[-width*.22,1.98,.27],[width*.42,1.91,.25],[width*.85,1.69,.16]],.10,hairColor);
  }
  b.ball([0,1.22,.02],[width,height,.41],skin);
  b.ball([0,1.16,.42],[.09+rand()*.06,.17+rand()*.08,.12],skin);
  for(const s of [-1,1]) {
    b.ball([s*eyeX,eyeY,.37],[.09+rand()*.035,.04+rand()*.025,.06],green?0xe4c874:ink);
    b.path([[s*.07,eyeY+.12,.41],[s*(eyeX+.05),eyeY+.18,.36],[s*(width*.8),eyeY+.14,.22]],.035+rand()*.025,ink);
  }
  const mouth=.22+rand()*.10;
  b.path([[-mouth,mouthY+.04,.34],[-.09,mouthY-.03,.39],[.16,mouthY,.38],[mouth,mouthY+.05,.31]],.027+rand()*.01,ink);
  if(green){
    b.ball([0,.41,-.02],[.69,.43,.43],coral);
    b.rod([0,1.88,0],[-.22,2.43,0],.51,.06,coral);
    b.ball([-.24,2.4,0],[.14,.14,.14],pale);
  }
}

function compass(b) {
  b.ring(center,.77,.07,brass);
  b.ball(center,[.1,.1,.15],pale);
  for(let i=0;i<8;i++){
    const a=i*tau/8;
    b.poly([[-.12,0],[.12,0],[0,i%2?.50:.79]],.08,[0,1,.03],i%2?silver:coral,[0,0,a]);
  }
}

function glyph(b,index,x=0,y=0,scale=1){
  const shapes=[
    [[-.5,.57],[0,1.3],[.5,.57],[0,.04],[-.5,.57]],
    [[-.46,.98],[.46,.98],[0,.12],[-.46,.98]],
    [[0,.02],[0,1.35],[.36,.97],[0,.68],[-.34,.95]],
  ];
  b.path(shapes[index%3].map(([px,py])=>[x+px*scale,y+py*scale,0]),.06*scale,brass);
}

function tribal(b,seed) {
  const random=identityFactors(seed), arc=.12+random()*.16;
  for(const s of [-1,1]) {
    b.poly([[0,.02],[.53,.65],[.84,1.55],[.39,1.22],[.59,2.1],[.14,1.53],[.04,.92],[.28,1.07]].map(([x,y])=>[x*s,y]),.21,[0,0,0],ink);
  }
  b.poly([[-.1,.5],[0,2.2],[.16,1.32]],.18,[0,0,.1],silver);
  for(const side of [-1,1]) b.path([[side*.12,.38,.22],[side*(.44+arc),.74,.22],[side*(.44+arc*.5),1.08,.22]],.035,ink);
}

function lettering(b) {
  // A free-standing pen stroke, with the long loops of the photographed script.
  b.path([[-1.25,.57,0],[-.85,.87,.08],[-.35,1.88,.12],[-.56,2.04,.15],[-.81,1.8,.18],[-.88,1.02,.19],[-.98,.54,.2],[-.61,.52,.21],[-.23,.74,.23],[0,.94,.2],[.14,.87,.16],[-.06,.69,.18],[.1,.61,.22],[.45,.81,.15],[.53,.64,.19],[.82,.86,.12],[.86,.64,.18],[1.21,.85,0]],.055,brass);
}

function lips(b) {
  b.poly([[-.98,0],[-.48,.28],[-.22,.3],[0,.16],[.26,.29],[.46,.27],[.99,0],[.55,-.27],[.16,-.37],[-.27,-.33],[-.65,-.19]],.18,center,coral);
  b.path([[-.88,1,.2],[-.39,.99,.22],[0,1.04,.22],[.43,.99,.22],[.86,1,.2]],.035,ink);
}

const sculptures = {
  heart, skull, web, eye, compass, lettering, lips, tribal,
  face: (b,seed)=>face(b,false,seed), greenfigure: b=>face(b,true),
  symbols(b,seed) {
    const random=identityFactors(seed), count=4+Math.floor(random()*3);
    for(let i=0;i<count;i++) {
      const x=(i-(count-1)/2)*.29, y=.35+(i%2)*.23;
      glyph(b,Math.floor(random()*3),x,y,.34+random()*.15);
    }
  },
  geometry(b,seed,workId) {
    if(workId==='wix-upload-2024-026') {
      // Fine, curved ornament in the reference, with a pendant.
      b.path([[0,.08,0],[-.34,.46,0],[-.44,.94,0],[-.15,1.30,0],[0,1.70,0],[.20,1.37,0],[.42,.98,0],[.29,.55,0],[0,.30,0]],.035,ink);
      for(const side of [-1,1]) b.path([[0,1.25,.03],[side*.44,1.56,.03],[side*.64,1.31,.03],[side*.40,1.09,.03]],.025,ink);
      for(let j=0;j<5;j++)b.ball([0,.16+j*.22,.08],[.05,.05,.05],brass);
    } else if(workId==='wix-upload-2025-010' || workId==='wix-upload-2024-012') {
      // The two photographs depict different geometric armbands.
      const number=workId==='wix-upload-2025-010'?4:3;
      for(let row=0;row<number;row++) {
        const y=.24+row*.40;
        b.path([[-.88,y,0],[0,y+.05,.04],[.88,y,0]],.04,ink);
        for(let j=0;j<5;j++) {
          const x=-.72+j*.36, flip=(j+row+(number===3?1:0))%2?1:-1;
          b.poly([[-.14,0],[0,flip*.20],[.14,0]],.04,[x,y+.12,.04],ink);
        }
      }
    } else {
      glyph(b,0,0,0,1.35);b.ring([0,1,0],.56,.035,silver);glyph(b,1,0,.58,.75);
    }
  },
  arrows(b) {
    b.rod([0,.05,0],[0,1.93,0],.045,.035,brass);
    b.poly([[-.19,0],[0,.44],[.19,0],[0,.12]],.08,[0,1.82,0],silver);
    for (const h of [.2,.4,.6]) for(const s of [-1,1]) b.rod([0,h,0],[s*.26,h+.21,0],.035,.018,pale);
  },
  flame(b){
    for(const [x,y,s] of [[-.46,.03,.65],[.39,0,.74],[0,0,1]]) b.poly([[-.39,0],[-.48,.48],[-.25,.92],[-.3,1.35],[.02,1.13],[.2,1.99],[.37,1.42],[.27,.91],[.48,.55],[.36,.13],[0,-.02]].map(([u,v])=>[u*s,v*s]),.18,[x,y,x===0?.18:0],x===0?0xf8a450:0xb85136);
  },
  moon(b) {
    const angles=Array.from({length:25},(_,i)=>Math.PI*.31+i/24*Math.PI*1.38);
    const outer=angles.map(a=>[Math.cos(a),Math.sin(a)]);
    const inner=Array.from({length:20},(_,i)=>{const y=outer.at(-1)[1]+i/19*(outer[0][1]-outer.at(-1)[1]);return [.89-Math.sqrt(1.01-y*y),y]});
    b.poly([...outer,...inner],.17,[0,1.03,0],pale);
  },
  paw(b) {
    b.ball([0,.77,0],[.5,.38,.15],ink);
    for(let i=0;i<4;i++){const a=(i-1.5)*.48;b.ball([Math.sin(a)*.78,.91+Math.cos(a)*.56,0],[.16,.21,.13],ink,[0,0,-a]);}
  },
  helmet(b) {
    b.ball([0,1.23,0],[.63,.64,.51],0x947353);
    b.ball([0,1.14,.41],[.48,.31,.16],ink);
    b.path([[-.55,1.28,.31],[-.27,1.4,.55],[0,1.31,.6],[.29,1.4,.55],[.55,1.28,.31]],.065,brass);
    b.rod([0,1.4,.55],[0,.86,.55],.085,.04,brass);
    for (const side of [-1,1]) b.poly([[-.16,.2],[.16,.25],[.14,-.4],[-.1,-.56]],.11,[side*.47,1,.31],brass,[0,side*.32,side*-.15]);
    b.poly([[-.61,-.12],[-.41,.41],[0,.6],[.48,.34],[.62,-.23],[.15,.1],[-.32,.1]],.15,[0,1.74,0],coral,[0,Math.PI/2,0]);
  },
  cassette(b) {
    b.box(center,[1.98,1.18,.42],ink);
    b.box([0,1.17,.23],[1.57,.50,.06],silver);
    for(const x of [-.49,.49]) {b.ring([x,1.17,.31],.18,.045,pale); b.ball([x,1.17,.27],[.12,.12,.025],ink);}
    b.path([[-.62,.45,0],[-.79,.23,.08],[-.33,.09,.19],[.31,.26,.09],[.81,.03,.04]],.04,wood);
  },
  sailboat(b) {
    b.poly([[-1,.03],[-.72,-.32],[.56,-.36],[1.02,.08]],.43,[0,.42,0],wood);
    b.rod([0,.44,0],[0,2.14,0],.038,.022,brass);
    b.poly([[-.08,.03],[-.88,.09],[-.09,1.39]],.05,[0,.58,0],pale);
    b.poly([[.09,.05],[.74,.1],[.1,1.17]],.06,[0,.58,0],coral);
  },
  cross(b) {b.box([0,1,0],[.24,1.95,.24],brass);b.box([0,1.35,0],[1.12,.24,.24],brass);},
  music(b) {
    for(const [x,y] of [[-.5,.36],[.52,.56]]){
      b.ball([x-.17,y,0],[.25,.17,.14],ink,[0,0,.28]);
      b.rod([x,y,0],[x,y+1.22,0],.055,.055,brass);
    }
    b.rod([-.5,1.58,0],[.52,1.78,0],.10,.10,brass);
  },
  scales(b) {
    b.rod([0,0,0],[0,1.95,0],.075,.04,brass); b.rod([-.82,1.76,0],[.82,1.76,0],.045,.045,brass);
    for(const s of [-1,1]){const x=s*.75; for(const d of [-.27,.27])b.rod([x,1.73,0],[x+d,.89,0],.018,.018,pale);b.ball([x,.87,0],[.36,.095,.29],brass);}
  },
  hand(b){
    b.ball([0,.83,0],[.4,.49,.21],pale);
    for(let i=0;i<4;i++) {const x=(i-1.5)*.19;b.rod([x,1.03,0],[x*1.23,1.77-Math.abs(i-1)*.1,.05],.092,.066,pale);}
    b.rod([-.28,.7,0],[-.57,1.18,.05],.12,.068,pale);
  },
  plane(b){
    b.ball(center,[.14,.13,.82],silver);
    b.poly([[0,.33],[-.98,-.1],[-.96,-.26],[0,-.12],[.96,-.26],[.98,-.1]],.06,center,silver,[Math.PI/2,0,0]);
    b.box([0,1.18,-.6],[.055,.35,.33],coral);
  },
  rope(b){b.path(Array.from({length:46},(_,i)=>{const a=i/45*tau*2;return [.66*Math.cos(a),.2+i/45*1.25,.66*Math.sin(a)]}),.07,wood);}
};

export function buildSculpture(code, builder, identitySeed, workId) {
  const make = sculptures[code];
  if (!make) return false;
  make(builder,identitySeed,workId);
  return true;
}
