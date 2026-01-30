import { Link } from 'react-router';
import { Code2, Swords, Users, Brain, Shield, Zap, ArrowRight, Github } from 'lucide-react';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-full">
              <Zap className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="text-caption text-[var(--text-secondary)]">
                Platform gamifiée pour développeurs
              </span>
            </div>
            
            <h1 className="mb-6 gradient-brand-text">
              Code. Battle. Level Up.
            </h1>
            
            <p className="text-[1.125rem] text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              Maîtrisez l'algorithmique en solo, affrontez d'autres développeurs en temps réel, 
              et participez à des hackathons style ICPC. Avec un IDE intégré, un juge automatisé, 
              et une IA pour vous guider.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Commencer Gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="secondary" size="lg">
                  Voir une Démo
                </Button>
              </Link>
            </div>

            {/* Mock IDE Preview */}
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)] shadow-lg glow">
              <div className="bg-[var(--surface-1)] px-4 py-2 border-b border-[var(--border-default)] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--state-error)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-success)]" />
                </div>
                <span className="text-caption text-[var(--text-muted)] ml-2 font-code">
                  two-sum-arena.py
                </span>
              </div>
              <div className="bg-[var(--bg-secondary)] p-6 text-left font-code text-[0.875rem]">
                <pre className="text-[var(--text-primary)]">
                  <code>{`def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Tests: 42/42 passed ✓
# Runtime: 68ms | Memory: 15.2MB`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="mb-4">Fonctionnalités Principales</h2>
            <p className="text-[var(--text-secondary)]">
              Tout ce dont vous avez besoin pour progresser en programmation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="Mode Solo"
              description="Des centaines de problèmes classés par difficulté et thématique. Progressez à votre rythme."
            />
            <FeatureCard
              icon={<Swords className="w-6 h-6" />}
              title="Duel 1v1 Temps Réel"
              description="Affrontez d'autres développeurs via WebSocket. Système Elo compétitif."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Hackathon ICPC"
              description="Compétitions en équipe avec scoreboard live, freeze, et classements officiels."
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="IDE Monaco Intégré"
              description="Éditeur professionnel avec coloration syntaxique, auto-complétion, et multi-langages."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Judge Sécurisé"
              description="Sandbox isolé pour exécuter votre code en toute sécurité. Résultats instantanés."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="IA Assistant"
              description="Smart hints progressifs et code review automatique pour améliorer votre code."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 text-center">
          <p className="text-caption text-[var(--text-muted)] mb-8">
            Utilisé par les développeurs de
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            <div className="text-[1.5rem] font-semibold text-[var(--text-secondary)]">École 42</div>
            <div className="text-[1.5rem] font-semibold text-[var(--text-secondary)]">Epitech</div>
            <div className="text-[1.5rem] font-semibold text-[var(--text-secondary)]">EPITA</div>
            <div className="text-[1.5rem] font-semibold text-[var(--text-secondary)]">Holberton</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 border-y border-[var(--border-default)]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 text-center">
          <h2 className="mb-4">Prêt à commencer votre aventure ?</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de développeurs qui améliorent leurs compétences chaque jour
          </p>
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Créer un Compte Gratuit
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[var(--surface-1)] border-t border-[var(--border-default)]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-[var(--radius-sm)] flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-[var(--bg-primary)]" />
                </div>
                <span className="font-semibold text-[var(--text-primary)]">ByteBattle</span>
              </div>
              <p className="text-caption text-[var(--text-muted)]">
                La plateforme gamifiée pour maîtriser l'algorithmique
              </p>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Produit</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Prix</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Entreprises</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Ressources</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Documentation</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Tutoriels</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Légal</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Confidentialité</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Conditions</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[var(--border-default)] flex items-center justify-between">
            <p className="text-caption text-[var(--text-muted)]">
              © 2026 ByteBattle. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--brand-primary)] transition-all duration-200">
      <div className="w-12 h-12 mb-4 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}