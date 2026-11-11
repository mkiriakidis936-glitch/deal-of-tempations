import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { MARATHON_STAGES } from '@/data/gameConfig';

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-primary/10 py-1 last:border-0">
      <span className="ds-label">{label}</span>
      <span className="ds-value text-right text-sm">{children}</span>
    </div>
  );
}

export default function MobileStatus({ state, myPlayer, isMyTurn }) {
  const mode = state.mode || 'classic';

  if (mode === 'marathon') {
    const marathonStage = state.marathonStage || 1;
    const stageInfo = MARATHON_STAGES.find((s) => s.stage === marathonStage) || MARATHON_STAGES[0];
    const team = myPlayer?.team;
    const teamData = team === 'alpha' ? state.teamAlpha : state.teamBeta;
    return (
      <ComicPanel>
        <div className="ds-eyebrow mb-2 text-primary/80">Marathon · Στάδιο {marathonStage}/4</div>
        <Row label="Στάδιο">{stageInfo?.name || '—'}</Row>
        <Row label="Ομάδα">{team === 'alpha' ? 'ALPHA' : 'BETA'}</Row>
        <Row label="Θέση">{(myPlayer?.position ?? 0) + 1} / 80</Row>
        <Row label="Team Loot">${(teamData?.loot || 0).toLocaleString()} · {teamData?.stars || 0}★</Row>
      </ComicPanel>
    );
  }

  if (mode === 'arrest_heist') {
    const team = myPlayer?.team;
    const teamPoints = team === 'A' ? state.teamA?.points : state.teamB?.points;
    const oppPoints = team === 'A' ? state.teamB?.points : state.teamA?.points;
    return (
      <ComicPanel>
        <div className="ds-eyebrow mb-2 text-primary/80">Απόδραση · Γύρος {state.round || 1}/6</div>
        <Row label="Ομάδα">
          {team === 'A' ? 'ALPHA' : 'BETA'}
          {myPlayer?.isLeader ? ' · Αρχηγός' : ''}
        </Row>
        <Row label="Ποινή">{myPlayer?.penaltyStep || 0}/6</Row>
        <Row label="Bounty">${teamPoints || 0} vs ${oppPoints || 0}</Row>
      </ComicPanel>
    );
  }

  return (
    <ComicPanel>
      <div className="ds-eyebrow mb-2 text-primary/80">
        Στάδιο {state.stage}/3 · {state.stage === 1 ? 'Περιπολία' : state.stage === 2 ? 'Ανάκριση' : 'Φινάλε'}
      </div>
      <Row label="Γύρος">{state.round}</Row>
      {state.players?.[state.currentPlayerIndex] && (
        <Row label="Σειρά">
          <span className="text-primary">{state.players[state.currentPlayerIndex].name}</span>
        </Row>
      )}
    </ComicPanel>
  );
}