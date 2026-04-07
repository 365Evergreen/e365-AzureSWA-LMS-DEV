import AppNav from '../../components/AppNav';
import styles from './AddNewCoursePage.module.css';

export default function AddNewCoursePage() {
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main} />
    </div>
  );
}
