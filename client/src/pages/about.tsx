import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl md:text-4xl font-styreneB font-medium text-primary mb-2">About Us</h1>
        </div>
        
        <div className="space-y-6 font-styreneA text-foreground">
          <p className="text-lg">
            We built EV-India database because we noticed a lack of a hub of EV centric information. Most of the mainstream car browsing websites (yes the ones with Hindi suffixes) are still very much ICE inclined. Not a lot of valuable information can be browsed regarding EVs. And the car makers websites is just a digital brochure which focus on features exclusively.
          </p>
          
          <p className="text-lg">
            Generating a comprehensive and reliable source of information was and will be the goal. We also built a real-world range estimator tool to help buyers get and idea of an anxiety free range (WLTP, MIDC, NEDC hardly reflect actual performance and hence can be confusing and overwhelming for the average buyer, making informed decisions easier).
          </p>
          
          <p className="text-lg">
            Our vision for EV-India doesn't stop here. We are seeking opportunities to conduct real-time vehicle testing. This will not only help us validate and continuously refine the accuracy of our ML models and range estimations but also allow us to document the process and bring even greater transparency to the Indian EV space.
          </p>
          
          <p className="text-lg">
            Ultimately, ev-india.org is driven by our passion to demystify electric vehicles for Indian consumers. We strive to provide clear, accessible, and data-driven insights to empower you in making informed decisions on your EV journey.
          </p>
        </div>
        
        <div className="mt-10 bg-muted p-6 rounded-lg border border-border">
          <h2 className="text-xl font-styreneB font-medium mb-3 text-primary">Disclaimer</h2>
          <p className="text-sm font-tiempos text-muted-foreground">
            The information and range estimates provided on ev-india.org are based on extensive data collection and advanced modelling. However, they are intended for guidance and informational purposes only. Real-world range and performance can vary significantly based on individual driving styles, specific route conditions, weather, vehicle maintenance, battery health, and other factors. Always ensure sufficient charge for your journey and consult the vehicle manufacturer for official specifications.
          </p>
        </div>
      </div>
    </div>
  );
}
