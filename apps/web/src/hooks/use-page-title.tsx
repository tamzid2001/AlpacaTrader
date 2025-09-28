import { useEffect } from 'react';

interface PageTitleOptions {
  title: string;
  description?: string;
}

export function usePageTitle({ title, description }: PageTitleOptions) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | PropFarming Pro`;
    
    // Update meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }
  }, [title, description]);
}

export default usePageTitle;