import React from 'react';
import MarathonInfiltration from '@/components/tablet/MarathonInfiltration';
import MarathonVault from '@/components/tablet/MarathonVault';
import MarathonRaids from '@/components/tablet/MarathonRaids';
import MarathonLockdown from '@/components/tablet/MarathonLockdown';

export default function MarathonScreen({ state, updateState, onEnd }) {
  const stage = state.marathonStage || 1;

  if (stage === 1) {
    return <MarathonInfiltration state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 2 })} />;
  }
  if (stage === 2) {
    return <MarathonVault state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 3 })} />;
  }
  if (stage === 3) {
    return <MarathonRaids state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 4 })} />;
  }
  if (stage === 4) {
    return <MarathonLockdown state={state} updateState={updateState} onEnd={onEnd} />;
  }
  return null;
}