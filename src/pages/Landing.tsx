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
                Gamified platform for developers
              </span>
            </div>
            
            <h1 className="mb-6 gradient-brand-text">
              Code. Battle. Level Up.
            </h1>
            
            <p className="text-[1.125rem] text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              Master algorithms solo, challenge other developers in real-time, 
              and participate in ICPC-style hackathons. With an integrated IDE, automated judge, 
              and AI to guide you.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Start Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="secondary" size="lg">
                  View Demo
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
            <h2 className="mb-4">Key Features</h2>
            <p className="text-[var(--text-secondary)]">
              Everything you need to improve your programming skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="Solo Mode"
              description="Hundreds of problems categorized by difficulty and topic. Progress at your own pace."
            />
            <FeatureCard
              icon={<Swords className="w-6 h-6" />}
              title="Real-Time 1v1 Duel"
              description="Challenge other developers via WebSocket. Competitive Elo system."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="ICPC Hackathon"
              description="Team competitions with live scoreboard, freeze, and official rankings."
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="Integrated Monaco IDE"
              description="Professional editor with syntax highlighting, auto-completion, and multi-language support."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure Judge"
              description="Isolated sandbox to run your code safely. Instant results."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="AI Assistant"
              description="Progressive smart hints and automatic code review to improve your code."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 text-center">
          <p className="text-caption text-[var(--text-muted)] mb-8">
            Used by developers from
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
          <h2 className="mb-4">Ready to start your adventure?</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            Join thousands of developers improving their skills every day
          </p>
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Create Free Account
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
                The gamified platform to master algorithms
              </p>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Product</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Features</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Pricing</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Enterprises</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Resources</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Documentation</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Tutorials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">Legal</h3>
              <ul className="space-y-2 text-caption text-[var(--text-muted)]">
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Privacy</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Terms</a></li>
                <li><a href="#" className="hover:text-[var(--brand-primary)]">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[var(--border-default)] flex items-center justify-between">
            <p className="text-caption text-[var(--text-muted)]">
              © 2026 ByteBattle. All rights reserved.
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