'use client';

import ChatIconDesktop from '@/assets/icons/chat-icon-desktop.svg';
import ChatIcon from '@/assets/icons/chat-icon.svg';

export function Chat() {
  const scrollToNeedHelp = () => {
    const needHelpElement = document.getElementById('need-help-section');
    if (needHelpElement) {
      needHelpElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <button
      onClick={scrollToNeedHelp}
      className="fixed bottom-6 right-4 lg:right-6 z-50"
      aria-label="Necesitas ayuda - Chat"
      id="presupuestador_boton_ayuda"
    >
      <div className="sm:hidden">
        <ChatIcon />
      </div>
      <div className="hidden sm:block">
        <ChatIconDesktop />
      </div>
    </button>
  );
}
