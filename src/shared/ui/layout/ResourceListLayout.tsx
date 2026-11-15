import styled from 'styled-components';
import { Banner } from '../feedback';

export const ResourceListPage = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  container: resource-list / inline-size;

  @media (max-width: 760px) {
    padding: 24px 16px;
  }
`;

export const ResourceListHeading = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @container resource-list (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const ResourceListSummary = styled.section`
  display: flex;
  width: 100%;
  align-items: stretch;
  gap: 16px;

  @container resource-list (max-width: 680px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);

    > * {
      width: 100%;
    }
  }
`;

export const ResourceListCards = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;

  @container resource-list (width < 932px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > * {
      width: 100%;
      min-width: 0;
    }
  }

  @container resource-list (width < 616px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ResourceListGuide = styled(Banner)`
  @container resource-list (max-width: 480px) {
    flex-wrap: wrap;

    > :nth-child(2) {
      flex-basis: calc(100% - 36px);
    }
  }
`;
