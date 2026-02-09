import { useNavigate } from "react-router-dom";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import logo from "@/assets/syntarex-logo-cropped.png";

interface FooterLink {
  label: string;
  href: string;
  onClick?: () => void;
}

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks: {
    product: FooterLink[];
    company: FooterLink[];
    legal: FooterLink[];
  } = {
    product: [
      { label: "How It Works", href: "#how-it-works" },
      // { label: "Mining Packages", href: "#packages" },
      { label: "XFLOW Token", href: "#xflow" },
      { label: "Calculate Returns", href: "#roi" },
    ],
    company: [
      { label: "Benefits", href: "#benefits" },
      { label: "Trust & Security", href: "#trust" },
      { label: "FAQ", href: "#faq" },
      { label: "Get Started", href: "#", onClick: () => navigate("/auth") },
    ],
    legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Compliance", href: "#compliance" },
      // { label: "KYC/AML", href: "#kyc" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/synterax", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/synterax", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/synterax", label: "GitHub" },
    { icon: Mail, href: "mailto:contact@synterax.io", label: "Email" },
  ];

  const scrollToSection = (href: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
      return;
    }
    if (href.startsWith("#") && href !== "#") {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <footer className="relative border-t border-border/40 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2">
            <div 
              className="flex items-center gap-2 mb-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={logo} alt="SynteraX Logo" className="h-10 w-auto" />
            </div>
            <p><strong>THE WINDOW IS OPEN</strong></p>
            <p className="text-muted-foreground mb-6 max-w-sm">
              SynteraX gives you something the public has never had: A fully built mining ecosystem
launching at a $ market cap – the exact early position institutions always kept for themselves. A
rare entry point into fully operational infrastructure.
.
            </p>
            <p className="text-muted-foreground mb-6 max-w-sm">Some people observe history. Builders write it. Which one are you today?</p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors group"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href, link.onClick)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href, link.onClick)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href, link.onClick)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40">
         <p className="text-sm text-muted-foreground text-center md:text-center mb-4">Disclaimer: These scenarios are hypothetical models based on market capitalization
comparisons and business milestones. They do not constitute a guarantee of future value or
price. Cryptocurrency investments are subject to high market risk.</p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} SynteraX. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">
                Built with ❤️ using cutting-edge technology
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)",
        }}
      />
    </footer>
  );
};
