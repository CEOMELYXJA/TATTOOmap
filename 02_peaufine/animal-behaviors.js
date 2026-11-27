// Local, bounded movement keeps each encounter linked to its catalogue position.
// Paths differ for land, flying and swimming subjects. The photographs and the
// placement group never move; companions have their own independent pivots.
const winged = new Set(['bird','owl','raptor','dragon','butterfly','moth','insect']);
const land = new Set(['tiger','lion','lioness','cub','cat','dog','pug','gorilla','bear','elk','turtle']);
const crawling = new Set(['snake','scorpion','frog']);
const drifting = new Set(['jellyfish','octopus']);

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
    const speed=flies?.37:drifts?.22:code==='turtle'?.08:.15;
    const radius=flies?.34:drifts?.20:creeps?.16:.24;
    pivot.position.x=base.x+radius*Math.sin(t*speed+phase);
    pivot.position.z=base.z+radius*.65*Math.sin(t*speed*.8+phase*1.2);
    // Flying and suspended creatures already have vertical movement in the
    // general animator. Land animals need their baseline restored each frame.
    if(walks || creeps) {
      const gait=code==='turtle'?1.2:code==='frog'?2.2:3.2;
      const lift=code==='frog'?.075:code==='turtle'?.008:.018;
      pivot.position.y=base.y+lift*Math.abs(Math.sin(t*gait+phase));
      pivot.rotation.x=(creeps?.025:.012)*Math.sin(t*gait*.5+phase);
    }
    pivot.rotation.y+=(.035+nearby*.03)*Math.sin(t*.55+phase);
  }
}

