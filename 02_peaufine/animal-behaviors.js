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

export function animateAnimal(group,time,visitorPosition) {
  const t=Number.isFinite(time)?time:0;
  const distance=visitorPosition ? Math.hypot(visitorPosition.x-group.position.x,visitorPosition.z-group.position.z) : Infinity;
  const nearby=Math.max(0,1-distance/6);
  for(let i=0;i<group.children.length;i++) {
    const pivot=group.children[i], code=pivot.userData.animalCode, base=pivot.userData.animalBase;
    if(!base) continue;
    const flies=winged.has(code), walks=land.has(code), creeps=crawling.has(code), drifts=drifting.has(code);
    if(!flies && !walks && !creeps && !drifts) continue;
    const phase=i*1.7+(Number(group.userData.motionSeed)||0);
    const rest=animalRest(code,t,phase);
    const speed=flies?.37:drifts?.22:code==='turtle'?.08:.15;
    const radius=(flies?.34:drifts?.20:creeps?.16:.24)*(1-rest);
    pivot.position.x=base.x+radius*Math.sin(t*speed+phase);
    pivot.position.z=base.z+radius*.65*Math.sin(t*speed*.8+phase*1.2);
    // Flying and suspended creatures already have vertical movement in the
    // general animator. Land animals need their baseline restored each frame.
    if(walks || creeps) {
      const gait=code==='turtle'?1.2:code==='frog'?2.2:3.2;
      const lift=code==='frog'?.075:code==='turtle'?.008:.018;
      pivot.position.y=base.y+lift*(1-rest)*Math.abs(Math.sin(t*gait+phase));
      pivot.rotation.x=(creeps?.025:.012)*(1-rest)*Math.sin(t*gait*.5+phase);
    }
    pivot.rotation.y+=(.035+nearby*.03)*Math.sin(t*.55+phase);
  }
}

