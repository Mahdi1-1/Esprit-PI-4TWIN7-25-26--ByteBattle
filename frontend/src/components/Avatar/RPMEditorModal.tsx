import React, { useEffect, useRef, useState } from 'react';
import { X, Loader } from 'lucide-react';

interface RPMEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarCreated: (glbUrl: string) => void;
  existingAvatarId?: string;
}

export const RPMEditorModal: React.FC<RPMEditorModalProps> = ({ isOpen, onClose, onAvatarCreated, existingAvatarId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const subdomain = 'demo'; // You can replace 'demo' with your own RPM subdomain
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsIframeLoaded(false);
      setShowTimeoutError(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!isIframeLoaded) setShowTimeoutError(true);
    }, 15000);

    const handleMessage = (event: MessageEvent) => {
        const source = event.data; // readyplayer.me sometimes sends direct objects,
        // but frameApi events are normally stringified
        
        let json;
        try {
            json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) { return; }

        if (json?.source !== 'readyplayerme') return;

        if (json.eventName === 'v1.frame.ready') {
            setIsIframeLoaded(true);
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({
                        target: 'readyplayerme',
                        type: 'subscribe',
                        eventName: 'v1.**'
                    }),
                    '*'
                );
            }
        }

        if (json.eventName === 'v1.avatar.exported') {
            onAvatarCreated(json.data.url);
        }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [isOpen, onAvatarCreated, isIframeLoaded]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="relative w-full h-full md:w-[95vw] md:h-[90vh] bg-slate-900 rounded-none md:rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {!isIframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-slate-900">
            {showTimeoutError ? (
                <div className="text-center p-6">
                <p className="text-red-400 mb-2">The editor took too long to load.</p>
                <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded text-white text-sm">Close</button>
                </div>
            ) : (
                <>
                    <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Connecting to Ready Player Me...</p>
                </>
            )}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={existingAvatarId 
            ? `https://${subdomain}.readyplayer.me/avatar/${existingAvatarId}?frameApi&language=en`
            : `https://${subdomain}.readyplayer.me/avatar?frameApi&bodyType=halfbody&language=en`
          }
          allow="camera *; microphone *"
          className="w-full h-full border-0 relative z-1"
          title="Avatar Editor"
        />
      </div>
    </div>
  );
};
