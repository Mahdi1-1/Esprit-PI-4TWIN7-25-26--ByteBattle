import { Layout } from '../components/Layout';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
 

export function DrawingPage() {
  return (
    <Layout>
            <div className="flex-1 h-[calc(100vh-64px)]">
        <ExcalidrawEditor />
      </div>
    </Layout>
  );
}
