/**
 * AnimatedWaves Component
 * 
 * Subtle 3D wave animation for hero section background
 * CSS radial gradients with breathing animation (19s, 14s, 10s cycles)
 * 
 * Design: Teal primary color, very subtle (12% opacity)
 * Performance: GPU-accelerated, respects reduced-motion
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

export function AnimatedWaves() {
  return (
    <div className="hero-waves" aria-hidden="true">
      <div className="hero-waves__layer hero-waves__layer--1" />
      <div className="hero-waves__layer hero-waves__layer--2" />
      <div className="hero-waves__layer hero-waves__layer--3" />
    </div>
  );
}
