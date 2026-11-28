import { addOrganicBody } from './animal-detail.js?v=organic-3';
// Volumetric interpretations of subjects identified in the 2024 archive.
// Built with the shared geometry batcher so identical motifs can be reused.
const ink = 0x29292c;
const stone = 0x96928d;
const silver = 0xc7c2b9;
const bark = 0x524b40;
const pine = 0x365348;

function forest(b) {
  // A cluster of individual trunks and radiating evergreen branches.
  for (const [x,z,h] of [[-.82,-.32,1.65],[-.36,.12,2.15],[.28,-.18,2.55],[.87,.16,1.8],[.15,.55,1.48]]) {
    b.rod([x,.08,z],[x,h,z],.085,.026,bark);
    for (let level=0; level<5; level++) {
      const y=h*(.33+level*.12), width=(.59-level*.075)*h/2;
      for (let branch=0; branch<7; branch++) {
        const angle=branch*Math.PI*2/7 + level*.42;
        const end=[x+Math.cos(angle)*width,y+.15,z+Math.sin(angle)*width];
        b.rod([x,y,z],end,.045,.009,pine);
        b.rod(end,[end[0]*.97,y-.1,end[2]*.97],.03,.004,pine);
      }
    }
  }
}

function mechanism(b) {
  // Raised interlocking gears, axles and a clock face suggest the mechanical sleeve.
  for (const [x,y,r,z] of [[-.42,1.56,.55,.02],[.49,.91,.51,.16],[.05,.38,.29,.04]]) {
    b.ring([x,y,z],r,.09,stone);
    b.ring([x,y,z+.04],r*.38,.045,silver);
    b.ball([x,y,z],[.11,.11,.16],ink);
    for (let i=0;i<10;i++) {
      const a=i*Math.PI*2/10, c=Math.cos(a), s=Math.sin(a);
      b.box([x+c*(r+.08),y+s*(r+.08),z],[.19,.15,.19],stone,[0,0,a]);
      b.rod([x+c*.16,y+s*.16,z],[x+c*(r-.09),y+s*(r-.09),z],.025,.025,silver);
    }
  }
}

function jellyfish(b) {
  // A rounded bell and separate, curling hanging tentacles remain visible from all sides.
  addOrganicBody('jellyfish','',b);
  for (let i=0;i<12;i++) {
    const a=i*Math.PI*2/12, r=.28+(i%3)*.12;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    b.path([[x,1.62,z],[x*1.12,1.2,z*1.1],[x-.09,.75,z+.08],[x+.11,.28,z-.05],[x,.06,z+.03]],i%3===0?.04:.025,0xb99a9f);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    b.ball([Math.cos(a)*.55,1.58,Math.sin(a)*.48],[.13,.13,.12],0xc4aeb0);
  }
}

function octopus(b) {
  // Long rounded head, eye ridge, eight independent curling arms and suckers.
  addOrganicBody('octopus','',b);
  for(const side of [-1,1]) {
    b.ball([side*.26,1.28,.37],[.15,.12,.12],silver);
    b.ball([side*.27,1.29,.47],[.062,.066,.045],ink);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4, c=Math.cos(a), s=Math.sin(a);
    const pts=[[c*.34,1.15,s*.28],[c*.68,.90,s*.58],[c*.99,.58,s*.88],[c*1.13,.28,s*.98],[c*.89,.12,s*.80],[c*.73,.27,s*.68]];
    b.path(pts,.105,stone);
    for(let j=1;j<5;j++) b.ball([pts[j][0],pts[j][1]-.07,pts[j][2]],[.042,.026,.042],silver);
  }
}

function frog(b) {
  // Broad head, raised eyes, folded rear legs and splayed toes.
  addOrganicBody('frog','',b);
  for(const side of [-1,1]) {
    b.ball([side*.4,.98,.69],[.18,.16,.17],0x91a76d);
    b.ball([side*.4,1.01,.81],[.075,.075,.06],ink);
    b.ball([side*.61,.46,-.31],[.25,.26,.39],0x61794b,[0,side*.2,0]);
    b.path([[side*.55,.56,.34],[side*.78,.29,.63],[side*.83,.16,.82]],.085,0x728854);
    for(let j=-1;j<=1;j++)b.rod([side*.83,.16,.82],[side*(.91+j*.08),.09,1.05],.04,.015,0x91a76d);
    b.path([[side*.56,.35,-.42],[side*.94,.18,-.66],[side*1.03,.12,-.43]],.1,0x61794b);
  }
  b.path([[-.38,.68,.83],[0,.62,.91],[.38,.68,.83]],.025,ink);
}

