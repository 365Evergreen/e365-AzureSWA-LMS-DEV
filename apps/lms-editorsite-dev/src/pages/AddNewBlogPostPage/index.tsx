import ContentEditor from '../../components/ContentEditor';

export default function AddNewBlogPostPage() {
  return <ContentEditor contentType="post" defaultTemplateId="post" returnPath="/blog-posts" />;
}
