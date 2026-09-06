'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Users } from 'lucide-react';
import api from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);

      if (user.role === 'TEAM_MEMBER') {
        router.push('/dashboard');
      } else {
        router.push('/manager/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
          WR
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Weekly Report & Team Dashboard
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to your account to manage weekly reports and reviews
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardContent className="p-8">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Test Accounts */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                Quick-Fill Demo Test Accounts
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickFill('admin@example.com', 'admin123')}
                  className="p-2 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-purple-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Admin</span>
                  </div>
                  <div className="text-[10px] text-purple-700 mt-0.5">admin@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickFill('manager@example.com', 'manager123')}
                  className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Manager</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 mt-0.5">manager@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickFill('alice@example.com', 'password123')}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>Member</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">alice@example.com</div>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Need an account?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
