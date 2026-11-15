import styled from 'styled-components';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';

const FormErrorCard = styled(ErrorCard)<{ $height: number }>`
  min-height: ${({ $height }) => $height}px;
`;

const sectionHeights = { source: [182, 598, 200], service: [292, 200, 328] };

export function DemoCreateFormState({ step, onRetry }: {
  step: keyof typeof sectionHeights;
  onRetry?: () => void;
}) {
  return sectionHeights[step].map(height => onRetry
    ? <FormErrorCard key={height} $height={height} onRetry={onRetry} />
    : <LoadingCard key={height} width="100%" height={height} />);
}
