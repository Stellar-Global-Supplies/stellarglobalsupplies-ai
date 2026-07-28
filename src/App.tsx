import { AuthProvider, useAuth } from '@/auth';
import { Loader2, Sparkles } from 'lucide-react';
import Login from '@/components/Login';
import Chat from '@/components/Chat';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gem-bg dark:bg-gem-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full stellar-gradient-bg flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-gem-blue" />
        </div>
      </div>
    );
  }

  return user ? <Chat /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
