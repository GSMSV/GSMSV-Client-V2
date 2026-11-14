import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getMyQuota, type MyQuota } from '../../entities/quota';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { ServerlessShell } from '../../widgets/serverless-shell';
import { isDemoMode } from '../../shared/demo';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const SummaryRow = styled.section`
  display: flex;
  width: 100%;
  align-items: stretch;
  gap: 16px;
`;

const SummaryCard = styled(UsageCard)`
  width: auto;
  min-width: 0;
  flex: 1 1 0;
`;

const SummaryLoading = styled(LoadingCard)`
  min-width: 0;
  flex: 1 1 0;
`;

const Section = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Cards = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
`;

const FunctionCard = styled.article`
  display: flex;
  width: calc((100% - 32px) / 3);
  min-width: 300px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardActions = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const FunctionIcon = styled.span`
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const FunctionName = styled.h3`
  overflow: hidden;
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDescription = styled.p`
  min-height: 22px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Metadata = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const CardFooter = styled.div`
  display: flex;
  min-height: 22px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Expiry = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const RuntimeState = styled.span<{ $active: boolean }>`
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const EmptyNotice = styled.div`
  display: flex;
  width: 100%;
  min-height: 120px;
  align-items: center;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Guide = styled.aside`
  display: flex;
  width: 100%;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const GuideText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

const GuideTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const GuideDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const InlineRetry = styled.button`
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  cursor: pointer;
`;

interface FunctionCardContent {
  id: string;
  name: string;
  description: string;
  method: string;
  expires: string;
  active: boolean;
  runtime: string;
  icon: 'file-code' | 'pulse';
}


function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export default function ServerlessListPage() {
  const navigate = useNavigate();
  const demoMode = isDemoMode();
  const [functions, setFunctions] = useState<FunctionCardContent[]>([]);
  const [quota, setQuota] = useState<{ value: MyQuota['fn'] | null; loading: boolean; error: boolean }>({ value: null, loading: true, error: false });
  const [retryKey, setRetryKey] = useState(0);

  const loadQuota = useCallback(async (signal: AbortSignal) => {
    setQuota(current => ({ ...current, loading: true, error: false }));
    if (import.meta.env.DEV && demoMode) {
      try {
        const demo = await import('../../entities/serverless');
        if (signal.aborted) return;
        setFunctions(demo.getDemoServerlessFunctions().map(fn => ({
          id: fn.id,
          name: fn.name,
          description: fn.description,
          method: fn.triggers.filter(trigger => trigger.enabled).map(trigger => trigger.type === 'Cron' ? 'Cron' : `HTTP ${trigger.schedule}`).join(' · ') || '트리거 연결 전',
          expires: fn.expiresAt,
          active: fn.active,
          runtime: fn.runtime === 'javascript' ? 'JavaScript' : fn.runtime === 'typescript' ? 'TypeScript' : 'Python',
          icon: fn.runtime === 'python' ? 'pulse' : 'file-code',
        })));
        setQuota({ value: demo.getDemoServerlessQuota(), loading: false, error: false });
      } catch {
        if (!signal.aborted) setQuota({ value: null, loading: false, error: true });
      }
      return;
    }
    try {
      const value = await getMyQuota(signal);
      if (!signal.aborted) {
        setFunctions([]);
        setQuota({ value: value.fn, loading: false, error: false });
      }
    } catch {
      if (!signal.aborted) setQuota({ value: null, loading: false, error: true });
    }
  }, [demoMode]);

  useEffect(() => {
    const controller = new AbortController();
    void loadQuota(controller.signal);
    return () => controller.abort();
  }, [loadQuota, retryKey]);

  const count = quota.value?.count;
  const executions = quota.value?.daily_executions;
  const countPercent = count && count.limit > 0 ? Math.min(100, count.used / count.limit * 100) : 0;
  const executionPercent = executions && executions.limit > 0 ? Math.min(100, executions.used / executions.limit * 100) : 0;

  return (
    <ServerlessShell>
      <Page>
        <Breadcrumb>Serverless</Breadcrumb>
        <Heading>
          <TitleGroup>
            <Title>Serverless</Title>
            <Description>서버 관리 없이 필요한 코드를 실행하세요.</Description>
          </TitleGroup>
          <Button
            variant="primary"
            icon={<Octicon name="plus" size={16} />}
            disabled={!demoMode}
            title={!demoMode ? 'Serverless 함수 생성 API가 아직 없습니다' : undefined}
            onClick={() => void navigate('/serverless/new')}
          >새 함수</Button>
        </Heading>

        <SummaryRow aria-label="Serverless 사용량">
          {quota.loading ? (
            <><SummaryLoading height={174} /><SummaryLoading height={174} /><SummaryLoading height={174} /></>
          ) : (
            <>
              <SummaryCard
                label="내 함수"
                icon={<Octicon name="file-code" size={16} />}
                value={count ? `${formatNumber(count.used)} / ${formatNumber(count.limit)}` : '— / —'}
                meter={count ? { value: countPercent, tone: count.used > count.limit ? 'danger' : 'primary', label: '함수 개수 사용량' } : undefined}
                caption={count ? `함수 ${formatNumber(Math.max(0, count.limit - count.used))}개를 더 만들 수 있습니다` : quota.error ? <>사용량을 불러오지 못했습니다<InlineRetry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</InlineRetry></> : '사용량 정보 없음'}
              />
              <SummaryCard
                label="오늘 실행"
                icon={<Octicon name="pulse" size={16} />}
                value={executions ? `${formatNumber(executions.used)} / ${formatNumber(executions.limit)}회` : '— / —회'}
                meter={executions ? { value: executionPercent, tone: executions.used > executions.limit ? 'danger' : 'primary', label: '오늘 함수 실행 사용량' } : undefined}
                caption={executions ? '내 함수 전체 실행량을 합해 세요' : quota.error ? <>사용량을 불러오지 못했습니다<InlineRetry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</InlineRetry></> : '사용량 정보 없음'}
              />
              <SummaryCard
                label="기본 실행 제한"
                icon={<Octicon name="cpu" size={16} />}
                value="30초 · 128MB"
                caption="최대 60초 · 256MB까지 늘릴 수 있습니다"
              />
            </>
          )}
        </SummaryRow>

        <Section>
          <SectionTitle>내 함수</SectionTitle>
          <Cards>
            {functions.map((fn, index) => (
              <FunctionCard key={`${fn.id}-${index}`}>
                <CardActions>
                  <FunctionIcon aria-hidden="true"><Octicon name={fn.icon} size={20} /></FunctionIcon>
                  <Button
                    variant="secondary"
                    icon={<Octicon name="arrow-right" size={16} />}
                    disabled={!demoMode}
                    title={!demoMode ? 'Serverless 함수 상세 API가 아직 없습니다' : undefined}
                    onClick={() => void navigate(`/serverless/${encodeURIComponent(fn.id)}`)}
                  >함수 열기</Button>
                </CardActions>
                <FunctionName>{fn.name}</FunctionName>
                <CardDescription>{fn.description}</CardDescription>
                <Metadata>{fn.method}</Metadata>
                <CardFooter>
                  <Expiry>만료 {fn.expires}</Expiry>
                  <RuntimeState $active={fn.active}>{fn.active ? '활성' : '비활성'} · {fn.runtime}</RuntimeState>
                </CardFooter>
              </FunctionCard>
            ))}
            {functions.length === 0 && <EmptyNotice>{demoMode ? '아직 함수가 없습니다. 새 함수를 만들어 보세요.' : 'Serverless 함수 목록 API 계약이 공개되면 실제 함수를 표시합니다.'}</EmptyNotice>}
          </Cards>
        </Section>

        <Guide>
          <GuideText>
            <GuideTitle>작게 만들고, 바로 테스트하세요</GuideTitle>
            <GuideDescription>요청 하나당 예약 한 번을 처리하고 끝나는 코드에 맞습니다. 계속 떠 있어야 하는 웹 앱은 Apps에서 배포하세요.</GuideDescription>
          </GuideText>
          <Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => void navigate('/help')}>사용 Docs</Button>
        </Guide>
      </Page>
    </ServerlessShell>
  );
}
