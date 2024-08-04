import React from 'react';
import Lottie from 'react-lottie-player';

import loadingJson from '../../../ui/loading.json';

function Loading() {
  return (
    <Lottie
      loop
      play
      animationData={loadingJson}
      style={{ width: 30, height: 30 }}
    />
  );
}

export { Loading };
