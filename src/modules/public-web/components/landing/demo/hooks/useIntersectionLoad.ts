/**
 * useIntersectionLoad Hook
 * 
 * Lazy loading trigger using Intersection Observer API.
 * Loads demo when mockup enters viewport.
 * 
 * Performance: Saves bandwidth, improves Lighthouse score.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { useState, useEffect, useRef } from 'react';

export function useIntersectionLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Load once
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, isVisible };
}
