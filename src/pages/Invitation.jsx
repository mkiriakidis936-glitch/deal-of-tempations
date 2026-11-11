import React, { useState } from 'react';
import InvitationTeaser from '@/components/invitation/InvitationTeaser';
import InvitationIntakeForm from '@/components/invitation/InvitationIntakeForm';
import ComicPanel from '@/components/comic/ComicPanel';
import { Image } from '@/components/ui/image';
import { ART } from '@/data/brandArt';

const LOGO_URL = ART.emblem;

export default function Invitation() {
  const [phase, setPhase] = useState('seal');

  if (phase === 'seal') {
    return <InvitationTeaser onOpen={() => setPhase('form')} />;
  }

  if (phase === 'form') {
    return <InvitationIntakeForm onDone={() => setPhase('done')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
      <ComicPanel className="bg-primary text-center py-10 px-8 max-w-md comic-pop">
        <div className="mb-3 mx-auto" style={{ width: 100, height: 100 }}>
          <Image src={LOGO_URL} fittingType="fill" className="rounded-full border-2 border-primary/40" />
        </div>
        <div className="font-heading text-3xl comic-text-stroke text-tarot-dark">ΕΓΙΝΕ.</div>
        <div className="text-sm mt-3 font-bold text-tarot-dark/80 font-body">
          Η παρουσία σου καταχωρήθηκε.<br />Τα πάντα θα αποκαλυφθούν επιτόπου.
        </div>
      </ComicPanel>
    </div>
  );
}