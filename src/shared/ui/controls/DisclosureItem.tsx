import { useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon } from '../icons';

export interface DisclosureItemProps {
  question: ReactNode;
  answer: ReactNode;
  defaultOpen?: boolean;
}

const Details = styled.details`
  display: flex;
  width: 100%;
  max-width: 600px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const Summary = styled.summary`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  & > svg {
    flex: 0 0 20px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.muted};
    transition: transform 120ms ease;
  }

  ${Details}[open] & > svg {
    transform: rotate(180deg);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const Answer = styled.div`
  padding: 0 0 ${({ theme }) => theme.space[16]}px;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

export function DisclosureItem({ question, answer, defaultOpen = false }: DisclosureItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <Summary>
        {question}
        <Octicon name="chevron-down" size={20} />
      </Summary>
      <Answer>{answer}</Answer>
    </Details>
  );
}
