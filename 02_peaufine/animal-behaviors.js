// Local, bounded movement keeps each encounter linked to its catalogue position.
// Paths differ for land, flying and swimming subjects. The photographs and the
// placement group never move; companions have their own independent pivots.
const winged = new Set(['bird','owl','raptor','dragon','butterfly','moth','insect']);
const land = new Set(['tiger','lion','lioness','cub','cat','dog','pug','gorilla','bear','elk','turtle']);
const crawling = new Set(['snake','scorpion','frog']);
const drifting = new Set(['jellyfish','octopus']);

// The available four-legged feline and canine models have separate legs.
// They can lower their bodies into a crouched rest and stand up again.
const resting = new Set(['tiger','lion','cub','cat','dog','pug']);
const ease = x => { x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
export function animalRest(code,time,phase) {
  if(!resting.has(code)) return 0;
  const cycle=((time+phase*1.3)%38+38)%38;
  return ease((cycle-10)/3)*(1-ease((cycle-25)/3));
}

// Each cycle alternates a calm walk, a faster playful run and a crouched rest.
export function animalRun(code,time,phase) {
  if(!resting.has(code) && code!=='frog' && code!=='elk') return 0;
  const cycle=((time+phase*1.3)%38+38)%38;
  return ease((cycle-27)/2)*(1-ease((cycle-35)/2));
}

function nearbyAnimal(group,time) {
  const cached=group.userData.playmate;
  if(cached && cached.parent===group.parent) return cached;
  if(time < (group.userData.nextPlaymateCheck || 0)) return null;
  group.userData.nextPlaymateCheck=time+3;
  let best=null, closest=144;
  for(const other of group.parent?.children || []) {
    if(other===group || other.userData.artIndex===undefined || !other.userData.animatedParts) continue;
    if(!other.children.some(p=>land.has(p.userData.animalCode) || crawling.has(p.userData.animalCode))) continue;
    const dx=other.position.x-group.position.x, dz=other.position.z-group.position.z;
    const d=dx*dx+dz*dz;
    if(d<closest){closest=d;best=other;}
  }
  group.userData.playmate=best;
  return best;
}

export function animateAnimal(group,time,visitorPosition) {
  const t=Number.isFinite(time)?time:0;
  const distance=visitorPosition ? Math.hypot(visitorPosition.x-group.position.x,visitorPosition.z-group.position.z) : Infinity;
  const nearby=Math.max(0,1-distance/6);
  const hasLand=group.children.some(p=>land.has(p.userData.animalCode) || crawling.has(p.userData.animalCode));
  const mate=hasLand?nearbyAnimal(group,t):null;
  for(let i=0;i<group.children.length;i++) {
    const pivot=group.children[i], code=pivot.userData.animalCode, base=pivot.userData.animalBase;
    if(!base) continue;
    const flies=winged.has(code), walks=land.has(code), creeps=crawling.has(code), drifts=drifting.has(code);
    if(!flies && !walks && !creeps && !drifts) continue;
    const phase=i*1.7+(Number(group.userData.motionSeed)||0);
    const rest=animalRest(code,t,phase), run=animalRun(code,t,phase);
    const speed=flies?.37:drifts?.22:code==='turtle'?.08:.27;
    const radius=(flies?.7:drifts?.25:creeps?.32:1.15)*(1-rest);
    const walkPhase=t*speed+phase+run*.65*Math.sin(t*.8);
    let x=radius*Math.sin(walkPhase), z=radius*.65*Math.sin(walkPhase*.8+phase*.2);
    if(mate && (walks || creeps)) {
      const a=Number(group.userData.artIndex)||0, b=Number(mate.userData.artIndex)||0;
      const pairPhase=Math.min(a,b)*.73+Math.max(a,b)*.21;
      const cycle=((t+pairPhase)%30+30)%30;
      const play=ease((cycle-7)/3)*(1-ease((cycle-20)/3))*(1-rest);
      const dx=mate.position.x-group.position.x, dz=mate.position.z-group.position.z;
      const length=Math.hypot(dx,dz)||1, reach=Math.min(length*.43,4.4)*play;
      const angle=group.rotation.y, wx=dx/length*reach, wz=dz/length*reach;
      x+=Math.cos(angle)*wx-Math.sin(angle)*wz;
      z+=Math.sin(angle)*wx+Math.cos(angle)*wz;
      // Offset their paths slightly so the animals circle instead of colliding.
      const chase=t*1.2+pairPhase+(a<b?0:-.8);
      const ox=.55*play*Math.cos(chase), oz=.55*play*Math.sin(chase);
      x+=Math.cos(angle)*ox-Math.sin(angle)*oz;
      z+=Math.sin(angle)*ox+Math.cos(angle)*oz;
    } else if(i>0 && (walks || creeps) && hasLand) {
      x+=.3*Math.sin(t*.8+phase); z+=.25*Math.cos(t*.8+phase);
    }
    pivot.position.x=base.x+x;
    pivot.position.z=base.z+z;
    if(walks || creeps) {
      const gait=code==='turtle'?1.2:code==='frog'?2.2:3.2;
      const lift=code==='frog'?.13:code==='turtle'?.008:.025+run*.11;
      const step=t*gait+phase+run*1.7*Math.sin(t*gait);
      const hop=Math.pow(Math.max(0,Math.sin(step)),2);
      pivot.position.y=base.y+lift*(1-rest)*hop;
      pivot.rotation.x=(creeps?.025:.025)*(1-rest)*Math.sin(t*gait*.5+phase);
    }
    pivot.rotation.y+=(.08+nearby*.03+run*.15)*Math.sin(t*.55+phase);
  }
}
