import ContentEditor from '../../components/ContentEditor';

export default function AddNewKnowledgePage() {
  return <ContentEditor contentType="knowledge" defaultTemplateId="post" returnPath="/knowledge-base" />;
}
