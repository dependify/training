import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Calendar, CheckCircle, Users } from "lucide-react";
import dependifyLogo from "@/assets/dependify-logo.jpg";
import aghefLogo from "@/assets/aghef-logo.jpg";
import uslaccLogo from "@/assets/uslacc-logo.jpg";

const courses = [
  {
    title: "WordPress Website Development",
    description: "Build professional websites from scratch using the world's most popular CMS",
    icon: "🌐",
  },
  {
    title: "Digital Marketing",
    description: "Master SEO, social media, and online advertising strategies",
    icon: "📱",
  },
  {
    title: "AI Automation for Businesses",
    description: "Leverage artificial intelligence to streamline operations",
    icon: "🤖",
  },
];

const benefits = [
  "Hands-on practical training",
  "Expert instructors",
  "Certificate upon completion",
  "Networking opportunities",
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero py-20 md:py-32">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <Users className="w-4 h-4" />
            FREE Training • Limited Spots
          </div>
          
          <p className="text-sm md:text-base text-muted-foreground mb-2 animate-fade-in">
            USLACC AFRICA TECH DPAY
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mb-6 animate-fade-in">
            (Technology Development Program for African Youths)
          </p>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="text-secondary">FREE</span> Online Digital
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Skills Training
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Transform your career with essential digital skills. Learn WordPress, Digital Marketing, 
            and AI Automation in our comprehensive training program.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity text-lg px-8">
                Register Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>December 2025</span>
            </div>
          </div>
        </div>
      </section>

      {/* Organizers Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3 font-medium">Organizers</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center flex flex-col items-center gap-2">
                  <img 
                    src={aghefLogo} 
                    alt="AGHEF Logo" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">African Grassroots Humanitarian &</p>
                    <p className="text-sm font-semibold text-foreground">Empowerment Foundation (AGHEF)</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-16 bg-border"></div>
                <div className="text-center flex flex-col items-center gap-2">
                  <img 
                    src={uslaccLogo} 
                    alt="USLACC Logo" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">United States Latino American</p>
                    <p className="text-sm font-semibold text-foreground">Chamber of Commerce (USLACC)</p>
                    <p className="text-xs text-muted-foreground">African Region</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-16 bg-border"></div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3 font-medium">Powered By</p>
              <div className="flex items-center gap-3">
                <img 
                  src={dependifyLogo} 
                  alt="Dependify LLC Logo" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span className="text-lg font-bold text-foreground">Dependify LLC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              What You'll Learn
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three comprehensive courses designed to give you practical, job-ready skills
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <CardContent className="p-6">
                  <div className="text-5xl mb-4">{course.icon}</div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground">{course.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Why Join This Program?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-lg text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-none">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  Completely FREE
                </h3>
                <p className="text-muted-foreground mb-6">
                  This training is offered at no cost through AGHEF & USLACC African Region
                </p>
                <Link to="/register">
                  <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Secure Your Spot
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
            Ready to Transform Your Skills?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Don't miss this opportunity to gain valuable digital skills that will advance your career.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Register Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/20">
        <div className="container">
          <div className="flex flex-col items-center gap-8">
            {/* Organizers */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <a href="https://uslaccafrica.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img 
                  src={aghefLogo} 
                  alt="AGHEF Logo" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-foreground">AGHEF</span>
              </a>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <a href="https://uslaccafrica.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img 
                  src={uslaccLogo} 
                  alt="USLACC Logo" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-foreground">USLACC African Region</span>
              </a>
              <div className="hidden sm:block w-px h-6 bg-border"></div>
              <a href="https://dependifyllc.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img 
                  src={dependifyLogo} 
                  alt="Dependify LLC Logo" 
                  className="w-8 h-8 rounded object-cover"
                />
                <span className="text-sm font-medium text-foreground">Dependify LLC</span>
              </a>
            </div>
            
            {/* Copyright */}
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Organized by AGHEF & USLACC African Region • Powered by Dependify LLC</p>
              <p className="text-sm mt-1">© 2025 All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
