import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import styles from './AuthCallbackPage.module.css';

export default function AuthCallbackPage() {
  const { user, isLoading } = useAuth(msalInstance);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/welcome', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  return (
    <div className={styles.page}>
      <LoadingSpinner />
    </div>
  );
}
