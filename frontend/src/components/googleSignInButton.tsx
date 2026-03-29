// frontend/src/components/GoogleSignInButton.tsx
import { FcGoogle } from 'react-icons/fc';

export function GoogleSignInButton() {
  const handleGoogleSignIn = () => {
    // Rediriger vers le backend
    window.location.href = 'http://localhost:4001/api/auth/google';
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <FcGoogle className="w-5 h-5" />
      <span className="font-medium text-gray-700">
        Sign in with Google
      </span>
    </button>
  );
}