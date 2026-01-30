import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Button } from '../components/Button';
import { canvasChallenges } from '../data/canvasChallengeData';
import { canvasTools, canvasAssets, canvasTemplates } from '../data/canvasChallengeData';
import {
  CanvasToolButton,
  ColorSwatch,
  LayerItem,
  MiniMap,
  CanvasTimer,
  HintPanel
} from '../components/canvas/CanvasComponents';
import {
  Save,
  Download,
  Send,
  HelpCircle,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Layers,
  Package,
  X,
  Menu,
  CheckSquare
} from 'lucide-react';

export function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as any)?.mode || 'solo';

  const challenge = canvasChallenges.find((c) => c.id === id);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#00E5FF');
  const [showBrief, setShowBrief] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [showAssets, setShowAssets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(challenge?.duration ? challenge.duration * 60 : 0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Challenge non trouvé
          </h2>
          <Button onClick={() => navigate('/canvas')}>
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isWarning = timeRemaining < 600 && timeRemaining > 300;
  const isCritical = timeRemaining <= 300;

  const colors = [
    '#00E5FF', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', 
    '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
  ];

  const mockLayers = [
    { id: '1', name: 'Load Balancer', visible: true, locked: false },
    { id: '2', name: 'Backend Services', visible: true, locked: false },
    { id: '3', name: 'Database Layer', visible: true, locked: false },
    { id: '4', name: 'Annotations', visible: true, locked: false }
  ];

  const handleSave = () => {
    setHasUnsavedChanges(false);
    // Show toast
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    navigate(`/canvas/${id}/result`);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 h-16 border-b border-[var(--border-default)] bg-[var(--surface-1)] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-[var(--surface-2)] rounded"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Challenge Info */}
          <div className="hidden sm:block">
            <h2 className="font-bold text-[var(--text-primary)] text-sm lg:text-base">
              {challenge.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Mode: {mode === 'solo' ? '🧑‍💻 Training' : mode === 'duel' ? '⚔️ Duel' : '🏆 Hackathon'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <CanvasTimer
            minutes={minutes}
            seconds={seconds}
            warning={isWarning}
            critical={isCritical}
          />

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              <span className="hidden lg:inline">Sauvegarder</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {}}>
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Export</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              <Send className="w-4 h-4" />
              <span className="hidden lg:inline">Soumettre</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Brief (Desktop) */}
        <div className={`
          ${showBrief ? 'w-80' : 'w-0'} 
          hidden lg:block
          flex-shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto transition-all duration-200
        `}>
          {showBrief && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)]">📋 Brief</h3>
                <button
                  onClick={() => setShowBrief(false)}
                  className="p-1 hover:bg-[var(--surface-2)] rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Context */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--brand-primary)]">Contexte</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {challenge.context}
                </p>
              </div>

              {/* Key Requirements */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--brand-primary)]">Exigences clés</h4>
                <ul className="space-y-1">
                  {challenge.requirements.slice(0, 5).map((req, idx) => (
                    <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <CheckSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--state-success)]" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--brand-primary)]">Checklist</h4>
                <div className="space-y-2">
                  {['Authentification', 'Scalabilité', 'Monitoring', 'Sécurité'].map((item) => (
                    <label key={item} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-[var(--border-default)]"
                      />
                      <span className="text-[var(--text-secondary)]">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/canvas/${id}/brief`)}
              >
                Voir brief complet
              </Button>
            </div>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden relative">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-2">
              <Button variant="ghost" size="sm" onClick={() => {}}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <span className="text-xs text-[var(--text-secondary)] min-w-[40px] text-center">100%</span>
              <Button variant="ghost" size="sm" onClick={() => {}}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-[var(--border-default)]" />
              <Button variant="ghost" size="sm" onClick={() => {}}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? 'text-[var(--brand-primary)]' : ''}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            {!showBrief && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBrief(true)}
                className="gap-2"
              >
                <Menu className="w-4 h-4" />
                Brief
              </Button>
            )}
          </div>

          {/* Canvas Area */}
          <div className={`
            flex-1 m-8 border-2 border-dashed border-[var(--border-default)] rounded-lg
            flex items-center justify-center
            ${showGrid ? 'bg-grid' : 'bg-[var(--surface-1)]'}
          `}>
            <div className="text-center space-y-4">
              <span className="text-6xl block">🎨</span>
              <p className="text-[var(--text-secondary)]">
                Canvas de dessin
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-md">
                Utilisez les outils de la barre de droite pour dessiner votre architecture.
                Glissez-déposez des éléments, créez des connexions, annotez votre diagramme.
              </p>
            </div>
          </div>

          {/* Mini Map */}
          <div className="absolute bottom-4 right-4 w-48 hidden lg:block">
            <MiniMap />
          </div>
        </div>

        {/* Right Panel - Tools */}
        <div className="w-16 lg:w-64 flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto">
          <div className="p-2 lg:p-4 space-y-4">
            {/* Tools */}
            <div className="space-y-2">
              <h4 className="hidden lg:block text-sm font-semibold text-[var(--text-primary)]">Outils</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {canvasTools.map((tool) => (
                  <CanvasToolButton
                    key={tool.id}
                    icon={tool.icon}
                    name={tool.name}
                    shortcut={tool.shortcut}
                    active={activeTool === tool.id}
                    onClick={() => setActiveTool(tool.id)}
                  />
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <h4 className="hidden lg:block text-sm font-semibold text-[var(--text-primary)]">Couleurs</h4>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {colors.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    active={activeColor === color}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Templates Button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Package className="w-4 h-4" />
              <span className="hidden lg:inline">Templates</span>
            </Button>

            {/* Templates Panel */}
            {showTemplates && (
              <div className="space-y-2 hidden lg:block">
                {canvasTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full p-3 text-left bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg border border-[var(--border-default)] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{template.icon}</span>
                      <span className="font-semibold text-sm text-[var(--text-primary)]">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Assets Button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowAssets(!showAssets)}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden lg:inline">Assets</span>
            </Button>

            {/* Assets Panel */}
            {showAssets && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 hidden lg:grid">
                {canvasAssets.map((asset) => (
                  <button
                    key={asset.id}
                    className="p-2 flex flex-col items-center gap-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded border border-[var(--border-default)] transition-colors"
                    title={asset.name}
                  >
                    <span className="text-2xl">{asset.icon}</span>
                    <span className="text-xs text-[var(--text-secondary)] text-center">
                      {asset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Layers Toggle */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowLayers(!showLayers)}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden lg:inline">Layers</span>
            </Button>

            {/* Layers Panel */}
            {showLayers && (
              <div className="space-y-1 hidden lg:block">
                {mockLayers.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    name={layer.name}
                    visible={layer.visible}
                    locked={layer.locked}
                    onToggleVisible={() => {}}
                    onToggleLock={() => {}}
                    onSelect={() => {}}
                    onRename={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Hint Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowHint(!showHint)}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Aide / Indice</span>
            </Button>

            {/* Hint Panel */}
            {showHint && (
              <div className="hidden lg:block">
                <HintPanel
                  hintNumber={currentHint}
                  totalHints={3}
                  hint="Pensez à séparer les composants de lecture et d'écriture pour améliorer la scalabilité (CQRS pattern)."
                  onNextHint={() => setCurrentHint(currentHint + 1)}
                  disabled={currentHint >= 3}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex-shrink-0 h-10 border-t border-[var(--border-default)] bg-[var(--surface-1)] px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-secondary)]">
            <span className="text-[var(--state-success)]">●</span> Connecté
          </span>
          <span className="text-[var(--text-muted)]">
            Dernier enregistrement: Il y a 2 min
          </span>
        </div>
        <div className="text-[var(--text-muted)]">
          Raccourcis: V (Select) · R (Rectangle) · A (Arrow) · T (Text)
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--brand-primary)] p-6 max-w-lg w-full space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Soumettre votre solution ?
            </h3>
            <p className="text-[var(--text-secondary)]">
              Vous êtes sur le point de soumettre votre diagramme pour évaluation.
              Cette action est définitive et lancera l'analyse IA.
            </p>
            
            {/* Preview Placeholder */}
            <div className="h-48 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)] flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowSubmitModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmSubmit}
              >
                Confirmer et soumettre
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
