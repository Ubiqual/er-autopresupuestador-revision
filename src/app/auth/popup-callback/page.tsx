'use client';

import { useEffect } from 'react';

export default function PopupCallback() {
  useEffect(() => {
    window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
    window.close();
  }, []);

  return <div>Completing login...</div>;
}
