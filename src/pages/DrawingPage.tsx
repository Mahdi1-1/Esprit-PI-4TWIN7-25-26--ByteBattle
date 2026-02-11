import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
import { mockUser } from '../data/mockData';

export function DrawingPage() {
  return (
    <Layout>
      <Navbar
        isLoggedIn
        userAvatar={mockUser.avatar}
        username={mockUser.username}
      />
      <div className="flex-1 h-[calc(100vh-64px)]">
        <ExcalidrawEditor />
      </div>
    </Layout>
  );
}
