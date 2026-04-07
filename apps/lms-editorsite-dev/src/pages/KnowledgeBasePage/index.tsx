import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import styles from './KnowledgeBasePage.module.css';

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Knowledge Base</h1>
          <Button onClick={() => navigate('/knowledge-base/new')}>+ New Article</Button>
        </div>
      </main>
    </div>
  );
}
