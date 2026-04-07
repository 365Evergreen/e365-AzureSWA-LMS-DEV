import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import styles from './BlogPostsPage.module.css';

export default function BlogPostsPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Blog Posts</h1>
          <Button onClick={() => navigate('/blog-posts/new')}>+ New Post</Button>
        </div>
      </main>
    </div>
  );
}
