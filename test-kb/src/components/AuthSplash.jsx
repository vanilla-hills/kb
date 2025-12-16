import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthSplash() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setLoading(true);
    setMessage(null);
    // Ensure the magic link redirects back to the current origin (production or preview)
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({ email }, { redirectTo });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Magic link sent — check your email. The link will return you to this site.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <label className="block mb-2">Email</label>
        <input
          className="w-full p-2 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@your.org"
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded mb-3"
          onClick={sendMagicLink}
          disabled={loading || !email}
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}
