import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import styles from './CoursesPage.module.css';

export default function CoursesPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Courses</h1>
          <Button onClick={() => navigate('/courses/new')}>+ New Course</Button>
        </div>
      </main>
    </div>
  );
}
