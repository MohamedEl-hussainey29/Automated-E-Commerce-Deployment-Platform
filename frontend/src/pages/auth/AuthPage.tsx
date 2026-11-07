import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type AuthMode = 'login' | 'register' | 'admin-login' | 'reset-password' | 'guest';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  // Login / Admin Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+2010');
  const [gender, setGender] = useState<0 | 1>(1);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Guest state
  const [guestName, setGuestName] = useState('');

  // Forgot Password / OTP state
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'admin-login' || email.trim().toLowerCase() === 'admin@floweapp.com') {
        const res = await api.adminLogin(email, password);
        if (res.data) {
          setSession(
            {
              id: res.data.user.id,
              email: res.data.user.email,
              firstName: res.data.user.firstName,
              lastName: res.data.user.lastName,
              name: `${res.data.user.firstName} ${res.data.user.lastName}`.trim(),
              roles: res.data.user.roles,
            },
            res.data.accessToken,
            res.data.refreshToken
          );
          toast('Admin Authenticated!', 'Signed in to Flowery Admin Studio');
          navigate('/admin');
        }
      } else {
        const res = await api.login(email, password);
        if (res.data) {
          setSession(res.data.user, res.data.token, res.data.refreshToken);
          toast('Welcome back!', `Signed in as ${res.data.user.name || res.data.user.email}`);
          const roles = (res.data.user.roles || []).map((r) => r.toUpperCase());
          if (roles.includes('ADMIN')) navigate('/admin');
          else if (roles.includes('DRIVER')) navigate('/driver');
          else navigate('/');
        }
      }
    } catch (err: any) {
      toast('Authentication Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.registerCustomer({
        firstName,
        lastName,
        email,
        phone,
        gender,
        password,
        confirmPassword,
      });
      if (res.data) {
        setSession(res.data.user, res.data.token);
        toast('Account Created!', 'Welcome to Flowery');
        navigate('/');
      }
    } catch (err: any) {
      toast('Registration Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const nameToUse = guestName.trim() || 'Flowery Guest';
      const res = await api.createGuest(nameToUse);
      const guestVal = res.data?.value || res.data;
      toast(
        'Continuing as Guest',
        `Welcome ${guestVal?.userName || nameToUse}`
      );
      navigate('/');
    } catch (err: any) {
      // Even if backend guest endpoint fails or requires no auth, allow browsing storefront
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (resetStep === 1) {
        await api.forgetPassword(email);
        toast('Verification Code Sent', 'Please enter the 6-digit code sent to your email');
        setResetStep(2);
      } else if (resetStep === 2) {
        const res = await api.verifyOtp(email, otpCode);
        if (res.data?.otpToken) {
          setOtpToken(res.data.otpToken);
        }
        toast('Code Verified!', 'Now enter your new password');
        setResetStep(3);
      } else {
        await api.resetPassword(otpToken, newPass, confirmNewPass);
        toast('Password Reset Complete!', 'You can now login with your new password');
        setMode('login');
        setResetStep(1);
      }
    } catch (err: any) {
      toast('Reset Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F9F9F9] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-6">
        {/* Top Navigation Header matching Figma node 73:4984 / 74:6504 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mode !== 'login') {
                  setMode('login');
                  setResetStep(1);
                } else {
                  navigate('/');
                }
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0] transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[20px] font-medium text-[#0C1015]">
              {mode === 'login' && 'Login'}
              {mode === 'admin-login' && 'Admin Login'}
              {mode === 'register' && 'Sign up'}
              {mode === 'reset-password' &&
                (resetStep === 1
                  ? 'Password'
                  : resetStep === 2
                  ? 'Email verification'
                  : 'Reset password')}
              {mode === 'guest' && 'Continue as guest'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <img src="/figma/logo-flower.svg" alt="Flowery" className="w-5 h-5" />
            <span className="font-flowery text-[20px] text-[#D21E6A] leading-none">Flowery</span>
          </div>
        </div>

        {/* LOGIN & ADMIN LOGIN (Figma node 73:4983) */}
        {(mode === 'login' || mode === 'admin-login') && (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Floating-Label Outlined Input */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
              />
            </div>

            {/* Password Floating-Label Outlined Input */}
            <div className="space-y-3">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              {/* Remember me & Forget password? matching Figma node 74:6465 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-[18px] h-[18px] rounded-[2px] border-[#535353] accent-[#D21E6A]"
                  />
                  <span className="text-[13px] text-[#0C1015]">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('reset-password');
                    setResetStep(1);
                  }}
                  className="text-[12px] text-[#0C1015] underline hover:text-[#D21E6A]"
                >
                  Forget password?
                </button>
              </div>
            </div>

            {/* Primary Pink Login Button + Outlined Continue as Guest matching Figma node 74:6485 */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
              >
                {loading ? 'Signing in...' : mode === 'admin-login' ? 'Admin Login' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => handleCreateGuest()}
                disabled={loading}
                className="w-full h-[48px] rounded-[100px] border border-[#535353] bg-transparent hover:bg-[#F9ECF0]/50 text-[#535353] text-[16px] font-medium transition-colors"
              >
                Continue as guest
              </button>
            </div>

            {/* Don't have an account? Sign up matching Figma node 73:5000 */}
            <div className="text-center pt-1">
              <p className="text-[16px] text-[#0C1015]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#D21E6A] font-medium underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        )}

        {/* SIGN UP (Figma node 74:6503) */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* 2-col First name & Last name matching Figma node 74:6678 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="w-full h-[56px] px-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="w-full h-[56px] px-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
              />
            </div>

            {/* 2-col Password & Confirm password matching Figma node 74:6682 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-[56px] px-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full h-[56px] px-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>
            </div>

            {/* Phone number */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Phone number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] placeholder:text-[#A6A6A6] focus:outline-none focus:border-[#D21E6A]"
              />
            </div>

            {/* Gender radio buttons matching Figma node 74:6768 */}
            <div className="flex items-center gap-8 pt-1">
              <span className="text-[18px] font-medium text-[#535353]">Gender</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reg-gender"
                    checked={gender === 1}
                    onChange={() => setGender(1)}
                    className="accent-[#D21E6A] w-4 h-4"
                  />
                  <span className="text-[16px] text-[#0C1015]">Female</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reg-gender"
                    checked={gender === 0}
                    onChange={() => setGender(0)}
                    className="accent-[#D21E6A] w-4 h-4"
                  />
                  <span className="text-[16px] text-[#0C1015]">Male</span>
                </label>
              </div>
            </div>

            {/* Terms & Conditions text matching Figma node 74:6688 */}
            <p className="text-[12px] text-[#0C1015] text-center">
              Creating an account, you agree to our{' '}
              <span className="font-semibold underline">Terms &amp; Conditions</span>
            </p>

            {/* Sign up button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>

            <p className="text-[16px] text-[#0C1015] text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#D21E6A] font-medium underline"
              >
                Login
              </button>
            </p>
          </form>
        )}

        {/* FORGET PASSWORD / OTP VERIFICATION / RESET PASSWORD (Figma nodes 74:6982, 74:7065, 76:7947) */}
        {mode === 'reset-password' && (
          <form onSubmit={handleResetFlow} className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-[18px] font-medium text-[#0C1015]">
                {resetStep === 1 && 'Forget password'}
                {resetStep === 2 && 'Email verification'}
                {resetStep === 3 && 'Reset password'}
              </h2>
              <p className="text-[14px] text-[#535353]">
                {resetStep === 1 &&
                  'Please enter your email associated to your account'}
                {resetStep === 2 &&
                  'Please enter your code that send to your email address'}
                {resetStep === 3 &&
                  'Password must not be empty and must contain 6 characters with upper case letter and one number at least'}
              </p>
            </div>

            {resetStep === 1 && (
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>
            )}

            {resetStep === 2 && (
              <div className="space-y-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Verification code
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full h-[56px] px-4 rounded-[10px] border border-[#535353] bg-[#DFE3E8]/40 text-center text-[18px] tracking-[0.35em] font-semibold text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
                <p className="text-center text-[14px] text-[#0C1015]">
                  Didn&apos;t receive code?{' '}
                  <button
                    type="button"
                    onClick={() => api.forgetPassword(email)}
                    className="text-[#D21E6A] underline font-medium"
                  >
                    Resend
                  </button>
                </p>
              </div>
            )}

            {resetStep === 3 && (
              <div className="space-y-5">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </form>
        )}

        {/* GUEST MODE */}
        {mode === 'guest' && (
          <form onSubmit={handleCreateGuest} className="space-y-5">
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Your name
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              {loading ? 'Starting...' : 'Continue as guest'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
