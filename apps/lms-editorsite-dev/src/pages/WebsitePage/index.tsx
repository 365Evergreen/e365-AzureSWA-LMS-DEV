import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import styles from './WebsitePage.module.css';

export default function WebsitePage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Website</h1>
          <Button onClick={() => navigate('/website/new')}>+ New Page</Button>
        </div>
      </main>
    </div>
  );
}
