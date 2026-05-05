import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Users, BookOpen, Code, Palette, Search } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              ARIX
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-foreground/70 hover:text-foreground transition">
                Features
              </Link>
              <Link href="#pricing" className="text-foreground/70 hover:text-foreground transition">
                Pricing
              </Link>
              <Link href="#community" className="text-foreground/70 hover:text-foreground transition">
                Community
              </Link>
              <Link href="#faq" className="text-foreground/70 hover:text-foreground transition">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <span className="text-sm font-medium text-primary bg-primary/10 px-4 py-1 rounded-full">
              Welcome to ARIX.help
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
            AI for Building Everything
          </h1>
          
          <p className="text-xl text-foreground/70 mb-12 max-w-2xl mx-auto">
            Your comprehensive platform for coding, design, app development, SaaS, SEO, and website building. Get instant AI-powered help from experts and join a thriving community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button 
                size="lg" 
                variant="outline"
                className="border-border hover:bg-card text-foreground"
              >
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 pt-12 border-t border-border/30">
            <div>
              <p className="text-3xl font-bold text-primary mb-2">10K+</p>
              <p className="text-foreground/60">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-2">100K+</p>
              <p className="text-foreground/60">AI Conversations</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-2">500+</p>
              <p className="text-foreground/60">Community Resources</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-foreground/60">Everything you need to build, design, and ship</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Chat */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">AI Chat Assistant</h3>
              <p className="text-foreground/70">
                Get instant help with coding, design, and building. Free tier includes 10 daily queries, Pro unlocks unlimited access.
              </p>
            </div>

            {/* Resources */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Resource Library</h3>
              <p className="text-foreground/70">
                Browse hundreds of guides, tutorials, and best practices for every aspect of web development and design.
              </p>
            </div>

            {/* Community */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Community Forums</h3>
              <p className="text-foreground/70">
                Connect with thousands of builders, get advice, share your projects, and collaborate on ideas.
              </p>
            </div>

            {/* Code Help */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <Code className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Coding Assistance</h3>
              <p className="text-foreground/70">
                Get help with any programming language, framework, or technology. From React to Python, we're here to help.
              </p>
            </div>

            {/* Design Tools */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <Palette className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Design Guidance</h3>
              <p className="text-foreground/70">
                Learn UI/UX principles, get design feedback, and discover tools for creating beautiful interfaces.
              </p>
            </div>

            {/* SEO Tools */}
            <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition">
              <Search className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">SEO & Growth</h3>
              <p className="text-foreground/70">
                Optimize your content, improve rankings, and learn strategies to grow your audience and reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32 border-t border-border/30 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Fair Pricing</h2>
            <p className="text-xl text-foreground/60">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-background border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-foreground/60 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>10 AI queries per day</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Access to resources</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Community forums</span>
                </li>
              </ul>
              <Button className="w-full bg-primary/20 hover:bg-primary/30 text-primary">
                Get Started
              </Button>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-primary/20 to-background border-2 border-primary rounded-lg p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-foreground/60 mb-6">Best for active builders</p>
              <div className="text-4xl font-bold mb-2">$29</div>
              <p className="text-foreground/60 mb-6">/month</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>500 AI queries per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Advanced features</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Bulk exports</span>
                </li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Pro Trial
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-background border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-foreground/60 mb-6">For teams and organizations</p>
              <div className="text-4xl font-bold mb-6">Custom</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Unlimited queries</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>SLA guarantee</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Build Something Great?</h2>
          <p className="text-xl text-foreground/60 mb-12">
            Join thousands of developers and designers who are already using ARIX.help to ship faster.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-foreground/60">
                <li><Link href="#" className="hover:text-foreground transition">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-foreground/60">
                <li><Link href="#" className="hover:text-foreground transition">Forums</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Resources</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-foreground/60">
                <li><Link href="#" className="hover:text-foreground transition">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-foreground/60">
                <li><Link href="#" className="hover:text-foreground transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8">
            <p className="text-foreground/60 text-center">
              © 2024 ARIX.help. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
