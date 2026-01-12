/**
 * ResetPasswordPage
 * 
 * Page for setting new password after reset link click
 * User is redirected here from email link
 * 
 * @package DechBar_App
 * @subpackage Pages/Auth
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';
import { Button, Input } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

type PasswordStrength = 'weak' | 'medium' | 'strong';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  // Password strength calculation
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('weak');
      return;
    }

    let strength: PasswordStrength = 'weak';
    
    if (newPassword.length >= 8) {
      strength = 'medium';
      
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (hasNumber && hasSpecial) {
        strength = 'strong';
      }
    }
    
    setPasswordStrength(strength);
  }, [newPassword]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setFormError(MESSAGES.error.requiredFields);
      return;
    }

    if (newPassword.length < 6) {
      setFormError(MESSAGES.error.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(MESSAGES.error.passwordMismatch);
      return;
    }

    try {
      setIsLoading(true);
      
      // Update password (Supabase automatically validates token from URL)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Success
      setIsSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Password update error:', err);
      
      const errorMessage = err.message || MESSAGES.error.passwordUpdateFailed;
      
      if (errorMessage.includes('New password should be different')) {
        setFormError('Nové heslo musí být jiné než staré');
      } else if (errorMessage.includes('Password should be at least')) {
        setFormError(MESSAGES.error.passwordTooShort);
      } else if (errorMessage.includes('Invalid or expired')) {
        setFormError('Odkaz vypršel. Požádej o nový odkaz pro obnovení hesla.');
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
        <div className="modal-card max-w-md w-full">
          <div className="auth-view">
            <div className="modal-header">
              <h2 className="modal-title text-green-600 mb-4">
                {MESSAGES.auth.passwordResetSuccessTitle}
              </h2>
              <p className="modal-subtitle">
                Přesměrováváme tě na dashboard...
              </p>
            </div>

            <ErrorMessage 
              variant="success"
              message={MESSAGES.success.passwordResetSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
      <div className="modal-card max-w-md w-full">
        <div className="auth-view">
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">
              {MESSAGES.auth.resetPasswordTitle}
            </h2>
            <p className="modal-subtitle">
              {MESSAGES.auth.resetPasswordSubtitle}
            </p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            
            {/* New Password */}
            <div>
              <Input
                type="password"
                label={MESSAGES.form.password}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={MESSAGES.form.placeholders.password}
                required
                disabled={isLoading}
                helperText={MESSAGES.hints.passwordStrength}
              />
              
              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className={`password-strength-fill ${passwordStrength}`}
                      style={{
                        width: passwordStrength === 'weak' ? '33%' : 
                               passwordStrength === 'medium' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <span className={`password-strength-text ${passwordStrength}`}>
                    {passwordStrength === 'weak' ? 'Slabé heslo' :
                     passwordStrength === 'medium' ? 'Střední heslo' : 'Silné heslo'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              type="password"
              label={MESSAGES.form.passwordConfirm}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={MESSAGES.form.placeholders.passwordConfirm}
              required
              disabled={isLoading}
            />

            {/* Error Message */}
            {formError && (
              <ErrorMessage message={formError} />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? MESSAGES.buttons.loading.saving : MESSAGES.buttons.setPassword}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
