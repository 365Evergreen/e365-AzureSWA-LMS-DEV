import AppNav from '../../components/AppNav';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main} />
    </div>
  );
}
