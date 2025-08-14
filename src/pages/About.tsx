import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Vote, Lock, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Role-based access controls and secure session management ensure every vote is protected and auditable."
    },
    {
      icon: Users,
      title: "User-Friendly",
      description: "Intuitive interface designed for seamless voting experience across all devices and user roles."
    },
    {
      icon: Vote,
      title: "Real-time Results",
      description: "Live vote counting with instant tallying and comprehensive election management tools."
    },
    {
      icon: Lock,
      title: "Privacy Protected",
      description: "Anonymous voting sessions with encrypted data storage to ensure complete ballot secrecy."
    }
  ];

  const stats = [
    { number: "1,000+", label: "Students Served" },
    { number: "99.9%", label: "Uptime" },
    { number: "100+", label: "Elections Conducted" },
    { number: "100%", label: "Vote Privacy" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-krona text-primary">evotar</h1>
          <Button variant="outline" onClick={() => navigate('/')} size="sm" className="text-sm">
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-krona text-white mb-4 md:mb-6">
            About Evotar
          </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
              Empowering educational institutions with secure, user-friendly digital voting and election management solutions.
            </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-foreground mb-8">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              At Evotar, we believe democracy should be accessible to everyone. Our mission is to provide 
              educational institutions with reliable, secure digital voting technology that streamlines 
              election management while ensuring every voice is heard, every vote counts, and every 
              election is conducted with complete transparency and privacy protection.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Accessibility First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We design for everyone, ensuring our platform works seamlessly for voters, staff, and 
                    administrators with intuitive interfaces across all devices and technical levels.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning" />
                    Innovation & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We combine modern web technology with proven database security and role-based access 
                    controls to create a voting experience that's both innovative and trustworthy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-foreground mb-12">
            Why Choose Evotar?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-foreground mb-12">
            Trusted by Thousands
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold text-primary">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join educational institutions who trust Evotar for their student election management needs.
          </p>
          <Button 
            size="lg" 
            className="bg-background text-primary hover:bg-background/95"
            onClick={() => navigate('/login')}
          >
            Access Voting Portal
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4 text-sm text-muted-foreground">
            <button onClick={() => navigate('/about')} className="hover:text-primary transition-colors">About</button>
            <button onClick={() => navigate('/faq')} className="hover:text-primary transition-colors">FAQ</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms</button>
          </div>
          <p className="text-muted-foreground">Evotar © 2025. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;