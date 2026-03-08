import React from "react";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl md:text-4xl font-styreneB font-medium text-primary mb-2">Contact Us</h1>
        </div>
        
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border max-w-xl w-full">
            <p className="text-lg font-styreneA text-center mb-6">
              In case of any queries, feedback or other information, kindly contact us at:
            </p>
            
            <div className="flex justify-center">
              <a 
                href="mailto:contact@ev-india.org" 
                className="text-xl font-medium text-primary hover:text-primary/80 font-styreneB transition-colors"
              >
                contact@ev-india.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
