import CampaignEditor from '@/components/campaign/campaign-editor';

export default async function EditCampaignPage({ params }) {
  const { id } = await params;
  return <CampaignEditor campaignId={decodeURIComponent(id)} />;
}
