'use client';
import { useEffect, useState } from 'react';
import { UserProfile, BookSummary } from '@/lib/types';
import { getCurrentUser, seedIfNeeded } from '@/lib/storage';
import LoginPage from './auth/LoginPage';
import StudentLibrary from './student/StudentLibrary';
import TeacherDashboard from './teacher/TeacherDashboard';

interface Props {
  books: BookSummary[];
}

export default function AppRoot({ books }: Props) {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    seedIfNeeded();
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => setUser(null);

  // Hydrating — render nothing to avoid flash.
  if (user === undefined) return null;

  if (!user) return <LoginPage onLogin={setUser} />;
  if (user.role === 'teacher') return <TeacherDashboard teacher={user} books={books} onLogout={handleLogout} />;
  return <StudentLibrary student={user} books={books} onLogout={handleLogout} />;
}
