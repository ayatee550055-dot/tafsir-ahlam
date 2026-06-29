import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export default function SEO({ title, description, image, url }: SEOProps) {
  const siteTitle = 'تفسير الأحلام الإسلامي | آية لتفسير الأحلام';
  const fullTitle = title === 'الرئيسية' ? siteTitle : `${title} - ${siteTitle}`;
  const defaultImage = '/og-image.jpg'; // We can add an actual image later

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url || typeof window !== 'undefined' ? window.location.href : ''} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      <link rel="canonical" href={url || typeof window !== 'undefined' ? window.location.href : ''} />
    </Helmet>
  );
}
