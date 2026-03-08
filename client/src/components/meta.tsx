import { useEffect } from 'react';

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
}

export default function Meta({
  title = "BharatEV | Electric Vehicles in India - Compare, Research & Find the Best EV",
  description = "India's most comprehensive electric vehicle database with real-world range estimates, detailed specifications and comparisons of all EVs in the Indian market.",
  keywords = "EVs, Indian EVs, Electric Vehicles India, EV comparison, EV range estimator, Electric Cars India, EV database",
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonicalUrl,
}: MetaProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords);
      document.head.appendChild(metaKeywords);
    }

    // Update Open Graph title
    let ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', ogTitle || title);
    } else {
      ogTitleTag = document.createElement('meta');
      ogTitleTag.setAttribute('property', 'og:title');
      ogTitleTag.setAttribute('content', ogTitle || title);
      document.head.appendChild(ogTitleTag);
    }

    // Update Open Graph description
    let ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
      ogDescriptionTag.setAttribute('content', ogDescription || description);
    } else {
      ogDescriptionTag = document.createElement('meta');
      ogDescriptionTag.setAttribute('property', 'og:description');
      ogDescriptionTag.setAttribute('content', ogDescription || description);
      document.head.appendChild(ogDescriptionTag);
    }

    // Update Open Graph image
    if (ogImage) {
      let ogImageTag = document.querySelector('meta[property="og:image"]');
      if (ogImageTag) {
        ogImageTag.setAttribute('content', ogImage);
      } else {
        ogImageTag = document.createElement('meta');
        ogImageTag.setAttribute('property', 'og:image');
        ogImageTag.setAttribute('content', ogImage);
        document.head.appendChild(ogImageTag);
      }
    }

    // Update Open Graph URL
    if (ogUrl) {
      let ogUrlTag = document.querySelector('meta[property="og:url"]');
      if (ogUrlTag) {
        ogUrlTag.setAttribute('content', ogUrl);
      } else {
        ogUrlTag = document.createElement('meta');
        ogUrlTag.setAttribute('property', 'og:url');
        ogUrlTag.setAttribute('content', ogUrl);
        document.head.appendChild(ogUrlTag);
      }
    }

    // Update Open Graph type
    let ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (ogTypeTag) {
      ogTypeTag.setAttribute('content', ogType);
    } else {
      ogTypeTag = document.createElement('meta');
      ogTypeTag.setAttribute('property', 'og:type');
      ogTypeTag.setAttribute('content', ogType);
      document.head.appendChild(ogTypeTag);
    }

    // Update Twitter card
    let twitterCardTag = document.querySelector('meta[name="twitter:card"]');
    if (twitterCardTag) {
      twitterCardTag.setAttribute('content', twitterCard);
    } else {
      twitterCardTag = document.createElement('meta');
      twitterCardTag.setAttribute('name', 'twitter:card');
      twitterCardTag.setAttribute('content', twitterCard);
      document.head.appendChild(twitterCardTag);
    }

    // Update Twitter title
    let twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleTag) {
      twitterTitleTag.setAttribute('content', twitterTitle || ogTitle || title);
    } else {
      twitterTitleTag = document.createElement('meta');
      twitterTitleTag.setAttribute('name', 'twitter:title');
      twitterTitleTag.setAttribute('content', twitterTitle || ogTitle || title);
      document.head.appendChild(twitterTitleTag);
    }

    // Update Twitter description
    let twitterDescTag = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescTag) {
      twitterDescTag.setAttribute('content', twitterDescription || ogDescription || description);
    } else {
      twitterDescTag = document.createElement('meta');
      twitterDescTag.setAttribute('name', 'twitter:description');
      twitterDescTag.setAttribute('content', twitterDescription || ogDescription || description);
      document.head.appendChild(twitterDescTag);
    }

    // Update Twitter image
    if (twitterImage || ogImage) {
      let twitterImageTag = document.querySelector('meta[name="twitter:image"]');
      if (twitterImageTag) {
        twitterImageTag.setAttribute('content', twitterImage || ogImage || '');
      } else {
        twitterImageTag = document.createElement('meta');
        twitterImageTag.setAttribute('name', 'twitter:image');
        twitterImageTag.setAttribute('content', twitterImage || ogImage || '');
        document.head.appendChild(twitterImageTag);
      }
    }

    // Update canonical URL
    if (canonicalUrl) {
      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute('href', canonicalUrl);
      } else {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        canonicalTag.setAttribute('href', canonicalUrl);
        document.head.appendChild(canonicalTag);
      }
    }

    // Clean up function
    return () => {
      // We don't need to remove the tags since they will be updated by the next Meta component
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType, 
      twitterCard, twitterTitle, twitterDescription, twitterImage, canonicalUrl]);

  // This component doesn't render anything
  return null;
}