import { LoadingContainer, LoadingContent } from '@/components/ui/loading';

export default function LoadingPage() {
  return (
    <div className="p-4 text-center">
      <LoadingContainer>
        <LoadingContent />
      </LoadingContainer>
    </div>
  );
}