function wings(b) {
  // Two sculpted wings, each with layered individual feathers.
  b.ball([0,1.12,0],[.12,.35,.12],ink);
  for (const side of [-1,1]) {
    const leading=[[side*.08,1.42,0],[side*.55,1.74,-.05],[side*1.19,1.87,-.10],[side*1.44,1.81,-.13]];
    b.path(leading,.07,stone);
    for (let i=0;i<9;i++) {
      const t=i/8;
      const root=[side*(.19+t*1.1),1.48+.31*Math.sin(t*Math.PI*.68),-.04-t*.08];
      const tip=[side*(.35+t*1.17),.66+.78*t,-.08-t*.1];
      b.rod(root,tip,.105,.014,i%2?stone:silver);
      b.path([root,[side*(.27+t*1.15),1.13+.43*t,.02],tip],.018,ink);
    }
    b.rod([side*.12,1.32,0],[side*.29,.83,.05],.07,.018,stone);
  }
}

function scorpion(b) {
  const shell=0x393a3b, highlight=0x8c8880;
  // Armoured body and eight jointed legs with two front pincers.
  addOrganicBody('scorpion','',b);
  for(const side of [-1,1]) {
    for(let i=0;i<4;i++) {
      const z=.31-i*.23;
      b.path([[side*.22,.43,z],[side*.55,.55,z-.12],[side*.8,.12,z-.24],[side*1.03,.07,z-.15]],.045,shell);
    }
    b.path([[side*.2,.5,.64],[side*.52,.42,.88],[side*.77,.46,1.09]],.095,shell);
    b.ball([side*.84,.46,1.13],[.20,.11,.16],shell);
    b.rod([side*.85,.46,1.18],[side*1.04,.43,1.31],.07,.008,highlight);
    b.rod([side*.76,.46,1.23],[side*.77,.44,1.41],.07,.008,highlight);
  }
  b.path([[0,.48,-.43],[.08,.72,-.70],[.18,1.07,-.78],[.18,1.45,-.70],[.12,1.72,-.43],[.04,1.73,-.18]],.095,shell);
  b.rod([.04,1.73,-.18],[0,1.49,-.08],.09,.005,highlight);
}

function reaper(b) {
  // Hooded figure in a long robe holding a curved, three-dimensional scythe.
  const robe=0x37383b, edge=0x696b6b;
  b.ball([0,1.85,0],[.42,.48,.35],robe);
  b.ball([0,1.82,.28],[.27,.30,.14],ink);
  b.ball([0,1.75,.36],[.19,.22,.09],silver);
  for(const side of [-1,1]) b.ball([side*.085,1.79,.43],[.055,.065,.025],ink);
  b.poly([[-.35,0],[-.65,-1.23],[.66,-1.23],[.35,0]],.32,[0,1.45,-.16],robe);
  b.path([[-.24,1.33,.16],[-.34,.89,.20],[-.42,.29,.13]],.045,edge);
  b.path([[.23,1.32,.16],[.35,.84,.21],[.44,.26,.12]],.045,edge);
  b.path([[-.25,1.28,0],[-.61,.97,.04],[-.79,1.17,.05]],.11,robe);
  b.path([[.25,1.28,0],[.54,1.0,.06],[.67,1.18,.08]],.11,robe);
  b.rod([-.84,.12,.1],[-.67,2.18,.1],.055,.04,stone);
  b.path([[-.67,2.17,.1],[-.32,2.46,.08],[.18,2.59,.05],[.68,2.46,.04],[1.01,2.13,.02]],.08,silver);
  b.path([[-.67,2.17,.12],[-.23,2.35,.12],[.23,2.41,.09],[.68,2.32,.06],[1.01,2.13,.02]],.035,stone);
}

function lioness(b) {
  const coat=0xaaa49c, shadow=0x625e59;
  // Mane-free lioness portrait with rounded ears, broad muzzle and almond eyes.
  addOrganicBody('lioness','',b);
  for(const side of [-1,1]) {
    b.ball([side*.50,1.79,-.01],[.20,.24,.15],shadow);
    b.ball([side*.50,1.8,.11],[.11,.14,.055],coat);
    b.ball([side*.27,1.43,.39],[.16,.085,.06],shadow,[0,0,-side*.2]);
    b.ball([side*.27,1.44,.44],[.066,.045,.025],ink);
    for(let i=0;i<3;i++) b.path([[side*.28,.99-i*.055,.53],[side*.56,.97-i*.07,.58],[side*.78,.98-i*.08,.52]],.008,ink);
    b.path([[side*.12,1.67,.40],[side*.32,1.61,.38],[side*.46,1.55,.27]],.026,shadow);
  }
  b.ball([0,1.12,.57],[.16,.11,.075],ink);
  b.rod([0,1.04,.60],[0,.87,.55],.022,.022,ink);
  b.path([[-.20,.87,.52],[0,.82,.57],[.20,.87,.52]],.022,ink);
}

