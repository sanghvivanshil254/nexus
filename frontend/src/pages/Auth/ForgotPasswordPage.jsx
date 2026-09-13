import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../components/Toast';

export const ForgotPasswordPage = ({ setCurrentView, onPasswordResetSuccess }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('alex.morgan@nexusocr.ai');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const otpInputs = useRef([]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Request OTP
  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your registered email address', 'warning');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setStep(2);
      setTimer(60);
      addToast(`6-digit verification code sent to ${email}`, 'info');
    }, 700);
  };

  // OTP change handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleAutofillOtp = () => {
    const demoCode = ['7', '8', '4', '9', '2', '0'];
    setOtp(demoCode);
    addToast('Demo OTP Code [784920] auto-filled', 'success');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      addToast('Please enter all 6 digits of the OTP code', 'warning');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setStep(3);
      addToast('Code verified! Please choose your new password.', 'success');
    }, 600);
  };

  // Step 3: Save New Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      addToast('Please fill in both password fields', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters long', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setStep(4);
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
      addToast('Password successfully updated!', 'success');
    }, 800);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-animate" style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.5)',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden'
      }}>
        {/* Step indicator bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#e2e8f0'
        }}>
          <div style={{
            height: '100%',
            width: step === 1 ? '33%' : step === 2 ? '66%' : '100%',
            background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* Back navigation */}
        {step < 4 && (
          <button
            onClick={() => step === 1 ? setCurrentView('login') : setStep(step - 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1.5rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} />
            <span>{step === 1 ? 'Back to Login' : 'Previous Step'}</span>
          </button>
        )}

        {/* ================= STEP 1: Enter Email ================= */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <KeyRound size={26} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Forgot Password?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                No problem. Enter your registered email address to receive a secure 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Work Email Address</label>
                <div className="input-wrapper">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="form-input input-with-icon"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="btn btn-primary btn-block btn-lg"
                style={{ fontWeight: 700, marginTop: '1.5rem' }}
              >
                {isSending ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 2: Enter OTP ================= */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <ShieldAlert size={26} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Enter 6-Digit Code
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                We sent a security code to <strong style={{ color: '#0f172a' }}>{email}</strong>
              </p>
            </div>

            {/* Quick Demo Autofill */}
            <button
              type="button"
              onClick={handleAutofillOtp}
              className="btn btn-secondary btn-block"
              style={{
                marginBottom: '1.5rem',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                color: '#2563eb',
                fontSize: '0.85rem'
              }}
            >
              <Sparkles size={15} />
              <span>Autofill Demo Code (784920)</span>
            </button>

            <form onSubmit={handleVerifyOtp}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '1.5rem'
              }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '46px',
                      height: '52px',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>
                  Resend code in: <strong style={{ color: timer > 0 ? '#2563eb' : '#ef4444' }}>{timer}s</strong>
                </span>
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={() => {
                    setTimer(60);
                    addToast('New verification code sent', 'info');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: timer === 0 ? '#2563eb' : '#94a3b8',
                    cursor: timer === 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Resend Code</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="btn btn-primary btn-block btn-lg"
                style={{ fontWeight: 700 }}
              >
                {isSending ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 3: Set New Password ================= */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Lock size={26} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Create New Password
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Please choose a strong password for your OCR pipeline account.
              </p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pwd">New Password</label>
                <div className="input-wrapper">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="new-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="form-input input-with-icon"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-new-pwd">Confirm New Password</label>
                <div className="input-wrapper">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="confirm-new-pwd"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="form-input input-with-icon"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="btn btn-primary btn-block btn-lg"
                style={{ fontWeight: 700, marginTop: '1.5rem' }}
              >
                {isSending ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Update Password & Complete</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 4: Success Screen ================= */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '2px solid #10b981',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Your password has been successfully updated. You can now sign in to your NexusOCR workspace.
            </p>

            <button
              type="button"
              onClick={() => {
                if (onPasswordResetSuccess) {
                  onPasswordResetSuccess({ email, name: email.split('@')[0] });
                } else {
                  setCurrentView('login');
                }
              }}
              className="btn btn-primary btn-block btn-lg"
              style={{ fontWeight: 700 }}
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
