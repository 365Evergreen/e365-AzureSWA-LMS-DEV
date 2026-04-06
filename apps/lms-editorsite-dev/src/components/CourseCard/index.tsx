import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@lms/shared-ui';
import type { Course } from '../../data/courses';
import StatusBadge from '../StatusBadge';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{course.title}</h2>
        <StatusBadge status={course.status} />
      </div>
      <p className={styles.meta}>Last edited: {course.lastEdited}</p>
      <div className={styles.footer}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/editor/${course.id}`)}
        >
          Open
        </Button>
      </div>
    </Card>
  );
}