function elk(b) {
  const coat=0x726d64, dark=0x464641;
  addOrganicBody('elk','',b);
  for(const side of [-1,1]) {
    for(const x of [-.62,.49]) {
      b.rod([x,1.05,side*.22],[x-.06,.50,side*.22],.095,.07,coat);
      b.rod([x-.06,.50,side*.22],[x,.10,side*.22],.07,.045,dark);
      b.ball([x+.06,.08,side*.22],[.15,.08,.10],dark);
    }
    b.ball([.63,2.22,side*.23],[.12,.20,.10],dark,[side*.2,0,-.4]);
    b.ball([.91,2.03,side*.23],[.045,.045,.035],ink);
    // Broad antlers with separately modelled tines.
    b.path([[.57,2.20,side*.18],[.36,2.48,side*.44],[.21,2.73,side*.71],[.08,2.85,side*.96]],.065,stone);
    for(let i=0;i<4;i++) {
      const t=i/3, x=.35-.25*t, z=side*(.43+.49*t), y=2.48+.34*t;
      b.rod([x,y,z],[x+.10,y+.24+(1-t)*.12,z+side*.06],.052,.006,stone);
    }
  }
}

function anubis(b) {
  const dark=0x34383a, gold=0xb79a5b;
  // Tall upright jackal ears, elongated muzzle and striped Egyptian collar.
  addOrganicBody('anubis','',b);
  for(const side of [-1,1]) {
    b.poly([[0,0],[side*.22,.04],[side*.10,.77]],.18,[side*.23,1.83,-.1],dark);
    b.poly([[0,0],[side*.09,.03],[side*.055,.48]],.04,[side*.25,1.94,.1],gold);
    b.ball([side*.22,1.67,.29],[.11,.055,.04],gold);
    b.ball([side*.23,1.68,.33],[.045,.035,.022],ink);
  }
  b.ball([0,1.34,.72],[.14,.10,.08],ink);
  b.poly([[-.55,0],[-.74,-.55],[0,-.77],[.74,-.55],[.55,0]],.23,[0,1.09,-.12],gold);
  for(let i=0;i<3;i++)b.path([[-.52-i*.04,.99-i*.14,.14],[0,.79-i*.14,.18],[.52+i*.04,.99-i*.14,.14]],.035,dark);
}

function windmill(b) {
  // A small stone windmill with four solid sails, matching the landscape subject.
  b.rod([0,.12,0],[0,1.68,0],.46,.29,stone);
  b.ball([0,1.72,0],[.37,.16,.35],darkRoof);
  b.box([0,.45,.42],[.20,.46,.05],ink);
  b.ball([0,1.36,.35],[.10,.10,.07],silver);
  for(let i=0;i<4;i++) {
    const angle=i*Math.PI/2;
    const x=Math.sin(angle), y=Math.cos(angle);
    b.rod([0,1.36,.42],[x*.91,1.36+y*.91,.42],.045,.025,bark);
    b.box([x*.59,1.36+y*.59,.42],[.24,.65,.055],silver,[0,0,-angle]);
  }
  b.ball([0,1.36,.50],[.11,.11,.09],bark);
}

const darkRoof = 0x4a4744;

function vehicle(b) {
  // A vintage car with round wheels and lamps, facing +Z.
  b.box([0,.58,0],[1.28,.48,2.05],0x696f70);
  b.box([0,.92,-.26],[1.10,.42,.90],0x858d8c);
  b.box([0,1.17,-.29],[1.16,.12,1.02],0x525b5c);
  b.box([0,.94,.205],[.85,.28,.035],0x9cb8bc);
  b.box([0,.58,1.05],[.74,.32,.08],ink);
  for(const side of [-1,1]) {
    for(const z of [-.67,.66]) {
      b.ball([side*.72,.28,z],[.16,.29,.29],ink);
      b.ball([side*.82,.28,z],[.04,.14,.14],silver);
    }
    b.ball([side*.48,.69,1.09],[.14,.14,.07],0xe8d5a6);
  }
  b.box([0,.29,1.08],[1.28,.09,.1],silver);
}

const builders = { forest, mechanism, jellyfish, octopus, frog, vehicle, wings, scorpion, reaper, lioness, elk, anubis, windmill };

export function build2024(code, builder) {
  const build = builders[code];
  if (!build) return false;
  build(builder);
  return true;
}
