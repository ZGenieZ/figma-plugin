import React from 'react';
import Lottie from 'react-lottie-player';

import loadingJson from '@/ui/loading.json';

function Loading() {
  return (
    <Lottie
      loop
      play
      animationData={loadingJson}
      style={{ width: 24, height: 24 }}
    />
  );
}

export { Loading };
