import styled, { keyframes } from 'styled-components';

const travel = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(168px); }
`;

// keyframes 안에서는 테마 함수가 풀리지 않으므로 CSS 변수로 색을 넘긴다.
const pulse = keyframes`
  0%, 100% { background-color: var(--loading-card-base); }
  50% { background-color: var(--loading-card-peak); }
`;

const Track = styled.span`
  position: relative;
  display: inline-block;
  width: 120px;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.overlayHover};
`;

const Bar = styled.span`
  position: absolute;
  top: 0;
  left: -48px;
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.primary};
  animation: ${travel} 1.2s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    left: 36px;
  }
`;

const LoadingCardSurface = styled.div<{ $width?: number | string; $height?: number | string }>`
  display: grid;
  width: ${({ $width }) => typeof $width === 'number' ? `${$width}px` : $width ?? '100%'};
  height: ${({ $height }) => typeof $height === 'number' ? `${$height}px` : $height ?? '174px'};
  place-items: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  --loading-card-base: ${({ theme }) => theme.colors.surface};
  --loading-card-peak: ${({ theme }) => theme.colors.raised};
  background-color: var(--loading-card-base);
  animation: ${pulse} 1.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export interface LoadingBarProps {
  className?: string;
}

export function LoadingBar({ className }: LoadingBarProps) {
  return (
    <Track className={className} role="status" aria-label="Loading">
      <Bar />
    </Track>
  );
}

export interface LoadingCardProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function LoadingCard({ width, height, className }: LoadingCardProps) {
  return (
    <LoadingCardSurface
      $width={width}
      $height={height}
      className={className}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      <LoadingBar />
    </LoadingCardSurface>
  );
}
