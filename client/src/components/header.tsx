import { useState } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl text-primary font-styreneB">
                EV-India
              </Link>
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-6">
            <Link href="/" className="text-primary hover:text-accent px-3 py-2 rounded-md text-sm font-medium font-styreneB transition-colors">
              Home
            </Link>
            <Link href="/estimator" className="text-secondary hover:text-accent px-3 py-2 rounded-md text-sm font-medium font-styreneB transition-colors">
              Range Estimator
            </Link>
            <Link href="/compare" className="text-secondary hover:text-accent px-3 py-2 rounded-md text-sm font-medium font-styreneB transition-colors">
              Compare
            </Link>
            <Link href="/about" className="text-secondary hover:text-accent px-3 py-2 rounded-md text-sm font-medium font-styreneB transition-colors">
              About
            </Link>
            <Link href="/contact">
              <Button variant="default" size="sm" className="ml-4 bg-black hover:bg-black/90 text-white">
                Contact
              </Button>
            </Link>
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open main menu"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border/40">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className="text-primary hover:text-accent block px-3 py-2 rounded-md text-base font-medium font-styreneB transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/estimator" 
              className="text-secondary hover:text-accent block px-3 py-2 rounded-md text-base font-medium font-styreneB transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Range Estimator
            </Link>
            <Link 
              href="/compare" 
              className="text-secondary hover:text-accent block px-3 py-2 rounded-md text-base font-medium font-styreneB transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Compare
            </Link>
            <Link 
              href="/about" 
              className="text-secondary hover:text-accent block px-3 py-2 rounded-md text-base font-medium font-styreneB transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-2 pb-3">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full bg-black hover:bg-black/90 text-white">
                  Contact
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
