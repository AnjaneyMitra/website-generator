import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import { User } from 'firebase/auth';

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [userDetails, setUserDetails] = useState<User | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserDetails(currentUser);
    }
  }, [currentUser]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
              <div className="mt-5">
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="px-4 py-5 bg-gray-50 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userDetails?.email}</dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500">Account created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userDetails?.metadata.creationTime ? new Date(userDetails.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
