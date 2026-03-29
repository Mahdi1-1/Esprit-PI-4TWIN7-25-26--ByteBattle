import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
 

export function DrawingPage() {
  return (
    <Layout>
      <Navbar
        isLoggedIn
        
        
      />
      <div className="flex-1 h-[calc(100vh-64px)]">
        <ExcalidrawEditor />
      </div>
    </Layout>
  );
}
