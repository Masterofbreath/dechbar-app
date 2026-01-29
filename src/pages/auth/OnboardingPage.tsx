/**
 * OnboardingPage Component
 * 
 * Onboarding po kliknutí na magic link z výzvy
 * Route: /onboarding
 * 
 * Flow:
 * 1. User klikne na magic link v emailu
 * 2. Supabase auth redirect sem
 * 3. Zobrazíme onboarding form (jméno, motivace, heslo)
 * 4. Uložíme do DB + aktivujeme challenge modul
 * 5. Redirect na /dekujeme-za-registraci
 * 
 * @package DechBar_App
 * @subpackage Pages/Auth
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeOnboarding } from '@/hooks/useChallenge';
import '@/styles/pages/onboarding.css';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, loading, error, metadata } = useChallengeOnboarding();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    motivations: [] as string[],
    password: '',
    passwordConfirm: ''
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  
  // Available motivations
  const motivationOptions = [
    { id: 'health', label: 'Zlepšit zdraví' },
    { id: 'stress', label: 'Zvládat stres' },
    { id: 'sleep', label: 'Lépe spát' },
    { id: 'energy', label: 'Mít víc energie' },
    { id: 'performance', label: 'Zvýšit výkon' },
    { id: 'mindfulness', label: 'Zklidnit mysl' }
  ];
  
  // Check if user came from magic link
  useEffect(() => {
    if (!metadata || !metadata.kpValue) {
      // No metadata = not from magic link
      navigate('/vyzva');
    }
  }, [metadata, navigate]);
  
  // Handle motivation toggle
  const toggleMotivation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      motivations: prev.motivations.includes(id)
        ? prev.motivations.filter(m => m !== id)
        : [...prev.motivations, id]
    }));
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation
    if (!formData.name.trim()) {
      setFormError('Zadej své jméno');
      return;
    }
    
    if (formData.motivations.length === 0) {
      setFormError('Vyber alespoň jednu motivaci');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Heslo musí mít alespoň 6 znaků');
      return;
    }
    
    if (formData.password !== formData.passwordConfirm) {
      setFormError('Hesla se neshodují');
      return;
    }
    
    // Submit
    const result = await completeOnboarding({
      name: formData.name,
      motivations: formData.motivations,
      password: formData.password
    });
    
    if (result.success) {
      navigate('/dekujeme-za-registraci');
    } else {
      setFormError(result.error || 'Něco se pokazilo. Zkus to znovu.');
    }
  };
  
  if (!metadata) {
    return null; // Redirecting...
  }
  
  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Header */}
        <div className="onboarding-header">
          <h1 className="onboarding-header__title">
            Vítej ve výzvě! 🎉
          </h1>
          <p className="onboarding-header__subtitle">
            Tvoje kontrolní pauza: <strong>{metadata.kpValue}s</strong>
          </p>
        </div>
        
        {/* Form */}
        <form className="onboarding-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="onboarding-form__field">
            <label htmlFor="name" className="onboarding-form__label">
              Jak ti máme říkat?
            </label>
            <input
              id="name"
              type="text"
              className="onboarding-form__input"
              placeholder="Tvoje jméno"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              autoFocus
            />
          </div>
          
          {/* Motivations */}
          <div className="onboarding-form__field">
            <label className="onboarding-form__label">
              Co tě motivuje? (vyber 1-3)
            </label>
            <div className="onboarding-motivations">
              {motivationOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`onboarding-motivation ${
                    formData.motivations.includes(option.id) ? 'onboarding-motivation--selected' : ''
                  }`}
                  onClick={() => toggleMotivation(option.id)}
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Password */}
          <div className="onboarding-form__field">
            <label htmlFor="password" className="onboarding-form__label">
              Vytvoř si heslo
            </label>
            <input
              id="password"
              type="password"
              className="onboarding-form__input"
              placeholder="Alespoň 6 znaků"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
            />
          </div>
          
          {/* Password Confirm */}
          <div className="onboarding-form__field">
            <label htmlFor="passwordConfirm" className="onboarding-form__label">
              Potvď heslo
            </label>
            <input
              id="passwordConfirm"
              type="password"
              className="onboarding-form__input"
              placeholder="Znovu heslo"
              value={formData.passwordConfirm}
              onChange={(e) => setFormData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
              disabled={loading}
            />
          </div>
          
          {/* Error */}
          {(formError || error) && (
            <div className="onboarding-form__error">
              {formError || error}
            </div>
          )}
          
          {/* Submit */}
          <button
            type="submit"
            className="onboarding-form__submit"
            disabled={loading}
          >
            {loading ? 'Ukládám...' : 'Dokončit registraci'}
          </button>
        </form>
        
        {/* Info */}
        <div className="onboarding-info">
          <p className="onboarding-info__text">
            Aplikace se otevře <strong>26. února 2026</strong>.<br />
            Výzva startuje <strong>1. března 2026</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
