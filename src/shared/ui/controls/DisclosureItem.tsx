import { useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon } from '../icons';

export interface DisclosureItemProps {
  question: ReactNode;
  answer: ReactNode;
  defaultOpen?: boolean;
}

const Details = styled.details`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Summary = styled.summary`
  display: flex;
  min-height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.body.size}px;
  font-weight: 500;
  line-height: ${({ theme }) => theme.typography.body.lineHeight}px;
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  & > svg {
    flex: 0 0 16px;
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
        <Octicon name="chevron-down" size={16} />
      </Summary>
      <Answer>{answer}</Answer>
    </Details>
  );
}
