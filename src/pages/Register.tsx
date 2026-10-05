import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // STEP 1 - ACCOUNT
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // STEP 2 - FARM
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmPhone, setFarmPhone] = useState('');
  const [farmDescription, setFarmDescription] = useState('');

  // STEP 3 - SUBMIT & STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!farmName.trim()) {
      setErrorMessage('Farm name is required.');
      return;
    }
    if (!farmLocation.trim()) {
      setErrorMessage('Farm location is required.');
      return;
    }

    setStep(3);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        farmName: farmName.trim(),
        farmLocation: farmLocation.trim(),
        farmPhone: farmPhone.trim() || undefined,
        farmDescription: farmDescription.trim() || undefined,
      });
      // AuthContext will automatically update user state, redirecting to Owner dashboard
    } catch (err: any) {
      setErrorMessage(err.message || 'Account creation failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
          DP
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-stone-900 tracking-tight">
          DAIRYPULSE
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Create your farm owner account & register your dairy farm
        </p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 1 ? 'bg-[#1b4332] text-white' : 'bg-stone-200 text-stone-700'
            }`}
          >
            1. Account
          </span>
          <span className="text-stone-300">──</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 2 ? 'bg-[#1b4332] text-white' : 'bg-stone-200 text-stone-700'
            }`}
          >
            2. Farm
          </span>
          <span className="text-stone-300">──</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 3 ? 'bg-[#1b4332] text-white' : 'bg-stone-200 text-stone-700'
            }`}
          >
            3. Finish
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-stone-200 rounded-xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-red-900 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: ACCOUNT */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="border-b border-stone-100 pb-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                  Step 1: Your Account
                </h2>
                <p className="text-xs text-stone-500">
                  As the creator, you will become the Farm Owner.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Namaganda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. grace@farm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  placeholder="+256 700 000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-lg bg-[#1b4332] text-white font-bold text-sm hover:bg-[#2d6a4f] active:bg-[#143225] transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 mt-4"
              >
                <span>Continue to Farm Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: FARM */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-4">
              <div className="border-b border-stone-100 pb-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                  Step 2: Farm Details
                </h2>
                <p className="text-xs text-stone-500">
                  Enter your farm's location and identification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Farm Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Dairy Farm"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Location / District
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mbarara, Western Region"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Farm Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="+256 700 000000"
                  value={farmPhone}
                  onChange={(e) => setFarmPhone(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Holstein Friesian herd in Western Uganda"
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                  className="w-full p-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-11 rounded-lg border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-11 rounded-lg bg-[#1b4332] text-white font-bold text-xs hover:bg-[#2d6a4f] flex items-center justify-center space-x-1"
                >
                  <span>Review & Finish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: FINISH */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                  Step 3: Confirm & Finish
                </h2>
                <p className="text-xs text-stone-500">
                  Verify the information before saving to Google Sheets.
                </p>
              </div>

              <div className="bg-stone-50 rounded-lg p-4 space-y-3 text-xs text-stone-700 border border-stone-200">
                <div>
                  <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                    Owner Details:
                  </span>
                  <p className="font-medium text-stone-800">{name}</p>
                  <p className="text-stone-500">{email} {phone ? `• ${phone}` : ''}</p>
                </div>

                <div className="border-t border-stone-200 pt-2">
                  <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                    Farm Details:
                  </span>
                  <p className="font-medium text-stone-800">{farmName}</p>
                  <p className="text-stone-500">{farmLocation} {farmPhone ? `• ${farmPhone}` : ''}</p>
                  {farmDescription && <p className="text-stone-500 italic mt-0.5">"{farmDescription}"</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="w-1/3 h-12 rounded-lg border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  className="w-2/3 h-12 rounded-lg bg-[#1b4332] text-white font-bold text-sm hover:bg-[#2d6a4f] active:bg-[#143225] transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Saving to Google Sheets...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-[#1b4332] hover:underline underline-offset-2 ml-1"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
