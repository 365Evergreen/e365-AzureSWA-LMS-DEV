import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import CourseCard from '../../components/CourseCard';
import { courses } from '../../data/courses';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Courses</h1>
          <Button onClick={() => navigate('/editor/new')}>+ New Course</Button>
        </div>
        <div className={styles.grid}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </main>
    </div>
  );
}
