/**
 * Stylelint Configuration
 * 
 * Ensures CSS code quality and enforces design token usage.
 * Prevents hardcoded rgba() values outside of design-tokens/colors.css
 * 
 * @package DechBar_App
 * @since 0.2.1
 */

export default {
  extends: 'stylelint-config-standard',
  
  rules: {
    // Enforce design tokens - NO hardcoded rgba() values
    'function-disallowed-list': [
      ['rgba'],
      {
        message: '❌ Use CSS tokens from design-tokens/colors.css instead of hardcoded rgba().\n' +
                 'Example: Use var(--glow-primary-shadow-subtle) instead of rgba(44, 190, 198, 0.15)'
      }
    ],
    
    // Allow Tailwind @directives
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'config']
      }
    ],
    
    // Allow CSS custom properties (design tokens)
    'custom-property-pattern': null,
    
    // BEM naming convention for classes (relaxed for global utility classes)
    'selector-class-pattern': null,  // Relaxed for now (Tailwind classes)
    
    // No !important (except in specific files)
    'declaration-no-important': null,  // Disabled for now (too many legacy !important)
    
    // Allow duplicate selectors in global reset files
    'no-duplicate-selectors': null,
  },
  
  // Exceptions for specific files
  overrides: [
    {
      // Allow rgba() ONLY in colors.css (where tokens are defined)
      files: ['**/design-tokens/colors.css'],
      rules: {
        'function-disallowed-list': null,
      }
    },
    {
      // Globals.css - Allow Tailwind and global resets
      files: ['**/globals.css'],
      rules: {
        'at-rule-no-unknown': null,
        'no-duplicate-selectors': null,
        'declaration-no-important': null,
      }
    },
    {
      // Session Engine components - Enforce strict rules
      files: ['**/session-engine/**/*.css'],
      rules: {
        'function-disallowed-list': [
          ['rgba'],
          {
            message: '❌ Session Engine: Use CSS tokens from colors.css'
          }
        ],
      }
    }
  ]
};
